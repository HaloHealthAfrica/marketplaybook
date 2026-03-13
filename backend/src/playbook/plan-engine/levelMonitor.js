/**
 * Level interaction monitor - 0.1% trigger, 0.3% reset.
 * distance = |price - level|, threshold = level * 0.001
 * Trigger when distance <= threshold
 * Reset when price moves > 0.3% away
 */
const TRIGGER_THRESHOLD_PCT = 0.001;
const RESET_THRESHOLD_PCT = 0.003;

function isInteracting(price, level) {
  if (!level || level <= 0) return false;
  const distance = Math.abs(price - level);
  const threshold = level * TRIGGER_THRESHOLD_PCT;
  return distance <= threshold;
}

function hasReset(price, level) {
  if (!level || level <= 0) return true;
  const distance = Math.abs(price - level);
  const threshold = level * RESET_THRESHOLD_PCT;
  return distance > threshold;
}

function getLevelsFromPlan(parsed) {
  const levels = [];
  for (const r of parsed.resistance || []) levels.push({ value: r, type: 'resistance' });
  for (const p of parsed.pivot || []) levels.push({ value: p, type: 'pivot' });
  for (const s of parsed.support || []) levels.push({ value: s, type: 'support' });
  return levels;
}

function findActiveSetup(parsed, price, lastTriggeredLevel) {
  const levels = getLevelsFromPlan(parsed);
  for (const level of levels) {
    if (isInteracting(price, level.value)) {
      if (!lastTriggeredLevel || lastTriggeredLevel !== level.value) {
        return { level: level.value, type: level.type };
      }
    }
  }
  return null;
}

function getEntryZoneForSetup(setup, parsed) {
  const zones = parsed.entryZones || [];
  for (const z of zones) {
    if (setup.type === 'pivot' && (z.setupType === 'pivotBounce' || z.setupType === 'pivotRejection')) {
      return z;
    }
  }
  return zones[0] || null;
}

module.exports = {
  isInteracting,
  hasReset,
  getLevelsFromPlan,
  findActiveSetup,
  getEntryZoneForSetup,
};
