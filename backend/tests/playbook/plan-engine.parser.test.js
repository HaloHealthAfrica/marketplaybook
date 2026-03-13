const { parse } = require('../../src/playbook/plan-engine/parser');

describe('Plan Parser', () => {
  test('parses structured format with levels and zones', () => {
    const text = `
Resistance: 6755
Pivot: 6728
Support: 6700

Bounce 6720–6728
Rejection 6728–6735
Target 6755
`;
    const result = parse(text);
    expect(result.success).toBe(true);
    expect(result.resistance).toContain(6755);
    expect(result.pivot).toContain(6728);
    expect(result.support).toContain(6700);
    expect(result.targets).toContain(6755);
    expect(result.entryZones.length).toBeGreaterThan(0);
    expect(result.entryZones[0]).toMatchObject({ low: 6720, high: 6728, setupType: 'pivotBounce' });
  });

  test('extracts symbol from ticker', () => {
    const text = 'SPX Day Plan\nResistance: 6755\nPivot: 6728';
    const result = parse(text);
    expect(result.symbol).toBe('SPY');
  });

  test('returns error for invalid input', () => {
    const result = parse(null);
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  test('handles minimal text', () => {
    const result = parse('SPY');
    expect(result.success).toBe(true);
    expect(result.symbol).toBe('SPY');
    expect(result.resistance).toEqual([]);
  });
});
