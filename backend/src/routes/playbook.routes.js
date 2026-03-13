/**
 * Playbook API routes - require authentication
 */
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const planController = require('../playbook/controllers/plan.controller');
const contextController = require('../playbook/controllers/context.controller');

router.use(authenticate);

// Plan endpoints
router.post('/plan/parse', planController.parsePlan);
router.post('/plans', planController.createPlan);
router.get('/plans', planController.getPlans);

// Context & regime
router.get('/context/:symbol', contextController.getContext);
router.get('/regime/:symbol', contextController.getRegime);

// Portfolio & paper trades
router.get('/portfolio', contextController.getPortfolio);
router.get('/paper-trades', contextController.getPaperTrades);

module.exports = router;
