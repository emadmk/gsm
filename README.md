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

## پیش‌نیازها

- Node.js `24`
- npm `11+`
- PostgreSQL
- Docker و Docker Compose در صورتی که بخواهید با Docker اجرا کنید

## راهنمای نصب

- [راه‌اندازی با Docker](docs/setup-docker.md)
- [راه‌اندازی روی سرور با `npm run dev`](docs/setup-server-dev.md)

## مستندات محصول

- [نقشه سایت عمومی برای Confluence](docs/confluence-site-map.md)
- [نقشه پنل ادمین برای Confluence](docs/confluence-admin-map.md)

## راه‌اندازی با Docker

### 1. کلون و ورود به پروژه

```bash
git clone <YOUR_REPO_URL>
cd gsm
```

### 2. ساخت فایل `.env`

```bash
cp .env.example .env
```

حداقل این مقدارها را در `.env` قرار دهید:

```env
POSTGRES_DB=gsm_news
POSTGRES_USER=gsm_user
POSTGRES_PASSWORD=change-this-postgres-password
DATABASE_URL=postgresql://gsm_user:change-this-postgres-password@127.0.0.1:5433/gsm_news

NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=change-this-nextauth-secret
SETTINGS_ENCRYPTION_KEY=change-this-settings-key

ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=change-this-admin-password

NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SITE_NAME=GSM
```

اگر هنوز S3 یا SMTP ندارید، می‌توانید مقدارهای آن بخش را خالی بگذارید.

### 3. ساخت image

```bash
docker compose build
```

### 4. اجرای دیتابیس

```bash
docker compose up -d db
```

پورت PostgreSQL پروژه در این حالت:

```text
127.0.0.1:5433
```

### 5. ساخت جدول‌ها و ادمین

```bash
docker compose --profile setup up setup
```

این مرحله:

- Prisma schema را روی دیتابیس اعمال می‌کند
- کاربر ادمین را می‌سازد یا بروزرسانی می‌کند

### 6. اجرای اپ

```bash
docker compose up -d app
```

### 7. تست نهایی

اپ را باز کنید:

- سایت: `http://localhost:3000`
- لاگین ادمین: `http://localhost:3000/admin/login`

### 8. دستورات مفید Docker

```bash
# مشاهده وضعیت کانتینرها
docker compose ps

# لاگ اپ
docker compose logs -f app

# لاگ دیتابیس
docker compose logs -f db

# توقف همه سرویس‌ها
docker compose down

# حذف کامل دیتای دیتابیس
docker compose down -v
```

## راه‌اندازی روی سرور با Node.js و `npm run dev`

این روش دقیقا با `npm run dev` اجرا می‌شود، ولی برای production واقعی بهتر است از `npm run build && npm run start` استفاده کنید. با این حال اگر می‌خواهید فعلا روی سرور با `npm run dev` بالا بیاورید، مراحل کامل این است:

### 1. نصب Node.js 24

روی سرور مطمئن شوید `node -v` نسخه `24` را نشان می‌دهد.

### 2. کلون پروژه

```bash
git clone <YOUR_REPO_URL>
cd gsm
```

### 3. نصب وابستگی‌ها

```bash
npm install
```

### 4. ساخت فایل `.env`

```bash
cp .env.example .env
```

اگر دیتابیس PostgreSQL روی همان سرور یا روی سرور دیگری دارید، `.env` را مشابه این تنظیم کنید:

```env
POSTGRES_DB=gsm_news
POSTGRES_USER=gsm_user
POSTGRES_PASSWORD=change-this-postgres-password
DATABASE_URL=postgresql://gsm_user:change-this-postgres-password@127.0.0.1:5432/gsm_news

NEXTAUTH_URL=http://YOUR_SERVER_IP_OR_DOMAIN:3000
NEXTAUTH_SECRET=change-this-nextauth-secret
SETTINGS_ENCRYPTION_KEY=change-this-settings-key

ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=change-this-admin-password

NEXT_PUBLIC_SITE_URL=http://YOUR_SERVER_IP_OR_DOMAIN:3000
NEXT_PUBLIC_SITE_NAME=GSM

S3_ENDPOINT=
S3_BUCKET=
S3_BASE_URL=
S3_ACCESS_KEY=
S3_SECRET_KEY=
```

اگر دامنه دارید:

```env
NEXTAUTH_URL=https://your-domain.com
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

### 5. تولید Prisma Client

```bash
npx prisma generate
```

### 6. اعمال schema روی دیتابیس

```bash
npx prisma db push
```

### 7. ساخت ادمین

```bash
npm run db:create-admin
```

### 8. اجرای پروژه با `npm run dev`

```bash
npm run dev
```

به صورت پیش‌فرض روی این آدرس بالا می‌آید:

```text
http://localhost:3000
```

اگر می‌خواهید از بیرون سرور هم در دسترس باشد:

```bash
npm run dev -- --hostname 0.0.0.0 --port 3000
```

### 9. باز کردن پورت روی سرور

اگر فایروال دارید، پورت `3000` را باز کنید.

مثلا روی Ubuntu با `ufw`:

```bash
sudo ufw allow 3000
sudo ufw reload
```

### 10. اجرای دائم روی سرور

اگر با `npm run dev` روی سرور اجرا می‌کنید، بهتر است آن را با یک process manager بالا نگه دارید:

```bash
npm install -g pm2
pm2 start npm --name gsm-news-dev -- run dev -- --hostname 0.0.0.0 --port 3000
pm2 save
pm2 startup
```

### 11. دستورات مفید روی سرور

```bash
# لاگ dev server
pm2 logs gsm-news-dev

# ری‌استارت
pm2 restart gsm-news-dev

# توقف
pm2 stop gsm-news-dev
```

## راه‌اندازی پیشنهادی برای production واقعی

اگر هدفتان production واقعی است، به جای `npm run dev` این را استفاده کنید:

```bash
npm run build
npm run start
```

یا با PM2:

```bash
pm2 start npm --name gsm-news -- run start
```

## تنظیم متغیرهای حساس

- قبل از ساخت ادمین یا دیپلوی، مقدارهای `ADMIN_PASSWORD` و `NEXTAUTH_SECRET` را در `.env` تنظیم کنید.
- برای امنیت بیشتر، مقدار `SETTINGS_ENCRYPTION_KEY` را هم تنظیم کنید.
- برای اسکریپت‌های migration، مقدارهای `STRAPI_DB_HOST`, `STRAPI_DB_USER`, `STRAPI_DB_PASSWORD`, `STRAPI_DB_NAME` را خودتان وارد کنید.
- فایل `.env.example` فقط placeholder دارد و هیچ credential واقعی production داخل repo نگه‌داری نمی‌شود.

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
- درون‌ریزی Strapi در پنل ادمین: `/admin/import/strapi`

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

## درون‌ریزی Strapi از پنل ادمین

- مسیر پنل: `/admin/import/strapi`
- اتصال دیتابیس Strapi را می‌توان از خود پنل تست کرد.
- رمز دیتابیس Strapi در دیتابیس برنامه ذخیره نمی‌شود و فقط برای همان اجرا استفاده می‌شود.
- تاریخچه اجرا، وضعیت، لاگ‌ها و خلاصه نتیجه در پنل ثبت می‌شود.
