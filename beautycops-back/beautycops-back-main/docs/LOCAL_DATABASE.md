# Local database setup (PostgreSQL or SQLite)

## Option 1: SQLite (default)

If you do **not** set `DATABASE_URL` or `POSTGRES_DB`, Django uses SQLite and the file `db.sqlite3` in the project root. Migrations will create the product tables and seed one sample product.

```bash
cd beautycops-back-main
python manage.py migrate
python manage.py runserver
```

## Option 2: Local PostgreSQL

### 1. Install PostgreSQL

- **Windows:** Install from [postgresql.org](https://www.postgresql.org/download/windows/) or use Chocolatey: `choco install postgresql`
- **macOS:** `brew install postgresql@16` then `brew services start postgresql@16`
- **Linux:** `sudo apt install postgresql postgresql-contrib` (or equivalent)

### 2. Create the database and user

Open a shell (psql or pg terminal):

```bash
# Connect as postgres superuser (Windows: use the user you set during install)
psql -U postgres

# In psql:
CREATE USER beautycops WITH PASSWORD 'your_password';
CREATE DATABASE beautycops OWNER beautycops;
\q
```

Or one line (Unix):

```bash
createdb -U postgres beautycops
```

### 3. Configure Django

Create a `.env` in `beautycops-back-main/` (or set env vars):

**Option A – URL (e.g. for Railway or one string):**

```env
DATABASE_URL=postgres://beautycops:your_password@localhost:5432/beautycops
```

**Option B – separate vars:**

```env
POSTGRES_DB=beautycops
POSTGRES_USER=beautycops
POSTGRES_PASSWORD=your_password
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
```

### 4. Run migrations and seed data

```bash
cd beautycops-back-main
python manage.py migrate
```

The migration will create the product tables (brands, categories, skincare_products, etc.) and insert one sample product so the frontend shows at least one item.

### 5. Start backend and frontend

```bash
# Terminal 1 – backend
python manage.py runserver

# Terminal 2 – frontend (from LOBE-main)
npm run dev
```

Open http://localhost:3000 and go to the products page. You should see the sample product.

---

## Importing data from Railway (production) into local PostgreSQL

If your production app on Railway has data and you want a copy locally:

### 1. Get Railway PostgreSQL URL

- Railway dashboard → your project → PostgreSQL service → **Connect** or **Variables**.
- Copy `DATABASE_URL` (e.g. `postgres://user:pass@host.railway.app:5432/railway`).

### 2. Export from Railway (pg_dump)

From your **local** machine (with `psql`/`pg_dump` installed), run:

```bash
pg_dump "postgres://USER:PASSWORD@HOST.railway.app:PORT/railway" --no-owner --no-acl -F c -f railway_backup.dump
```

Or plain SQL:

```bash
pg_dump "postgres://USER:PASSWORD@HOST.railway.app:PORT/railway" --no-owner --no-acl > railway_backup.sql
```

Replace `USER`, `PASSWORD`, `HOST`, `PORT` with the values from Railway’s `DATABASE_URL`.

### 3. Create local PostgreSQL DB (if not done)

```bash
createdb -U postgres beautycops
```

### 4. Import into local DB

**If you used custom format (`.dump`):**

```bash
pg_restore -U postgres -d beautycops --no-owner --no-acl railway_backup.dump
```

**If you used plain SQL (`.sql`):**

```bash
psql -U postgres -d beautycops -f railway_backup.sql
```

### 5. Point Django to local PostgreSQL

In `.env`:

```env
DATABASE_URL=postgres://postgres:your_local_password@localhost:5432/beautycops
```

Then run migrations (in case schema changed):

```bash
python manage.py migrate
```

After that, the local site should show the same products as production (from the imported data).
