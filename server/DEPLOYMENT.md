# MEDI-TREND Backend — Vercel + Supabase Deployment Guide

## Overview

The MEDI-TREND backend supports two database backends:

| Mode | Condition | Database | Use Case |
|------|-----------|----------|----------|
| **SQLite (local)** | `DATABASE_URL` not set | `medi_trend.db` (local file) | Development, testing |
| **PostgreSQL (production)** | `DATABASE_URL` set | Supabase PostgreSQL | Vercel serverless, production |

No code changes are required to switch between modes — the backend auto-detects based on the `DATABASE_URL` environment variable.

## Prerequisites

1. **Supabase Project** — Create a project at https://supabase.com and note the PostgreSQL connection string.
2. **Vercel Account** — Connect your GitHub repo and deploy the `server/` directory as a FastAPI API.
3. **Python dependencies** — `psycopg2-binary`, `asyncpg`, `supabase` are already in `server/requirements.txt`.

## Environment Variables

Set the following in your Vercel project settings (or `.env` for local testing):

```env
# Required for PostgreSQL production mode
DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres

# Vercel sets VERCEL=1 automatically. DATABASE_URL is required there;
# do not configure a SQLite fallback for a serverless deployment.

# AI provider keys (backend only — never expose to frontend)
GEMINI_API_KEY=your_gemini_api_key
OPENROUTER_API_KEY=your_openrouter_api_key
GROK_API_KEY=your_grok_api_key

# CORS
CORS_ORIGINS=https://your-frontend-domain.vercel.app

# Frontend (Vite) — set in frontend project, not backend
VITE_SUPABASE_URL=https://[YOUR_PROJECT_ID].supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_[YOUR_KEY]
```

**Security:** `DATABASE_URL`, `GEMINI_API_KEY`, `OPENROUTER_API_KEY`, and `GROK_API_KEY` are backend-only. Never add them to the frontend `.env` or commit them to version control.

## Vercel Deployment Steps

1. Connect your GitHub repository to Vercel.
2. Configure the project:
   - **Framework Preset:** Other
   - **Root Directory:** `server/` (or deploy the whole repo with a `vercel.json` that routes `/api` to the server)
   - **Build Command:** `pip install -r requirements.txt`
   - **Dev Command:** `python -m uvicorn app.main:app --reload`
   - **Install Command:** `pip install -r requirements.txt`
3. Add environment variables in Vercel project settings.
4. Deploy.

### vercel.json (optional, for monorepo deployment)

```json
{
  "version": 2,
  "builds": [
    { "src": "server/app/main.py", "use": "@vercel/python" },
    { "src": "client/**", "use": "@vercel/static-build" }
  ],
  "routes": [
    { "src": "/api(.*)", "dest": "server/app/main.py" },
    { "src": "/(.*)", "dest": "client/index.html" }
  ]
}
```

## How Dual-Database Works

The backend (`server/app/data/db.py`) checks the `DATABASE_URL` environment variable at import time:

- **If `DATABASE_URL` is set:** Uses `psycopg2` to connect to Supabase PostgreSQL. All `?` placeholders in SQL are transparently converted to `$1`, `$2`, ... for PostgreSQL. Schema migrations check `information_schema.columns` before adding columns (idempotent).
- **If `DATABASE_URL` is not set locally:** Uses `sqlite3` with the local `medi_trend.db` file. On Vercel (`VERCEL=1`), the API fails at startup instead of silently using ephemeral `/tmp` storage.

## Data Seeding

On first startup, the backend seeds default records if they don't exist:
- Admin user (`admin` / `admin13152425`, must change password on first login)
- Doctor (`dr.arvind@hospital.org` / `doctor1315`)
- Staff (`priya.staff@hospital.org` / `staff1315`)
- AI provider configurations

These seeds are idempotent — running on an existing database will not duplicate or overwrite data.

## Migration Risks & Limitations

### 1. Persistent database required on Vercel
The application refuses to start its API on Vercel without `DATABASE_URL`. SQLite under `/tmp` is ephemeral and may differ between serverless instances, which makes login sessions invalid between requests and causes dashboard metrics to read from an empty database. Set `DATABASE_URL` to the existing persistent PostgreSQL database containing the application records. Do not point it at a newly initialized empty database if existing records must be preserved.

### 2. Boolean type differences
SQLite stores boolean-like columns as `INTEGER (0/1)`. PostgreSQL stores them as `BOOLEAN (true/false)`. Python's `bool` is a subclass of `int`, so `True == 1` and `False == 0` in comparisons. JSON serialization differs (`true` vs `1`), but most frontend checks use truthiness, which works for both.

### 3. Connection lifecycle
PostgreSQL connections are cached per `DatabaseManager` instance. On Vercel serverless, each invocation gets a fresh instance, so connections are created and closed per request. This is correct for serverless but means no connection pooling across invocations (Supabase handles connection pooling via PgBouncer if configured).

### 4. `time.time()` timestamps
`active_sessions.created_at` and `expires_at` use `time.time()` (float epoch seconds) stored in `REAL` columns. PostgreSQL `REAL` (float4) has ~7 decimal digits of precision, sufficient for second-level timestamps.

### 5. No `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`
PostgreSQL does not support `ADD COLUMN IF NOT EXISTS` in versions before PG 9.6, and Supabase uses a recent PG version. The migration loop checks `information_schema.columns` first, then falls back to `try/except` for safety.

### 6. File uploads
Uploaded PDFs are stored on the local filesystem (`pdf_storage_dir`). On Vercel serverless, the filesystem is ephemeral. For production, configure cloud storage (Supabase Storage, S3, etc.) and update the file storage path in `main.py`.

### 7. AI provider API keys
AI provider keys (`GEMINI_API_KEY`, etc.) are read from server-side environment variables only. They are never sent to the frontend.

## Testing Locally with PostgreSQL

To test the PostgreSQL path locally without Vercel:

```bash
# Set DATABASE_URL to a local PostgreSQL instance
export DATABASE_URL="postgresql://postgres:password@localhost:5432/medi_trend"

# Start the backend
cd server
python -m uvicorn app.main:app --reload
```

The backend will create all tables and seed default data in PostgreSQL automatically.

## Rollback

To revert to SQLite mode, unset `DATABASE_URL` and redeploy. The backend will create/use a local `medi_trend.db` file. Note that data in PostgreSQL will not be automatically migrated back to SQLite.
