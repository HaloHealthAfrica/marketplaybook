/**
 * Playbook context controller - market context, regime, portfolio, paper trades
 */
const db = require('../../config/database');
const dataProviders = require('../data-providers');

async function getContext(req, res) {
  try {
    const { symbol } = req.params;
    const userId = req.user.id;
    const sym = dataProviders.resolveSymbol(symbol);
    if (!dataProviders.SUPPORTED_SYMBOLS.includes(sym)) {
      return res.status(400).json({ error: 'Unsupported symbol' });
    }
    const snapshot = await dataProviders.getSnapshot(sym);
    if (!snapshot) {
      return res.status(503).json({ error: 'Market data unavailable' });
    }
    const { rows } = await db.query(
      `SELECT regime, atr, vwap FROM market_context WHERE symbol = $1 ORDER BY timestamp DESC LIMIT 1`,
      [sym]
    );
    const latest = rows[0] || {};
    return res.json({
      symbol: sym,
      price: snapshot.price,
      volume: snapshot.volume,
      atr: latest.atr,
      vwap: latest.vwap,
      regime: latest.regime,
      timestamp: snapshot.timestamp,
    });
  } catch (err) {
    console.error('[Playbook] getContext error:', err);
    return res.status(500).json({ error: 'Failed to fetch context' });
  }
}

async function getRegime(req, res) {
  try {
    const { symbol } = req.params;
    const sym = dataProviders.resolveSymbol(symbol);
    const { rows } = await db.query(
      `SELECT regime, timestamp FROM market_context WHERE symbol = $1 ORDER BY timestamp DESC LIMIT 1`,
      [sym]
    );
    return res.json(rows[0] || { regime: null, timestamp: null });
  } catch (err) {
    console.error('[Playbook] getRegime error:', err);
    return res.status(500).json({ error: 'Failed to fetch regime' });
  }
}

async function getPortfolio(req, res) {
  try {
    const userId = req.user.id;
    const { rows } = await db.query(
      `SELECT id, symbol, direction, entry_price, quantity, status, pnl, entry_at
       FROM paper_trades WHERE user_id = $1 AND status = 'open'
       ORDER BY entry_at DESC`,
      [userId]
    );
    const positions = rows.map((r) => ({
      id: r.id,
      symbol: r.symbol,
      direction: r.direction,
      entryPrice: parseFloat(r.entry_price),
      quantity: r.quantity,
      status: r.status,
      pnl: r.pnl ? parseFloat(r.pnl) : null,
      entryAt: r.entry_at,
    }));
    return res.json({ positions });
  } catch (err) {
    console.error('[Playbook] getPortfolio error:', err);
    return res.status(500).json({ error: 'Failed to fetch portfolio' });
  }
}

async function getPaperTrades(req, res) {
  try {
    const userId = req.user.id;
    const { status, limit = 50 } = req.query;
    let query = 'SELECT id, symbol, direction, entry_price, exit_price, quantity, pnl, status, entry_at, exit_at FROM paper_trades WHERE user_id = $1';
    const params = [userId];
    if (status) {
      params.push(status);
      query += ` AND status = $${params.length}`;
    }
    query += ' ORDER BY entry_at DESC LIMIT $' + (params.length + 1);
    params.push(Math.min(parseInt(limit, 10) || 50, 200));
    const { rows } = await db.query(query, params);
    return res.json(rows.map((r) => ({
      id: r.id,
      symbol: r.symbol,
      direction: r.direction,
      entryPrice: parseFloat(r.entry_price),
      exitPrice: r.exit_price ? parseFloat(r.exit_price) : null,
      quantity: r.quantity,
      pnl: r.pnl ? parseFloat(r.pnl) : null,
      status: r.status,
      entryAt: r.entry_at,
      exitAt: r.exit_at,
    })));
  } catch (err) {
    console.error('[Playbook] getPaperTrades error:', err);
    return res.status(500).json({ error: 'Failed to fetch paper trades' });
  }
}

module.exports = { getContext, getRegime, getPortfolio, getPaperTrades };
