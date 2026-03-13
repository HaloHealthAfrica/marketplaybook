/**
 * Probability Engine - computes probability from reaction stats, regime, ATR, VWAP, volume.
 * Clamp 0.05 <= P <= 0.95
 */
const db = require('../../config/database');

async function getReactionStats(symbol, levelType, levelValue) {
  try {
    const { rows } = await db.query(
      `SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE reacted) as reacted_count
       FROM level_reactions 
       WHERE symbol = $1 AND level_type = $2 AND ABS(level_value - $3) < 0.01`,
      [symbol, levelType, levelValue]
    );
    const total = parseInt(rows[0]?.total || 0, 10);
    const reacted = parseInt(rows[0]?.reacted_count || 0, 10);
    return total > 0 ? reacted / total : 0.5;
  } catch {
    return 0.5;
  }
}

function evaluateProbability(context, setup, reactionBase = 0.5) {
  let p = reactionBase;

  if (context.regime) {
    const regimeAligned = (setup.direction === 'long' && context.regime === 'TRENDING_UP') ||
      (setup.direction === 'short' && context.regime === 'TRENDING_DOWN');
    if (regimeAligned) p += 0.1;
    else if (context.regime === 'RANGE_BOUND') p += 0.02;
  }

  if (context.vwap && context.price) {
    const vwapDist = Math.abs(context.price - context.vwap) / context.price;
    if (vwapDist < 0.002) p += 0.05;
  }

  if (context.atr && context.price) {
    const atrPct = context.atr / context.price;
    if (atrPct < 0.01) p += 0.03;
  }

  return Math.max(0.05, Math.min(0.95, p));
}

module.exports = {
  getReactionStats,
  evaluateProbability,
};
