/**
 * Strategy Allocation Engine - position size multipliers from strategy weights.
 * Phase 1: default weights. Full recompute hourly.
 */
const db = require('../../config/database');

const DEFAULT_WEIGHTS = {
  pivotBounce: 0.3,
  pivotRejection: 0.3,
  breakout: 0.2,
  breakdown: 0.2,
};

async function getWeights(userId) {
  try {
    const { rows } = await db.query(
      `SELECT strategy_id, weight FROM strategy_allocation WHERE user_id = $1 ORDER BY computed_at DESC`,
      [userId]
    );
    if (rows.length) {
      return Object.fromEntries(rows.map((r) => [r.strategy_id, parseFloat(r.weight)]));
    }
  } catch {
    // ignore
  }
  return { ...DEFAULT_WEIGHTS };
}

function getPositionSizeMultiplier(weights, strategyId) {
  return weights[strategyId] ?? 0.2;
}

module.exports = {
  getWeights,
  getPositionSizeMultiplier,
  DEFAULT_WEIGHTS,
};
