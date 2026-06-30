import { normalizeEventType } from '../../config/eventTypes.js';

export function normalizeIncomingEvent(body) {
  return {
    source: body.source?.trim(),
    eventType: normalizeEventType(body.eventType?.trim()),
    username: body.username?.trim() || undefined,
    ip: body.ip?.trim() || undefined,
    metadata: body.metadata && typeof body.metadata === 'object' ? body.metadata : {},
    severity: body.severity || 'low',
    timestamp: new Date(body.timestamp),
  };
}
