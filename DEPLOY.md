# Deploy TradeTally + Playbook to Fly.io and Neon

## 1. Neon (Database) ✓

Your Neon database is ready at `ep-proud-lake-an8dkxkl-pooler.c-6.us-east-1.aws.neon.tech`.

Use your connection string from [Neon Console](https://console.neon.tech) → Connection details. Add `?sslmode=require` if not present.

## 2. Fly.io Redis

1. Install [Fly CLI](https://fly.io/docs/hands-on/install-flyctl/).
2. Log in: `fly auth login`
3. Create Redis: `fly redis create`
   - Choose a name (e.g. `tradetally-redis`)
   - Select region (e.g. `iad` for US East)
4. Get the URL: `fly redis list` then attach or copy the `REDIS_URL` from the Redis dashboard.

## 3. Fly.io App

1. From the repo root: `fly launch` (or use existing `fly.toml`)
2. Set secrets:
   ```bash
   fly secrets set DATABASE_URL="postgresql://..." 
   fly secrets set REDIS_URL="redis://..."
   fly secrets set JWT_SECRET="your-long-random-secret"
   fly secrets set TWELVEDATA_API_KEY="your-key"
   fly secrets set FINNHUB_API_KEY="your-key"
   ```
3. Deploy: `fly deploy`

## 4. Run Migrations

Migrations run automatically on server startup (`RUN_MIGRATIONS=true`). The server connects to Neon and applies migrations before serving.

To run migrations manually (e.g. from local with Neon URL):
```bash
cd backend
DATABASE_URL="postgresql://..." node src/utils/migrate.js
```

## 5. GitHub Actions Deploy

1. Add `FLY_API_TOKEN` to GitHub repo secrets:
   - Get token: `fly tokens create deploy`
   - GitHub → Settings → Secrets → New repository secret → `FLY_API_TOKEN`

2. Push to `main` to trigger deploy, or run the workflow manually.

## 6. Environment Variables (Fly Secrets)

| Secret | Required | Description |
|--------|----------|-------------|
| DATABASE_URL | Yes | Neon connection string |
| REDIS_URL | Yes | Fly Redis or Upstash URL |
| JWT_SECRET | Yes | Long random string |
| TWELVEDATA_API_KEY | Yes (for Playbook) | Twelve Data API key |
| FINNHUB_API_KEY | No | For quotes/sentiment |
| ALPHA_VANTAGE_API_KEY | No | For charts |
