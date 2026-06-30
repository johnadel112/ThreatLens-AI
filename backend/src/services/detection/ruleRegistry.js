import { bruteForceRule } from './rules/bruteForce.rule.js';
import { suspiciousLoginRule } from './rules/suspiciousLogin.rule.js';
import { dataExfiltrationRule } from './rules/dataExfiltration.rule.js';
import { suspiciousAdminRule } from './rules/suspiciousAdmin.rule.js';
import { portScanRule } from './rules/portScan.rule.js';
import { privilegeEscalationRule } from './rules/privilegeEscalation.rule.js';
import { malwareActivityRule } from './rules/malwareActivity.rule.js';
import { apiAbuseRule } from './rules/apiAbuse.rule.js';

export const ALL_RULES = [
  bruteForceRule,
  suspiciousLoginRule,
  dataExfiltrationRule,
  suspiciousAdminRule,
  portScanRule,
  privilegeEscalationRule,
  malwareActivityRule,
  apiAbuseRule,
];

const rulesByEventType = ALL_RULES.reduce((map, rule) => {
  for (const eventType of rule.eventTypes) {
    if (!map.has(eventType)) map.set(eventType, []);
    map.get(eventType).push(rule);
  }
  return map;
}, new Map());

export function getRulesForEventType(eventType) {
  return rulesByEventType.get(eventType) || [];
}

export function getRuleById(ruleId) {
  return ALL_RULES.find((r) => r.id === ruleId);
}
