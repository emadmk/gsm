# راه‌اندازی با Docker

این راهنما کل پروژه را با Docker بالا می‌آورد: دیتابیس PostgreSQL، اجرای schema Prisma و ساخت کاربر ادمین.

## پیش‌نیازها

- Docker
- Docker Compose
- پورت‌های `3000` و `5433` روی سیستم آزاد باشند

## 1. دریافت پروژه

```bash
git clone <YOUR_REPO_URL>
cd gsm
```

## 2. ساخت فایل `.env`

```bash
cp .env.example .env
```

حداقل این مقدارها را در `.env` تنظیم کنید:

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

نکته‌ها:

- مقدار `DATABASE_URL` بالا برای زمانی است که بخواهید از روی سیستم خودتان با `npx prisma ...` به دیتابیس Docker وصل شوید.
- خود سرویس `app` داخل Docker از اتصال داخلی Compose استفاده می‌کند و لازم نیست این URL را تغییر دهید.
- اگر هنوز S3 یا SMTP ندارید، مقدارهای آن بخش‌ها را خالی بگذارید.

## 3. ساخت imageها

```bash
docker compose build
```

## 4. اجرای دیتابیس

```bash
docker compose up -d db
```

بررسی کنید سرویس دیتابیس بالا آمده باشد:

```bash
docker compose ps
```

در این حالت PostgreSQL روی این آدرس در دسترس است:

```text
127.0.0.1:5433
```

## 5. ساخت جدول‌ها و کاربر ادمین

```bash
docker compose --profile setup up setup
```

این مرحله کارهای زیر را انجام می‌دهد:

- اجرای `prisma db push`
- ساخت یا بروزرسانی کاربر ادمین با `ADMIN_EMAIL` و `ADMIN_PASSWORD`

## 6. اجرای اپلیکیشن

```bash
docker compose up -d app
```

## 7. تست نهایی

اپ را در مرورگر باز کنید:

- سایت: `http://localhost:3000`
- لاگین ادمین: `http://localhost:3000/admin/login`

## 8. اجرای دوباره migration یا admin script از روی سیستم

اگر خواستید بعدا از روی سیستم خودتان Prisma یا اسکریپت ادمین را اجرا کنید:

```bash
npx prisma generate
npx prisma db push
npm run db:create-admin
```

در این حالت باید `DATABASE_URL` در `.env` همان مقدار `127.0.0.1:5433` باشد.

## 9. دستورات مفید Docker

```bash
# وضعیت کانتینرها
docker compose ps

# لاگ اپ
docker compose logs -f app

# لاگ دیتابیس
docker compose logs -f db

# ورود به دیتابیس
docker compose exec db psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"

# توقف سرویس‌ها
docker compose down
```

## 10. حذف کامل دیتا و شروع دوباره

اگر می‌خواهید دیتابیس Docker کاملا ریست شود:

```bash
docker compose down -v
docker compose up -d db
docker compose --profile setup up setup
docker compose up -d app
```

## 11. نکات امنیتی

- قبل از استفاده واقعی، `POSTGRES_PASSWORD`، `NEXTAUTH_SECRET` و `ADMIN_PASSWORD` را با مقدارهای قوی عوض کنید.
- برای رمزنگاری تنظیمات حساس پنل، مقدار `SETTINGS_ENCRYPTION_KEY` را خالی نگذارید.
- اگر از درون‌ریزی Strapi استفاده می‌کنید، اطلاعات دیتابیس Strapi را فقط در پنل ادمین وارد کنید و داخل repo نگه ندارید.
