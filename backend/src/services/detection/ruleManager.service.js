import DetectionRule from '../../models/DetectionRule.js';
import { ALL_RULES } from './allRules.js';
import { mapRuleToMitre } from '../intelligence/mitreMapping.service.js';
import { recordAudit } from '../playbook/auditService.js';

let cachedOverrides = null;
let cacheExpiry = 0;
const CACHE_TTL_MS = 30_000;

function ruleDescription(rule) {
  return `${rule.name} — triggers on ${rule.eventTypes?.join(', ') || 'configured events'}`;
}

export async function syncRulesFromCode() {
  const synced = [];

  for (const codeRule of ALL_RULES) {
    const mitre = mapRuleToMitre(codeRule.id);
    const doc = await DetectionRule.findOneAndUpdate(
      { ruleId: codeRule.id },
      {
        $setOnInsert: {
          ruleId: codeRule.id,
          name: codeRule.name,
          description: ruleDescription(codeRule),
          eventTypes: codeRule.eventTypes,
        },
        $set: {
          severity: codeRule.severity,
          windowMinutes: codeRule.windowMinutes,
          threshold: codeRule.threshold,
          mitreTactic: mitre?.tactic,
          mitreTechniqueId: mitre?.techniqueId,
        },
      },
      { upsert: true, new: true }
    );
    synced.push(doc);
  }

  invalidateRuleCache();
  return synced;
}

export function invalidateRuleCache() {
  cachedOverrides = null;
  cacheExpiry = 0;
}

export async function getRuleOverrides() {
  const now = Date.now();
  if (cachedOverrides && now < cacheExpiry) {
    return cachedOverrides;
  }

  const count = await DetectionRule.countDocuments();
  if (count === 0) {
    await syncRulesFromCode();
  }

  const rules = await DetectionRule.find();
  cachedOverrides = Object.fromEntries(rules.map((r) => [r.ruleId, r]));
  cacheExpiry = now + CACHE_TTL_MS;
  return cachedOverrides;
}

export async function listDetectionRules() {
  const count = await DetectionRule.countDocuments();
  if (count === 0) await syncRulesFromCode();
  const rules = await DetectionRule.find().sort({ name: 1 });
  return rules;
}

export async function getDetectionRule(ruleId) {
  const rule = await DetectionRule.findOne({ ruleId });
  if (!rule) {
    const err = new Error('Detection rule not found');
    err.status = 404;
    throw err;
  }
  return rule;
}

export async function updateDetectionRule(ruleId, updates, user) {
  const rule = await getDetectionRule(ruleId);
  const previous = rule.toPublicJSON();

  if (updates.enabled !== undefined) rule.enabled = updates.enabled;
  if (updates.severity) rule.severity = updates.severity;
  if (updates.threshold !== undefined) rule.threshold = updates.threshold;
  if (updates.windowMinutes !== undefined) rule.windowMinutes = updates.windowMinutes;
  if (updates.description) rule.description = updates.description;

  rule.version += 1;
  rule.lastModifiedBy = user?._id || user?.id;
  await rule.save();
  invalidateRuleCache();

  const action = updates.enabled === false ? 'rule_disabled' : updates.enabled === true ? 'rule_enabled' : 'rule_updated';
  await recordAudit({
    action,
    entityType: 'detection_rule',
    entityId: rule._id,
    user,
    details: { ruleId, previous, current: rule.toPublicJSON() },
  });

  return rule;
}

export function applyRuleOverrides(codeRule, override) {
  if (!override || !override.enabled) return null;

  return {
    ...codeRule,
    severity: override.severity || codeRule.severity,
    threshold: override.threshold ?? codeRule.threshold,
    windowMinutes: override.windowMinutes ?? codeRule.windowMinutes,
  };
}
