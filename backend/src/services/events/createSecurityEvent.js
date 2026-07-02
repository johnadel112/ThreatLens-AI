import SecurityEvent from '../../models/SecurityEvent.js';
import { runDetection } from '../detection/engine.js';
import { normalizeIncomingEvent } from './normalize.js';
import { enrichIp } from '../intelligence/threatIntel.service.js';
import { computeEventRiskScore } from '../intelligence/riskScoring.service.js';

/**
 * Central pipeline: validate → enrich → persist → detect → correlate → group incidents.
 */
export async function createSecurityEvent(eventData, userId) {
  if (!userId) {
    throw new Error('userId is required for event creation');
  }

  const normalized = {
    ...normalizeIncomingEvent(eventData),
    userId,
  };

  const threatIntel = normalized.ip
    ? { ip: enrichIp(normalized.ip, normalized.metadata || {}) }
    : undefined;

  normalized.threatIntel = threatIntel;
  normalized.riskScore = computeEventRiskScore(normalized, threatIntel?.ip);

  const event = await SecurityEvent.create(normalized);
  const alerts = await runDetection(event);

  const incidentId =
    alerts.find((a) => a.incidentId)?.incidentId?.toString() || null;

  return {
    event,
    alerts,
    incidentId,
  };
}
