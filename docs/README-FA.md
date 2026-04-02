# مستندات فنی پروژه GSM

> سیستم مدیریت محتوای تخصصی موبایل — اولین رسانه تخصصی موبایل ایران

---

## ۱. معرفی

**GSM** یک پلتفرم خبری و بررسی تخصصی موبایل است که با فناوری‌های مدرن وب ساخته شده. این سیستم شامل سایت عمومی فارسی (RTL) و پنل مدیریت حرفه‌ای است.

### فناوری‌ها

| فناوری | نسخه | کاربرد |
|--------|-------|--------|
| Next.js | 16.2.1 | فریمورک React با App Router |
| React | 19.2.4 | کتابخانه رابط کاربری |
| Prisma | 6.19.2 | ORM دیتابیس |
| PostgreSQL | 16+ | دیتابیس اصلی |
| Tailwind CSS | 3.4.19 | فریمورک CSS |
| TipTap | 3.21.0 | ویرایشگر متن غنی |
| NextAuth | 4.24.13 | احراز هویت |
| AWS SDK S3 | 3.1019.0 | ذخیره‌سازی ابری |
| Sharp | 0.34.5 | پردازش تصویر |
| Zod | 4.3.6 | اعتبارسنجی داده |
| Vazirmatn | 5.2.8 | فونت فارسی |

---

## ۲. نصب و راه‌اندازی

### پیش‌نیازها
- Node.js نسخه ۱۸ یا بالاتر
- PostgreSQL نسخه ۱۶ یا بالاتر
- npm یا yarn

### نصب با npm

```bash
git clone <repo-url> && cd gsm
cp .env.example .env          # ویرایش فایل .env
npm install
npx prisma db push            # ساخت جداول دیتابیس
npx tsx scripts/create-admin.ts  # ساخت کاربر ادمین
npm run dev                    # اجرا → http://localhost:3000
```

### نصب با Docker

```bash
docker compose up --build      # همه سرویس‌ها یکجا
```

### متغیرهای محیطی

| متغیر | الزامی | توضیح |
|--------|--------|-------|
| `DATABASE_URL` | بله | آدرس اتصال PostgreSQL |
| `NEXTAUTH_SECRET` | بله | کلید رمزنگاری JWT (حداقل ۳۲ کاراکتر) |
| `NEXTAUTH_URL` | بله | آدرس سایت (مثال: http://localhost:3000) |
| `ADMIN_EMAIL` | خیر | ایمیل ادمین (پیش‌فرض: admin@example.com) |
| `ADMIN_PASSWORD` | بله | رمز عبور ادمین |
| `NEXT_PUBLIC_SITE_URL` | خیر | آدرس عمومی سایت |
| `NEXT_PUBLIC_SITE_NAME` | خیر | نام سایت (پیش‌فرض: GSM) |
| `S3_ENDPOINT` | خیر | آدرس سرور S3 |
| `S3_REGION` | خیر | منطقه S3 (پیش‌فرض: us-east-1) |
| `S3_BUCKET` | خیر | نام باکت |
| `S3_ACCESS_KEY` | خیر | کلید دسترسی S3 |
| `S3_SECRET_KEY` | خیر | کلید محرمانه S3 |
| `S3_PATH_STYLE` | خیر | استفاده از path-style (true/false) |
| `NEXT_PUBLIC_S3_BASE_URL` | خیر | آدرس عمومی فایل‌ها |
| `SETTINGS_ENCRYPTION_KEY` | خیر | کلید رمزنگاری تنظیمات |

---

## ۳. ساختار پروژه

```
gsm/
├── app/
│   ├── layout.tsx              # لایه‌بندی ریشه (فونت، متادیتا، اسکیما)
│   ├── globals.css             # سیستم طراحی، انیمیشن، تایپوگرافی
│   ├── (site)/                 # صفحات عمومی سایت
│   │   ├── page.tsx            # صفحه اصلی
│   │   ├── articles/           # /articles — لیست مقالات
│   │   ├── news/               # /news — لیست اخبار
│   │   ├── reviews/            # /reviews — لیست بررسی‌ها
│   │   ├── search/             # /search — جستجو
│   │   ├── author/[slug]/      # صفحه نویسنده
│   │   ├── category/[slug]/    # صفحه دسته‌بندی
│   │   ├── tag/[slug]/         # صفحه تگ
│   │   └── mag/                # صفحات جزئیات مطالب
│   ├── admin/                  # پنل مدیریت
│   │   ├── page.tsx            # داشبورد
│   │   ├── articles/           # مدیریت مطالب
│   │   ├── categories/         # مدیریت دسته‌بندی‌ها
│   │   ├── tags/               # مدیریت تگ‌ها
│   │   ├── authors/            # مدیریت نویسندگان
│   │   ├── brands/             # مدیریت برندها
│   │   ├── comments/           # مدیریت نظرات
│   │   ├── media/              # کتابخانه رسانه
│   │   ├── seo/                # مدیریت SEO
│   │   ├── aeo/                # بهینه‌سازی AEO
│   │   ├── import/strapi/      # درون‌ریزی Strapi
│   │   └── settings/           # تنظیمات
│   └── api/                    # مسیرهای API
├── components/                 # کامپوننت‌های React
├── lib/                        # کتابخانه‌ها و ابزارها
├── prisma/                     # طرحواره دیتابیس
├── public/fonts/               # فونت Vazirmatn
├── scripts/                    # اسکریپت‌های CLI
└── docs/                       # مستندات
```

---

## ۴. مدل‌های دیتابیس

### User (کاربر)
| فیلد | نوع | توضیح |
|------|------|-------|
| id | String (CUID) | شناسه یکتا |
| email | String (unique) | ایمیل |
| password | String | رمز عبور (bcrypt) |
| role | UserRole | نقش: ADMIN یا EDITOR |
| name | String? | نام |

### Author (نویسنده)
| فیلد | نوع | توضیح |
|------|------|-------|
| id | Int (PK) | شناسه |
| name | String | نام نویسنده |
| slug | String (unique) | اسلاگ URL |
| email | String? | ایمیل |
| bio | Text? | بیوگرافی |
| avatar | String? | تصویر پروفایل |
| label | String? | عنوان شغلی |
| viewCount | Int | تعداد بازدید |

### Article (مقاله/خبر/بررسی)
| فیلد | نوع | توضیح |
|------|------|-------|
| id | Int (PK) | شناسه |
| title | String | عنوان |
| slug | String | اسلاگ URL |
| excerpt | Text? | خلاصه |
| content | Text? | محتوای HTML |
| image | String? | تصویر اصلی |
| postType | PostType | نوع: NEWS, ARTICLE, REVIEW, STORY |
| status | ContentStatus | وضعیت: DRAFT, PUBLISHED |
| publishedAt | DateTime? | تاریخ انتشار |
| authorId | Int? | نویسنده |
| categoryId | Int? | دسته‌بندی |
| viewCount | Int | بازدید |
| readingTime | Int? | زمان مطالعه (دقیقه) |
| metaTitle | String? | عنوان SEO |
| metaDesc | Text? | توضیح SEO |
| focusKeyword | String? | کلمه کلیدی |
| featured | Boolean | ویژه |
| faq | JSON? | سوالات متداول |
| points | JSON? | امتیاز بررسی (pros/cons/score) |

**ایندکس‌های ترکیبی:** `[status, publishedAt]` `[status, postType, publishedAt]` `[status, viewCount]` `[status, featured, publishedAt]`

### Category (دسته‌بندی)
ساختار سلسله‌مراتبی با `parentId` — هر دسته می‌تواند زیردسته‌بندی داشته باشد.

### Tag (تگ) / ArticleTag (جدول واسط)
ارتباط چند‌به‌چند بین مقاله و تگ.

### Comment (نظر)
پشتیبانی از نظرات تودرتو با `parentId`. فیلد `isApproved` برای تایید نظر.

### Story (استوری)
محتوای کوتاه تصویری — `items` به صورت JSON.

### Brand (برند)
برندهای موبایل با لوگو و اولویت.

### Ad (تبلیغ)
تبلیغات با `zone` برای مکان‌های مختلف سایت.

### Setting (تنظیم)
جدول key-value — کلیدهای حساس (S3 keys) خودکار رمزنگاری می‌شوند.

### Media (رسانه)
فایل‌های آپلود شده با metadata: نام، نوع، اندازه، ابعاد، alt text.

### ImportRun (درون‌ریزی)
ردیابی عملیات انتقال داده از Strapi.

---

## ۵. صفحات عمومی سایت

### صفحه اصلی (/)
- اسلایدر استوری‌ها (۲۰ استوری)
- تیکر مطالب آپدیت شده (marquee)
- گرید آخرین مطالب (۵ مطلب، ۱ بزرگ + ۴ کوچک)
- بخش بررسی‌های تخصصی (۵ بررسی)
- بخش اخبار (۴ خبر)
- بخش مقالات (۵ مقاله)
- سایدبار پربازدیدترین‌ها (۵ مطلب)
- `export const dynamic = 'force-dynamic'` — بدون کش

### صفحات لیست (/articles, /news, /reviews)
- صفحه‌بندی (۱۰ آیتم در صفحه)
- فیلتر دسته‌بندی
- کارت مقاله با تصویر، عنوان، نویسنده، تاریخ

### صفحه جستجو (/search)
- جستجو در عنوان مقالات (case-insensitive)
- صفحه‌بندی نتایج

### صفحه نویسنده (/author/[slug])
- اطلاعات نویسنده (آواتار، نام، بیو، تعداد مقالات)
- لیست مقالات نویسنده با صفحه‌بندی

### صفحه جزئیات مقاله (/mag/article/[id]/[slug])
- محتوای کامل HTML
- تصویر اصلی با کپشن
- اطلاعات نویسنده (لینک به صفحه نویسنده)
- تگ‌ها و دسته‌بندی
- بخش FAQ (سوالات متداول)
- نظرات تودرتو با فرم ارسال
- مقالات مرتبط
- داده‌های ساختاریافته (Article, Breadcrumb, FAQ)

### صفحه بررسی (/mag/review/[id]/[slug])
- تمام ویژگی‌های مقاله +
- نمایش نقاط قوت/ضعف (pros/cons)
- امتیاز کلی (از ۱۰)
- اسکیمای Review

---

## ۶. پنل مدیریت

### داشبورد (/admin)
- کارت‌های آماری (اخبار، مقالات، بررسی‌ها، نظرات، بازدید)
- نمودار توزیع مطالب
- دسترسی سریع (مطلب جدید، نظرات، تنظیمات)
- جدول آخرین مطالب

### مدیریت مطالب (/admin/articles)
- لیست با فیلتر نوع، وضعیت، جستجو
- ایجاد/ویرایش با ادیتور TipTap
- مدیریت FAQ و نقاط بررسی
- انتخاب دسته‌بندی، نویسنده، تگ‌ها
- بارگذاری تصویر

### کتابخانه رسانه (/admin/media)
- نمای Grid و List (مثل وردپرس)
- جستجو و فیلتر نوع فایل
- آپلود drag-and-drop
- ویرایش نام و alt text
- حذف تکی و دسته‌ای
- کپی URL
- صفحه‌بندی

### مدیریت SEO (/admin/seo)
- تنظیمات SEO سایت
- جدول audit مقالات با امتیاز
- چک‌لیست ۱۰ نکته‌ای SEO
- ویرایش سریع metaTitle و metaDesc

### بهینه‌سازی AEO (/admin/aeo)
- امتیاز AEO هر مقاله (۱۰ معیار)
- مدیریت FAQ (ایجاد/ویرایش/حذف)
- پیش‌نمایش JSON-LD Schema
- نکات بهینه‌سازی

### درون‌ریزی Strapi (/admin/import/strapi)
- اتصال به MySQL
- تست اتصال
- Dry Run (اجرای آزمایشی)
- نمایش پیشرفت و لاگ
- دکمه لغو
- تاریخچه اجراها

---

## ۷. احراز هویت

- **NextAuth** با CredentialsProvider
- نشست JWT با اعتبار ۳۰ روزه
- رمزنگاری bcryptjs
- دو نقش: **ADMIN** (دسترسی کامل) و **EDITOR** (مدیریت محتوا)
- صفحات ADMIN-only: `/admin/media`, `/admin/settings`, `/admin/import/strapi`, `/admin/seo`, `/admin/aeo`

---

## ۸. سیستم رسانه و S3

- ذخیره‌سازی سازگار با S3 (AWS S3, MinIO)
- نام‌گذاری یکتا: `uploads/YYYY/MM/name-timestamp-hex.ext`
- اعتبارسنجی نوع فایل و حداکثر حجم
- استخراج ابعاد تصویر با Sharp
- رمزنگاری کلیدهای حساس با AES-256-GCM

---

## ۹. SEO و داده‌های ساختاریافته

- `generateSeoMeta()` — تولید متادیتای Next.js
- Schema.org: Organization, WebSite, NewsArticle, Review, FAQPage, BreadcrumbList
- Open Graph و Twitter Cards
- Canonical URLs
- کامپوننت SeoAnalyzer

---

## ۱۰. AEO (بهینه‌سازی موتور پاسخ)

AEO = Answer Engine Optimization — بهینه‌سازی محتوا برای تبدیل شدن به منبع پاسخ AI.

**معیارهای امتیاز:**
1. بخش FAQ
2. ساختار سرتیتر (H2/H3)
3. لیست‌های ساختاریافته
4. جداول مقایسه‌ای
5. طول محتوا (>۱۰۰۰ کلمه)
6. توضیح متا
7. کلمه کلیدی
8. فرمت پاسخ مستقیم
9. خلاصه مطلب
10. عنوان سوالی

---

## ۱۱. میان‌افزار و امنیت (proxy.ts)

- **محدودیت نرخ:** ۱۰۰ درخواست/دقیقه برای هر IP
- **هدرهای امنیتی:** X-Frame-Options, X-Content-Type-Options, XSS-Protection
- **مسدودسازی:** user-agent‌های مشکوک (sqlmap, nikto, nessus)
- **الگوهای خطرناک:** SQL injection و XSS در query string
- **محافظت مسیر:** redirect به login برای مسیرهای admin

---

## ۱۲. درون‌ریزی Strapi

مراحل انتقال از MySQL Strapi به PostgreSQL:
1. **تگ‌ها** — با مدیریت تکراری slug
2. **دسته‌بندی‌ها** — با روابط سلسله‌مراتبی
3. **نویسندگان** — ادغام admin_users + up_users
4. **مطالب** — تشخیص نوع، تصویر، برند
5. **نظرات** — با threading
6. **بازنشانی شمارنده‌ها** — PostgreSQL sequences

---

## ۱۳. کامپوننت‌ها

### کامپوننت‌های مقاله
- **ArticleCard** — کارت مقاله با تصویر، نویسنده، تاریخ
- **CommentSection** — نظرات تودرتو + فرم ارسال
- **RelatedArticles** — مقالات مرتبط
- **TableOfContents** — فهرست مطالب خودکار

### کامپوننت‌های لایه‌بندی
- **Header** — سربرگ sticky با جستجو و منوی موبایل
- **Footer** — فوتر با خبرنامه و لینک‌های شبکه اجتماعی

### کامپوننت‌های مشترک
- **Pagination** — صفحه‌بندی با اعداد فارسی
- **Breadcrumb** — مسیر راهنما
- **SearchBox** — فرم جستجو
- **AuthorLink** — لینک نویسنده (Client Component برای جلوگیری از تودرتویی `<a>`)
- **ShareButton** — دکمه اشتراک‌گذاری
- **BackToTop** — دکمه بازگشت به بالا

### کامپوننت‌های UI
- **Button** — دکمه با variant‌های primary, secondary, ghost, link
- **Input/Textarea** — فیلد ورودی با label و error
- **Badge** — برچسب رنگی
- **Toast** — اعلان‌های کوتاه

### کامپوننت‌های ادمین
- **RichTextEditor** — ادیتور TipTap با ۳ نوار ابزار (قالب‌بندی، ساختار، رسانه)
- **MediaUpload** — آپلود فایل drag-and-drop
- **SeoAnalyzer** — تحلیل SEO مقاله

---

## ۱۴. استایل و طراحی

- **Tailwind CSS** با متغیرهای CSS سفارشی
- **فونت Vazirmatn** — نصب محلی (بدون CDN)، ۴ وزن
- **جهت RTL** — تمام صفحات راست‌به‌چپ
- **انیمیشن‌ها:** fade-in scroll، marquee ticker، skeleton loading
- **پالت رنگ:** primary (آبی)، green، yellow، red، gray

---

## ۱۵. استقرار با Docker

```yaml
# docker-compose.yml
services:
  db:        PostgreSQL 16-alpine (port 5433)
  app:       Next.js application (port 3000)
  setup:     One-time init (prisma push + create admin)
```

```bash
docker compose up -d                    # اجرا
docker compose logs -f app              # مشاهده لاگ
docker compose exec db psql -U postgres gsm_news  # دسترسی دیتابیس
```
