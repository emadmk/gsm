# GSM API Reference / مرجع API

> Bilingual API documentation — English headings with Persian descriptions
> مستند دوزبانه API — سرتیتر انگلیسی با توضیحات فارسی

---

## Authentication / احراز هویت

All admin API endpoints require a valid NextAuth session cookie. Role levels:
تمام API‌های ادمین نیاز به کوکی نشست NextAuth دارند. سطوح دسترسی:

| Role | Access | دسترسی |
|------|--------|--------|
| **ADMIN** | Full access to all endpoints | دسترسی کامل |
| **EDITOR** | Content management endpoints | مدیریت محتوا |
| **Public** | Comments, contact, search only | نظرات، تماس، جستجو |

Error responses / پاسخ‌های خطا:
- `401` — Not authenticated / احراز هویت نشده
- `403` — Insufficient role or invalid origin / دسترسی ناکافی

---

## Articles / مقالات

### `GET /api/articles`
**Auth:** EDITOR+ | **Description:** List articles with filters / لیست مقالات با فیلتر

**Query Parameters / پارامترها:**

| Parameter | Type | Default | Description / توضیح |
|-----------|------|---------|---------------------|
| `page` | number | 1 | Page number / شماره صفحه |
| `limit` | number | 20 | Items per page (max 100) / تعداد در صفحه |
| `postType` | string | — | `NEWS` `ARTICLE` `REVIEW` `STORY` |
| `status` | string | — | `DRAFT` `PUBLISHED` |
| `categoryId` | number | — | Filter by category / فیلتر دسته‌بندی |
| `authorId` | number | — | Filter by author / فیلتر نویسنده |
| `search` | string | — | Search title/excerpt/content / جستجو |

**Response:**
```json
{
  "articles": [
    {
      "id": 1,
      "title": "عنوان مقاله",
      "slug": "عنوان-مقاله",
      "excerpt": "خلاصه...",
      "content": "<p>محتوا...</p>",
      "image": "/uploads/2024/01/img.jpg",
      "postType": "NEWS",
      "status": "PUBLISHED",
      "publishedAt": "2024-01-15T10:00:00Z",
      "viewCount": 150,
      "readingTime": 5,
      "metaTitle": "...",
      "metaDesc": "...",
      "focusKeyword": "...",
      "featured": false,
      "faq": [{"question": "...", "answer": "..."}],
      "points": {"pros": [], "cons": [], "score": 8},
      "author": {"id": 1, "name": "نام", "slug": "نام"},
      "category": {"id": 1, "name": "دسته", "slug": "دسته"}
    }
  ],
  "total": 100,
  "page": 1,
  "totalPages": 5
}
```

**Status:** `200` OK, `401` Unauthorized, `500` Server error

```bash
curl -b cookies.txt "http://localhost:3000/api/articles?page=1&limit=10&postType=NEWS"
```

---

### `POST /api/articles`
**Auth:** EDITOR+ | **Description:** Create article / ایجاد مقاله

**Request Body (Zod validated):**
```json
{
  "title": "string (required, min 1)",
  "slug": "string (required, min 1)",
  "excerpt": "string (optional)",
  "content": "string (optional)",
  "image": "string (optional)",
  "imageCaption": "string (optional)",
  "postType": "NEWS|ARTICLE|REVIEW|STORY (default: NEWS)",
  "status": "DRAFT|PUBLISHED (default: DRAFT)",
  "publishedAt": "ISO8601 datetime (optional)",
  "authorId": "number (optional)",
  "categoryId": "number (optional)",
  "tagIds": "[number] (optional)",
  "readingTime": "number (optional)",
  "wordCount": "number (optional)",
  "metaTitle": "string (optional)",
  "metaDesc": "string (optional)",
  "canonicalUrl": "string (optional)",
  "focusKeyword": "string (optional)",
  "featured": "boolean (optional)",
  "points": "JSON (optional) — review pros/cons/score",
  "faq": "JSON (optional) — [{question, answer}]",
  "brands": "JSON (optional)"
}
```

**Status:** `201` Created, `400` Validation error, `401` Unauthorized, `500` Server error

---

### `GET /api/articles/:id`
**Auth:** EDITOR+ | **Description:** Get single article / دریافت یک مقاله

**Response:** Single article with comments (approved only) and tag details

**Status:** `200` OK, `400` Invalid ID, `401`, `404` Not found, `500`

---

### `PATCH /api/articles/:id`
**Auth:** EDITOR+ | **Description:** Update article / ویرایش مقاله

**Body:** Any article fields to update. If status changes to PUBLISHED and no publishedAt, current date is set automatically.

**Status:** `200` Updated, `400`, `401`, `404`, `500`

---

### `DELETE /api/articles/:id`
**Auth:** EDITOR+ | **Description:** Delete article / حذف مقاله

**Response:** `{"message": "مقاله با موفقیت حذف شد"}`

**Status:** `200` Deleted, `400`, `401`, `404`, `500`

---

## Authors / نویسندگان

### `GET /api/authors`
**Auth:** EDITOR+ | **Response:** Array of authors with `_count.articles`

### `POST /api/authors`
**Auth:** EDITOR+ | **Body:** `{name (required), slug (required), email?, bio?, avatar?, label?}`
**Status:** `201`

### `PATCH /api/authors/:id`
**Auth:** EDITOR+ | **Body:** Any author fields

### `DELETE /api/authors/:id`
**Auth:** EDITOR+ | **Response:** `{"message": "نویسنده با موفقیت حذف شد"}`

---

## Categories / دسته‌بندی‌ها

### `GET /api/categories`
**Auth:** EDITOR+ | **Response:** Array with `_count.articles`, `children[]`, hierarchy

### `POST /api/categories`
**Auth:** EDITOR+ | **Body:** `{name (required), slug (required), description?, image?, parentId?, order?, seoTitle?, seoContent?}`

### `PATCH /api/categories/:id`
**Auth:** EDITOR+ | **Body:** Any category fields

### `DELETE /api/categories/:id`
**Auth:** EDITOR+ | **Response:** `{"message": "دسته‌بندی با موفقیت حذف شد"}`

---

## Tags / تگ‌ها

### `GET /api/tags`
**Auth:** EDITOR+ | **Response:** Array with `_count.articles`

### `POST /api/tags`
**Auth:** EDITOR+ | **Body:** `{name (required), slug (required)}`

### `PATCH /api/tags/:id` / `DELETE /api/tags/:id`
**Auth:** EDITOR+

---

## Brands / برندها

### `GET /api/brands`
**Auth:** EDITOR+ | **Response:** Array sorted by priority

### `POST /api/brands`
**Auth:** EDITOR+ | **Body:** `{name (required), slug (required), nameEn?, logo?, description?, priority?}`

### `GET /api/brands/:id`
**Auth:** EDITOR+ | **Response:** Single brand

### `PATCH /api/brands/:id` / `DELETE /api/brands/:id`
**Auth:** EDITOR+

---

## Comments / نظرات

### `GET /api/comments`
**Auth:** EDITOR+ | **Params:** `articleId?`, `isApproved?`
**Response:** Array with `article` info and `replies[]`

### `POST /api/comments`
**Auth:** Public (no auth required) / عمومی
**Body:**
```json
{
  "authorName": "string (required)",
  "authorEmail": "string (optional, email format)",
  "content": "string (required)",
  "articleId": "number (required)",
  "parentId": "number (optional, for replies)"
}
```
**Note:** Created with `isApproved: false` by default. / نظر با وضعیت تایید نشده ایجاد می‌شود.

### `PATCH /api/comments/:id`
**Auth:** EDITOR+ | **Body:** `{isApproved?, isAdmin?, content?}`

### `DELETE /api/comments/:id`
**Auth:** EDITOR+

---

## Contact Messages / پیام‌های تماس

### `GET /api/contact`
**Auth:** EDITOR+ | **Params:** `page` (default 1), `limit` (default 10)

### `POST /api/contact`
**Auth:** Public / عمومی
**Body:** `{name (required), email (required), subject (required), message (required)}`

### `PATCH /api/contact/:id`
**Auth:** EDITOR+ | **Body:** `{isRead: boolean}`

### `DELETE /api/contact/:id`
**Auth:** EDITOR+

---

## Stories / استوری‌ها

### `GET /api/stories`
**Auth:** EDITOR+ | **Response:** Active stories sorted by order

### `POST /api/stories`
**Auth:** EDITOR+ | **Body:** `{title (required), cover?, items?, order?, isActive?}`

### `PATCH /api/stories/:id` / `DELETE /api/stories/:id`
**Auth:** EDITOR+

---

## Advertisements / تبلیغات

### `GET /api/ads`
**Auth:** EDITOR+ | **Params:** `zone?` filter

### `POST /api/ads`
**Auth:** EDITOR+ | **Body:** `{zone (required), title?, content?, imageUrl?, linkUrl?, isActive?, order?, id?}`
**Note:** If `id` is provided, updates existing ad instead of creating. / اگر `id` داده شود، آپدیت می‌کند.

### `PATCH /api/ads/:id` / `DELETE /api/ads/:id`
**Auth:** EDITOR+

---

## File Upload / آپلود فایل

### `POST /api/upload`
**Auth:** EDITOR+ | **Body:** `FormData` with `file` field
- **Allowed types:** image/jpeg, image/png, image/webp, image/gif, image/svg+xml
- **Max size:** 10MB

**Response:**
```json
{
  "url": "https://s3.example.com/uploads/2024/01/img-1705123456-a1b2c3.jpg",
  "key": "uploads/2024/01/img-1705123456-a1b2c3.jpg",
  "name": "img.jpg",
  "size": 245678,
  "type": "image/jpeg"
}
```

---

## Media Library / کتابخانه رسانه

### `GET /api/media`
**Auth:** EDITOR+

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page |
| `limit` | number | 40 | Items (max 100) |
| `search` | string | — | Search filename/altText |
| `type` | string | all | `all` `images` `videos` |
| `sort` | string | date-desc | `date-asc` `date-desc` `name-asc` `name-desc` `size-asc` `size-desc` |

**Response:**
```json
{
  "items": [
    {
      "id": 1,
      "filename": "img-170512-a1b2.jpg",
      "originalName": "photo.jpg",
      "mimeType": "image/jpeg",
      "size": 245678,
      "width": 1920,
      "height": 1080,
      "altText": "توضیح تصویر",
      "url": "https://s3.../uploads/2024/01/img.jpg",
      "path": "uploads/2024/01/img.jpg",
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ],
  "total": 150,
  "page": 1,
  "limit": 40,
  "totalPages": 4
}
```

### `POST /api/media`
**Auth:** EDITOR+ | **Body:** FormData with `file`
- **Allowed:** images + video/mp4, video/webm, video/ogg
- **Max size:** 50MB

### `PATCH /api/media`
**Auth:** EDITOR+ | **Body:** `{id (required), altText?, originalName?}`

### `DELETE /api/media`
**Auth:** EDITOR+ | **Body:** `{ids: [1, 2, 3]}` — deletes from S3 + database

---

## Media Connection Test / تست اتصال رسانه

### `POST /api/media/test`
**Auth:** ADMIN only | **Body:** S3 config object | Tests S3 connectivity and write access

---

## Settings / تنظیمات

### `GET /api/settings`
**Auth:** ADMIN only | **Response:** Key-value object of all settings
Sensitive values are auto-decrypted. / مقادیر حساس خودکار رمزگشایی می‌شوند.

### `POST /api/settings`
**Auth:** ADMIN only | **Body:** `{"key1": "value1", "key2": "value2"}`
Sensitive keys (s3_access_key, s3_secret_key, smtp_password) are auto-encrypted. / کلیدهای حساس خودکار رمزنگاری می‌شوند.

---

## Dashboard Stats / آمار داشبورد

### `GET /api/stats`
**Auth:** EDITOR+

**Response:**
```json
{
  "articles": {
    "news": 500,
    "articles": 200,
    "reviews": 80,
    "stories": 15,
    "total": 795
  },
  "comments": {
    "approved": 3000,
    "pending": 45,
    "total": 3045
  },
  "totalViews": 1500000,
  "recentArticles": [
    {
      "id": 1,
      "title": "...",
      "postType": "NEWS",
      "status": "PUBLISHED",
      "publishedAt": "...",
      "viewCount": 500,
      "author": {"name": "..."},
      "category": {"name": "..."}
    }
  ]
}
```

---

## Search / جستجو

### `GET /api/search`
**Auth:** Public / عمومی

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `q` | string | required | Search query / عبارت جستجو |
| `postType` | string | — | Filter type |
| `limit` | number | 20 | Max results (max 50) |

**Response:**
```json
{
  "query": "آیفون",
  "total": 15,
  "articles": [
    {
      "id": 1,
      "title": "بررسی آیفون ۱۵",
      "slug": "بررسی-آیفون-۱۵",
      "image": "...",
      "postType": "REVIEW",
      "publishedAt": "...",
      "author": {"id": 1, "name": "...", "slug": "..."},
      "category": {"id": 1, "name": "...", "slug": "..."}
    }
  ]
}
```

**Status:** `200`, `400` (missing query)

---

## Strapi Import / درون‌ریزی Strapi

### `GET /api/imports/strapi`
**Auth:** ADMIN only | Returns latest 10 import runs

### `POST /api/imports/strapi`
**Auth:** ADMIN only | Start new import

**Body:**
```json
{
  "connection": {
    "host": "172.30.x.x",
    "port": 3306,
    "user": "db_user",
    "password": "secret",
    "database": "blog_gsm",
    "s3BaseUrl": "https://s3.example.com/bucket"
  },
  "options": {
    "dryRun": false,
    "skipComments": false,
    "limit": 100,
    "offset": 0,
    "commentLimit": 100000
  }
}
```

**Status:** `202` Accepted (import started), `400`, `401`, `409` (import already running)

### `GET /api/imports/strapi/:id`
**Auth:** ADMIN only | Get import details with logText

### `PATCH /api/imports/strapi/:id`
**Auth:** ADMIN only | Cancel running import
**Body:** `{"action": "cancel"}`
**Status:** `200`, `400` (not cancellable), `404`

### `POST /api/imports/strapi/test`
**Auth:** ADMIN only | Test MySQL connection
**Body:** Connection object (host, port, user, password, database)
