# GSM — Technical Documentation

> Professional mobile news & review content management system built with Next.js

---

## 1. Overview

**GSM** is a Persian-language mobile news, article, and review platform. It features a public-facing site with RTL support and a comprehensive admin panel.

### Tech Stack

| Technology | Version | Purpose |
|-----------|---------|---------|
| Next.js | 16.2.1 | React framework (App Router) |
| React | 19.2.4 | UI library |
| Prisma | 6.19.2 | Database ORM |
| PostgreSQL | 16+ | Primary database |
| Tailwind CSS | 3.4.19 | Utility-first CSS |
| TipTap | 3.21.0 | Rich text editor |
| NextAuth | 4.24.13 | Authentication |
| AWS SDK S3 | 3.1019.0 | Cloud storage |
| Sharp | 0.34.5 | Image processing |
| Zod | 4.3.6 | Schema validation |
| Vazirmatn | 5.2.8 | Persian font (local) |

### Architecture

- **App Router** with Server & Client Components
- **Route Groups:** `(site)` for public pages, `admin` for panel
- **API Routes** for backend logic
- **Prisma ORM** with PostgreSQL
- **S3-compatible** media storage
- **JWT sessions** with role-based access

---

## 2. Installation & Setup

### Prerequisites
- Node.js >= 18
- PostgreSQL >= 16
- npm or yarn

### Quick Start

```bash
git clone <repo-url> && cd gsm
cp .env.example .env          # Configure environment
npm install
npx prisma db push            # Create database tables
npx tsx scripts/create-admin.ts  # Create admin user
npm run dev                    # http://localhost:3000
```

### Docker

```bash
docker compose up --build
```

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Yes | JWT encryption key (32+ chars) |
| `NEXTAUTH_URL` | Yes | Site URL (e.g. http://localhost:3000) |
| `ADMIN_EMAIL` | No | Admin email (default: admin@example.com) |
| `ADMIN_PASSWORD` | Yes | Admin password for setup |
| `NEXT_PUBLIC_SITE_URL` | No | Public site URL |
| `NEXT_PUBLIC_SITE_NAME` | No | Site name (default: GSM) |
| `S3_ENDPOINT` | No | S3 server URL |
| `S3_REGION` | No | AWS region (default: us-east-1) |
| `S3_BUCKET` | No | Bucket name |
| `S3_ACCESS_KEY` | No | S3 access key |
| `S3_SECRET_KEY` | No | S3 secret key |
| `S3_PATH_STYLE` | No | Use path-style URLs (true/false) |
| `NEXT_PUBLIC_S3_BASE_URL` | No | CDN/public URL for files |
| `SETTINGS_ENCRYPTION_KEY` | No | AES-256 key for sensitive settings |

---

## 3. Project Structure

```
gsm/
├── app/
│   ├── layout.tsx              # Root layout (fonts, metadata, schemas)
│   ├── globals.css             # Design system, animations
│   ├── (site)/                 # Public site pages
│   │   ├── page.tsx            # Homepage
│   │   ├── articles/           # /articles
│   │   ├── news/               # /news
│   │   ├── reviews/            # /reviews
│   │   ├── search/             # /search
│   │   ├── author/[slug]/      # /author/:slug
│   │   ├── category/[slug]/    # /category/:slug
│   │   ├── tag/[slug]/         # /tag/:slug
│   │   └── mag/                # Article detail pages
│   ├── admin/                  # Admin panel
│   │   ├── articles/           # CRUD articles
│   │   ├── categories/tags/authors/brands/  # Content management
│   │   ├── comments/           # Comment moderation
│   │   ├── media/              # Media library
│   │   ├── seo/                # SEO management
│   │   ├── aeo/                # AEO optimization
│   │   ├── import/strapi/      # Strapi import
│   │   └── settings/           # Site settings
│   └── api/                    # API routes (27 endpoints)
├── components/                 # React components
│   ├── articles/               # ArticleCard, CommentSection, etc.
│   ├── layout/                 # Header, Footer
│   ├── common/                 # Pagination, Breadcrumb, etc.
│   ├── ui/                     # Button, Input, Badge, Toast
│   └── admin/                  # RichTextEditor, MediaUpload
├── lib/                        # Libraries & utilities
│   ├── db.ts                   # Prisma client singleton
│   ├── auth.ts                 # NextAuth configuration
│   ├── utils.ts                # Utility functions
│   ├── seo.ts                  # SEO helpers
│   ├── api-auth.ts             # API authentication
│   ├── admin-security.ts       # Role-based access
│   ├── secure-settings.ts      # AES-256-GCM encryption
│   ├── media-storage.ts        # S3 storage helpers
│   └── imports/                # Strapi migration engine
├── prisma/schema.prisma        # Database schema
├── public/fonts/               # Vazirmatn (4 weights)
├── proxy.ts                    # Security middleware
└── docker-compose.yml          # Docker deployment
```

---

## 4. Database Schema

### Models

| Model | Description | Key Fields |
|-------|-------------|------------|
| **User** | Admin users | email, password (bcrypt), role |
| **Author** | Content authors | name, slug, bio, avatar, label |
| **Article** | News/articles/reviews | title, slug, content, postType, status, faq, points |
| **Category** | Hierarchical categories | name, slug, parentId, seoTitle |
| **Tag** | Article tags | name, slug |
| **ArticleTag** | Many-to-many junction | articleId, tagId |
| **Comment** | Threaded comments | content, authorName, isApproved, parentId |
| **Story** | Instagram-like stories | title, cover, items (JSON) |
| **Brand** | Mobile brands | name, nameEn, slug, logo |
| **Ad** | Advertisements | zone, imageUrl, linkUrl, isActive |
| **Setting** | Key-value config | key, value (auto-encrypted) |
| **ContactMessage** | Contact form | name, email, subject, message |
| **PageView** | Analytics | articleId, viewDate, count |
| **ImportRun** | Migration tracking | status, progress, logText, stats |
| **Media** | Uploaded files | filename, mimeType, size, width, height, url, altText |

### Enums

| Enum | Values |
|------|--------|
| UserRole | `ADMIN`, `EDITOR` |
| PostType | `NEWS`, `ARTICLE`, `REVIEW`, `STORY` |
| ContentStatus | `DRAFT`, `PUBLISHED` |
| ImportRunStatus | `PENDING`, `RUNNING`, `COMPLETED`, `FAILED` |

### Composite Indexes (Article)

```
[status, publishedAt]           — Listing pages
[status, postType, publishedAt] — Filtered listings
[status, viewCount]             — Most viewed
[status, featured, publishedAt] — Featured content
[status, modifiedAt]            — Updated ticker
```

---

## 5. Public Site Pages

| Route | Type | Description |
|-------|------|-------------|
| `/` | Server Component | Homepage: stories, latest posts, reviews, news, articles, most viewed |
| `/articles` | Server Component | Article listing with pagination & category filter |
| `/news` | Server Component | News listing with pagination |
| `/reviews` | Server Component | Reviews listing with pagination |
| `/search?q=` | Server Component | Full-text search across articles |
| `/author/:slug` | Server Component | Author profile with articles |
| `/category/:slug` | Server Component | Category page with hierarchy |
| `/tag/:slug` | Server Component | Tag page with articles |
| `/mag/article/:id/:slug` | Server Component | Article detail (content, FAQ, comments, related) |
| `/mag/news/:id/:slug` | Server Component | News detail |
| `/mag/review/:id/:slug` | Server Component | Review detail (pros/cons/score) |

All listing pages use `export const dynamic = 'force-dynamic'` to prevent stale data.

---

## 6. Admin Panel

| Route | Role | Description |
|-------|------|-------------|
| `/admin` | EDITOR+ | Dashboard with statistics |
| `/admin/login` | Public | Login page |
| `/admin/articles` | EDITOR+ | Articles CRUD (search, filter, bulk delete) |
| `/admin/articles/new` | EDITOR+ | Create article (TipTap editor, FAQ, review points) |
| `/admin/articles/:id` | EDITOR+ | Edit article |
| `/admin/categories` | EDITOR+ | Category management (hierarchical) |
| `/admin/tags` | EDITOR+ | Tag management |
| `/admin/authors` | EDITOR+ | Author management (avatar upload) |
| `/admin/brands` | EDITOR+ | Brand management |
| `/admin/comments` | EDITOR+ | Comment moderation (approve/reject/reply) |
| `/admin/stories` | EDITOR+ | Story management |
| `/admin/ads` | EDITOR+ | Advertisement management |
| `/admin/media` | **ADMIN** | WordPress-like media library (grid/list, upload, edit) |
| `/admin/media/settings` | **ADMIN** | S3 storage configuration |
| `/admin/seo` | **ADMIN** | SEO audit, settings, article checklist |
| `/admin/aeo` | **ADMIN** | AEO scoring, FAQ editor, schema preview |
| `/admin/import/strapi` | **ADMIN** | Strapi data import with cancel support |
| `/admin/settings` | **ADMIN** | Site settings |
| `/admin/contact` | EDITOR+ | Contact messages |

---

## 7. Authentication & Authorization

- **Provider:** NextAuth with CredentialsProvider
- **Sessions:** JWT with 30-day expiry
- **Password Hashing:** bcryptjs
- **Roles:** ADMIN (full) > EDITOR (content)
- **Route Protection:** Middleware redirects unauthorized to /admin/login
- **API Protection:** `requireAuthorizedSession()` with role checking
- **CSRF:** Origin/Referer validation for mutations

---

## 8. Media & File Upload

- **Storage:** S3-compatible (AWS S3, MinIO)
- **Upload Path:** `uploads/{year}/{month}/{name}-{timestamp}-{hex}.{ext}`
- **File Validation:** MIME type checking, size limits (10MB upload, 50MB media)
- **Image Processing:** Dimension extraction via Sharp
- **Security:** Sensitive S3 keys encrypted with AES-256-GCM at rest
- **Media Library:** Full WordPress-like UI with grid/list view, search, filter, bulk operations

---

## 9. SEO System

### Meta Generation
`generateSeoMeta()` creates Next.js Metadata with Open Graph, Twitter Cards, canonical URLs, and robots config.

### Structured Data (JSON-LD)

| Schema Type | Used On |
|-------------|---------|
| Organization | Root layout (site-wide) |
| WebSite | Root layout (with SearchAction) |
| NewsArticle | Article & news detail pages |
| Review | Review detail pages (with rating) |
| FAQPage | Articles with FAQ sections |
| BreadcrumbList | All content detail pages |

### SEO Admin Tools
- Article audit table with 10-point scoring
- Inline meta title/description editing
- Focus keyword tracking
- Site-wide SEO settings

---

## 10. AEO (Answer Engine Optimization)

AEO helps content become AI answer sources. The system scores articles on 10 criteria:

1. FAQ section presence
2. Structured headings (H2/H3)
3. Ordered/unordered lists
4. Comparison tables
5. Content length (>1000 words)
6. Meta description
7. Focus keyword
8. Direct answer format (first paragraph)
9. Article excerpt
10. Question-oriented title

Features: FAQ editor per article, JSON-LD preview, content recommendations, score filtering.

---

## 11. Security Middleware (proxy.ts)

| Feature | Details |
|---------|---------|
| Rate Limiting | 100 requests/minute per IP |
| Security Headers | X-Frame-Options, X-Content-Type-Options, XSS-Protection, Referrer-Policy |
| Bot Blocking | Blocks sqlmap, nikto, nessus, and other scanner user-agents |
| SQL Injection | Blocks common injection patterns in query strings |
| XSS Prevention | Blocks `<script>` and similar patterns |
| Admin Protection | Redirects unauthenticated to /admin/login |
| API Protection | Role-based access for sensitive endpoints |

---

## 12. Strapi Import System

Migrates data from Strapi MySQL to PostgreSQL:

1. **Tags** — with slug deduplication (fallback: `slug-{id}`)
2. **Categories** — with parent-child hierarchy preservation
3. **Authors** — merges `admin_users` + `up_users` tables
4. **Posts** — type detection (NEWS/ARTICLE/REVIEW), image resolution, brand linking
5. **Comments** — with reply threading, approval status mapping
6. **Sequence Reset** — resets PostgreSQL auto-increment sequences

Features: Dry run mode, cancellation support, progress events, stale run detection (>12h), per-entity error tracking.

---

## 13. Components Reference

### Article Components
| Component | Type | Description |
|-----------|------|-------------|
| ArticleCard | Server | Article card with image, title, author, date |
| ArticleCardLarge | Server | Large featured card with overlay |
| CommentSection | Client | Threaded comments with submit form |
| RelatedArticles | Server | Related articles from same category |
| TableOfContents | Client | Auto-generated TOC from headings |

### Layout Components
| Component | Type | Description |
|-----------|------|-------------|
| Header | Client | Sticky header with search dropdown, mobile menu |
| Footer | Client | Newsletter, social links, trust badges |

### Common Components
| Component | Type | Description |
|-----------|------|-------------|
| Pagination | Server | Page numbers with Persian digits |
| Breadcrumb | Server | Navigation path |
| SearchBox | Client | Search form with router navigation |
| AuthorLink | Client | Clickable author name (avoids nested `<a>` errors) |
| ShareButton | Client | Native share / clipboard copy |
| BackToTop | Client | Scroll-to-top button |

### UI Components
| Component | Description |
|-----------|-------------|
| Button | Variants: primary, secondary, ghost, link. Sizes: sm, md, lg |
| Input | Form input with label, error, RTL support |
| Textarea | Multi-line input |
| Badge | Colored label badges |
| Toast | Notification system with context provider |

### Admin Components
| Component | Description |
|-----------|-------------|
| RichTextEditor | TipTap editor with 3 toolbars (formatting, structure, media). Supports: bold, italic, underline, headings, alignment, lists, blockquote, code, images, YouTube, tables, color picker |
| MediaUpload | Drag-and-drop file upload to S3 |
| SeoAnalyzer | Article SEO analysis component |

---

## 14. Styling System

- **Framework:** Tailwind CSS with CSS custom properties
- **Font:** Vazirmatn (locally hosted, 4 weights: 400, 500, 700, 900)
- **Direction:** RTL-first design
- **Typography Classes:** display-sm/lg, h1-h6, subtitle-sm/lg, body-sm/lg, caption
- **Custom Animations:** fade-section (scroll), marquee (ticker), skeleton (loading), spin-slow
- **Color Palette:** Primary blue (#197BFF), green, yellow, red, gray, orange

---

## 15. Deployment

### Docker Compose (Production)

```yaml
services:
  db:       PostgreSQL 16-alpine (port 5433→5432, healthcheck, volume)
  app:      Next.js (port 3000, depends on healthy db)
  setup:    One-time init (prisma push + create admin)
```

### Commands

```bash
docker compose up -d                     # Start
docker compose down                      # Stop
docker compose logs -f app               # Logs
docker compose exec app sh               # Shell
docker compose exec db psql -U postgres  # DB shell
```

### Production Checklist

- [ ] Set all required environment variables
- [ ] Use strong NEXTAUTH_SECRET (32+ chars)
- [ ] Configure S3 storage for media
- [ ] Set NEXT_PUBLIC_SITE_URL to actual domain
- [ ] Run `npx prisma db push` for schema sync
- [ ] Create admin user via setup service or script
- [ ] Configure reverse proxy (nginx) with SSL
- [ ] Enable HTTPS for security headers

---

## 16. API Reference

See [API-REFERENCE.md](./API-REFERENCE.md) for complete endpoint documentation.

## Glossary

See [GLOSSARY.md](./GLOSSARY.md) for term definitions in English and Persian.

## Cheat Sheet

See [CHEAT-SHEET.md](./CHEAT-SHEET.md) for quick command reference.
