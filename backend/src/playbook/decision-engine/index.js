/**
 * Decision Engine - evaluates setups with probability and confidence thresholds.
 * probability < 0.55 → reject
 * 0.55-0.59 → watch
 * >= 0.60 + confidence >= 70 → trade
 */
const CONFIDENCE_THRESHOLD = 70;
const PROB_REJECT = 0.55;
const PROB_WATCH = 0.59;
const PROB_TRADE = 0.60;

function computeConfidence(probability, context, setup) {
  let score = 0;

  if (probability >= 0.8) score += 30;
  else if (probability >= 0.7) score += 22;
  else if (probability >= 0.6) score += 15;

  if (context.regime) {
    const aligned = (setup.direction === 'long' && context.regime === 'TRENDING_UP') ||
      (setup.direction === 'short' && context.regime === 'TRENDING_DOWN');
    if (aligned) score += 15;
  }

  if (context.vwap && context.price) {
    const vwapDist = Math.abs(context.price - context.vwap) / context.price;
    if (vwapDist < 0.002) score += 15;
  }

  if (context.volume && context.volume > 1000000) score += 10;

  return Math.min(100, score);
}

function evaluate(probability, confidence) {
  if (probability < PROB_REJECT) return { action: 'reject', reason: 'probability_below_threshold' };
  if (probability >= PROB_REJECT && probability <= PROB_WATCH) return { action: 'watch', reason: 'watch_zone' };
  if (probability >= PROB_TRADE && confidence >= CONFIDENCE_THRESHOLD) {
    return { action: 'trade', reason: 'approved' };
  }
  return { action: 'watch', reason: 'confidence_below_threshold' };
}

module.exports = {
  computeConfidence,
  evaluate,
  CONFIDENCE_THRESHOLD,
  PROB_TRADE,
};
