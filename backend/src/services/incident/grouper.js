import Alert from '../../models/Alert.js';
import Incident from '../../models/Incident.js';
import SecurityEvent from '../../models/SecurityEvent.js';
import { maxSeverity } from '../../config/constants.js';
import { rebuildIncidentTimeline } from './timelineBuilder.js';
import { analyzeCorrelation } from '../intelligence/correlation.service.js';
import { summarizeIncidentMitre } from '../intelligence/mitreMapping.service.js';
import { enrichIp } from '../intelligence/threatIntel.service.js';
import {
  computeIncidentRiskScore,
  computeConfidenceScore,
} from '../intelligence/riskScoring.service.js';
import { ensureCaseFields, deriveCasePriority } from './caseService.js';
import { recordAudit } from '../playbook/auditService.js';
import { notifyUser } from '../notifications/notificationService.js';

const GROUPING_WINDOW_MINUTES = 60;
const OPEN_INCIDENT_STATUSES = ['new', 'investigating', 'contained'];

export function deriveIncidentTitle(alerts) {
  const ruleIds = alerts.map((a) => a.ruleId);

  const hasSuspiciousLogin = ruleIds.includes('suspicious_login_v1');
  const hasDataExfil = ruleIds.includes('data_exfil_v1');
  const hasBruteForce = ruleIds.includes('brute_force_v1');
  const hasPrivEsc = ruleIds.includes('priv_esc_v1');
  const hasMalware = ruleIds.includes('malware_v1');
  const hasPortScan = ruleIds.includes('port_scan_v1');

  if (hasSuspiciousLogin && hasDataExfil) {
    return 'Possible Account Compromise';
  }
  if (hasMalware && hasDataExfil) {
    return 'Malware Activity with Data Exfiltration';
  }
  if (hasSuspiciousLogin || hasPrivEsc) {
    return 'Possible Account Compromise';
  }
  if (hasBruteForce && !hasSuspiciousLogin) {
    return 'Brute Force Attack Detected';
  }
  if (hasDataExfil) {
    return 'Possible Data Exfiltration';
  }
  if (hasPortScan) {
    return 'Reconnaissance Activity Detected';
  }

  return 'Multi-Stage Suspicious Activity';
}

async function findMatchingIncident(alert) {
  const since = new Date(Date.now() - GROUPING_WINDOW_MINUTES * 60 * 1000);
  const orConditions = [];

  if (alert.username) orConditions.push({ username: alert.username });
  if (alert.ip) orConditions.push({ ip: alert.ip });

  if (orConditions.length === 0) return null;

  return Incident.findOne({
    userId: alert.userId,
    status: { $in: OPEN_INCIDENT_STATUSES },
    createdAt: { $gte: since },
    $or: orConditions,
  }).sort({ createdAt: -1 });
}

async function refreshIncident(incident) {
  const alerts = await Alert.find({ _id: { $in: incident.alerts } });
  incident.title = deriveIncidentTitle(alerts);
  incident.severity = maxSeverity(alerts.map((a) => a.severity));

  const { timeline, relatedEvents } = await rebuildIncidentTimeline(incident._id);
  incident.timeline = timeline;
  incident.relatedEvents = relatedEvents;

  const events = relatedEvents.length
    ? await SecurityEvent.find({ _id: { $in: relatedEvents } }).sort({ timestamp: 1 })
    : [];

  const correlation = analyzeCorrelation({
    events,
    alerts,
    username: incident.username,
    ip: incident.ip,
  });

  const mitre = summarizeIncidentMitre(alerts, events);
  const threatIntel = incident.ip ? { ip: enrichIp(incident.ip) } : undefined;

  incident.correlationScore = correlation.correlationScore;
  incident.correlation = correlation;
  incident.mitre = mitre;
  incident.threatIntel = threatIntel;
  incident.riskScore = computeIncidentRiskScore({
    severity: incident.severity,
    alerts,
    events,
    correlationScore: correlation.correlationScore,
    mitreSummary: mitre,
    threatIntel: threatIntel?.ip,
  });
  incident.confidenceScore = computeConfidenceScore({
    correlationScore: correlation.correlationScore,
    alertCount: alerts.length,
    eventCount: events.length,
    hasAiSummary: !!incident.aiSummary,
  });

  if (!incident.threatClassification?.attackType && mitre.primaryTactic !== 'Unknown') {
    incident.threatClassification = {
      ...(incident.threatClassification || {}),
      attackType: incident.threatClassification?.attackType || deriveIncidentTitle(alerts),
      category: mitre.primaryTactic,
      mitreTactic: mitre.primaryTactic,
      mitreTechnique: mitre.techniques[0]?.technique,
      techniqueId: mitre.techniques[0]?.techniqueId,
      confidence: incident.confidenceScore / 100,
    };
  }

  await incident.save();
  return incident;
}

export async function groupAlertIntoIncident(alert) {
  if (alert.incidentId) {
    return alert.incidentId;
  }

  let incident = await findMatchingIncident(alert);

  if (!incident) {
    incident = await Incident.create({
      userId: alert.userId,
      title: deriveIncidentTitle([alert]),
      severity: alert.severity,
      status: 'new',
      priority: deriveCasePriority(alert.severity),
      alerts: [alert._id],
      username: alert.username,
      ip: alert.ip,
      relatedEvents: alert.relatedEvents || [],
      timeline: [],
      tags: [],
      notes: [],
      tasks: [],
    });

    await ensureCaseFields(incident);
    await incident.save();

    await recordAudit({
      action: 'incident_created',
      entityType: 'incident',
      entityId: incident._id,
      incidentId: incident._id,
      details: {
        title: incident.title,
        severity: incident.severity,
        caseNumber: incident.caseNumber,
        ruleId: alert.ruleId,
      },
    });

    await notifyUser(alert.userId, {
      type: 'incident_created',
      title: `New incident: ${incident.title}`,
      message: `Case ${incident.caseNumber} opened — ${alert.severity} severity`,
      link: `/incidents/${incident._id}`,
      metadata: { incidentId: incident._id, caseNumber: incident.caseNumber },
    });

    alert.incidentId = incident._id;
    await alert.save();

    await refreshIncident(incident);
    return incident._id;
  }

  if (!incident.alerts.some((id) => id.toString() === alert._id.toString())) {
    incident.alerts.push(alert._id);
    await incident.save();
  }

  alert.incidentId = incident._id;
  await alert.save();

  await refreshIncident(incident);
  return incident._id;
}

export async function groupAlertsIntoIncidents(alerts) {
  const incidentIds = new Set();

  for (const alert of alerts) {
    const incidentId = await groupAlertIntoIncident(alert);
    incidentIds.add(incidentId.toString());
  }

  return [...incidentIds];
}

/** Backfill incidents for alerts created before grouping was enabled */
export async function regroupOrphanAlerts() {
  const orphans = await Alert.find({
    $or: [{ incidentId: null }, { incidentId: { $exists: false } }],
    status: { $in: ['open', 'acknowledged'] },
  }).sort({ createdAt: 1 });

  return groupAlertsIntoIncidents(orphans);
}
