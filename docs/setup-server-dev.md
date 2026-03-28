# راه‌اندازی روی سرور با `npm run dev`

این راهنما برای زمانی است که می‌خواهید پروژه را مستقیم روی سرور اجرا کنید و از Docker استفاده نکنید. این روش با `npm run dev` کار می‌کند، اما برای production واقعی بهتر است در نهایت از `npm run build && npm run start` استفاده کنید.

## پیش‌نیازها

- یک سرور لینوکسی با دسترسی shell
- Node.js `24`
- npm `11+`
- PostgreSQL محلی یا remote
- Git

## 1. آماده‌سازی سرور

روی Ubuntu/Debian حداقل این ابزارها را نصب کنید:

```bash
sudo apt update
sudo apt install -y git curl build-essential
```

اگر `nvm` از قبل روی سرور دارید، Node 24 را فعال کنید:

```bash
nvm install 24
nvm alias default 24
nvm use 24
node -v
npm -v
```

اگر از قبل Node 24 نصب است، همین بخش را رد کنید.

## 2. آماده‌سازی PostgreSQL

اگر دیتابیس آماده دارید، این مرحله را رد کنید و فقط `DATABASE_URL` را با دیتابیس خودتان تنظیم کنید.

برای ساخت دیتابیس و یوزر جدید روی PostgreSQL محلی:

```bash
sudo -u postgres psql
```

سپس داخل `psql`:

```sql
CREATE USER gsm_user WITH PASSWORD 'change-this-postgres-password';
CREATE DATABASE gsm_news OWNER gsm_user;
\q
```

## 3. دریافت پروژه

```bash
git clone <YOUR_REPO_URL>
cd gsm
```

## 4. نصب وابستگی‌ها

```bash
npm install
```

## 5. ساخت فایل `.env`

```bash
cp .env.example .env
```

نمونه تنظیم برای زمانی که PostgreSQL روی همان سرور اجرا می‌شود:

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

SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
EMAIL_FROM=noreply@example.com
```

اگر دیتابیس remote دارید، فقط `DATABASE_URL` را با اطلاعات همان سرور ست کنید.

اگر دامنه دارید:

```env
NEXTAUTH_URL=https://your-domain.com
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

## 6. ساخت Prisma Client

```bash
npx prisma generate
```

## 7. ساخت جدول‌ها در دیتابیس

```bash
npx prisma db push
```

## 8. ساخت یا بروزرسانی کاربر ادمین

```bash
npm run db:create-admin
```

این دستور از `ADMIN_EMAIL` و `ADMIN_PASSWORD` داخل `.env` استفاده می‌کند.

## 9. اجرای پروژه با `npm run dev`

برای اجرای محلی روی خود سرور:

```bash
npm run dev
```

برای در دسترس بودن از بیرون سرور:

```bash
npm run dev -- --hostname 0.0.0.0 --port 3000
```

آدرس‌های مهم:

- سایت: `http://YOUR_SERVER_IP_OR_DOMAIN:3000`
- پنل ادمین: `http://YOUR_SERVER_IP_OR_DOMAIN:3000/admin`
- لاگین ادمین: `http://YOUR_SERVER_IP_OR_DOMAIN:3000/admin/login`
- درون‌ریزی Strapi: `http://YOUR_SERVER_IP_OR_DOMAIN:3000/admin/import/strapi`

## 10. اجرای دائم با PM2

برای اینکه بعد از بستن ترمینال برنامه متوقف نشود:

```bash
npm install -g pm2
pm2 start npm --name gsm-news-dev -- run dev -- --hostname 0.0.0.0 --port 3000
pm2 save
pm2 startup
```

دستورات مفید:

```bash
# مشاهده لاگ‌ها
pm2 logs gsm-news-dev

# ری‌استارت
pm2 restart gsm-news-dev

# توقف
pm2 stop gsm-news-dev

# وضعیت
pm2 status
```

## 11. باز کردن پورت در فایروال

اگر می‌خواهید مستقیما از پورت `3000` سرویس بدهید:

```bash
sudo ufw allow 3000
sudo ufw reload
```

اگر Nginx یا reverse proxy دارید، می‌توانید فقط پورت `80/443` را باز بگذارید و درخواست‌ها را به `127.0.0.1:3000` پراکسی کنید.

## 12. بروزرسانی نسخه روی سرور

هر بار که کد جدید گرفتید:

```bash
git pull
npm install
npx prisma generate
npx prisma db push
pm2 restart gsm-news-dev
```

## 13. نکات مهم production

- `npm run dev` برای محیط production ایده‌آل نیست و فقط برای راه‌اندازی سریع یا سرورهای داخلی مناسب است.
- برای production واقعی بهتر است از این جریان استفاده کنید:

```bash
npm run build
pm2 start npm --name gsm-news -- run start -- --hostname 0.0.0.0 --port 3000
```

- `NEXTAUTH_SECRET`، `ADMIN_PASSWORD` و `SETTINGS_ENCRYPTION_KEY` را حتما با مقدارهای قوی تنظیم کنید.
- اگر از پنل import استفاده می‌کنید، اتصال دیتابیس Strapi را فقط از داخل پنل ادمین وارد کنید.
