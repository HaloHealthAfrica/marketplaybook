-- Market Playbook Intelligence Platform tables
-- Extends TradeTally for plan parsing, context, decisions, paper trading, and meta learning

-- Trading plans (one active per symbol per user)
CREATE TABLE IF NOT EXISTS trading_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    symbol VARCHAR(20) NOT NULL,
    raw_text TEXT NOT NULL,
    parsed_data JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    superseded_by UUID REFERENCES trading_plans(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trading_plans_user_symbol_active ON trading_plans(user_id, symbol) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_trading_plans_user_id ON trading_plans(user_id);

-- Market context snapshots (5m candles, updated every 5s)
CREATE TABLE IF NOT EXISTS market_context (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    symbol VARCHAR(20) NOT NULL,
    price DECIMAL(18, 6) NOT NULL,
    atr DECIMAL(18, 6),
    vwap DECIMAL(18, 6),
    volume BIGINT,
    sentiment DECIMAL(5, 4),
    regime VARCHAR(50),
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_market_context_symbol_timestamp ON market_context(symbol, timestamp DESC);

-- Level reaction history (for probability engine)
CREATE TABLE IF NOT EXISTS level_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    symbol VARCHAR(20) NOT NULL,
    level_type VARCHAR(50) NOT NULL,
    level_value DECIMAL(18, 6) NOT NULL,
    regime VARCHAR(50),
    reacted BOOLEAN NOT NULL,
    outcome VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_level_reactions_symbol_level ON level_reactions(symbol, level_type, level_value);

-- Strategy performance (for allocation engine)
CREATE TABLE IF NOT EXISTS strategy_performance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    strategy_id VARCHAR(100) NOT NULL,
    win_rate DECIMAL(5, 4),
    sharpe_ratio DECIMAL(10, 4),
    drawdown DECIMAL(10, 4),
    regime_compatibility JSONB,
    computed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_strategy_performance_strategy ON strategy_performance(strategy_id);

-- Strategy allocation weights
CREATE TABLE IF NOT EXISTS strategy_allocation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    strategy_id VARCHAR(100) NOT NULL,
    weight DECIMAL(5, 4) NOT NULL,
    computed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_strategy_allocation_user ON strategy_allocation(user_id);

-- Paper trades
CREATE TABLE IF NOT EXISTS paper_trades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES trading_plans(id) ON DELETE SET NULL,
    symbol VARCHAR(20) NOT NULL,
    direction VARCHAR(10) NOT NULL,
    entry_price DECIMAL(18, 6) NOT NULL,
    exit_price DECIMAL(18, 6),
    stop_price DECIMAL(18, 6),
    target_price DECIMAL(18, 6),
    quantity INTEGER NOT NULL,
    pnl DECIMAL(18, 6),
    status VARCHAR(20) DEFAULT 'open',
    strategy_id VARCHAR(100),
    probability DECIMAL(5, 4),
    confidence INTEGER,
    entry_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    exit_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_paper_trades_user_status ON paper_trades(user_id, status);
CREATE INDEX IF NOT EXISTS idx_paper_trades_symbol ON paper_trades(symbol);
