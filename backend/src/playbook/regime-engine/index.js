/**
 * Market Regime Engine - determines regime from trend and volatility.
 * trend = lastClose - close_20_bars_ago
 * TRENDING_UP: trend > 2*ATR
 * TRENDING_DOWN: trend < -2*ATR
 * HIGH_VOLATILITY: ATR/price >= 0.008
 * LOW_VOLATILITY: ATR/price <= 0.0035
 * RANGE_BOUND: default
 */
const db = require('../../config/database');
const dataProviders = require('../data-providers');
const signalBus = require('../signal-bus');
const { SIGNAL_TYPES } = signalBus;

const TREND_ATR_MULTIPLIER = 2.0;
const HIGH_VOL_THRESHOLD = 0.008;
const LOW_VOL_THRESHOLD = 0.0035;

async function detectRegime(symbol) {
  const sym = dataProviders.resolveSymbol(symbol);
  const candles = await dataProviders.getHistoricalCandles(sym, '5min', { size: 25 });
  if (!candles || candles.length < 21) return null;

  const lastClose = candles[candles.length - 1].close;
  const close20Ago = candles[candles.length - 21].close;
  const trend = lastClose - close20Ago;

  let atr = 0;
  for (let i = candles.length - 15; i < candles.length - 1; i++) {
    const tr = Math.max(
      candles[i].high - candles[i].low,
      Math.abs(candles[i].high - candles[i - 1].close),
      Math.abs(candles[i].low - candles[i - 1].close)
    );
    atr += tr;
  }
  atr = atr / 14;

  const atrPct = lastClose > 0 ? atr / lastClose : 0;

  let regime = 'RANGE_BOUND';
  if (trend > TREND_ATR_MULTIPLIER * atr) regime = 'TRENDING_UP';
  else if (trend < -TREND_ATR_MULTIPLIER * atr) regime = 'TRENDING_DOWN';
  else if (atrPct >= HIGH_VOL_THRESHOLD) regime = 'HIGH_VOLATILITY';
  else if (atrPct <= LOW_VOL_THRESHOLD) regime = 'LOW_VOLATILITY';

  try {
    await db.query(
      `UPDATE market_context mc SET regime = $1
       FROM (SELECT id FROM market_context WHERE symbol = $2 ORDER BY timestamp DESC LIMIT 1) sub
       WHERE mc.id = sub.id`,
      [regime, sym]
    );
  } catch (err) {
    console.error('[RegimeEngine] DB update error:', err.message);
  }

  try {
    await signalBus.publish(SIGNAL_TYPES.MarketContextUpdated, { symbol: sym, regime });
  } catch (err) {
    console.warn('[RegimeEngine] Signal publish failed:', err.message);
  }

  return { symbol: sym, regime };
}

async function detectAllRegimes() {
  const symbols = dataProviders.SUPPORTED_SYMBOLS;
  const results = [];
  for (const sym of symbols) {
    try {
      const r = await detectRegime(sym);
      if (r) results.push(r);
    } catch (err) {
      console.error(`[RegimeEngine] Error for ${sym}:`, err.message);
    }
  }
  return results;
}

module.exports = { detectRegime, detectAllRegimes };
