/**
 * Evaluation flow - context → plan eval → probability → decision → governor → paper trade.
 * Orchestrates the full trade decision pipeline.
 */
const db = require('../../config/database');
const dataProviders = require('../data-providers');
const levelMonitor = require('../plan-engine/levelMonitor');
const probabilityEngine = require('../probability-engine');
const decisionEngine = require('../decision-engine');
const portfolioGovernor = require('../portfolio-governor');
const strategyAllocation = require('../strategy-allocation');
const paperTrader = require('../paper-trader');
const metaLearning = require('../meta-learning');
const signalBus = require('../signal-bus');
const { SIGNAL_TYPES } = signalBus;

const DEFAULT_CAPITAL = 100000;

async function evaluateForSymbol(symbol, context) {
  const sym = dataProviders.resolveSymbol(symbol);
  const results = [];

  const { rows: plans } = await db.query(
    `SELECT id, user_id, parsed_data FROM trading_plans WHERE symbol = $1 AND is_active = TRUE`,
    [sym]
  );

  for (const plan of plans) {
    const parsed = typeof plan.parsed_data === 'string' ? JSON.parse(plan.parsed_data || '{}') : (plan.parsed_data || {});
    const setup = levelMonitor.findActiveSetup(parsed, context.price, null);
    if (!setup) continue;

    const zone = levelMonitor.getEntryZoneForSetup(setup, parsed);
    const direction = (zone?.setupType === 'pivotBounce' || zone?.setupType === 'breakout') ? 'long' : 'short';
    const strategyId = zone?.setupType || 'pivotBounce';

    const reactionBase = await probabilityEngine.getReactionStats(sym, setup.type, setup.level);
    const probability = probabilityEngine.evaluateProbability(
      { ...context, regime: context.regime },
      { direction },
      reactionBase
    );

    const confidence = decisionEngine.computeConfidence(
      probability,
      context,
      { direction }
    );

    const decision = decisionEngine.evaluate(probability, confidence);
    if (decision.action !== 'trade') continue;

    const weights = await strategyAllocation.getWeights(plan.user_id);
    const mult = strategyAllocation.getPositionSizeMultiplier(weights, strategyId);
    const riskPct = 0.01 * mult;
    const quantity = Math.floor((DEFAULT_CAPITAL * riskPct) / context.price);
    if (quantity < 1) continue;

    const approval = await portfolioGovernor.approve(plan.user_id, sym, riskPct, quantity);
    if (!approval.approved) continue;

    const stopDist = (context.atr || context.price * 0.01) * 1.0;
    const stopPrice = direction === 'long' ? context.price - stopDist : context.price + stopDist;
    const targets = parsed.targets || [];
    const targetPrice = targets[0] || (direction === 'long' ? context.price + stopDist * 1.5 : context.price - stopDist * 1.5);

    try {
      const trade = await paperTrader.executeEntry(
        plan.user_id,
        plan.id,
        sym,
        direction,
        quantity,
        context.price,
        stopPrice,
        targetPrice,
        strategyId,
        probability,
        confidence
      );
      results.push({ planId: plan.id, userId: plan.user_id, trade });
      await signalBus.publish(SIGNAL_TYPES.TradeExecuted, { trade, planId: plan.id });
    } catch (err) {
      console.error('[EvaluationFlow] Paper trade error:', err.message);
    }
  }

  return results;
}

module.exports = { evaluateForSymbol };
