/** MITRE ATT&CK-style mapping for detection rules and event types. */

export const RULE_MITRE_MAP = {
  brute_force_v1: {
    tactic: 'Credential Access',
    technique: 'Brute Force',
    techniqueId: 'T1110',
    description: 'Adversary attempts to gain access through repeated authentication failures.',
    recommendedResponse: 'Lock account, block source IP, enforce MFA, monitor subsequent logins.',
  },
  suspicious_login_v1: {
    tactic: 'Initial Access',
    technique: 'Valid Accounts',
    techniqueId: 'T1078',
    description: 'Successful login after multiple failed attempts suggests credential abuse.',
    recommendedResponse: 'Verify user identity, reset credentials, review recent activity.',
  },
  data_exfil_v1: {
    tactic: 'Exfiltration',
    technique: 'Automated Exfiltration',
    techniqueId: 'T1020',
    description: 'Unusual volume of file downloads may indicate data theft.',
    recommendedResponse: 'Isolate session, block egress, preserve evidence, notify data owner.',
  },
  suspicious_admin_v1: {
    tactic: 'Privilege Escalation',
    technique: 'Account Manipulation',
    techniqueId: 'T1098',
    description: 'Administrative activity outside normal business hours.',
    recommendedResponse: 'Verify admin intent, review policy changes, enable enhanced monitoring.',
  },
  port_scan_v1: {
    tactic: 'Discovery',
    technique: 'Network Service Discovery',
    techniqueId: 'T1046',
    description: 'Rapid probing of multiple ports/endpoints from a single source.',
    recommendedResponse: 'Block scanning IP, inspect perimeter logs, hunt for follow-on activity.',
  },
  priv_esc_v1: {
    tactic: 'Privilege Escalation',
    technique: 'Abuse Elevation Control Mechanism',
    techniqueId: 'T1548',
    description: 'Permission change following prior suspicious authentication activity.',
    recommendedResponse: 'Revert permission changes, lock account, audit privileged groups.',
  },
  malware_v1: {
    tactic: 'Execution',
    technique: 'User Execution',
    techniqueId: 'T1204',
    description: 'Endpoint signals consistent with malware execution or propagation.',
    recommendedResponse: 'Isolate host, collect forensic artifacts, scan adjacent systems.',
  },
  api_abuse_v1: {
    tactic: 'Impact',
    technique: 'Endpoint Denial of Service',
    techniqueId: 'T1499',
    description: 'Abnormal API request volume or repeated rate-limit violations.',
    recommendedResponse: 'Throttle source IP, review API keys, enable WAF rules.',
  },
};

const EVENT_CATEGORY_MITRE = {
  login_failed: { tactic: 'Credential Access', technique: 'Brute Force', techniqueId: 'T1110' },
  login_success: { tactic: 'Initial Access', technique: 'Valid Accounts', techniqueId: 'T1078' },
  permission_change: { tactic: 'Privilege Escalation', technique: 'Account Manipulation', techniqueId: 'T1098' },
  role_change: { tactic: 'Privilege Escalation', technique: 'Account Manipulation', techniqueId: 'T1098' },
  file_download: { tactic: 'Exfiltration', technique: 'Automated Exfiltration', techniqueId: 'T1020' },
  port_scan: { tactic: 'Discovery', technique: 'Network Service Discovery', techniqueId: 'T1046' },
  network_access: { tactic: 'Discovery', technique: 'Network Service Discovery', techniqueId: 'T1046' },
  audit_log_cleared: { tactic: 'Defense Evasion', technique: 'Indicator Removal', techniqueId: 'T1070' },
  malware_detected: { tactic: 'Execution', technique: 'User Execution', techniqueId: 'T1204' },
  ransomware_behavior: { tactic: 'Impact', technique: 'Data Encrypted for Impact', techniqueId: 'T1486' },
  admin_action: { tactic: 'Privilege Escalation', technique: 'Account Manipulation', techniqueId: 'T1098' },
};

export function mapRuleToMitre(ruleId) {
  return RULE_MITRE_MAP[ruleId] || null;
}

export function mapEventTypeToMitre(eventType) {
  return EVENT_CATEGORY_MITRE[eventType] || null;
}

export function summarizeIncidentMitre(alerts = [], events = []) {
  const tactics = new Set();
  const techniques = [];

  for (const alert of alerts) {
    const m = alert.mitre || mapRuleToMitre(alert.ruleId);
    if (m?.tactic) tactics.add(m.tactic);
    if (m?.technique) techniques.push({ technique: m.technique, techniqueId: m.techniqueId, source: 'alert', ruleId: alert.ruleId });
  }

  for (const event of events) {
    const m = mapEventTypeToMitre(event.eventType);
    if (m?.tactic) tactics.add(m.tactic);
    if (m?.technique) techniques.push({ technique: m.technique, techniqueId: m.techniqueId, source: 'event', eventType: event.eventType });
  }

  const uniqueTechniques = [...new Map(techniques.map((t) => [t.techniqueId || t.technique, t])).values()];

  return {
    primaryTactic: [...tactics][0] || 'Unknown',
    tactics: [...tactics],
    techniques: uniqueTechniques.slice(0, 8),
    tacticCount: tactics.size,
  };
}

export function attachMitreToAlertPayload(payload, ruleId) {
  const mitre = mapRuleToMitre(ruleId);
  if (!mitre) return payload;
  return { ...payload, mitre };
}
