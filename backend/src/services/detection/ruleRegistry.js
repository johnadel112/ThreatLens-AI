import { ALL_RULES } from './allRules.js';
import { applyRuleOverrides, getRuleOverrides } from './ruleManager.service.js';

const rulesByEventType = ALL_RULES.reduce((map, rule) => {
  for (const eventType of rule.eventTypes) {
    if (!map.has(eventType)) map.set(eventType, []);
    map.get(eventType).push(rule);
  }
  return map;
}, new Map());

export async function getRulesForEventType(eventType) {
  const overrides = await getRuleOverrides();
  const rules = rulesByEventType.get(eventType) || [];

  return rules
    .map((rule) => applyRuleOverrides(rule, overrides[rule.id]))
    .filter(Boolean);
}

export function getRuleById(ruleId) {
  return ALL_RULES.find((r) => r.id === ruleId);
}
