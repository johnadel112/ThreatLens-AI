import SecurityEvent from '../../models/SecurityEvent.js';
import { runDetection } from '../detection/engine.js';
import { normalizeIncomingEvent } from './normalize.js';

/**
 * Central pipeline: validate → persist → detect → group incidents.
 */
export async function createSecurityEvent(eventData, userId) {
  if (!userId) {
    throw new Error('userId is required for event creation');
  }

  const normalized = {
    ...normalizeIncomingEvent(eventData),
    userId,
  };

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
