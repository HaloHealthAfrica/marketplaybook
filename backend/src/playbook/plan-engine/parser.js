/**
 * Plan parser - extracts structured data from trading plan text.
 * Phase 1: structured format only.
 *
 * Example:
 *   Resistance: 6755
 *   Pivot: 6728
 *   Support: 6700
 *   Bounce 6720–6728
 *   Rejection 6728–6735
 *   Target 6755
 */
const dataProviders = require('../data-providers');

const LEVEL_PATTERNS = {
  resistance: /resistance\s*:\s*([\d.]+)/gi,
  pivot: /pivot\s*:\s*([\d.]+)/gi,
  support: /support\s*:\s*([\d.]+)/gi,
};

const ZONE_PATTERNS = {
  bounce: /bounce\s+([\d.]+)\s*[–\-]\s*([\d.]+)/gi,
  rejection: /rejection\s+([\d.]+)\s*[–\-]\s*([\d.]+)/gi,
  breakout: /breakout\s+([\d.]+)\s*[–\-]\s*([\d.]+)/gi,
  breakdown: /breakdown\s+([\d.]+)\s*[–\-]\s*([\d.]+)/gi,
};

const TARGET_PATTERN = /target\s*:\s*([\d.]+)|target\s+([\d.]+)/gi;

const SYMBOL_PATTERNS = [
  /\b(SPX|NDX|RUT|SPY|QQQ|IWM|AAPL|NVDA|META|TSLA|AMD)\b/gi,
  /\b(symbol|ticker)\s*:\s*(\w+)/gi,
];

function extractNumbers(text, pattern) {
  const matches = [];
  let m;
  const re = new RegExp(pattern.source, pattern.flags);
  while ((m = re.exec(text)) !== null) {
    const val = parseFloat(m[1] || m[2]);
    if (!Number.isNaN(val)) matches.push(val);
  }
  return [...new Set(matches)];
}

function extractZones(text, pattern, setupType) {
  const zones = [];
  let m;
  const re = new RegExp(pattern.source, pattern.flags);
  while ((m = re.exec(text)) !== null) {
    const low = parseFloat(m[1]);
    const high = parseFloat(m[2]);
    if (!Number.isNaN(low) && !Number.isNaN(high)) {
      zones.push({ low, high, setupType });
    }
  }
  return zones;
}

function parse(text) {
  if (!text || typeof text !== 'string') {
    return { success: false, error: 'Invalid plan text' };
  }

  const normalized = text.trim();
  const result = {
    success: true,
    symbol: null,
    support: [],
    resistance: [],
    pivot: [],
    entryZones: [],
    targets: [],
    setups: [],
  };

  // Extract symbol - look for explicit symbol: X or common tickers
  const symbolMatch = normalized.match(/\b(symbol|ticker)\s*:\s*(\w+)/i);
  if (symbolMatch) {
    result.symbol = dataProviders.resolveSymbol(symbolMatch[2].toUpperCase());
  } else {
    const tickerMatch = normalized.match(/\b(SPX|NDX|RUT|SPY|QQQ|IWM|AAPL|NVDA|META|TSLA|AMD)\b/i);
    if (tickerMatch) {
      result.symbol = dataProviders.resolveSymbol(tickerMatch[1].toUpperCase());
    }
  }
  if (!result.symbol) result.symbol = 'SPY'; // default

  // Extract levels
  result.resistance = extractNumbers(normalized, LEVEL_PATTERNS.resistance);
  result.pivot = extractNumbers(normalized, LEVEL_PATTERNS.pivot);
  result.support = extractNumbers(normalized, LEVEL_PATTERNS.support);

  // Extract entry zones and setup types
  const allZones = [];
  allZones.push(...extractZones(normalized, ZONE_PATTERNS.bounce, 'pivotBounce'));
  allZones.push(...extractZones(normalized, ZONE_PATTERNS.rejection, 'pivotRejection'));
  allZones.push(...extractZones(normalized, ZONE_PATTERNS.breakout, 'breakout'));
  allZones.push(...extractZones(normalized, ZONE_PATTERNS.breakdown, 'breakdown'));
  result.entryZones = allZones;

  // Extract targets
  result.targets = extractNumbers(normalized, TARGET_PATTERN);

  // Build setups
  result.setups = result.entryZones.map((z) => ({
    setupType: z.setupType,
    entryZone: [z.low, z.high],
    targets: result.targets.length ? [...result.targets] : [],
  }));

  return result;
}

module.exports = { parse };
