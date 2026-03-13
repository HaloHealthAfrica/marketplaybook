jest.mock('../../src/config/database', () => ({
  query: jest.fn(),
}));

const probabilityEngine = require('../../src/playbook/probability-engine');
const db = require('../../src/config/database');

describe('Probability Engine', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('evaluateProbability clamps between 0.05 and 0.95', () => {
    const ctx = { price: 100, vwap: 100, regime: 'RANGE_BOUND' };
    const low = probabilityEngine.evaluateProbability(ctx, { direction: 'long' }, 0);
    const high = probabilityEngine.evaluateProbability(ctx, { direction: 'long' }, 1);
    expect(low).toBeGreaterThanOrEqual(0.05);
    expect(high).toBeLessThanOrEqual(0.95);
  });

  test('getReactionStats returns 0.5 when no data', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ total: '0', reacted_count: '0' }] });
    const stats = await probabilityEngine.getReactionStats('SPY', 'pivot', 6728);
    expect(stats).toBe(0.5);
  });

  test('getReactionStats returns ratio when data exists', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ total: '10', reacted_count: '6' }] });
    const stats = await probabilityEngine.getReactionStats('SPY', 'pivot', 6728);
    expect(stats).toBe(0.6);
  });
});
