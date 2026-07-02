import {
  listDetectionRules,
  updateDetectionRule,
  syncRulesFromCode,
} from '../services/detection/ruleManager.service.js';

export async function listRules(req, res, next) {
  try {
    const rules = await listDetectionRules();
    res.json({ rules: rules.map((r) => r.toPublicJSON()) });
  } catch (err) {
    next(err);
  }
}

export async function updateRule(req, res, next) {
  try {
    const rule = await updateDetectionRule(req.params.ruleId, req.body, req.user);
    res.json({ rule: rule.toPublicJSON() });
  } catch (err) {
    if (err.status === 404) {
      return res.status(404).json({ error: err.message, code: 'NOT_FOUND' });
    }
    next(err);
  }
}

export async function syncRules(req, res, next) {
  try {
    const rules = await syncRulesFromCode();
    res.json({
      message: 'Detection rules synced from code definitions',
      count: rules.length,
    });
  } catch (err) {
    next(err);
  }
}
