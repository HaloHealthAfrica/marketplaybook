/**
 * Market data providers - Twelve Data (primary), Finnhub, MarketData.app
 */
const twelveData = require('./twelveData');

const SUPPORTED_SYMBOLS = ['SPY', 'QQQ', 'IWM', 'AAPL', 'NVDA', 'META', 'TSLA', 'AMD'];
const INDEX_TO_ETF = { SPX: 'SPY', NDX: 'QQQ', RUT: 'IWM' };

function resolveSymbol(symbol) {
  return INDEX_TO_ETF[symbol?.toUpperCase()] || symbol?.toUpperCase();
}

async function getSnapshot(symbol) {
  const sym = resolveSymbol(symbol);
  if (!SUPPORTED_SYMBOLS.includes(sym)) return null;
  const snapshot = await twelveData.getSnapshot(sym);
  return snapshot ? { ...snapshot, symbol: sym } : null;
}

async function getHistoricalCandles(symbol, interval = '5min', options = {}) {
  const sym = resolveSymbol(symbol);
  if (!SUPPORTED_SYMBOLS.includes(sym)) return [];
  return twelveData.getHistoricalCandles(sym, interval, options);
}

async function getSentiment(symbol) {
  // Phase 1: Finnhub news-sentiment can be added when configured
  // For now return null - system does not block on sentiment
  return null;
}

module.exports = {
  getSnapshot,
  getHistoricalCandles,
  getSentiment,
  resolveSymbol,
  SUPPORTED_SYMBOLS,
  isPriceConfigured: () => twelveData.isConfigured(),
};
