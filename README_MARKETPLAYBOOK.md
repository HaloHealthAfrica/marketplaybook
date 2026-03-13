# Market Playbook Intelligence Platform

TradeTally extended with plan parsing, market context, regime detection, and paper trading.

**Repo**: [HaloHealthAfrica/marketplaybook](https://github.com/HaloHealthAfrica/marketplaybook)

## Quick Deploy (Fly.io + Neon)

### 1. Push to GitHub (if not done)

```bash
cd tradetally
git push marketplaybook main
```

If prompted for credentials, use a [GitHub Personal Access Token](https://github.com/settings/tokens) (repo scope).

### 2. Create Fly.io Account

1. Sign up at [fly.io](https://fly.io)
2. Install CLI: `flyctl` or `fly`

### 3. Create Fly Redis

```bash
fly redis create
# Name: marketplaybook-redis
# Region: iad (US East)
```

### 4. Deploy to Fly

```bash
fly launch   # Creates app from fly.toml
fly secrets set DATABASE_URL="postgresql://neondb_owner:YOUR_PASSWORD@ep-proud-lake-an8dkxkl-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require"
fly secrets set REDIS_URL="redis://..."   # From Fly Redis
fly secrets set JWT_SECRET="$(openssl rand -hex 32)"
fly secrets set TWELVEDATA_API_KEY="your-key"
fly deploy
```

### 5. Migrations

Migrations run automatically on first deploy. The app connects to Neon and applies all migrations.

### 6. GitHub Actions (optional)

Add `FLY_API_TOKEN` to repo secrets for auto-deploy on push to main:
```bash
fly tokens create deploy
```

## Local Development

See [PLAYBOOK_SETUP.md](PLAYBOOK_SETUP.md).

## API Endpoints

All require `Authorization: Bearer <token>`:

- `POST /api/playbook/plan/parse` - Parse plan text
- `POST /api/playbook/plans` - Create plan
- `GET /api/playbook/plans` - List plans
- `GET /api/playbook/context/:symbol` - Market context
- `GET /api/playbook/regime/:symbol` - Regime
- `GET /api/playbook/portfolio` - Paper positions
- `GET /api/playbook/paper-trades` - Trade history
