const decisionEngine = require('../../src/playbook/decision-engine');

describe('Decision Engine', () => {
  test('rejects when probability < 0.55', () => {
    const result = decisionEngine.evaluate(0.5, 80);
    expect(result.action).toBe('reject');
  });

  test('watch when probability 0.55-0.59', () => {
    const result = decisionEngine.evaluate(0.57, 80);
    expect(result.action).toBe('watch');
  });

  test('trade when probability >= 0.60 and confidence >= 70', () => {
    const result = decisionEngine.evaluate(0.65, 75);
    expect(result.action).toBe('trade');
  });

  test('watch when confidence < 70', () => {
    const result = decisionEngine.evaluate(0.65, 65);
    expect(result.action).toBe('watch');
  });

  test('computeConfidence returns 0-100', () => {
    const ctx = { price: 100, vwap: 100, volume: 2000000, regime: 'TRENDING_UP' };
    const score = decisionEngine.computeConfidence(0.7, ctx, { direction: 'long' });
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });
});
