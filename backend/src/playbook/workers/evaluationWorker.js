/**
 * Evaluation worker - subscribes to MarketContextUpdated, runs evaluation flow.
 * Uses BullMQ for durable processing.
 */
const signalBus = require('../signal-bus');
const { SIGNAL_TYPES, QUEUE_NAMES } = signalBus;
const evaluationFlow = require('../evaluation-flow');

let unsubscribe = null;

function start() {
  if (unsubscribe) return;

  unsubscribe = signalBus.subscribe(SIGNAL_TYPES.MarketContextUpdated, async (signal) => {
    const { symbol, price, atr, vwap, volume, regime } = signal.payload || {};
    if (!symbol || !price) return;

    try {
      const db = require('../../config/database');
      const { rows } = await db.query(
        `SELECT regime, atr, vwap FROM market_context WHERE symbol = $1 ORDER BY timestamp DESC LIMIT 1`,
        [symbol]
      );
      const latest = rows[0] || {};
      const context = {
        symbol,
        price,
        atr: atr ?? latest?.atr,
        vwap: vwap ?? latest?.vwap,
        volume,
        regime: regime ?? latest?.regime,
      };
      const results = await evaluationFlow.evaluateForSymbol(symbol, context);
      if (results.length) {
        console.log(`[EvaluationWorker] Evaluated ${symbol}: ${results.length} trades executed`);
      }
    } catch (err) {
      console.error('[EvaluationWorker] Error:', err.message);
    }
  });

  console.log('[EvaluationWorker] Subscribed to MarketContextUpdated');
}

function stop() {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
    console.log('[EvaluationWorker] Stopped');
  }
}

module.exports = { start, stop };
