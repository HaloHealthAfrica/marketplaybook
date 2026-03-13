# Market Playbook Intelligence Platform — Setup

The Playbook system extends TradeTally with plan parsing, market context, regime detection, and paper trading.

## Prerequisites

- Node.js 20+
- Docker (for Postgres + Redis)
- TradeTally backend dependencies installed (`npm install` in `backend/`)

## Local Development

### 1. Start infrastructure (required for migrations and full features)

```bash
# From tradetally root - start Docker Desktop first
docker-compose -f docker-compose.dev.yaml up -d postgres redis
```

Postgres: `localhost:5433` (internal 5432)  
Redis: `localhost:6379`

**Note**: If Docker is not running, migrations will fail. Set `RUN_MIGRATIONS=false` in `.env` to skip migrations and start the server (playbook API will work but DB operations will fail).

### 2. Configure environment

Copy `backend/.env.example` to `backend/.env` and set:

```env
DB_HOST=localhost
DB_PORT=5433
DB_USER=trader
DB_PASSWORD=trader_password
DB_NAME=tradetally
REDIS_URL=redis://localhost:6379
TWELVEDATA_API_KEY=your_key_here
JWT_SECRET=your_jwt_secret
```

### 3. Run migrations

```bash
cd backend
npm run migrate
```

### 4. Start backend

```bash
cd backend
npm run dev
```

## Playbook API Endpoints

All require `Authorization: Bearer <token>`.

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/playbook/plan/parse` | Parse raw plan text |
| POST | `/api/playbook/plans` | Create trading plan |
| GET | `/api/playbook/plans` | List plans |
| GET | `/api/playbook/context/:symbol` | Market context |
| GET | `/api/playbook/regime/:symbol` | Regime |
| GET | `/api/playbook/portfolio` | Paper positions |
| GET | `/api/playbook/paper-trades` | Paper trade history |

## Plan Format (Phase 1)

```
Resistance: 6755
Pivot: 6728
Support: 6700

Bounce 6720–6728
Rejection 6728–6735
Target 6755
```

## Implemented

- [x] Database schema (trading_plans, market_context, level_reactions, strategy_performance, strategy_allocation, paper_trades)
- [x] Signal Bus (Redis Pub/Sub + BullMQ)
- [x] Data providers (Twelve Data primary)
- [x] Plan parser
- [x] Plan CRUD API
- [x] Context/regime/portfolio/paper-trades API
- [x] Market context service (ATR, VWAP, publish)
- [x] Regime engine
- [x] Probability engine
- [x] Decision engine
- [x] Strategy allocation
- [x] Portfolio governor
- [x] Paper trading engine
- [x] Meta learning (reaction recording)
- [x] Schedulers (context 5s, regime 30s, allocation hourly, meta 6h)

## Pending

- Full trade flow wiring (context → plan eval → probability → decision → governor → paper trade)
- BullMQ workers for async processing
