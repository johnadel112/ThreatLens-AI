import Alert from '../../models/Alert.js';
import Incident from '../../models/Incident.js';
import { maxSeverity } from '../../config/constants.js';
import { rebuildIncidentTimeline } from './timelineBuilder.js';

const GROUPING_WINDOW_MINUTES = 60;
const OPEN_INCIDENT_STATUSES = ['new', 'investigating', 'contained'];

export function deriveIncidentTitle(alerts) {
  const ruleIds = alerts.map((a) => a.ruleId);

  const hasSuspiciousLogin = ruleIds.includes('suspicious_login_v1');
  const hasDataExfil = ruleIds.includes('data_exfil_v1');
  const hasBruteForce = ruleIds.includes('brute_force_v1');
  const hasPrivEsc = ruleIds.includes('priv_esc_v1');

  if (hasSuspiciousLogin && hasDataExfil) {
    return 'Possible Account Compromise';
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

  return 'Multi-Stage Suspicious Activity';
}

async function findMatchingIncident(alert) {
  const since = new Date(Date.now() - GROUPING_WINDOW_MINUTES * 60 * 1000);
  const orConditions = [];

  if (alert.username) orConditions.push({ username: alert.username });
  if (alert.ip) orConditions.push({ ip: alert.ip });

  if (orConditions.length === 0) return null;

  return Incident.findOne({
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
      title: deriveIncidentTitle([alert]),
      severity: alert.severity,
      status: 'new',
      alerts: [alert._id],
      username: alert.username,
      ip: alert.ip,
      relatedEvents: alert.relatedEvents || [],
      timeline: [],
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
