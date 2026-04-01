# GSM Cheat Sheet / برگه تقلب

---

## Quick Start / شروع سریع

```bash
# Clone & Setup
git clone <repo-url> && cd gsm
cp .env.example .env          # Edit .env with your DB credentials
npm install
npx prisma db push            # Create database tables
npx tsx scripts/create-admin.ts  # Create admin user
npm run dev                    # Start dev server → http://localhost:3000

# Docker (alternative)
docker compose up --build      # Everything in one command
```

---

## CLI Commands / دستورات خط فرمان

| Command | Description | توضیح |
|---------|-------------|-------|
| `npm run dev` | Start dev server | اجرای سرور توسعه |
| `npm run build` | Production build | بیلد برای تولید |
| `npm start` | Start production | اجرای نسخه تولید |
| `npx next dev --webpack` | Dev with Webpack | توسعه با Webpack (اگه Turbopack ارور داد) |
| `npx prisma db push` | Sync schema to DB | همگام‌سازی طرحواره با دیتابیس |
| `npx prisma studio` | Open DB GUI | باز کردن رابط گرافیکی دیتابیس |
| `npx prisma generate` | Generate Prisma Client | تولید کلاینت Prisma |
| `npx prisma migrate dev` | Create migration | ایجاد مایگریشن جدید |
| `npx tsx scripts/create-admin.ts` | Create admin | ساخت کاربر ادمین |
| `npx tsc --noEmit` | TypeScript check | بررسی تایپ‌اسکریپت |

---

## Environment Variables / متغیرهای محیطی

```env
# Required / الزامی
DATABASE_URL="postgresql://user:pass@localhost:5432/gsm_news"
NEXTAUTH_SECRET="random-secret-string-at-least-32-chars"
NEXTAUTH_URL="http://localhost:3000"

# Admin / ادمین
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="your-password"

# Site / سایت
NEXT_PUBLIC_SITE_URL="https://your-domain.com"
NEXT_PUBLIC_SITE_NAME="GSM"

# S3 Storage / ذخیره‌سازی (Optional)
S3_ENDPOINT="https://s3.example.com"
S3_REGION="us-east-1"
S3_BUCKET="gsm-media"
S3_ACCESS_KEY="your-access-key"
S3_SECRET_KEY="your-secret-key"
S3_PATH_STYLE="true"
NEXT_PUBLIC_S3_BASE_URL="https://s3.example.com/gsm-media"

# Encryption / رمزنگاری (Optional)
SETTINGS_ENCRYPTION_KEY="32-char-hex-key"
```

---

## Project Structure / ساختار پروژه

```
gsm/
├── app/
│   ├── layout.tsx              # Root layout (fonts, metadata, schemas)
│   ├── globals.css             # Design system, animations, typography
│   ├── (site)/                 # Public site (route group)
│   │   ├── layout.tsx          # Site layout (Header + Footer)
│   │   ├── page.tsx            # Homepage
│   │   ├── articles/page.tsx   # /articles
│   │   ├── news/page.tsx       # /news
│   │   ├── reviews/page.tsx    # /reviews
│   │   ├── search/page.tsx     # /search?q=...
│   │   ├── author/[slug]/      # /author/نام-نویسنده
│   │   ├── category/[slug]/    # /category/دسته-بندی
│   │   ├── tag/[slug]/         # /tag/برچسب
│   │   └── mag/
│   │       ├── article/[id]/[slug]/  # /mag/article/123/عنوان
│   │       ├── news/[id]/[slug]/     # /mag/news/123/عنوان
│   │       └── review/[id]/[slug]/   # /mag/review/123/عنوان
│   ├── admin/                  # Admin panel
│   │   ├── layout.tsx          # Admin layout (sidebar, auth)
│   │   ├── page.tsx            # Dashboard
│   │   ├── login/page.tsx      # Login
│   │   ├── articles/           # CRUD articles
│   │   ├── categories/         # CRUD categories
│   │   ├── tags/               # CRUD tags
│   │   ├── authors/            # CRUD authors
│   │   ├── brands/             # CRUD brands
│   │   ├── comments/           # Moderate comments
│   │   ├── stories/            # CRUD stories
│   │   ├── ads/                # CRUD advertisements
│   │   ├── media/              # Media library
│   │   ├── media/settings/     # S3 configuration
│   │   ├── contact/            # Contact messages
│   │   ├── seo/                # SEO management
│   │   ├── aeo/                # AEO optimization
│   │   ├── import/strapi/      # Strapi data import
│   │   └── settings/           # Site settings
│   └── api/                    # API routes
│       ├── articles/           # GET POST
│       ├── articles/[id]/      # GET PATCH DELETE
│       ├── authors/            # GET POST
│       ├── categories/         # GET POST
│       ├── tags/               # GET POST
│       ├── brands/             # GET POST
│       ├── comments/           # GET POST
│       ├── stories/            # GET POST
│       ├── ads/                # GET POST
│       ├── contact/            # GET POST
│       ├── media/              # GET POST PATCH DELETE
│       ├── upload/             # POST (file upload)
│       ├── settings/           # GET POST
│       ├── stats/              # GET (dashboard stats)
│       ├── search/             # GET
│       └── imports/strapi/     # GET POST + [id] + test
├── components/
│   ├── articles/               # ArticleCard, CommentSection, etc.
│   ├── layout/                 # Header, Footer
│   ├── common/                 # Pagination, Breadcrumb, SearchBox, etc.
│   ├── ui/                     # Button, Input, Badge, Toast
│   └── admin/                  # RichTextEditor, MediaUpload, SeoAnalyzer
├── lib/
│   ├── db.ts                   # Prisma client singleton
│   ├── auth.ts                 # NextAuth config
│   ├── utils.ts                # Utility functions
│   ├── seo.ts                  # SEO helpers & schema generators
│   ├── api-auth.ts             # API authentication
│   ├── admin-security.ts       # Role-based access control
│   ├── secure-settings.ts      # AES-256-GCM encryption
│   ├── media-storage.ts        # S3 storage helpers
│   └── imports/                # Strapi migration
├── prisma/
│   └── schema.prisma           # Database schema
├── public/
│   ├── fonts/                  # Vazirmatn woff2 files
│   └── images/                 # Static images
├── scripts/
│   ├── create-admin.ts         # Create admin user
│   ├── fix-images.ts           # Fix image paths
│   └── migrate-strapi.ts       # CLI migration script
├── proxy.ts                    # Middleware (security, rate limiting)
├── next.config.mjs             # Next.js configuration
├── tailwind.config.ts          # Tailwind CSS configuration
├── docker-compose.yml          # Docker deployment
└── package.json                # Dependencies & scripts
```

---

## API Quick Reference / مرجع سریع API

### Authentication Required / نیاز به احراز هویت

| Endpoint | Methods | Role | Description |
|----------|---------|------|-------------|
| `GET /api/articles` | GET | EDITOR+ | List articles |
| `POST /api/articles` | POST | EDITOR+ | Create article |
| `GET /api/articles/:id` | GET | EDITOR+ | Get article |
| `PATCH /api/articles/:id` | PATCH | EDITOR+ | Update article |
| `DELETE /api/articles/:id` | DELETE | EDITOR+ | Delete article |
| `GET /api/authors` | GET | EDITOR+ | List authors |
| `POST /api/authors` | POST | EDITOR+ | Create author |
| `PATCH /api/authors/:id` | PATCH | EDITOR+ | Update author |
| `DELETE /api/authors/:id` | DELETE | EDITOR+ | Delete author |
| `GET /api/categories` | GET | EDITOR+ | List categories |
| `POST /api/categories` | POST | EDITOR+ | Create category |
| `GET /api/tags` | GET | EDITOR+ | List tags |
| `POST /api/tags` | POST | EDITOR+ | Create tag |
| `GET /api/brands` | GET | EDITOR+ | List brands |
| `POST /api/brands` | POST | EDITOR+ | Create brand |
| `GET /api/comments` | GET | EDITOR+ | List comments |
| `PATCH /api/comments/:id` | PATCH | EDITOR+ | Approve/reject |
| `GET /api/stories` | GET | EDITOR+ | List stories |
| `GET /api/ads` | GET | EDITOR+ | List ads |
| `GET /api/contact` | GET | EDITOR+ | List messages |
| `GET /api/stats` | GET | EDITOR+ | Dashboard stats |
| `POST /api/upload` | POST | EDITOR+ | Upload file |
| `GET /api/media` | GET | EDITOR+ | List media |
| `POST /api/media` | POST | EDITOR+ | Upload media |
| `PATCH /api/media` | PATCH | EDITOR+ | Update media |
| `DELETE /api/media` | DELETE | EDITOR+ | Delete media |
| `GET /api/settings` | GET | **ADMIN** | Get settings |
| `POST /api/settings` | POST | **ADMIN** | Update settings |
| `GET /api/imports/strapi` | GET | **ADMIN** | List imports |
| `POST /api/imports/strapi` | POST | **ADMIN** | Start import |
| `PATCH /api/imports/strapi/:id` | PATCH | **ADMIN** | Cancel import |

### Public / عمومی

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `POST /api/comments` | POST | Submit comment |
| `POST /api/contact` | POST | Submit contact form |
| `GET /api/search` | GET | Search articles |

---

## Database Models / مدل‌های دیتابیس

```
User (id, email, password, role, name)
Author (id, name, slug, email, bio, avatar, label, viewCount)
Article (id, title, slug, content, image, postType, status, publishedAt, authorId, categoryId, viewCount, metaTitle, metaDesc, focusKeyword, faq, points, brands)
Category (id, name, slug, description, image, parentId, order, seoTitle, seoContent)
Tag (id, name, slug)
ArticleTag (articleId, tagId) — junction table
Comment (id, articleId, parentId, authorName, content, isApproved, isAdmin)
Story (id, title, cover, items, order, isActive)
Brand (id, name, nameEn, slug, logo, description, priority)
Ad (id, zone, title, content, imageUrl, linkUrl, isActive, order)
Setting (id, key, value)
ContactMessage (id, name, email, subject, message, isRead)
PageView (id, articleId, viewDate, count)
ImportRun (id, sourceType, status, sourceHost, sourceDatabase, ...)
Media (id, filename, originalName, mimeType, size, width, height, altText, url, path)
```

---

## User Roles / نقش‌های کاربری

| Role | Access | Description |
|------|--------|-------------|
| **ADMIN** | Everything | Full access + settings, media config, imports, SEO, AEO |
| **EDITOR** | Content | Articles, categories, tags, authors, comments, stories, ads |

### ADMIN-only pages:
`/admin/media` `/admin/settings` `/admin/import/strapi` `/admin/seo` `/admin/aeo`

### ADMIN-only APIs:
`/api/settings` `/api/imports/*` `/api/media/test`

---

## Common Prisma Queries / کوئری‌های رایج

```typescript
// Get published articles with author
prisma.article.findMany({
  where: { status: 'PUBLISHED', postType: 'NEWS' },
  orderBy: { publishedAt: 'desc' },
  take: 10,
  include: { author: true, category: true },
})

// Search articles
prisma.article.findMany({
  where: {
    status: 'PUBLISHED',
    OR: [
      { title: { contains: query, mode: 'insensitive' } },
      { excerpt: { contains: query, mode: 'insensitive' } },
    ],
  },
})

// Upsert a setting
prisma.setting.upsert({
  where: { key: 'site_name' },
  update: { value: 'New Name' },
  create: { key: 'site_name', value: 'New Name' },
})

// Count by post type
prisma.article.groupBy({
  by: ['postType'],
  _count: true,
  where: { status: 'PUBLISHED' },
})
```

---

## Utility Functions / توابع کمکی

```typescript
import { getImageUrl, formatDate, formatDateShort, toPersianDigits,
         slugify, getPostUrl, calculateReadingTime, cleanHtmlContent } from '@/lib/utils'

getImageUrl('/uploads/img.jpg')        // → S3_BASE_URL + /uploads/img.jpg
getImageUrl(null)                       // → /images/placeholder.svg
formatDate('2024-01-15')               // → ۲۵ دی ۱۴۰۲
formatDateShort('2024-01-15')          // → ۲۵ دی ۱۴۰۲
toPersianDigits(1234)                  // → ۱۲۳۴
slugify('بررسی آیفون ۱۵')              // → بررسی-آیفون-۱۵
getPostUrl(123, 'slug', 'NEWS')        // → /mag/news/123/slug
calculateReadingTime(1500)             // → 8 (minutes)
cleanHtmlContent('<p>text</p>')        // → cleaned HTML
```

---

## SEO Schema Types / انواع اسکیما

| Schema | Usage | File |
|--------|-------|------|
| `Organization` | Site-wide | `app/layout.tsx` |
| `WebSite` | Site-wide + search action | `app/layout.tsx` |
| `NewsArticle` | Article/News pages | `mag/article/`, `mag/news/` |
| `Review` | Review pages | `mag/review/` |
| `BreadcrumbList` | All content pages | All detail pages |
| `FAQPage` | Articles with FAQ | `mag/article/` |

---

## Keyboard Shortcuts / میانبرهای ادیتور TipTap

| Shortcut | Action | عملیات |
|----------|--------|--------|
| `Ctrl+B` | Bold | بولد |
| `Ctrl+I` | Italic | ایتالیک |
| `Ctrl+U` | Underline | زیرخط |
| `Ctrl+Z` | Undo | بازگردانی |
| `Ctrl+Shift+Z` | Redo | بازانجام |
| `Ctrl+Shift+8` | Bullet list | لیست نشانه‌دار |
| `Ctrl+Shift+7` | Ordered list | لیست شماره‌دار |
| `Ctrl+Shift+9` | Blockquote | نقل قول |

---

## Docker Commands / دستورات داکر

```bash
docker compose up -d           # Start all services
docker compose down            # Stop all services
docker compose logs -f app     # View app logs
docker compose exec app sh     # Shell into app container
docker compose exec db psql -U postgres gsm_news  # DB shell
```

---

## Troubleshooting / عیب‌یابی

| Problem | Solution |
|---------|----------|
| Turbopack error on Windows | `npx next dev --webpack` |
| `ECONNRESET` during npm install | Change VPN or use `npm config set registry https://registry.npmmirror.com` |
| Prisma engine download fails | `set PRISMA_ENGINES_MIRROR=https://binaries.prisma.sh` |
| Hydration error `<a> inside <a>` | Use `AuthorLink` component instead of `<Link>` inside cards |
| TipTap SSR error | Add `immediatelyRender: false` to `useEditor` |
| 404 on Persian slugs | Add `decodeURIComponent()` to slug params |
| Old dates showing (1398) | Add `export const dynamic = 'force-dynamic'` to page |
| Images not loading | Check `NEXT_PUBLIC_S3_BASE_URL` in `.env` |
| Node version mismatch | Use `--ignore-engines` flag or Node >= 18 |
