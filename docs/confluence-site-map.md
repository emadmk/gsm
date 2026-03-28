# GSM Public Site Map

## Document Control

| Field | Value |
| --- | --- |
| Document type | Confluence-ready product document |
| Scope | Public website information architecture |
| Product | GSM News |
| Platform | Next.js 16 application |
| Last reviewed | 2026-03-28 |
| Source of truth | Current routes under `app/(site)` |

## Purpose

This document describes the public-facing information architecture of the GSM News website. It is intended to help product, content, engineering, QA, and SEO stakeholders understand the current navigation model, page types, and content entry points.

## Audience

- Product managers
- Editors and content leads
- Frontend and backend engineers
- QA and SEO teams
- Stakeholders reviewing site scope or delivery status

## Platform Summary

The public website is a Persian RTL content platform focused on mobile and technology news. The content model centers on four editorial content types:

- `NEWS`
- `ARTICLE`
- `REVIEW`
- `STORY`

Published content is surfaced through the homepage, listing pages, detail pages, search, and taxonomy pages.

## Public Navigation Tree

```text
/
|-- /news
|-- /articles
|-- /reviews
|-- /search?q=
|-- /category/{slug}
|-- /tag/{slug}
|-- /author/{slug}
|-- /mag/news/{id}/{slug}
|-- /mag/article/{id}/{slug}
`-- /mag/review/{id}/{slug}
```

## Page Inventory

| Area | Route | Page type | Primary purpose | Primary audience |
| --- | --- | --- | --- | --- |
| Homepage | `/` | Landing page | Showcase latest and most important content across the site | All visitors |
| News listing | `/news` | Listing page | Browse published news posts with pagination | Readers interested in latest updates |
| Articles listing | `/articles` | Listing page | Browse long-form editorial and educational content | Readers seeking guides and explainers |
| Reviews listing | `/reviews` | Listing page | Browse published review content | Readers researching products |
| Search | `/search?q=` | Search results | Search published article titles | All visitors |
| Category detail | `/category/{slug}` | Taxonomy page | Browse published content for a category | Topic-based readers |
| Tag detail | `/tag/{slug}` | Taxonomy page | Browse published content for a tag | Topic-based readers |
| Author detail | `/author/{slug}` | Profile and listing page | Show author profile and that author's published content | Readers following writers |
| News detail | `/mag/news/{id}/{slug}` | Content detail | Render a published news article | Readers and search traffic |
| Article detail | `/mag/article/{id}/{slug}` | Content detail | Render a published article | Readers and search traffic |
| Review detail | `/mag/review/{id}/{slug}` | Content detail | Render a published review | Readers and search traffic |

## Homepage Composition

The homepage is the primary editorial hub and currently assembles the following blocks from the database:

| Block | Source | Purpose |
| --- | --- | --- |
| Stories strip | Active `Story` records | Quick visual entry point for short-form content |
| Updated posts ticker | Recently modified published posts | Surface refreshed content |
| Latest posts grid | Latest published posts across types | Highlight top editorial items |
| Reviews section | Latest published `REVIEW` posts | Promote product review content |
| News section | Latest published `NEWS` posts | Promote timely content |
| Articles section | Latest published `ARTICLE` posts | Promote evergreen/editorial content |
| Most viewed section | Highest view-count published posts | Surface popular content |

## Listing and Discovery Model

| Feature | Current behavior |
| --- | --- |
| Pagination | Enabled on listing, taxonomy, author, and search pages |
| Search | Title-based search over published articles |
| Breadcrumbs | Present on listing, taxonomy, author, and detail pages |
| SEO metadata | Generated per route |
| Structured data | Website and breadcrumb schema are generated where applicable |
| Filters | Listing pages use a `brand` query parameter in the UI |
| Ads | Listing sidebars currently include ad placeholders |

## Content Detail Model

The public detail URLs use an `id + slug` structure:

- `/mag/news/{id}/{slug}`
- `/mag/article/{id}/{slug}`
- `/mag/review/{id}/{slug}`

This structure is important operationally because the platform preserves legacy content identifiers from Strapi where possible, which helps maintain URL continuity during migration.

## Taxonomy and Entity Pages

| Entity | Public route | Notes |
| --- | --- | --- |
| Category | `/category/{slug}` | Category landing page for published content |
| Tag | `/tag/{slug}` | Tag landing page for published content |
| Author | `/author/{slug}` | Author bio, stats, and authored content |

## Public Entities Managed by the Site

| Entity | Purpose on public site |
| --- | --- |
| Article | Main editorial record for news, articles, and reviews |
| Story | Short-form visual content shown on homepage |
| Category | Primary content taxonomy |
| Tag | Secondary content taxonomy |
| Author | Writer profile and attribution |
| Brand | Associated metadata used in editorial organization and filtering |
| Comment | User conversation attached to article detail pages |
| Ad | Placement data used for promotional inventory |

## URL and SEO Notes

| Item | Current status |
| --- | --- |
| `robots.txt` | Present |
| `sitemap.xml` | Present |
| `manifest.webmanifest` | Present |
| Route-level metadata | Implemented |
| Breadcrumb schema | Implemented on key pages |
| Canonical-ready content fields | Supported at content model level |

## Known IA Constraints

| Constraint | Impact |
| --- | --- |
| No public standalone story detail route | Stories are currently surfaced from the homepage only |
| No public contact page in current route map | Contact messages exist in admin, but there is no public contact route in the current app tree |
| Brand filtering is presented through category-driven chips on list pages | Labeling and filtering semantics may need refinement in a future UX pass |

## Recommended Confluence Page Title

`GSM News - Public Site Map and Information Architecture`
