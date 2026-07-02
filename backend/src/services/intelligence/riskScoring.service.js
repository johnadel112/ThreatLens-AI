import { SEVERITY_RANK } from '../../config/constants.js';
import { reputationRiskBoost } from './threatIntel.service.js';
import { mapRuleToMitre } from './mitreMapping.service.js';

export const RISK_BANDS = [
  { min: 0, max: 25, label: 'Low' },
  { min: 26, max: 50, label: 'Guarded' },
  { min: 51, max: 75, label: 'Elevated' },
  { min: 76, max: 90, label: 'High' },
  { min: 91, max: 100, label: 'Critical' },
];

export function riskLabel(score) {
  const band = RISK_BANDS.find((b) => score >= b.min && score <= b.max);
  return band?.label || 'Low';
}

function severityBase(severity) {
  const map = { info: 5, low: 12, medium: 28, high: 52, critical: 78 };
  return map[severity] || 12;
}

function clamp(score) {
  return Math.min(100, Math.max(0, Math.round(score)));
}

export function computeEventRiskScore(event, threatIntel = null) {
  let score = severityBase(event.severity);

  const meta = event.metadata || {};
  if (meta.anomalyScore) score += meta.anomalyScore * 15;
  if (meta.isAttackChain) score += 8;
  if (meta.country && meta.usualCountry && meta.country !== meta.usualCountry) score += 6;

  const intel = threatIntel || (event.ip ? null : null);
  if (intel?.reputation) score += reputationRiskBoost(intel.reputation);

  const criticalTypes = ['ransomware_behavior', 'audit_log_cleared', 'malware_detected', 'privilege_escalation'];
  if (criticalTypes.includes(event.eventType)) score += 12;

  return clamp(score);
}

export function computeAlertRiskScore(alert, threatIntel = null) {
  let score = severityBase(alert.severity);

  const eventCount = alert.evidence?.eventIds?.length || alert.relatedEvents?.length || 0;
  score += Math.min(eventCount * 2, 12);

  const mitre = alert.mitre || mapRuleToMitre(alert.ruleId);
  if (mitre?.tactic) score += 5;

  if (threatIntel?.reputation) score += reputationRiskBoost(threatIntel.reputation);
  if (alert.status === 'open') score += 4;

  return clamp(score);
}

export function computeIncidentRiskScore({
  severity,
  alerts = [],
  events = [],
  correlationScore = 0,
  mitreSummary = null,
  threatIntel = null,
}) {
  let score = severityBase(severity);

  const openAlerts = alerts.filter((a) => ['open', 'acknowledged'].includes(a.status));
  score += Math.min(openAlerts.length * 3, 15);
  score += openAlerts.filter((a) => a.severity === 'critical').length * 8;
  score += openAlerts.filter((a) => a.severity === 'high').length * 4;

  score += Math.min(events.length * 0.5, 10);
  score += Math.min((correlationScore || 0) * 0.12, 15);

  if (mitreSummary?.tacticCount) score += Math.min(mitreSummary.tacticCount * 4, 16);
  if (threatIntel?.reputation) score += reputationRiskBoost(threatIntel.reputation);

  const raw = clamp(score);
  const openCritical = openAlerts.filter((a) => a.severity === 'critical').length;
  if (raw >= 91 && openCritical < 2) {
    return Math.min(90, raw);
  }
  if (raw >= 76 && severity !== 'critical' && openCritical === 0) {
    return Math.min(75, raw);
  }
  return raw;
}

export function computeConfidenceScore({ correlationScore, alertCount, eventCount, hasAiSummary }) {
  let confidence = 35;
  confidence += Math.min((correlationScore || 0) * 0.22, 22);
  confidence += Math.min(alertCount * 4, 12);
  confidence += Math.min(eventCount * 1.2, 8);
  if (hasAiSummary) confidence += 12;
  return Math.min(hasAiSummary ? 95 : 82, clamp(confidence));
}
