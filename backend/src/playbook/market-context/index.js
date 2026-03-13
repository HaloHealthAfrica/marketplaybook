/**
 * Market Context Service - unified market state.
 * Fetches price, computes VWAP, ATR, volume; caches; publishes MarketContextUpdated.
 */
const db = require('../../config/database');
const dataProviders = require('../data-providers');
const signalBus = require('../signal-bus');
const { SIGNAL_TYPES, QUEUE_NAMES } = signalBus;

const CANDLE_INTERVAL = '5min';
const ATR_PERIOD = 14;

function computeATR(candles) {
  if (!candles || candles.length < ATR_PERIOD + 1) return null;
  const trs = [];
  for (let i = 1; i < candles.length; i++) {
    const high = candles[i].high;
    const low = candles[i].low;
    const prevClose = candles[i - 1].close;
    trs.push(Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose)));
  }
  const atrValues = trs.slice(-ATR_PERIOD);
  return atrValues.reduce((a, b) => a + b, 0) / atrValues.length;
}

function computeVWAP(candles) {
  if (!candles || candles.length === 0) return null;
  let sumPV = 0;
  let sumV = 0;
  for (const c of candles) {
    const typical = (c.high + c.low + c.close) / 3;
    const vol = c.volume || 0;
    sumPV += typical * vol;
    sumV += vol;
  }
  return sumV > 0 ? sumPV / sumV : null;
}

async function updateContext(symbol) {
  const sym = dataProviders.resolveSymbol(symbol);
  if (!dataProviders.SUPPORTED_SYMBOLS.includes(sym)) return null;

  const candles = await dataProviders.getHistoricalCandles(sym, CANDLE_INTERVAL, { size: 50 });
  const snapshot = await dataProviders.getSnapshot(sym);
  if (!snapshot || !candles.length) return null;

  const price = snapshot.price;
  const volume = snapshot.volume || 0;
  const atr = computeATR(candles);
  const vwap = computeVWAP(candles);
  const sentiment = await dataProviders.getSentiment(sym);

  const context = {
    symbol: sym,
    price,
    atr: atr ?? undefined,
    vwap: vwap ?? undefined,
    volume,
    sentiment: sentiment ?? undefined,
    regime: null,
    timestamp: new Date(),
  };

  try {
    await db.query(
      `INSERT INTO market_context (symbol, price, atr, vwap, volume, sentiment, regime, timestamp)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [sym, price, atr, vwap, volume, sentiment, null, context.timestamp]
    );
  } catch (err) {
    console.error('[MarketContext] DB insert error:', err.message);
    return null;
  }

  try {
    await signalBus.publish(SIGNAL_TYPES.MarketContextUpdated, context);
  } catch (err) {
    console.warn('[MarketContext] Signal publish failed (Redis may be down):', err.message);
  }

  return context;
}

async function updateAllSymbols() {
  const symbols = dataProviders.SUPPORTED_SYMBOLS;
  const results = [];
  for (const sym of symbols) {
    try {
      const ctx = await updateContext(sym);
      if (ctx) results.push(ctx);
    } catch (err) {
      console.error(`[MarketContext] Error for ${sym}:`, err.message);
    }
  }
  return results;
}

module.exports = {
  updateContext,
  updateAllSymbols,
  computeATR,
  computeVWAP,
};
