/**
 * Signal types for the Market Playbook Signal Bus.
 * Engines communicate only through these signals - no direct calls.
 */
module.exports = {
  MarketContextUpdated: 'MarketContextUpdated',
  PlanSetupDetected: 'PlanSetupDetected',
  ProbabilityEvaluated: 'ProbabilityEvaluated',
  TradeDecisionGenerated: 'TradeDecisionGenerated',
  TradeExecutionApproved: 'TradeExecutionApproved',
  TradeExecuted: 'TradeExecuted',
  LearningDatasetUpdated: 'LearningDatasetUpdated',
};
