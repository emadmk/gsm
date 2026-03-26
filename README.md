# GSM News - جی‌اس‌ام

سایت خبری جی‌اس‌ام - اولین رسانه تخصصی موبایل ایران

## فناوری‌ها

- **Frontend:** Next.js 14 (App Router) + TypeScript
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

# ساخت فایل .env
cp .env.example .env
# ویرایش .env با تنظیمات خودتان

# تولید Prisma Client
npx prisma generate

# ساخت جداول دیتابیس
npx prisma db push

# ساخت کاربر ادمین
npx ts-node scripts/create-admin.ts

# مایگریشن از Strapi (اختیاری)
npx ts-node scripts/migrate-strapi.ts --dry-run  # تست
npx ts-node scripts/migrate-strapi.ts             # اجرا

# اجرای سرور توسعه
npm run dev
```

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
