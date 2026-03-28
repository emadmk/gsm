# Docker Setup

This guide runs the full project with Docker, including PostgreSQL, Prisma schema setup, and admin user creation.

## Prerequisites

- Docker
- Docker Compose
- Ports `3000` and `5433` available on your machine

## 1. Clone the project

```bash
git clone <YOUR_REPO_URL>
cd gsm
```

## 2. Create the `.env` file

```bash
cp .env.example .env
```

Set at least these values in `.env`:

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

Notes:

- The `DATABASE_URL` above is for local commands such as `npx prisma ...` running from your machine against the Docker database.
- The app container itself uses the internal Docker network and does not need that localhost URL.
- If you do not have S3 or SMTP yet, you can leave those values empty for now.

## 3. Build the images

```bash
docker compose build
```

## 4. Start the database

```bash
docker compose up -d db
```

Check that the database is running:

```bash
docker compose ps
```

PostgreSQL will be available on:

```text
127.0.0.1:5433
```

## 5. Create tables and admin user

```bash
docker compose --profile setup up setup
```

This step will:

- run `prisma db push`
- create or update the admin user using `ADMIN_EMAIL` and `ADMIN_PASSWORD`

## 6. Start the app

```bash
docker compose up -d app
```

## 7. Final check

Open the app in your browser:

- Site: `http://localhost:3000`
- Admin login: `http://localhost:3000/admin/login`

## 8. Run Prisma or admin commands locally later

If you want to run Prisma or the admin script from your machine later:

```bash
npx prisma generate
npx prisma db push
npm run db:create-admin
```

In that case, keep `DATABASE_URL` in `.env` pointed to `127.0.0.1:5433`.

## 9. Useful Docker commands

```bash
# Container status
docker compose ps

# App logs
docker compose logs -f app

# Database logs
docker compose logs -f db

# Open PostgreSQL shell
docker compose exec db psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"

# Stop services
docker compose down
```

## 10. Reset the Docker database

If you want a full reset:

```bash
docker compose down -v
docker compose up -d db
docker compose --profile setup up setup
docker compose up -d app
```

## 11. Security notes

- Replace `POSTGRES_PASSWORD`, `NEXTAUTH_SECRET`, and `ADMIN_PASSWORD` before any real deployment.
- Do not leave `SETTINGS_ENCRYPTION_KEY` empty if you want encrypted sensitive settings in the admin panel.
- If you use the Strapi import feature, enter the Strapi database credentials only inside the admin panel, not in tracked project files.
