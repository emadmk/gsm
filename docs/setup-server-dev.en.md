# Server Setup With `npm run dev`

This guide is for running the project directly on a server without Docker. It uses `npm run dev`. For a real production deployment, `npm run build && npm run start` is still the recommended runtime flow.

## Prerequisites

- A Linux server with shell access
- Node.js `24`
- npm `11+`
- PostgreSQL, local or remote
- Git

## 1. Prepare the server

On Ubuntu or Debian, install the basics:

```bash
sudo apt update
sudo apt install -y git curl build-essential
```

If you already use `nvm`, enable Node 24:

```bash
nvm install 24
nvm alias default 24
nvm use 24
node -v
npm -v
```

If Node 24 is already installed, you can skip this step.

## 2. Prepare PostgreSQL

If you already have a PostgreSQL database, skip this section and only set `DATABASE_URL` to your existing database.

To create a new local database and user:

```bash
sudo -u postgres psql
```

Then inside `psql`:

```sql
CREATE USER gsm_user WITH PASSWORD 'change-this-postgres-password';
CREATE DATABASE gsm_news OWNER gsm_user;
\q
```

## 3. Clone the project

```bash
git clone <YOUR_REPO_URL>
cd gsm
```

## 4. Install dependencies

```bash
npm install
```

## 5. Create the `.env` file

```bash
cp .env.example .env
```

Example for a PostgreSQL server running on the same machine:

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
S3_REGION=us-east-1
S3_BUCKET=
S3_BASE_URL=
S3_ACCESS_KEY=
S3_SECRET_KEY=
S3_PATH_STYLE=false

SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
EMAIL_FROM=noreply@example.com
```

If your database is remote, only change `DATABASE_URL` to the correct remote connection string.

If you have a domain:

```env
NEXTAUTH_URL=https://your-domain.com
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

## 6. Generate Prisma Client

```bash
npx prisma generate
```

## 7. Apply the schema

```bash
npx prisma db push
```

## 8. Create or update the admin user

```bash
npm run db:create-admin
```

This command uses `ADMIN_EMAIL` and `ADMIN_PASSWORD` from `.env`.

## 9. Start the app with `npm run dev`

To run only on the server itself:

```bash
npm run dev
```

To expose it externally:

```bash
npm run dev -- --hostname 0.0.0.0 --port 3000
```

Important URLs:

- Site: `http://YOUR_SERVER_IP_OR_DOMAIN:3000`
- Admin panel: `http://YOUR_SERVER_IP_OR_DOMAIN:3000/admin`
- Admin login: `http://YOUR_SERVER_IP_OR_DOMAIN:3000/admin/login`
- Strapi import: `http://YOUR_SERVER_IP_OR_DOMAIN:3000/admin/import/strapi`
- Media settings: `http://YOUR_SERVER_IP_OR_DOMAIN:3000/admin/media`

## 10. Keep it running with PM2

To keep the process alive after you close the terminal:

```bash
npm install -g pm2
pm2 start npm --name gsm-news-dev -- run dev -- --hostname 0.0.0.0 --port 3000
pm2 save
pm2 startup
```

Useful commands:

```bash
# View logs
pm2 logs gsm-news-dev

# Restart
pm2 restart gsm-news-dev

# Stop
pm2 stop gsm-news-dev

# Status
pm2 status
```

## 11. Open the firewall port

If you want to serve directly on port `3000`:

```bash
sudo ufw allow 3000
sudo ufw reload
```

If you use Nginx or another reverse proxy, you can keep only ports `80` and `443` public and proxy requests to `127.0.0.1:3000`.

## 12. Update the server later

Whenever you deploy a new version:

```bash
git pull
npm install
npx prisma generate
npx prisma db push
pm2 restart gsm-news-dev
```

## 13. Production notes

- `npm run dev` is acceptable for quick server setup or internal environments, but it is not the preferred production runtime.
- For a real production runtime, use:

```bash
npm run build
pm2 start npm --name gsm-news -- run start -- --hostname 0.0.0.0 --port 3000
```

- Use strong values for `NEXTAUTH_SECRET`, `ADMIN_PASSWORD`, and `SETTINGS_ENCRYPTION_KEY`.
- If you configure S3 in `/admin/media`, new uploads will be stored in S3 and returned with the final storage URL instead of local `/uploads/...` paths.
