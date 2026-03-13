/**
 * Meta Learning Engine - statistical aggregation, reaction frequencies.
 * Phase 1: rule-based, full recompute every 6h.
 */
const db = require('../../config/database');

async function recordReaction(symbol, levelType, levelValue, regime, reacted, outcome) {
  try {
    await db.query(
      `INSERT INTO level_reactions (symbol, level_type, level_value, regime, reacted, outcome)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [symbol, levelType, levelValue, regime || 'UNKNOWN', reacted, outcome || null]
    );
  } catch (err) {
    console.error('[MetaLearning] recordReaction error:', err.message);
  }
}

async function updateStrategyPerformance(strategyId, winRate, sharpeRatio, drawdown) {
  try {
    await db.query(
      `INSERT INTO strategy_performance (strategy_id, win_rate, sharpe_ratio, drawdown, regime_compatibility)
       VALUES ($1, $2, $3, $4, '{}')`,
      [strategyId, winRate, sharpeRatio, drawdown]
    );
  } catch (err) {
    console.error('[MetaLearning] updateStrategyPerformance error:', err.message);
  }
}

module.exports = {
  recordReaction,
  updateStrategyPerformance,
};
