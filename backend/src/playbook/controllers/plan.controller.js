/**
 * Playbook plan controller - parse plans, CRUD trading plans
 */
const db = require('../../config/database');
const { parse } = require('../plan-engine/parser');

async function parsePlan(req, res) {
  try {
    const { rawText } = req.body;
    if (!rawText) {
      return res.status(400).json({ error: 'rawText is required' });
    }
    const parsed = parse(rawText);
    return res.json(parsed);
  } catch (err) {
    console.error('[Playbook] parsePlan error:', err);
    return res.status(500).json({ error: 'Failed to parse plan' });
  }
}

async function createPlan(req, res) {
  try {
    const userId = req.user.id;
    const { rawText, symbol } = req.body;
    if (!rawText) {
      return res.status(400).json({ error: 'rawText is required' });
    }
    const parsed = parse(rawText);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error || 'Parse failed' });
    }
    const sym = symbol || parsed.symbol || 'SPY';

    const { rows } = await db.query(
      `INSERT INTO trading_plans (user_id, symbol, raw_text, parsed_data, is_active)
       VALUES ($1, $2, $3, $4, TRUE)
       RETURNING id, symbol, raw_text, parsed_data, is_active, created_at`,
      [userId, sym, rawText, JSON.stringify(parsed)]
    );
    const newPlan = rows[0];

    // Supersede existing active plan for this symbol (point to new plan)
    await db.query(
      `UPDATE trading_plans SET is_active = FALSE, superseded_by = $1
       WHERE user_id = $2 AND symbol = $3 AND is_active = TRUE AND id != $1`,
      [newPlan.id, userId, sym]
    );

    return res.status(201).json(newPlan);
  } catch (err) {
    console.error('[Playbook] createPlan error:', err);
    return res.status(500).json({ error: 'Failed to create plan' });
  }
}

async function getPlans(req, res) {
  try {
    const userId = req.user.id;
    const { symbol, activeOnly } = req.query;
    let query = 'SELECT id, symbol, raw_text, parsed_data, is_active, created_at FROM trading_plans WHERE user_id = $1';
    const params = [userId];
    if (symbol) {
      params.push(symbol);
      query += ` AND symbol = $${params.length}`;
    }
    if (activeOnly === 'true') {
      query += ' AND is_active = TRUE';
    }
    query += ' ORDER BY created_at DESC';
    const { rows } = await db.query(query, params);
    return res.json(rows);
  } catch (err) {
    console.error('[Playbook] getPlans error:', err);
    return res.status(500).json({ error: 'Failed to fetch plans' });
  }
}

module.exports = { parsePlan, createPlan, getPlans };
