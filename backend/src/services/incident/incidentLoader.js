import Incident from '../../models/Incident.js';
import Alert from '../../models/Alert.js';
import SecurityEvent from '../../models/SecurityEvent.js';

export async function loadIncidentBundle(incidentId) {
  const incident = await Incident.findById(incidentId).populate('assignedAnalyst', 'name email role');

  if (!incident) {
    return null;
  }

  const alerts = await Alert.find({ _id: { $in: incident.alerts } }).sort({ createdAt: 1 });
  const events = incident.relatedEvents?.length
    ? await SecurityEvent.find({ _id: { $in: incident.relatedEvents } }).sort({ timestamp: 1 })
    : [];

  return { incident, alerts, events };
}

export function toAiServiceContext(incident, alerts, events) {
  return {
    incident_id: incident._id.toString(),
    title: incident.title,
    severity: incident.severity,
    status: incident.status,
    username: incident.username,
    ip: incident.ip,
    correlation_score: incident.correlationScore ?? undefined,
    correlation_narrative: incident.correlation?.narrative ?? undefined,
    mitre_tactics: incident.mitre?.tactics ?? [],
    risk_score: incident.riskScore ?? undefined,
    threat_intel: incident.threatIntel ?? {},
    alerts: alerts.map((a) => ({
      alert_id: a._id.toString(),
      title: a.title,
      severity: a.severity,
      rule_id: a.ruleId,
      summary: a.evidence?.summary,
      mitre_tactic: a.mitre?.tactic,
      risk_score: a.riskScore,
    })),
    events: events.map((e) => ({
      event_id: e._id.toString(),
      event_type: e.eventType,
      username: e.username,
      ip: e.ip,
      source: e.source,
      timestamp: e.timestamp.toISOString(),
      severity: e.severity,
      risk_score: e.riskScore,
      metadata: e.metadata || {},
    })),
    timeline: (incident.timeline || []).map((t) => ({
      timestamp: new Date(t.timestamp).toISOString(),
      source: t.source,
      title: t.title,
      description: t.description,
    })),
  };
}

export function toIncidentDetailJson(incident, alerts, events, agentOutputs = []) {
  const json = incident.toPublicJSON();
  if (incident.assignedAnalyst) {
    json.assignedAnalyst = {
      id: incident.assignedAnalyst._id,
      name: incident.assignedAnalyst.name,
      email: incident.assignedAnalyst.email,
      role: incident.assignedAnalyst.role,
    };
  }
  json.alerts = alerts.map((a) => a.toPublicJSON());
  json.events = events.map((e) => e.toPublicJSON());
  json.agentOutputs = agentOutputs.map((o) => o.toPublicJSON?.() ?? o);
  return json;
}
