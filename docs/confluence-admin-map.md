# GSM Admin Map

## Document Control

| Field | Value |
| --- | --- |
| Document type | Confluence-ready product and operations document |
| Scope | Admin panel information architecture and access model |
| Product | GSM News |
| Platform | Next.js 16 admin application |
| Last reviewed | 2026-03-28 |
| Source of truth | Current routes under `app/admin` and role guards in `lib/admin-security.ts` |

## Purpose

This document describes the structure, access model, and operational responsibilities of the GSM News admin panel. It is intended to support product planning, editorial operations, QA, onboarding, and release documentation.

## Admin Roles

The platform currently supports two admin roles:

| Role | Summary |
| --- | --- |
| `ADMIN` | Full access to all admin sections, settings, media configuration, and import tools |
| `EDITOR` | Access to content and operational sections, but not to admin-only configuration sections |

## Admin Navigation Tree

```text
/admin/login
/admin
|-- /admin/articles
|   |-- /admin/articles/new
|   `-- /admin/articles/{id}
|-- /admin/categories
|-- /admin/tags
|-- /admin/authors
|-- /admin/brands
|-- /admin/comments
|-- /admin/stories
|-- /admin/ads
|-- /admin/contact
|-- /admin/media          (ADMIN only)
|-- /admin/import/strapi  (ADMIN only)
`-- /admin/settings       (ADMIN only)
```

## Admin Page Inventory

| Area | Route | Access | Purpose | Primary users |
| --- | --- | --- | --- | --- |
| Login | `/admin/login` | Public auth entry | Authenticate admin users | Admins, editors |
| Dashboard | `/admin` | `EDITOR` and `ADMIN` | View headline metrics and recent content activity | Admins, editors |
| Content list | `/admin/articles` | `EDITOR` and `ADMIN` | Manage editorial content across types | Admins, editors |
| New content | `/admin/articles/new` | `EDITOR` and `ADMIN` | Create new content item | Admins, editors |
| Edit content | `/admin/articles/{id}` | `EDITOR` and `ADMIN` | Edit an existing content item | Admins, editors |
| Categories | `/admin/categories` | `EDITOR` and `ADMIN` | Manage content categories | Admins, editors |
| Tags | `/admin/tags` | `EDITOR` and `ADMIN` | Manage tags | Admins, editors |
| Authors | `/admin/authors` | `EDITOR` and `ADMIN` | Manage author profiles | Admins, editors |
| Brands | `/admin/brands` | `EDITOR` and `ADMIN` | Manage brand taxonomy and metadata | Admins, editors |
| Comments | `/admin/comments` | `EDITOR` and `ADMIN` | Moderate reader comments | Admins, editors |
| Stories | `/admin/stories` | `EDITOR` and `ADMIN` | Manage homepage story items | Admins, editors |
| Ads | `/admin/ads` | `EDITOR` and `ADMIN` | Manage ad placements and zones | Admins, editors |
| Contact messages | `/admin/contact` | `EDITOR` and `ADMIN` | Review inbound contact records | Admins, editors |
| Media settings | `/admin/media` | `ADMIN` only | Configure S3-compatible storage and test upload connectivity | Admins |
| Strapi import | `/admin/import/strapi` | `ADMIN` only | Connect to Strapi MySQL, test connection, and run imports | Admins |
| Settings | `/admin/settings` | `ADMIN` only | Maintain site-wide and integration settings | Admins |

## Dashboard Scope

The dashboard currently summarizes:

| Metric area | Current coverage |
| --- | --- |
| Article counts | News, articles, reviews, stories, total |
| Comment counts | Approved, pending, total |
| Traffic | Aggregate article view count |
| Recent activity | Recently created articles with author and category |

## Managed Content Domains

| Domain | Managed data |
| --- | --- |
| Editorial content | Articles across `NEWS`, `ARTICLE`, `REVIEW`, and `STORY` types |
| Taxonomy | Categories, tags, brands |
| People | Authors |
| Moderation | Comments |
| Promotions | Ads |
| Homepage modules | Stories |
| Inbound communication | Contact messages |
| Configuration | Site settings, media storage settings |
| Data migration | Strapi import runs, logs, and summaries |

## Access Matrix

| Section | EDITOR | ADMIN |
| --- | --- | --- |
| Dashboard | Yes | Yes |
| Articles | Yes | Yes |
| Categories | Yes | Yes |
| Tags | Yes | Yes |
| Authors | Yes | Yes |
| Brands | Yes | Yes |
| Comments | Yes | Yes |
| Stories | Yes | Yes |
| Ads | Yes | Yes |
| Contact messages | Yes | Yes |
| Media | No | Yes |
| Strapi import | No | Yes |
| Settings | No | Yes |

## Admin-Only Security Boundaries

The following areas are intentionally restricted to `ADMIN` users:

| Boundary | Protected paths |
| --- | --- |
| Admin pages | `/admin/import`, `/admin/media`, `/admin/settings` |
| Admin APIs | `/api/imports`, `/api/settings` |

Additional security controls currently in place:

| Control | Purpose |
| --- | --- |
| Session-based authorization | Prevent unauthenticated access |
| Role checks | Limit admin-only features to `ADMIN` users |
| Same-origin checks on sensitive mutations | Reduce CSRF risk on protected write operations |
| Encrypted sensitive settings at rest | Protect stored secrets such as storage and SMTP credentials |
| Hidden admin-only navigation items | Prevent non-admin users from seeing restricted sections in the UI |

## Core Admin APIs

| API group | Purpose | Access level |
| --- | --- | --- |
| `/api/articles` | CRUD for editorial content | `EDITOR` and `ADMIN` |
| `/api/categories` | Category management | `EDITOR` and `ADMIN` |
| `/api/tags` | Tag management | `EDITOR` and `ADMIN` |
| `/api/authors` | Author management | `EDITOR` and `ADMIN` |
| `/api/brands` | Brand management | `EDITOR` and `ADMIN` |
| `/api/comments` | Comment moderation | `EDITOR` and `ADMIN` |
| `/api/stories` | Story management | `EDITOR` and `ADMIN` |
| `/api/ads` | Advertising management | `EDITOR` and `ADMIN` |
| `/api/contact` | Contact message review | `EDITOR` and `ADMIN` |
| `/api/stats` | Dashboard metrics | `EDITOR` and `ADMIN` |
| `/api/upload` | Media upload and connectivity checks | `EDITOR` and `ADMIN`, configured by `ADMIN` |
| `/api/settings` | Site and integration settings | `ADMIN` only |
| `/api/imports/strapi` | Import execution, history, and status | `ADMIN` only |

## Operational Workflows

### Editorial Workflow

1. An editor or admin creates content in `/admin/articles/new`.
2. The content record is classified by post type and status.
3. Taxonomy and author relationships are attached.
4. The content is published and becomes eligible for public discovery.
5. The public site surfaces it through homepage modules, listings, search, and detail pages.

### Strapi Import Workflow

1. An admin opens `/admin/import/strapi`.
2. The admin enters Strapi MySQL connection details and optional import controls.
3. The admin can test the source connection before import.
4. The platform creates an `ImportRun` record and executes the import.
5. Status, logs, progress, and summary metrics are visible in the admin UI.
6. Source passwords are not stored in the application database.

## Configuration Domains

| Configuration area | Example data |
| --- | --- |
| Site settings | Title, description, contact info, social links, analytics code |
| Media settings | S3 endpoint, bucket, region, access keys, CDN URL |
| Security-sensitive settings | Encrypted at rest using the settings encryption layer |

## Recommended Confluence Page Title

`GSM News - Admin Panel Map, Roles, and Operational Architecture`
