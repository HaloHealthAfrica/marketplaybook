/**
 * Playbook schedulers - node-cron jobs.
 * Market context: every 5 seconds (6-field cron)
 * Regime detection: every 30 seconds
 * Strategy allocation: hourly
 * Meta learning: every 6 hours
 */
const cron = require('node-cron');
const marketContext = require('../market-context');
const regimeEngine = require('../regime-engine');

let contextJob = null;
let regimeJob = null;
let allocationJob = null;
let metaLearningJob = null;

function start() {
  if (contextJob) return;

  contextJob = cron.schedule('*/5 * * * * *', async () => {
    try {
      await marketContext.updateAllSymbols();
    } catch (err) {
      console.error('[PlaybookScheduler] Market context error:', err.message);
    }
  }, { scheduled: true });

  regimeJob = cron.schedule('*/30 * * * * *', async () => {
    try {
      await regimeEngine.detectAllRegimes();
    } catch (err) {
      console.error('[PlaybookScheduler] Regime detection error:', err.message);
    }
  }, { scheduled: true });

  allocationJob = cron.schedule('0 * * * *', async () => {
    try {
      const strategyAllocation = require('../strategy-allocation');
      await strategyAllocation.getWeights('00000000-0000-0000-0000-000000000000');
    } catch (err) {
      console.error('[PlaybookScheduler] Strategy allocation error:', err.message);
    }
  }, { scheduled: true });

  metaLearningJob = cron.schedule('0 */6 * * *', async () => {
    try {
      const db = require('../../config/database');
      const { rows } = await db.query('SELECT COUNT(*) FROM level_reactions');
    } catch (err) {
      console.error('[PlaybookScheduler] Meta learning error:', err.message);
    }
  }, { scheduled: true });

  console.log('[PlaybookScheduler] Started (context 5s, regime 30s, allocation hourly, meta 6h)');
}

function stop() {
  if (contextJob) { contextJob.stop(); contextJob = null; }
  if (regimeJob) { regimeJob.stop(); regimeJob = null; }
  if (allocationJob) { allocationJob.stop(); allocationJob = null; }
  if (metaLearningJob) { metaLearningJob.stop(); metaLearningJob = null; }
  console.log('[PlaybookScheduler] Stopped');
}

module.exports = { start, stop };
