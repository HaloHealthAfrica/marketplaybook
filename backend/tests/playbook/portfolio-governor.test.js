jest.mock('../../src/config/database', () => ({
  query: jest.fn(),
}));

const portfolioGovernor = require('../../src/playbook/portfolio-governor');
const db = require('../../src/config/database');

describe('Portfolio Governor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('approve returns approved when under limits', async () => {
    db.query.mockResolvedValueOnce({ rows: [] });
    db.query.mockResolvedValueOnce({ rows: [] });
    db.query.mockResolvedValueOnce({ rows: [] });

    const result = await portfolioGovernor.approve('user-1', 'SPY', 0.005, 10);
    expect(result.approved).toBe(true);
  });

  test('rejects when max portfolio risk', async () => {
    db.query.mockResolvedValue({ rows: [{ quantity: 500, entry_price: 500 }] });

    const result = await portfolioGovernor.approve('user-1', 'SPY', 0.02, 100);
    expect(result.approved).toBe(false);
    expect(result.reason).toBe('max_portfolio_risk');
  });
});
