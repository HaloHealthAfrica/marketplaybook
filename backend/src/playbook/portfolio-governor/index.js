/**
 * Portfolio Governor - final risk checks.
 * max portfolio risk = 2%
 * max symbol exposure = 20%
 * max correlated trades = 3
 */
const db = require('../../config/database');

const MAX_PORTFOLIO_RISK_PCT = 0.02;
const MAX_SYMBOL_EXPOSURE_PCT = 0.20;
const MAX_CORRELATED_TRADES = 3;
const DEFAULT_CAPITAL = 100000;

async function getPaperPositions(userId) {
  const { rows } = await db.query(
    `SELECT symbol, direction, quantity, entry_price FROM paper_trades WHERE user_id = $1 AND status = 'open'`,
    [userId]
  );
  return rows;
}

async function getPortfolioRisk(userId) {
  const positions = await getPaperPositions(userId);
  let totalRisk = 0;
  for (const p of positions) {
    const notional = p.quantity * parseFloat(p.entry_price);
    totalRisk += notional * 0.01;
  }
  return totalRisk / DEFAULT_CAPITAL;
}

async function getSymbolExposure(userId, symbol) {
  const positions = await getPaperPositions(userId);
  const symbolNotional = positions
    .filter((p) => p.symbol === symbol)
    .reduce((sum, p) => sum + p.quantity * parseFloat(p.entry_price), 0);
  return symbolNotional / DEFAULT_CAPITAL;
}

async function getCorrelatedCount(userId, symbol) {
  const positions = await getPaperPositions(userId);
  return positions.filter((p) => p.symbol === symbol).length;
}

async function approve(userId, symbol, risk, quantity) {
  const portfolioRisk = await getPortfolioRisk(userId);
  if (portfolioRisk >= MAX_PORTFOLIO_RISK_PCT) return { approved: false, reason: 'max_portfolio_risk' };

  const symbolExposure = await getSymbolExposure(userId, symbol);
  if (symbolExposure >= MAX_SYMBOL_EXPOSURE_PCT) return { approved: false, reason: 'max_symbol_exposure' };

  const correlated = await getCorrelatedCount(userId, symbol);
  if (correlated >= MAX_CORRELATED_TRADES) return { approved: false, reason: 'max_correlated_trades' };

  return { approved: true, risk };
}

module.exports = {
  approve,
  getPaperPositions,
  getPortfolioRisk,
  MAX_PORTFOLIO_RISK_PCT,
  MAX_SYMBOL_EXPOSURE_PCT,
  MAX_CORRELATED_TRADES,
};
