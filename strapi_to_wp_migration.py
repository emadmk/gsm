#!/usr/bin/env python3
"""
GSM Strapi to WordPress Database Migration Tool
================================================
Migrates 50k+ posts from Strapi CMS to WordPress with:
- Full SEO preservation (slugs, meta titles/descriptions, canonical URLs, structured data)
- S3/MinIO image handling with proper WordPress attachments
- Comment migration with threading
- Per-post transactions with rollback
- Dry-run, local-test, and production modes
- Resume capability and comprehensive logging

Usage:
    # Dry-run (validate only, no DB writes)
    python strapi_to_wp_migration.py --dry-run --config config/local_test_config.ini

    # Local Docker test (first 100 posts)
    python strapi_to_wp_migration.py --local-test --limit 100

    # Production migration
    python strapi_to_wp_migration.py --production

    # Resume from a specific post ID
    python strapi_to_wp_migration.py --local-test --resume-from 5000
"""

import argparse
import configparser
import csv
import hashlib
import json
import logging
import os
import re
import sys
import time
import traceback
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple
from urllib.parse import urlparse, unquote
import posixpath

try:
    import mysql.connector
    from mysql.connector import Error as MySQLError
except ImportError:
    print("ERROR: mysql-connector-python is required. Install with:")
    print("  pip install mysql-connector-python")
    sys.exit(1)

# ─────────────────────────────────────────────────────────────
# Constants
# ─────────────────────────────────────────────────────────────

POST_TYPE_MAP = {
    "news": "news",
    "review": "reviews",
    "article": "articles",
}
DEFAULT_POST_TYPE = "news"

CATEGORY_MAP = {
    "news": "اخبار",
    "review": "بررسی ها",
    "article": "مقاله",
}

def extract_relative_upload_path(image_url: str) -> str:
    """
    Convert an absolute image URL into a WordPress-friendly relative file path.

    Examples:
    - https://s3.gsm.ir/gsm-blog-production/Repository/images/news/old/0/Jbl-logo71331.jpg
      -> Repository/images/news/old/0/Jbl-logo71331.jpg

    - https://cdn.example.com/wp-content/uploads/2026/03/pic.jpg
      -> 2026/03/pic.jpg
    """
    if not image_url:
        return ""

    parsed = urlparse(image_url)
    path = unquote(parsed.path or "").strip()

    if not path:
        return ""

    path = path.lstrip("/")

    # If URL already points to wp-content/uploads, keep only the relative uploads part
    uploads_marker = "wp-content/uploads/"
    idx = path.find(uploads_marker)
    if idx != -1:
        rel = path[idx + len(uploads_marker):]
        return rel.lstrip("/")

    normalized = posixpath.normpath(path).lstrip("/")

    # Legacy migrated media sometimes includes the bucket name in the object key.
    # WordPress expects the path relative to the uploads base, so strip it.
    bucket_prefixes = (
        "gsm-blog-production/",
        "gsmblog-production/",
    )
    for prefix in bucket_prefixes:
        if normalized.startswith(prefix):
            return normalized[len(prefix):].lstrip("/")

    return normalized



# ─────────────────────────────────────────────────────────────
# Utility Functions
# ─────────────────────────────────────────────────────────────

def contains_persian(text: str) -> bool:
    """Check if text contains Persian/Arabic characters."""
    if not text:
        return False
    return bool(re.search(r'[\u0600-\u06FF\uFB50-\uFDFF\uFE70-\uFEFF]', text))

def normalize_existing_slug(slug: str) -> str:
    if not slug:
        return ''
    slug = str(slug).strip()
    slug = re.sub(r'[\s_]+', '-', slug)
    slug = re.sub(r'-{2,}', '-', slug)
    return slug.strip('-')


def normalize_source_slug(slug: str, max_length: int = 200) -> str:
    """Normalize slug values coming from Strapi fields or URL segments."""
    if not slug:
        return ''
    return create_wp_slug(unquote(str(slug).strip()), max_length=max_length)

def create_wp_slug(text: str, max_length: int = 200) -> str:
    """
    Create a WordPress-compatible slug from text.
    For Persian text: keep the original characters and only normalize separators.
    For Latin text: standard slug generation.
    """
    if not text:
        return ""

    # Strip HTML tags
    text = re.sub(r'<[^>]+>', '', text).strip()

    # Replace multiple whitespace/dashes with single dash
    slug = re.sub(r'[\s_]+', '-', text)

    if not contains_persian(slug):
        # For Latin: standard slug cleanup
        slug = slug.lower()
        slug = re.sub(r'[^a-z0-9\-]', '', slug)

    # Clean up multiple consecutive dashes
    slug = re.sub(r'-{2,}', '-', slug)
    slug = slug.strip('-')

    return slug[:max_length]


def extract_slug_from_canonical_url(url: str, max_length: int = 200) -> str:
    """Extract the public slug segment from a canonical URL."""
    if not url:
        return ''

    parsed = urlparse(url)
    path = unquote(parsed.path or '').strip('/')
    if not path:
        return ''

    parts = [part for part in path.split('/') if part]
    if not parts:
        return ''

    candidate = parts[-1]
    if re.fullmatch(r'\d+', candidate):
        return ''

    return normalize_source_slug(candidate, max_length=max_length)


def resolve_post_slug(post: Dict[str, Any], seo_data: Optional[Dict[str, Any]],
                      title: str, slug_source: str) -> Tuple[str, str]:
    """
    Resolve the WordPress slug based on migration config.

    `title` mode forces title-based slugs.
    `seo_component` mode prefers the canonical URL slug, then SEO slug,
    then the post slug, and finally falls back to the title.
    """
    source_mode = (slug_source or 'seo_component').strip().lower()

    if source_mode == 'title':
        slug = create_wp_slug(title)
        if slug:
            return slug, 'title'

    if seo_data:
        canonical_slug = extract_slug_from_canonical_url(seo_data.get('canonical_url', ''))
        if canonical_slug:
            return canonical_slug, 'canonical_url'

        seo_slug = normalize_source_slug(seo_data.get('slug', ''))
        if seo_slug:
            return seo_slug, 'seo_component'

    post_slug = normalize_source_slug(post.get('slug', ''))
    if post_slug:
        return post_slug, 'post_slug'

    fallback_slug = create_wp_slug(title)
    if fallback_slug:
        return fallback_slug, 'title'

    return '', 'empty'


def strip_html_tags(html: str) -> str:
    """Remove HTML tags from string, preserving text content."""
    if not html:
        return ""
    return re.sub(r'<[^>]+>', '', html).strip()


def extract_first_image_url(html: str) -> Optional[str]:
    """Extract the first image URL from HTML content."""
    if not html:
        return None
    match = re.search(r'<img[^>]+src=["\']([^"\']+)["\']', html, re.IGNORECASE)
    return match.group(1) if match else None


def php_serialize_array(items: List[str]) -> str:
    """
    Format a list of strings as a PHP serialized array.
    a:N:{i:0;s:LEN:"VAL";i:1;s:LEN:"VAL";...}
    """
    if not items:
        return "a:0:{}"

    parts = [f"a:{len(items)}:{{"]
    for i, item in enumerate(items):
        item_str = str(item)
        # Use byte length for multi-byte characters (PHP uses byte length)
        byte_len = len(item_str.encode('utf-8'))
        parts.append(f'i:{i};s:{byte_len}:"{item_str}";')
    parts.append("}")
    return "".join(parts)


def rewrite_s3_url(url: str, old_base: str, new_base: str) -> str:
    """Rewrite S3 URLs from old base to new base if configured."""
    if not url or not old_base or not new_base:
        return url or ""
    if url.startswith(old_base):
        return url.replace(old_base, new_base, 1)
    return url


def format_datetime(dt) -> str:
    """Format a datetime value to MySQL-compatible string."""
    if dt is None:
        return datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    if isinstance(dt, datetime):
        return dt.strftime('%Y-%m-%d %H:%M:%S')
    if isinstance(dt, str):
        # Handle ISO format with Z suffix
        dt = dt.replace('Z', '+00:00').replace('T', ' ')
        # Strip microseconds and timezone for MySQL
        dt = re.sub(r'\.\d+.*$', '', dt)
        return dt
    return str(dt)


def calculate_word_count(reading_time_str, main_text: str = "") -> int:
    """Calculate word count from reading_time or content length."""
    if reading_time_str:
        match = re.search(r'(\d+)', str(reading_time_str))
        if match:
            return int(match.group(1)) * 200
    if main_text:
        text = strip_html_tags(main_text)
        # Rough estimate: count words by splitting on whitespace
        return len(text.split())
    return 0


# ─────────────────────────────────────────────────────────────
# Configuration
# ─────────────────────────────────────────────────────────────

class MigrationConfig:
    """Loads and validates migration configuration from INI files."""

    def __init__(self, config_path: str):
        if not os.path.exists(config_path):
            raise FileNotFoundError(f"Config file not found: {config_path}")

        self.parser = configparser.ConfigParser()
        self.parser.read(config_path, encoding='utf-8')
        self.path = config_path

    @property
    def strapi_db(self) -> Dict[str, Any]:
        return {
            'host': self.parser.get('strapi_db', 'host'),
            'port': self.parser.getint('strapi_db', 'port'),
            'user': self.parser.get('strapi_db', 'user'),
            'password': self.parser.get('strapi_db', 'password'),
            'database': self.parser.get('strapi_db', 'database'),
            'charset': 'utf8mb4',
            'collation': 'utf8mb4_unicode_ci',
            'use_unicode': True,
        }

    @property
    def wordpress_db(self) -> Dict[str, Any]:
        return {
            'host': self.parser.get('wordpress_db', 'host'),
            'port': self.parser.getint('wordpress_db', 'port'),
            'user': self.parser.get('wordpress_db', 'user'),
            'password': self.parser.get('wordpress_db', 'password'),
            'database': self.parser.get('wordpress_db', 'database'),
            'charset': 'utf8mb4',
            'collation': 'utf8mb4_unicode_ci',
            'use_unicode': True,
        }

    @property
    def s3(self) -> Dict[str, str]:
        return {
            'endpoint': self.parser.get('s3', 'endpoint', fallback=''),
            'bucket': self.parser.get('s3', 'bucket', fallback=''),
            'base_url': self.parser.get('s3', 'base_url', fallback=''),
            'old_base_url': self.parser.get('s3', 'old_base_url', fallback=''),
            'new_base_url': self.parser.get('s3', 'new_base_url', fallback=''),
        }

    @property
    def batch_size(self) -> int:
        return self.parser.getint('migration', 'batch_size', fallback=500)

    @property
    def id_offset(self) -> int:
        return self.parser.getint('migration', 'id_offset', fallback=100000)

    @property
    def site_url(self) -> str:
        return self.parser.get('migration', 'site_url', fallback='http://localhost')

    @property
    def slug_source(self) -> str:
        return self.parser.get('migration', 'slug_source', fallback='seo_component')

    @property
    def log_file(self) -> str:
        return self.parser.get('logging', 'log_file', fallback='migration.log')

    @property
    def log_level(self) -> str:
        return self.parser.get('logging', 'log_level', fallback='INFO')


# ─────────────────────────────────────────────────────────────
# Database Connection
# ─────────────────────────────────────────────────────────────

class DatabaseConnection:
    """MySQL database connection with retry logic and transaction support."""

    def __init__(self, config: Dict[str, Any], name: str = "db", max_retries: int = 3):
        self.config = config
        self.name = name
        self.max_retries = max_retries
        self.conn = None

    def connect(self) -> bool:
        """Connect with exponential backoff retry."""
        for attempt in range(1, self.max_retries + 1):
            try:
                self.conn = mysql.connector.connect(**self.config)
                self.conn.autocommit = False
                return True
            except MySQLError as e:
                wait = 2 ** attempt
                print(f"[{self.name}] Connection attempt {attempt}/{self.max_retries} failed: {e}")
                if attempt < self.max_retries:
                    print(f"  Retrying in {wait}s...")
                    time.sleep(wait)
        return False

    def cursor(self, dictionary: bool = True, buffered: bool = True):
        """Get a new cursor."""
        return self.conn.cursor(dictionary=dictionary, buffered=buffered)

    def execute(self, query: str, params=None, cursor=None):
        """Execute a query, optionally on an existing cursor."""
        c = cursor or self.cursor()
        c.execute(query, params or ())
        return c

    def fetchall(self, query: str, params=None) -> List[Dict]:
        """Execute query and return all rows."""
        c = self.execute(query, params)
        rows = c.fetchall()
        c.close()
        return rows

    def fetchone(self, query: str, params=None) -> Optional[Dict]:
        """Execute query and return one row."""
        c = self.execute(query, params)
        row = c.fetchone()
        c.close()
        return row

    def insert(self, query: str, params=None) -> int:
        """Execute INSERT and return last insert ID."""
        c = self.execute(query, params)
        last_id = c.lastrowid
        c.close()
        return last_id

    def commit(self):
        if self.conn:
            self.conn.commit()

    def rollback(self):
        if self.conn:
            self.conn.rollback()

    def close(self):
        if self.conn:
            try:
                self.conn.close()
            except Exception:
                pass

    def ping(self):
        """Reconnect if connection was lost."""
        try:
            self.conn.ping(reconnect=True, attempts=3, delay=2)
        except MySQLError:
            self.connect()


# ─────────────────────────────────────────────────────────────
# Migration Logger
# ─────────────────────────────────────────────────────────────

class MigrationLogger:
    """Comprehensive logging to file, console, and CSV."""

    def __init__(self, log_file: str, log_level: str, session_id: str, dry_run: bool = False):
        self.dry_run = dry_run
        self.session_id = session_id
        self.prefix = "[DRY-RUN] " if dry_run else ""

        # Python logger
        self.logger = logging.getLogger('gsm_migration')
        self.logger.setLevel(getattr(logging, log_level.upper(), logging.INFO))
        self.logger.handlers.clear()

        fmt = logging.Formatter('[%(asctime)s] %(levelname)-8s %(message)s', '%Y-%m-%d %H:%M:%S')

        fh = logging.FileHandler(log_file, encoding='utf-8')
        fh.setFormatter(fmt)
        self.logger.addHandler(fh)

        ch = logging.StreamHandler(sys.stdout)
        ch.setFormatter(fmt)
        self.logger.addHandler(ch)

        # CSV log
        csv_path = log_file.replace('.log', '_operations.csv')
        self._csv_fh = open(csv_path, 'w', newline='', encoding='utf-8-sig')
        self._csv_writer = csv.DictWriter(self._csv_fh, fieldnames=[
            'sync_date', 'session_id', 'strapi_id', 'strapi_type', 'wp_post_id',
            'post_title', 'slug', 'operation', 'status', 'error_message',
            'processing_time_ms', 'seo_migrated', 'image_migrated',
        ])
        self._csv_writer.writeheader()
        self.csv_path = csv_path

    def info(self, msg):
        self.logger.info(self.prefix + msg)

    def warn(self, msg):
        self.logger.warning(self.prefix + msg)

    def error(self, msg):
        self.logger.error(self.prefix + msg)

    def debug(self, msg):
        self.logger.debug(self.prefix + msg)

    def log_operation(self, strapi_id, strapi_type, wp_post_id, title, slug,
                      operation, status, error='', elapsed_ms=0,
                      seo_migrated=False, image_migrated=False):
        """Write one row to the CSV audit log."""
        try:
            self._csv_writer.writerow({
                'sync_date': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                'session_id': self.session_id,
                'strapi_id': strapi_id,
                'strapi_type': strapi_type or '',
                'wp_post_id': wp_post_id or '',
                'post_title': (title or '')[:200],
                'slug': (slug or '')[:200],
                'operation': operation,
                'status': status,
                'error_message': (error or '')[:500],
                'processing_time_ms': f"{elapsed_ms:.1f}",
                'seo_migrated': 'yes' if seo_migrated else 'no',
                'image_migrated': 'yes' if image_migrated else 'no',
            })
            self._csv_fh.flush()
        except Exception as e:
            self.logger.error(f"CSV write error: {e}")

    def close(self):
        if self._csv_fh:
            self._csv_fh.close()
        for h in self.logger.handlers[:]:
            h.close()
            self.logger.removeHandler(h)


# ─────────────────────────────────────────────────────────────
# Migration Statistics
# ─────────────────────────────────────────────────────────────

class MigrationStats:
    """Tracks all migration counters."""

    def __init__(self):
        self.posts_processed = 0
        self.posts_created = 0
        self.posts_skipped = 0
        self.posts_failed = 0
        self.users_created = 0
        self.users_existing = 0
        self.tags_created = 0
        self.tags_existing = 0
        self.categories_created = 0
        self.comments_migrated = 0
        self.static_pages_migrated = 0
        self.images_attached = 0
        self.seo_migrated = 0
        self.seo_missing = 0
        self.slug_from_seo = 0
        self.slug_from_title = 0
        self.slug_empty = 0
        self.views_migrated = 0
        self.errors = 0
        self.warnings = 0
        self.start_time = time.time()

    def summary(self) -> str:
        elapsed = time.time() - self.start_time
        lines = [
            "",
            "=" * 70,
            "  MIGRATION SUMMARY",
            "=" * 70,
            f"  Posts processed:    {self.posts_processed}",
            f"    - Created:        {self.posts_created}",
            f"    - Skipped:        {self.posts_skipped}",
            f"    - Failed:         {self.posts_failed}",
            f"  Users:              {self.users_created} created, {self.users_existing} existing",
            f"  Tags:               {self.tags_created} created, {self.tags_existing} existing",
            f"  Categories:         {self.categories_created}",
            f"  Comments:           {self.comments_migrated}",
            f"  Static pages:       {self.static_pages_migrated}",
            f"  Images attached:    {self.images_attached}",
            f"  SEO data migrated:  {self.seo_migrated}",
            f"  SEO data missing:   {self.seo_missing}",
            f"  Slugs from SEO:     {self.slug_from_seo}",
            f"  Slugs from title:   {self.slug_from_title}",
            f"  Slugs empty:        {self.slug_empty}",
            f"  Views migrated:     {self.views_migrated}",
            f"  Errors:             {self.errors}",
            f"  Warnings:           {self.warnings}",
            f"  Total time:         {elapsed:.1f}s ({elapsed/60:.1f}m)",
            f"  Speed:              {self.posts_processed / max(elapsed, 0.1):.1f} posts/sec",
            "=" * 70,
        ]
        return "\n".join(lines)


# ─────────────────────────────────────────────────────────────
# Main Migration Engine
# ─────────────────────────────────────────────────────────────

class StrapiToWordPressMigration:
    """
    Main migration engine. Reads from Strapi MySQL, writes to WordPress MySQL.
    """

    def __init__(self, config: MigrationConfig, dry_run: bool = False,
                 limit: Optional[int] = None, batch_size: Optional[int] = None,
                 skip_comments: bool = False, skip_static_pages: bool = False,
                 resume_from: Optional[int] = None,
                 per_model_limit: Optional[int] = None):

        self.config = config
        self.dry_run = dry_run
        self.limit = limit
        self.batch_size = batch_size or config.batch_size
        self.skip_comments = skip_comments
        self.skip_static_pages = skip_static_pages
        self.resume_from = resume_from
        self.per_model_limit = per_model_limit
        self.id_offset = config.id_offset

        self.session_id = datetime.now().strftime('%Y%m%d_%H%M%S')
        self.log = MigrationLogger(config.log_file, config.log_level, self.session_id, dry_run)
        self.stats = MigrationStats()

        self.strapi: Optional[DatabaseConnection] = None
        self.wp: Optional[DatabaseConnection] = None

        # Lookup caches (populated during prefetch)
        self._tags: Dict[int, str] = {}                     # tag_id -> name
        self._brands: Dict[int, Dict] = {}                  # brand_id -> {persian_name, english_name}
        self._products: Dict[int, str] = {}                 # product_id -> name
        self._seo: Dict[int, Dict] = {}                     # seo_component_id -> {meta_title, ...}
        self._post_seo: Dict[int, int] = {}                 # post_id -> seo_component_id
        self._files: Dict[int, Dict] = {}                   # file_id -> {name, url, mime, ...}
        self._post_main_image: Dict[int, int] = {}          # post_id -> file_id
        self._publisher_links: Dict[int, int] = {}          # post_id -> user_id
        self._post_tags: Dict[int, List[int]] = {}          # post_id -> [tag_id, ...]
        self._post_brands: Dict[int, List[int]] = {}        # post_id -> [brand_id, ...]
        self._post_products: Dict[int, List[int]] = {}      # post_id -> [product_id, ...]
        self._comment_threads: Dict[int, int] = {}          # comment_id -> parent_comment_id
        self._strapi_posts_has_slug = False

        # WordPress side caches
        self._wp_user_map: Dict[int, int] = {}              # strapi_user_id -> wp_user_id
        self._wp_term_cache: Dict[str, int] = {}            # "taxonomy:name" -> term_taxonomy_id
        self._wp_comment_id_map: Dict[int, int] = {}        # strapi_comment_id -> wp_comment_id

    # ─── Entry Point ─────────────────────────────────────────

    def run(self) -> bool:
        """Execute the full migration pipeline."""
        try:
            self.log.info("=" * 70)
            self.log.info(f"GSM Strapi -> WordPress Migration  |  Session: {self.session_id}")
            self.log.info(f"Mode: {'DRY-RUN (read-only)' if self.dry_run else 'LIVE MIGRATION'}")
            self.log.info(f"Config: {self.config.path}")
            self.log.info(f"ID offset: {self.id_offset}")
            if self.limit:
                self.log.info(f"Limit: {self.limit} posts")
            if self.per_model_limit:
                self.log.info(f"Per-model limit: {self.per_model_limit}")
            if self.resume_from:
                self.log.info(f"Resuming from Strapi post ID >= {self.resume_from}")
            self.log.info("=" * 70)

            # 1. Connect databases
            if not self._connect():
                return False

            # 2. Pre-fetch all lookup data
            self._prefetch_all()

            # 3. Migrate users
            self.log.info("─── Phase 1: Users ───")
            self._migrate_users()

            # 4. Migrate categories
            self.log.info("─── Phase 2: Categories ───")
            self._migrate_categories()

            # 5. Migrate posts (with tags, brands, products, images, SEO, views)
            self.log.info("─── Phase 3: Posts ───")
            self._migrate_posts()

            # 6. Migrate comments
            if not self.skip_comments:
                self.log.info("─── Phase 4: Comments ───")
                self._migrate_comments()
            else:
                self.log.info("─── Phase 4: Comments (SKIPPED) ───")

            # 7. Migrate static pages
            if not self.skip_static_pages:
                self.log.info("─── Phase 5: Static Pages ───")
                self._migrate_static_pages()
            else:
                self.log.info("─── Phase 5: Static Pages (SKIPPED) ───")

            # 8. Update term counts
            if not self.dry_run:
                self.log.info("─── Phase 6: Updating Term Counts ───")
                self._update_term_counts()

            # 9. Final report
            report = self.stats.summary()
            for line in report.split('\n'):
                self.log.info(line)
            self.log.info(f"CSV audit log: {self.log.csv_path}")

            return self.stats.errors == 0

        except KeyboardInterrupt:
            self.log.warn("Migration interrupted by user (Ctrl+C)")
            if not self.dry_run and self.wp:
                self.wp.rollback()
            return False
        except Exception as e:
            self.log.error(f"FATAL: {e}")
            self.log.error(traceback.format_exc())
            if not self.dry_run and self.wp:
                self.wp.rollback()
            return False
        finally:
            self._cleanup()

    # ─── Connection ──────────────────────────────────────────

    def _connect(self) -> bool:
        """Connect to Strapi and (unless dry-run) WordPress databases."""
        self.log.info("Connecting to Strapi database...")
        self.strapi = DatabaseConnection(self.config.strapi_db, name="strapi")
        if not self.strapi.connect():
            self.log.error("Cannot connect to Strapi database.")
            return False
        self.log.info(f"Connected to Strapi: {self.config.strapi_db['database']}")
        slug_column = self.strapi.fetchone(
            "SELECT 1 AS present "
            "FROM information_schema.columns "
            "WHERE table_schema = %s AND table_name = 'posts' AND column_name = 'slug' "
            "LIMIT 1",
            (self.config.strapi_db['database'],)
        )
        self._strapi_posts_has_slug = bool(slug_column)
        self.log.info(
            f"Strapi posts.slug column: {'YES' if self._strapi_posts_has_slug else 'NO'}"
        )

        if not self.dry_run:
            self.log.info("Connecting to WordPress database...")
            self.wp = DatabaseConnection(self.config.wordpress_db, name="wordpress")
            if not self.wp.connect():
                self.log.error("Cannot connect to WordPress database.")
                return False
            self.log.info(f"Connected to WordPress: {self.config.wordpress_db['database']}")
        else:
            self.log.info("Dry-run mode: WordPress database connection skipped.")

        return True

    def _cleanup(self):
        """Close connections and logs."""
        if self.strapi:
            self.strapi.close()
        if self.wp:
            self.wp.close()
        self.log.close()

    # ─── Pre-fetch ───────────────────────────────────────────

    def _prefetch_all(self):
        """Pre-fetch all lookup data into memory for fast access."""
        self.log.info("Pre-fetching lookup data from Strapi...")
        t0 = time.time()

        # Tags
        for row in self.strapi.fetchall("SELECT id, name FROM tags WHERE name IS NOT NULL"):
            self._tags[row['id']] = row['name'].strip()
        self.log.info(f"  Tags: {len(self._tags)}")

        # Brands
        for row in self.strapi.fetchall("SELECT id, persian_name, english_name FROM brands"):
            self._brands[row['id']] = {
                'persian_name': row.get('persian_name') or '',
                'english_name': row.get('english_name') or '',
            }
        self.log.info(f"  Brands: {len(self._brands)}")

        # Products
        for row in self.strapi.fetchall("SELECT id, name FROM products WHERE name IS NOT NULL"):
            self._products[row['id']] = row['name']
        self.log.info(f"  Products: {len(self._products)}")

        # SEO components
        for row in self.strapi.fetchall(
            "SELECT id, meta_title, meta_description, slug, canonical_url, "
            "meta_robots, structured_data, meta_viewport FROM components_shared_seos"
        ):
            self._seo[row['id']] = row
        self.log.info(f"  SEO components: {len(self._seo)}")

        # Post -> SEO component mapping via posts_components
        # The column name in posts_components is 'component_id', component_type is 'shared.seo', field is 'seo'
        for row in self.strapi.fetchall(
            "SELECT entity_id, component_id FROM posts_components "
            "WHERE component_type = 'shared.seo' AND field = 'seo'"
        ):
            self._post_seo[row['entity_id']] = row['component_id']
        self.log.info(f"  Post-SEO links: {len(self._post_seo)}")

        # Files
        for row in self.strapi.fetchall(
            "SELECT id, name, alternative_text, url, mime, width, height, ext FROM files"
        ):
            self._files[row['id']] = row
        self.log.info(f"  Files: {len(self._files)}")

        # Post main images (from files_related_morphs)
        for row in self.strapi.fetchall(
            "SELECT related_id, file_id FROM files_related_morphs "
            "WHERE related_type = 'api::post.post' AND field = 'main_image' "
            "ORDER BY `order` ASC"
        ):
            # Keep first image per post (lowest order)
            if row['related_id'] not in self._post_main_image:
                self._post_main_image[row['related_id']] = row['file_id']
        self.log.info(f"  Post main images: {len(self._post_main_image)}")

        # Publisher links (post_id -> author user_id)
        for row in self.strapi.fetchall("SELECT post_id, user_id FROM posts_publisher_links"):
            self._publisher_links[row['post_id']] = row['user_id']
        self.log.info(f"  Publisher links: {len(self._publisher_links)}")

        # Post-tag links
        for row in self.strapi.fetchall("SELECT post_id, tag_id FROM posts_tags_links"):
            self._post_tags.setdefault(row['post_id'], []).append(row['tag_id'])
        self.log.info(f"  Post-tag links: {sum(len(v) for v in self._post_tags.values())}")

        # Post-brand links
        for row in self.strapi.fetchall("SELECT post_id, brand_id FROM posts_brands_links"):
            self._post_brands.setdefault(row['post_id'], []).append(row['brand_id'])
        self.log.info(f"  Post-brand links: {sum(len(v) for v in self._post_brands.values())}")

        # Post-product links
        for row in self.strapi.fetchall("SELECT post_id, product_id FROM posts_products_links"):
            self._post_products.setdefault(row['post_id'], []).append(row['product_id'])
        self.log.info(f"  Post-product links: {sum(len(v) for v in self._post_products.values())}")

        # Comment thread links (for parent comments)
        for row in self.strapi.fetchall(
            "SELECT comment_id, inv_comment_id FROM comments_comment_thread_of_links"
        ):
            self._comment_threads[row['comment_id']] = row['inv_comment_id']
        self.log.info(f"  Comment thread links: {len(self._comment_threads)}")

        elapsed = time.time() - t0
        self.log.info(f"Pre-fetch complete in {elapsed:.1f}s")

    # ─── Phase 1: Users ─────────────────────────────────────

    def _migrate_users(self):
        """Migrate Strapi admin_users to WordPress wp_users."""
        query = (
            "SELECT id, firstname, lastname, username, email, is_active, created_at "
            "FROM admin_users ORDER BY id"
        )
        if self.per_model_limit:
            query += f" LIMIT {self.per_model_limit}"
        users = self.strapi.fetchall(query)
        self.log.info(f"Found {len(users)} Strapi users to migrate")

        for u in users:
            sid = u['id']
            email = (u.get('email') or '').strip()
            username = (u.get('username') or f"user_{sid}").strip()
            firstname = (u.get('firstname') or '').strip()
            lastname = (u.get('lastname') or '').strip()
            display_name = f"{firstname} {lastname}".strip() or username

            if self.dry_run:
                self.log.debug(f"  [WOULD CREATE] User: {username} <{email}> (strapi_id={sid})")
                self._wp_user_map[sid] = sid  # dummy mapping for dry-run
                self.stats.users_created += 1
                continue

            # Check if exists by email
            existing = self.wp.fetchone(
                "SELECT ID FROM wp_users WHERE user_email = %s", (email,)
            )
            if existing:
                self._wp_user_map[sid] = existing['ID']
                self.stats.users_existing += 1
                self.log.debug(f"  User exists: {email} -> WP ID {existing['ID']}")
                continue

            # Check by username
            existing = self.wp.fetchone(
                "SELECT ID FROM wp_users WHERE user_login = %s", (username,)
            )
            if existing:
                self._wp_user_map[sid] = existing['ID']
                self.stats.users_existing += 1
                continue

            # Create user
            nicename = email.split('@')[0].replace('.', '-') if email else username.lower()
            registered = format_datetime(u.get('created_at'))
            # Use a placeholder hash (users will need to reset password)
            pw_hash = '$P$B' + hashlib.md5(f"migrate_{sid}".encode()).hexdigest()

            wp_uid = self.wp.insert(
                "INSERT INTO wp_users "
                "(user_login, user_pass, user_nicename, user_email, user_url, "
                " user_registered, user_activation_key, user_status, display_name) "
                "VALUES (%s, %s, %s, %s, '', %s, '', 0, %s)",
                (username, pw_hash, nicename, email, registered, display_name)
            )

            if wp_uid:
                self._wp_user_map[sid] = wp_uid

                # Add usermeta
                meta = [
                    (wp_uid, 'wp_capabilities', 'a:1:{s:6:"editor";b:1;}'),
                    (wp_uid, 'wp_user_level', '7'),
                    (wp_uid, 'first_name', firstname),
                    (wp_uid, 'last_name', lastname),
                    (wp_uid, 'strapi_user_id', str(sid)),
                ]
                for user_id, key, val in meta:
                    self.wp.insert(
                        "INSERT INTO wp_usermeta (user_id, meta_key, meta_value) VALUES (%s, %s, %s)",
                        (user_id, key, val)
                    )

                self.wp.commit()
                self.stats.users_created += 1
                self.log.info(f"  Created user: {username} -> WP ID {wp_uid}")
            else:
                self.log.error(f"  Failed to create user: {username}")
                self.stats.errors += 1

    # ─── Phase 2: Categories ────────────────────────────────

    def _migrate_categories(self):
        """Create WordPress categories for each post type."""
        for post_type, cat_name in CATEGORY_MAP.items():
            if self.dry_run:
                self.log.info(f"  [WOULD CREATE] Category: {cat_name} (type={post_type})")
                self.stats.categories_created += 1
                continue

            # Check if already exists
            existing = self.wp.fetchone(
                "SELECT t.term_id, tt.term_taxonomy_id FROM wp_terms t "
                "JOIN wp_term_taxonomy tt ON t.term_id = tt.term_id "
                "WHERE t.name = %s AND tt.taxonomy = 'category'",
                (cat_name,)
            )
            if existing:
                cache_key = f"category:{cat_name}"
                self._wp_term_cache[cache_key] = existing['term_taxonomy_id']
                self.log.info(f"  Category exists: {cat_name} (tt_id={existing['term_taxonomy_id']})")
                continue

            slug = create_wp_slug(cat_name)
            term_id = self.wp.insert(
                "INSERT INTO wp_terms (name, slug, term_group) VALUES (%s, %s, 0)",
                (cat_name, slug)
            )
            if term_id:
                tt_id = self.wp.insert(
                    "INSERT INTO wp_term_taxonomy (term_id, taxonomy, description, parent, count) "
                    "VALUES (%s, 'category', %s, 0, 0)",
                    (term_id, f"Posts of type: {post_type}")
                )
                cache_key = f"category:{cat_name}"
                self._wp_term_cache[cache_key] = tt_id
                self.wp.commit()
                self.stats.categories_created += 1
                self.log.info(f"  Created category: {cat_name} (term_id={term_id}, tt_id={tt_id})")

    # ─── Phase 3: Posts ──────────────────────────────────────

    def _migrate_posts(self):
        """Migrate posts in batches with full data including SEO, images, tags, etc."""
        # Count total
        where_clause = ""
        params = []
        if self.resume_from:
            where_clause = "WHERE id >= %s"
            params = [self.resume_from]

        count_row = self.strapi.fetchone(f"SELECT COUNT(*) as cnt FROM posts {where_clause}", params)
        total = count_row['cnt'] if count_row else 0
        if self.per_model_limit:
            total = min(total, self.per_model_limit)
        if self.limit:
            total = min(total, self.limit)

        self.log.info(f"Total posts to process: {total}")

        offset = 0
        processed = 0
        batch_num = 0

        while processed < total:
            batch_num += 1
            post_slug_select = "slug, " if self._strapi_posts_has_slug else ""
            query = (
                f"SELECT id, titre, {post_slug_select}main_text, summary, published_at, created_at, "
                "updated_at, created_by_id, type, reading_time, views, is_hot, source "
                f"FROM posts {where_clause} "
                "ORDER BY id ASC "
                f"LIMIT {self.batch_size} OFFSET {offset}"
            )
            posts = self.strapi.fetchall(query, params if where_clause else None)

            if not posts:
                break

            self.log.info(f"  Batch {batch_num}: processing {len(posts)} posts (offset={offset})")

            for post in posts:
                if self.limit and processed >= self.limit:
                    break

                self._migrate_single_post(post)
                processed += 1

                # Progress log every 100 posts
                if processed % 100 == 0:
                    elapsed = time.time() - self.stats.start_time
                    rate = processed / max(elapsed, 0.1)
                    eta = (total - processed) / max(rate, 0.01)
                    self.log.info(
                        f"  Progress: {processed}/{total} ({processed*100//total}%) "
                        f"| {rate:.1f} posts/s | ETA: {eta:.0f}s"
                    )

            offset += self.batch_size

            # Ping connection to keep alive for large migrations
            if not self.dry_run and self.wp:
                self.wp.ping()

    def _migrate_single_post(self, post: Dict):
        """Migrate a single post with all its related data. Per-post transaction."""
        t0 = time.time()
        strapi_id = post['id']
        title = post.get('titre') or ''
        post_type = post.get('type') or DEFAULT_POST_TYPE
        wp_type = POST_TYPE_MAP.get(post_type, DEFAULT_POST_TYPE)

        self.stats.posts_processed += 1

        # Skip posts without title
        if not title.strip():
            self.log.warn(f"  Post {strapi_id}: no title, skipping")
            self.stats.posts_skipped += 1
            self.log.log_operation(strapi_id, post_type, None, '', '', 'skip', 'skipped',
                                   'No title', (time.time() - t0) * 1000)
            return

        try:
            # ── Resolve SEO data ──
            seo_data = None
            seo_component_id = self._post_seo.get(strapi_id)
            if seo_component_id and seo_component_id in self._seo:
                seo_data = self._seo[seo_component_id]
                self.stats.seo_migrated += 1
            else:
                self.stats.seo_missing += 1
                self.log.debug(f"  Post {strapi_id}: no SEO component found")

            # ── Resolve slug (CRITICAL for SEO) ──
            slug, slug_origin = resolve_post_slug(post, seo_data, title, self.config.slug_source)
            if slug_origin == 'title':
                self.stats.slug_from_title += 1
            elif slug_origin in {'canonical_url', 'seo_component', 'post_slug'}:
                self.stats.slug_from_seo += 1

            if not slug:
                slug = f"post-{strapi_id}"
                self.stats.slug_empty += 1
                self.log.warn(f"  Post {strapi_id}: empty slug, using fallback: {slug}")

            # ── Resolve author ──
            wp_author_id = 1  # default admin
            publisher_uid = self._publisher_links.get(strapi_id)
            if publisher_uid and publisher_uid in self._wp_user_map:
                wp_author_id = self._wp_user_map[publisher_uid]
            elif post.get('created_by_id') and post['created_by_id'] in self._wp_user_map:
                wp_author_id = self._wp_user_map[post['created_by_id']]

            # ── Resolve featured image ──
            image_file_id = self._post_main_image.get(strapi_id)
            image_url = None
            if image_file_id and image_file_id in self._files:
                image_url = self._files[image_file_id].get('url', '')
                # Rewrite S3 URL if configured
                s3_cfg = self.config.s3
                if s3_cfg['old_base_url'] and s3_cfg['new_base_url']:
                    image_url = rewrite_s3_url(image_url, s3_cfg['old_base_url'], s3_cfg['new_base_url'])
            else:
                # Fallback: extract first image from content
                image_url = extract_first_image_url(post.get('main_text', ''))

            # ── Resolve tags, brands, products ──
            tag_names = [self._tags[tid] for tid in self._post_tags.get(strapi_id, []) if tid in self._tags]
            brand_ids = self._post_brands.get(strapi_id, [])
            product_ids = self._post_products.get(strapi_id, [])

            # ── DRY RUN ──
            if self.dry_run:
                self.log.debug(
                    f"  [WOULD MIGRATE] Post {strapi_id}: \"{title[:60]}\" | "
                    f"type={wp_type} | slug={slug[:40]} | "
                    f"seo={'YES' if seo_data else 'NO'} | image={'YES' if image_url else 'NO'} | "
                    f"tags={len(tag_names)} | brands={len(brand_ids)} | products={len(product_ids)}"
                )
                self.stats.posts_created += 1
                self.log.log_operation(strapi_id, post_type, strapi_id + self.id_offset,
                                       title, slug, 'create', 'success', '',
                                       (time.time() - t0) * 1000,
                                       bool(seo_data), bool(image_url))
                return

            # ── LIVE INSERT ──
            wp_post_id = strapi_id + self.id_offset

            # Dates
            post_date = format_datetime(post.get('published_at') or post.get('created_at'))
            post_modified = format_datetime(post.get('updated_at') or post_date)
            post_status = 'publish' if post.get('published_at') else 'draft'

            main_text = post.get('main_text') or ''
            excerpt = strip_html_tags(post.get('summary') or '')
            guid = f"{self.config.site_url}/?p={wp_post_id}"

            # Insert post with explicit ID
            self.wp.insert(
                "INSERT INTO wp_posts "
                "(ID, post_author, post_date, post_date_gmt, post_content, post_title, "
                " post_excerpt, post_status, comment_status, ping_status, post_password, "
                " post_name, to_ping, pinged, post_modified, post_modified_gmt, "
                " post_content_filtered, post_parent, guid, menu_order, post_type, "
                " post_mime_type, comment_count) "
                "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'open', 'closed', '', "
                "        %s, '', '', %s, %s, '', 0, %s, 0, %s, '', 0)",
                (wp_post_id, wp_author_id, post_date, post_date, main_text, title,
                 excerpt, post_status,
                 slug, post_modified, post_modified, guid, wp_type)
            )

            # ── Post Meta ──
            meta_pairs = [
                ('strapi_id', str(strapi_id)),
                ('strapi_type', post_type),
            ]

            # Reading time & word count
            if post.get('reading_time'):
                meta_pairs.append(('reading_time', str(post['reading_time'])))
            wc = calculate_word_count(post.get('reading_time'), main_text)
            if wc:
                meta_pairs.append(('word_count', str(wc)))

            if post.get('source'):
                meta_pairs.append(('source', str(post['source'])))
            if 'is_hot' in post:
                meta_pairs.append(('is_hot', '1' if post['is_hot'] else '0'))

            # SEO meta (Yoast-compatible)
            if seo_data:
                if seo_data.get('meta_title'):
                    meta_pairs.append(('_yoast_wpseo_title', seo_data['meta_title']))
                if seo_data.get('meta_description'):
                    meta_pairs.append(('_yoast_wpseo_metadesc', seo_data['meta_description']))
                if seo_data.get('canonical_url'):
                    meta_pairs.append(('_yoast_wpseo_canonical', seo_data['canonical_url']))
                if seo_data.get('meta_robots'):
                    robots = seo_data['meta_robots']
                    if 'noindex' in str(robots).lower():
                        meta_pairs.append(('_yoast_wpseo_meta-robots-noindex', '1'))
                    if 'nofollow' in str(robots).lower():
                        meta_pairs.append(('_yoast_wpseo_meta-robots-nofollow', '1'))
                if seo_data.get('structured_data'):
                    sd = seo_data['structured_data']
                    if isinstance(sd, dict):
                        sd = json.dumps(sd, ensure_ascii=False)
                    meta_pairs.append(('_yoast_wpseo_schema_json', str(sd)))

            # Featured image as WP attachment
            if image_url:
                attachment_id = self._create_attachment(wp_post_id, image_file_id, image_url, post_date)
                if attachment_id:
                    meta_pairs.append(('_thumbnail_id', str(attachment_id)))
                    self.stats.images_attached += 1

            # Brands
            if brand_ids:
                brand_names = []
                for bid in brand_ids:
                    if bid in self._brands:
                        b = self._brands[bid]
                        brand_names.append(b.get('persian_name') or b.get('english_name') or str(bid))
                if brand_names:
                    meta_pairs.append(('related_brands', php_serialize_array(brand_names)))

            # Products
            if product_ids:
                product_names = [self._products[pid] for pid in product_ids if pid in self._products]
                if product_names:
                    meta_pairs.append(('related_products', php_serialize_array(product_names)))

            # Batch insert all meta
            for key, val in meta_pairs:
                if val is not None:
                    self.wp.insert(
                        "INSERT INTO wp_postmeta (post_id, meta_key, meta_value) VALUES (%s, %s, %s)",
                        (wp_post_id, key, val)
                    )

            # ── Category link ──
            cat_name = CATEGORY_MAP.get(post_type)
            if cat_name:
                cache_key = f"category:{cat_name}"
                tt_id = self._wp_term_cache.get(cache_key)
                if tt_id:
                    self.wp.insert(
                        "INSERT IGNORE INTO wp_term_relationships (object_id, term_taxonomy_id, term_order) "
                        "VALUES (%s, %s, 0)",
                        (wp_post_id, tt_id)
                    )

            # ── Tag links ──
            for tag_name in tag_names:
                tt_id = self._get_or_create_tag(tag_name)
                if tt_id:
                    self.wp.insert(
                        "INSERT IGNORE INTO wp_term_relationships (object_id, term_taxonomy_id, term_order) "
                        "VALUES (%s, %s, 0)",
                        (wp_post_id, tt_id)
                    )

            # ── Views ──
            if post.get('views') and int(post['views'] or 0) > 0:
                try:
                    self.wp.insert(
                        "INSERT INTO wp_gsm_view (post_id, view_count) VALUES (%s, %s) "
                        "ON DUPLICATE KEY UPDATE view_count = VALUES(view_count)",
                        (wp_post_id, int(post['views']))
                    )
                    self.stats.views_migrated += 1
                except Exception:
                    # Table might not exist, store as meta instead
                    self.wp.insert(
                        "INSERT INTO wp_postmeta (post_id, meta_key, meta_value) VALUES (%s, 'views', %s)",
                        (wp_post_id, str(post['views']))
                    )

            # ── Commit this post ──
            self.wp.commit()
            self.stats.posts_created += 1

            elapsed_ms = (time.time() - t0) * 1000
            self.log.log_operation(strapi_id, post_type, wp_post_id, title, slug,
                                   'create', 'success', '', elapsed_ms,
                                   bool(seo_data), bool(image_url))

        except Exception as e:
            elapsed_ms = (time.time() - t0) * 1000
            self.stats.posts_failed += 1
            self.stats.errors += 1

            if not self.dry_run and self.wp:
                self.wp.rollback()

            self.log.error(f"  Post {strapi_id} FAILED: {e}")
            self.log.log_operation(strapi_id, post_type, None, title, slug,
                                   'create', 'failed', str(e), elapsed_ms)

    def _create_attachment(self, parent_post_id: int, file_id: Optional[int],
                       image_url: str, post_date: str) -> Optional[int]:
        """
        Create a WordPress attachment post for a featured image.
        Returns the attachment post ID.
        """
        if not image_url:
            return None

        try:
            file_info = self._files.get(file_id, {}) if file_id else {}

            parsed_name = os.path.basename(urlparse(image_url).path) if image_url else ""
            file_name = file_info.get('name') or parsed_name or 'image.jpg'
            mime_type = file_info.get('mime', 'image/jpeg')
            alt_text = file_info.get('alternative_text', '')

            # The attachment ID: use a deterministic ID based on parent post
            # This ensures re-runs don't create duplicates
            attachment_id = parent_post_id + 500000  # separate ID space for attachments

            relative_path = extract_relative_upload_path(image_url)
            guid = image_url
            s3_base_url = (self.config.s3.get('base_url') or '').rstrip('/')
            if s3_base_url and relative_path:
                guid = f"{s3_base_url}/{relative_path.lstrip('/')}"

            self.wp.insert(
                "INSERT INTO wp_posts "
                "(ID, post_author, post_date, post_date_gmt, post_content, post_title, "
                " post_excerpt, post_status, comment_status, ping_status, post_password, "
                " post_name, to_ping, pinged, post_modified, post_modified_gmt, "
                " post_content_filtered, post_parent, guid, menu_order, post_type, "
                " post_mime_type, comment_count) "
                "VALUES (%s, 1, %s, %s, '', %s, '', 'inherit', 'open', 'closed', '', "
                "        %s, '', '', %s, %s, '', %s, %s, 0, 'attachment', %s, 0)",
                (attachment_id, post_date, post_date, file_name,
                create_wp_slug(file_name), post_date, post_date,
                parent_post_id, guid, mime_type)
            )

            # Store WordPress-style relative attachment path, not absolute URL
            self.wp.insert(
                "INSERT INTO wp_postmeta (post_id, meta_key, meta_value) VALUES (%s, '_wp_attached_file', %s)",
                (attachment_id, relative_path)
            )

            # Alt text
            if alt_text:
                self.wp.insert(
                    "INSERT INTO wp_postmeta (post_id, meta_key, meta_value) VALUES (%s, '_wp_attachment_image_alt', %s)",
                    (attachment_id, alt_text)
                )

            return attachment_id

        except Exception as e:
            self.log.warn(f"  Failed to create attachment for post {parent_post_id}: {e}")
            return None


    def _get_or_create_tag(self, tag_name: str) -> Optional[int]:
        """Get or create a WordPress tag, return term_taxonomy_id."""
        cache_key = f"post_tag:{tag_name}"
        if cache_key in self._wp_term_cache:
            return self._wp_term_cache[cache_key]

        if self.dry_run:
            return None

        # Check if exists
        existing = self.wp.fetchone(
            "SELECT t.term_id, tt.term_taxonomy_id FROM wp_terms t "
            "JOIN wp_term_taxonomy tt ON t.term_id = tt.term_id "
            "WHERE t.name = %s AND tt.taxonomy = 'post_tag'",
            (tag_name,)
        )
        if existing:
            self._wp_term_cache[cache_key] = existing['term_taxonomy_id']
            self.stats.tags_existing += 1
            return existing['term_taxonomy_id']

        # Create
        slug = create_wp_slug(tag_name)
        term_id = self.wp.insert(
            "INSERT INTO wp_terms (name, slug, term_group) VALUES (%s, %s, 0)",
            (tag_name, slug)
        )
        if term_id:
            tt_id = self.wp.insert(
                "INSERT INTO wp_term_taxonomy (term_id, taxonomy, description, parent, count) "
                "VALUES (%s, 'post_tag', '', 0, 0)",
                (term_id,)
            )
            self._wp_term_cache[cache_key] = tt_id
            self.stats.tags_created += 1
            return tt_id

        return None

    # ─── Phase 4: Comments ───────────────────────────────────

    def _migrate_comments(self):
        """Migrate comments from Strapi to WordPress wp_comments."""
        comments = self.strapi.fetchall(
            "SELECT id, content, author_name, author_email, author_avatar, "
            "is_admin_comment, approval_status, related, created_at, updated_at "
            "FROM comments_comment WHERE removed IS NULL OR removed = 0 "
            "ORDER BY id ASC"
            + (f" LIMIT {self.per_model_limit}" if self.per_model_limit else "")
        )

        self.log.info(f"Found {len(comments)} comments to migrate")

        if self.dry_run:
            self.stats.comments_migrated = len(comments)
            self.log.info(f"  [WOULD MIGRATE] {len(comments)} comments")
            return

        for comment in comments:
            try:
                strapi_comment_id = comment['id']

                # Parse the 'related' field to find the post
                # Format is typically "api::post.post:POST_ID"
                related = comment.get('related') or ''
                strapi_post_id = None

                if ':' in str(related):
                    parts = str(related).split(':')
                    try:
                        strapi_post_id = int(parts[-1])
                    except (ValueError, IndexError):
                        pass

                if not strapi_post_id:
                    # Try parsing as JSON
                    try:
                        rel_data = json.loads(related) if isinstance(related, str) else related
                        if isinstance(rel_data, dict):
                            strapi_post_id = rel_data.get('id')
                    except (json.JSONDecodeError, TypeError):
                        pass

                if not strapi_post_id:
                    self.log.debug(f"  Comment {strapi_comment_id}: cannot resolve post, skipping")
                    continue

                wp_post_id = strapi_post_id + self.id_offset

                # Resolve parent comment (threading)
                parent_strapi_id = self._comment_threads.get(strapi_comment_id, 0)
                wp_parent_id = self._wp_comment_id_map.get(parent_strapi_id, 0)

                # Map approval status
                status = comment.get('approval_status') or ''
                if status == 'APPROVED' or status == 'approved':
                    approved = '1'
                elif status == 'REJECTED' or status == 'rejected':
                    approved = 'spam'
                else:
                    approved = '0'  # pending

                comment_date = format_datetime(comment.get('created_at'))
                author_name = comment.get('author_name') or 'Anonymous'
                author_email = comment.get('author_email') or ''
                content = comment.get('content') or ''

                wp_comment_id = self.wp.insert(
                    "INSERT INTO wp_comments "
                    "(comment_post_ID, comment_author, comment_author_email, comment_author_url, "
                    " comment_author_IP, comment_date, comment_date_gmt, comment_content, "
                    " comment_karma, comment_approved, comment_agent, comment_type, "
                    " comment_parent, user_id) "
                    "VALUES (%s, %s, %s, '', '', %s, %s, %s, 0, %s, 'strapi-migration', "
                    "        'comment', %s, 0)",
                    (wp_post_id, author_name, author_email, comment_date, comment_date,
                     content, approved, wp_parent_id)
                )

                if wp_comment_id:
                    self._wp_comment_id_map[strapi_comment_id] = wp_comment_id
                    self.stats.comments_migrated += 1

                    # Store strapi comment ID as meta
                    self.wp.insert(
                        "INSERT INTO wp_commentmeta (comment_id, meta_key, meta_value) "
                        "VALUES (%s, 'strapi_comment_id', %s)",
                        (wp_comment_id, str(strapi_comment_id))
                    )

            except Exception as e:
                self.log.error(f"  Comment {comment.get('id')} failed: {e}")
                self.stats.errors += 1

        if self.stats.comments_migrated > 0:
            self.wp.commit()

    # ─── Phase 5: Static Pages ───────────────────────────────

    def _migrate_static_pages(self):
        """Migrate Strapi static_pages to WordPress pages."""
        pages = self.strapi.fetchall(
            "SELECT id, page_name, main_text, created_at, updated_at, published_at "
            "FROM static_pages ORDER BY id"
            + (f" LIMIT {self.per_model_limit}" if self.per_model_limit else "")
        )

        self.log.info(f"Found {len(pages)} static pages to migrate")

        if self.dry_run:
            for p in pages:
                self.log.info(f"  [WOULD MIGRATE] Page: {p.get('page_name')}")
            self.stats.static_pages_migrated = len(pages)
            return

        for page in pages:
            try:
                page_name = page.get('page_name') or f"page-{page['id']}"
                slug = create_wp_slug(page_name)
                content = page.get('main_text') or ''
                post_date = format_datetime(page.get('published_at') or page.get('created_at'))
                post_modified = format_datetime(page.get('updated_at') or post_date)
                status = 'publish' if page.get('published_at') else 'draft'

                wp_page_id = page['id'] + self.id_offset + 200000  # separate space for pages

                guid = f"{self.config.site_url}/?page_id={wp_page_id}"

                self.wp.insert(
                    "INSERT INTO wp_posts "
                    "(ID, post_author, post_date, post_date_gmt, post_content, post_title, "
                    " post_excerpt, post_status, comment_status, ping_status, post_password, "
                    " post_name, to_ping, pinged, post_modified, post_modified_gmt, "
                    " post_content_filtered, post_parent, guid, menu_order, post_type, "
                    " post_mime_type, comment_count) "
                    "VALUES (%s, 1, %s, %s, %s, %s, '', %s, 'closed', 'closed', '', "
                    "        %s, '', '', %s, %s, '', 0, %s, 0, 'page', '', 0)",
                    (wp_page_id, post_date, post_date, content, page_name,
                     status, slug, post_modified, post_modified, guid)
                )

                # Store strapi reference
                self.wp.insert(
                    "INSERT INTO wp_postmeta (post_id, meta_key, meta_value) VALUES (%s, 'strapi_page_id', %s)",
                    (wp_page_id, str(page['id']))
                )

                self.wp.commit()
                self.stats.static_pages_migrated += 1
                self.log.info(f"  Migrated page: {page_name} -> WP ID {wp_page_id}")

            except Exception as e:
                self.log.error(f"  Static page {page.get('page_name')} failed: {e}")
                self.stats.errors += 1
                if self.wp:
                    self.wp.rollback()

    # ─── Phase 6: Update Term Counts ────────────────────────

    def _update_term_counts(self):
        """Update wp_term_taxonomy.count to reflect actual post counts."""
        try:
            self.wp.execute(
                "UPDATE wp_term_taxonomy tt SET count = ("
                "  SELECT COUNT(DISTINCT tr.object_id) "
                "  FROM wp_term_relationships tr "
                "  JOIN wp_posts p ON tr.object_id = p.ID "
                "  WHERE tr.term_taxonomy_id = tt.term_taxonomy_id "
                "  AND p.post_status = 'publish'"
                ")"
            )

            # Also update comment counts on posts
            self.wp.execute(
                "UPDATE wp_posts p SET comment_count = ("
                "  SELECT COUNT(*) FROM wp_comments c "
                "  WHERE c.comment_post_ID = p.ID AND c.comment_approved = '1'"
                ")"
            )

            self.wp.commit()
            self.log.info("  Term counts and comment counts updated.")
        except Exception as e:
            self.log.error(f"  Failed to update counts: {e}")
            self.stats.errors += 1


# ─────────────────────────────────────────────────────────────
# CLI Entry Point
# ─────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description='Strapi to WordPress Database Migration Tool',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Dry-run with default config (read-only validation)
  python strapi_to_wp_migration.py --dry-run

  # Local Docker test (first 100 posts)
  python strapi_to_wp_migration.py --local-test --limit 100

  # Full local test
  python strapi_to_wp_migration.py --local-test

  # Production migration
  python strapi_to_wp_migration.py --production

  # Resume from post ID 5000
  python strapi_to_wp_migration.py --local-test --resume-from 5000

  # Custom config
  python strapi_to_wp_migration.py --config my_config.ini
        """
    )

    mode = parser.add_mutually_exclusive_group()
    mode.add_argument('--local-test', action='store_true',
                      help='Use config/local_test_config.ini (Docker MySQL on port 3307)')
    mode.add_argument('--production', action='store_true',
                      help='Use config/production_config.ini')

    parser.add_argument('--config', default=None,
                        help='Path to custom config file (overrides --local-test/--production)')
    parser.add_argument('--dry-run', action='store_true',
                        help='Validate only, do not write to WordPress DB')
    parser.add_argument('--limit', type=int, default=None,
                        help='Process only N posts (legacy posts-only limit)')
    parser.add_argument('--per-model-limit', type=int, default=None,
                        help='Process only N rows for each model: users, posts, comments, static pages')
    parser.add_argument('--batch-size', type=int, default=None,
                        help='Override batch size from config')
    parser.add_argument('--skip-comments', action='store_true',
                        help='Skip comment migration')
    parser.add_argument('--skip-static-pages', action='store_true',
                        help='Skip static page migration')
    parser.add_argument('--resume-from', type=int, default=None,
                        help='Resume from Strapi post ID (skip posts with ID < this)')

    args = parser.parse_args()

    # Determine config file
    if args.config:
        config_file = args.config
    elif args.local_test:
        config_file = 'config/local_test_config.ini'
    elif args.production:
        config_file = 'config/production_config.ini'
    else:
        config_file = 'config/migration_config.ini'

    # Load config
    try:
        config = MigrationConfig(config_file)
    except FileNotFoundError as e:
        print(f"ERROR: {e}")
        sys.exit(1)

    # Run migration
    migration = StrapiToWordPressMigration(
        config=config,
        dry_run=args.dry_run,
        limit=args.limit,
        batch_size=args.batch_size,
        skip_comments=args.skip_comments,
        skip_static_pages=args.skip_static_pages,
        resume_from=args.resume_from,
        per_model_limit=args.per_model_limit,
    )

    success = migration.run()
    sys.exit(0 if success else 1)


if __name__ == '__main__':
    main()
