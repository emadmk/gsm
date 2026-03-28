# GSM News - جی‌اس‌ام

سایت خبری جی‌اس‌ام - اولین رسانه تخصصی موبایل ایران

## فناوری‌ها

- **Frontend:** Next.js 16 (App Router) + TypeScript
- **Runtime:** Node.js 24 LTS
- **Styling:** Tailwind CSS
- **Database:** PostgreSQL + Prisma ORM
- **Authentication:** NextAuth.js
- **Storage:** S3 (MinIO)
- **Font:** IRANSansX
- **Direction:** RTL

## نصب و راه‌اندازی

```bash
# نصب وابستگی‌ها
npm install

# در صورت نیاز به دیتابیس محلی با Docker
docker compose -f docker-compose.dev.yml up -d

# ساخت فایل .env
cp .env.example .env
# ویرایش .env با تنظیمات خودتان

# تولید Prisma Client
npx prisma generate

# ساخت جداول دیتابیس
npx prisma db push

# ساخت کاربر ادمین
npm run db:create-admin

# مایگریشن از Strapi (اختیاری)
npx tsx scripts/migrate-strapi.ts --dry-run  # تست
npx tsx scripts/migrate-strapi.ts             # اجرا

# اجرای سرور توسعه
npm run dev
```

## دیتابیس محلی با Docker

- پورت PostgreSQL محلی پروژه: `127.0.0.1:5433`
- قبل از اجرای Docker، مقدارهای `POSTGRES_PASSWORD` و `DATABASE_URL` را در `.env` تنظیم کنید.
- برای اجرای کامل اپ، مقدارهای `NEXTAUTH_SECRET` و `ADMIN_PASSWORD` را هم در `.env` قرار دهید.
- فایل `.env.example` فقط placeholder دارد و هیچ credential واقعی production داخل repo نگه‌داری نمی‌شود.

## تنظیم متغیرهای حساس

- قبل از ساخت ادمین یا دیپلوی، مقدارهای `ADMIN_PASSWORD` و `NEXTAUTH_SECRET` را در `.env` تنظیم کنید.
- برای اسکریپت‌های migration، مقدارهای `STRAPI_DB_HOST`, `STRAPI_DB_USER`, `STRAPI_DB_PASSWORD`, `STRAPI_DB_NAME` را خودتان وارد کنید.

## ساختار URL

- صفحه اصلی: `/`
- اخبار: `/mag/news/{id}/{slug}`
- مقالات: `/mag/article/{id}/{slug}`
- بررسی‌ها: `/mag/review/{id}/{slug}`
- لیست اخبار: `/news`
- لیست مقالات: `/articles`
- لیست بررسی‌ها: `/reviews`
- دسته‌بندی: `/category/{slug}`
- تگ: `/tag/{slug}`
- نویسنده: `/author/{slug}`
- جستجو: `/search?q=...`
- پنل ادمین: `/admin`

## مایگریشن از Strapi

اسکریپت مایگریشن دیتای Strapi MySQL را به PostgreSQL منتقل می‌کند:
- **ID پست‌ها حفظ می‌شود** تا URL‌های قدیمی کار کنند
- تگ‌ها، دسته‌بندی‌ها، نویسندگان، نظرات migrate می‌شوند
- تصاویر از S3 خوانده می‌شوند

## دیپلوی

```bash
# Build
npm run build

# PM2
pm2 start ecosystem.config.js --env production
```

## متغیرهای محیطی

فایل `.env.example` را ببینید.
