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
