const levelMonitor = require('../../src/playbook/plan-engine/levelMonitor');

describe('Level Monitor', () => {
  test('isInteracting returns true when within 0.1%', () => {
    expect(levelMonitor.isInteracting(6728, 6728)).toBe(true);
    expect(levelMonitor.isInteracting(6728.5, 6728)).toBe(true);
    expect(levelMonitor.isInteracting(6740, 6728)).toBe(false);
  });

  test('hasReset returns true when > 0.3% away', () => {
    expect(levelMonitor.hasReset(6750, 6728)).toBe(true);
    expect(levelMonitor.hasReset(6728, 6728)).toBe(false);
  });

  test('getLevelsFromPlan extracts levels', () => {
    const parsed = { resistance: [6755], pivot: [6728], support: [6700] };
    const levels = levelMonitor.getLevelsFromPlan(parsed);
    expect(levels).toHaveLength(3);
    expect(levels.find((l) => l.type === 'pivot').value).toBe(6728);
  });

  test('findActiveSetup returns setup when price interacts', () => {
    const parsed = {
      resistance: [6755],
      pivot: [6728],
      support: [6700],
      entryZones: [{ low: 6720, high: 6728, setupType: 'pivotBounce' }],
    };
    const setup = levelMonitor.findActiveSetup(parsed, 6728, null);
    expect(setup).not.toBeNull();
    expect(setup.type).toBe('pivot');
    expect(setup.level).toBe(6728);
  });

  test('findActiveSetup returns null when no interaction', () => {
    const parsed = { pivot: [6728], entryZones: [] };
    const setup = levelMonitor.findActiveSetup(parsed, 6700, null);
    expect(setup).toBeNull();
  });
});
