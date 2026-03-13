/**
 * Paper Trading Engine - simulates trades.
 * Market orders only, ATR stops, targets, slippage.
 */
const db = require('../../config/database');
const dataProviders = require('../data-providers');

const SLIPPAGE_ETF = 0.0002;
const SLIPPAGE_INDEX = 0.0003;
const DEFAULT_CAPITAL = 100000;

function getSlippage(symbol) {
  const idx = ['SPY', 'QQQ', 'IWM'];
  return idx.includes(symbol) ? SLIPPAGE_ETF : SLIPPAGE_INDEX;
}

async function executeEntry(userId, planId, symbol, direction, quantity, entryPrice, stopPrice, targetPrice, strategyId, probability, confidence) {
  const sym = dataProviders.resolveSymbol(symbol);
  const slippage = getSlippage(sym);
  const adjPrice = direction === 'long' ? entryPrice * (1 + slippage) : entryPrice * (1 - slippage);

  const { rows } = await db.query(
    `INSERT INTO paper_trades (user_id, plan_id, symbol, direction, entry_price, stop_price, target_price, quantity, status, strategy_id, probability, confidence)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'open', $9, $10, $11)
     RETURNING id, symbol, direction, entry_price, stop_price, target_price, quantity, status, entry_at`,
    [userId, planId, sym, direction, adjPrice, stopPrice, targetPrice, quantity, strategyId, probability, confidence]
  );
  return rows[0];
}

async function closePosition(tradeId, exitPrice, pnl) {
  await db.query(
    `UPDATE paper_trades SET exit_price = $1, pnl = $2, status = 'closed', exit_at = NOW() WHERE id = $3`,
    [exitPrice, pnl, tradeId]
  );
}

async function getOpenPositions(userId) {
  const { rows } = await db.query(
    `SELECT * FROM paper_trades WHERE user_id = $1 AND status = 'open'`,
    [userId]
  );
  return rows;
}

module.exports = {
  executeEntry,
  closePosition,
  getOpenPositions,
  getSlippage,
};
