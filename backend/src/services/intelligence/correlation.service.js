import { SEVERITY_RANK } from '../../config/constants.js';
import { mapEventTypeToMitre } from './mitreMapping.service.js';

/** Known attack chain patterns for sequence detection */
export const ATTACK_CHAIN_PATTERNS = [
  {
    id: 'credential_compromise_exfil',
    name: 'Credential Compromise → Exfiltration',
    sequence: ['login_failed', 'login_success', 'file_download'],
    optional: ['permission_change', 'login_from_new_country'],
    mitreTactics: ['Credential Access', 'Exfiltration'],
  },
  {
    id: 'brute_force_takeover',
    name: 'Brute Force → Account Takeover',
    sequence: ['login_failed', 'login_success'],
    optional: ['permission_change', 'admin_action'],
    mitreTactics: ['Credential Access', 'Privilege Escalation'],
  },
  {
    id: 'privilege_abuse',
    name: 'Privilege Escalation Chain',
    sequence: ['login_success', 'permission_change'],
    optional: ['role_change', 'admin_action'],
    mitreTactics: ['Privilege Escalation'],
  },
  {
    id: 'recon_to_impact',
    name: 'Reconnaissance → Impact',
    sequence: ['port_scan', 'network_access'],
    optional: ['malware_detected', 'ransomware_behavior'],
    mitreTactics: ['Discovery', 'Impact'],
  },
  {
    id: 'defense_evasion',
    name: 'Defense Evasion After Compromise',
    sequence: ['login_success', 'file_download', 'audit_log_cleared'],
    optional: ['permission_change'],
    mitreTactics: ['Defense Evasion', 'Exfiltration'],
  },
];

const ESCALATION_EVENT_TYPES = new Set([
  'login_failed', 'login_success', 'permission_change', 'file_download',
  'audit_log_cleared', 'malware_detected', 'ransomware_behavior', 'port_scan',
]);

function sequenceMatch(eventTypes, pattern) {
  let idx = 0;
  const matched = [];
  for (const type of eventTypes) {
    if (type === pattern.sequence[idx]) {
      matched.push(type);
      idx += 1;
      if (idx >= pattern.sequence.length) return { matched: true, matchedTypes: matched };
    } else if (pattern.optional?.includes(type)) {
      matched.push(type);
    }
  }
  return { matched: idx >= pattern.sequence.length, matchedTypes: matched, partial: idx };
}

function severityEscalation(events) {
  if (events.length < 2) return 0;
  let escalations = 0;
  for (let i = 1; i < events.length; i += 1) {
    const prev = SEVERITY_RANK[events[i - 1].severity] || 0;
    const curr = SEVERITY_RANK[events[i].severity] || 0;
    if (curr > prev) escalations += 1;
  }
  return Math.min(escalations * 8, 24);
}

function sharedEntityScore(events, alerts) {
  const usernames = new Set(events.map((e) => e.username).filter(Boolean));
  const ips = new Set(events.map((e) => e.ip).filter(Boolean));
  alerts.forEach((a) => {
    if (a.username) usernames.add(a.username);
    if (a.ip) ips.add(a.ip);
  });
  let score = 0;
  if (usernames.size === 1 && usernames.size > 0) score += 12;
  if (ips.size <= 2 && ips.size > 0) score += 10;
  return score;
}

function timeProximityScore(events) {
  if (events.length < 2) return 0;
  const first = new Date(events[0].timestamp).getTime();
  const last = new Date(events[events.length - 1].timestamp).getTime();
  const spanMinutes = (last - first) / 60000;
  if (spanMinutes <= 15) return 20;
  if (spanMinutes <= 60) return 14;
  if (spanMinutes <= 180) return 8;
  return 4;
}

export function analyzeCorrelation({ events = [], alerts = [], username, ip } = {}) {
  const sortedEvents = [...events].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  const eventTypes = sortedEvents.map((e) => e.eventType);

  const matchedChains = [];
  for (const pattern of ATTACK_CHAIN_PATTERNS) {
    const result = sequenceMatch(eventTypes, pattern);
    if (result.matched || (result.partial && result.partial >= 2)) {
      matchedChains.push({
        id: pattern.id,
        name: pattern.name,
        matched: result.matched,
        partial: !result.matched,
        matchedTypes: result.matchedTypes || [],
        mitreTactics: pattern.mitreTactics,
      });
    }
  }

  const ruleIds = [...new Set(alerts.map((a) => a.ruleId))];
  let score = 0;
  score += Math.min(alerts.length * 6, 24);
  score += Math.min(ruleIds.length * 8, 32);
  score += sharedEntityScore(sortedEvents, alerts);
  score += timeProximityScore(sortedEvents);
  score += severityEscalation(sortedEvents);

  if (matchedChains.some((c) => c.matched)) score += 22;
  else if (matchedChains.some((c) => c.partial)) score += 12;

  const escalationEvents = sortedEvents.filter((e) => ESCALATION_EVENT_TYPES.has(e.eventType));
  score += Math.min(escalationEvents.length * 2, 10);

  const correlationScore = Math.min(100, Math.max(0, Math.round(score)));

  const groupingKeys = [];
  if (username) groupingKeys.push({ type: 'username', value: username });
  if (ip) groupingKeys.push({ type: 'ip', value: ip });
  const deviceId = sortedEvents.find((e) => e.metadata?.deviceId)?.metadata?.deviceId;
  if (deviceId) groupingKeys.push({ type: 'deviceId', value: deviceId });

  const stages = sortedEvents.slice(0, 12).map((e) => {
    const mitre = mapEventTypeToMitre(e.eventType);
    return {
      timestamp: e.timestamp,
      eventType: e.eventType,
      severity: e.severity,
      username: e.username,
      ip: e.ip,
      mitreTactic: mitre?.tactic,
    };
  });

  const narrative = buildCorrelationNarrative({
    correlationScore,
    matchedChains,
    alerts,
    sortedEvents,
    groupingKeys,
  });

  return {
    correlationScore,
    matchedChains,
    groupingKeys,
    stages,
    alertCount: alerts.length,
    eventCount: sortedEvents.length,
    ruleIds,
    narrative,
    windowMinutes: 60,
  };
}

function buildCorrelationNarrative({ correlationScore, matchedChains, alerts, sortedEvents, groupingKeys }) {
  const parts = [];

  if (groupingKeys.length) {
    parts.push(
      `Grouped by ${groupingKeys.map((k) => `${k.type} ${k.value}`).join(' and ')} within a ${60}-minute window.`
    );
  }

  if (matchedChains.length) {
    const full = matchedChains.filter((c) => c.matched);
    if (full.length) {
      parts.push(`Detected attack chain pattern: ${full.map((c) => c.name).join('; ')}.`);
    } else {
      parts.push(`Partial attack sequence detected: ${matchedChains[0].name}.`);
    }
  }

  if (alerts.length) {
    parts.push(`${alerts.length} related alert(s) from rules: ${[...new Set(alerts.map((a) => a.ruleId))].join(', ')}.`);
  }

  if (sortedEvents.length >= 2) {
    const span = Math.round(
      (new Date(sortedEvents[sortedEvents.length - 1].timestamp) - new Date(sortedEvents[0].timestamp)) / 60000
    );
    parts.push(`${sortedEvents.length} correlated events spanning ~${span} minutes with severity escalation.`);
  }

  if (correlationScore >= 75) {
    parts.push('High-confidence multi-stage activity — not isolated noise.');
  } else if (correlationScore >= 50) {
    parts.push('Moderate correlation — warrants analyst review.');
  }

  return parts.join(' ');
}
