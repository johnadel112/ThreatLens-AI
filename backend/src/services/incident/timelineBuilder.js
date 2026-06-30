import Alert from '../../models/Alert.js';
import SecurityEvent from '../../models/SecurityEvent.js';

function collectEventIds(alerts) {
  const ids = new Set();
  for (const alert of alerts) {
    for (const id of alert.relatedEvents || []) {
      ids.add(id.toString());
    }
    for (const id of alert.evidence?.eventIds || []) {
      ids.add(id.toString());
    }
  }
  return [...ids];
}

export function buildTimelineEntries(events, alerts) {
  const entries = [];

  for (const event of events) {
    entries.push({
      timestamp: event.timestamp,
      source: 'event',
      title: event.eventType.replace(/_/g, ' '),
      description: `${event.username || 'system'} @ ${event.ip || 'unknown'} via ${event.source}`,
      refId: event._id,
    });
  }

  for (const alert of alerts) {
    entries.push({
      timestamp: alert.createdAt,
      source: 'alert',
      title: alert.title,
      description: alert.evidence?.summary || alert.title,
      refId: alert._id,
    });
  }

  return entries.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
}

export async function rebuildIncidentTimeline(incidentId) {
  const alerts = await Alert.find({ incidentId }).sort({ createdAt: 1 });
  const eventIds = collectEventIds(alerts);
  const events = eventIds.length
    ? await SecurityEvent.find({ _id: { $in: eventIds } }).sort({ timestamp: 1 })
    : [];

  return {
    timeline: buildTimelineEntries(events, alerts),
    relatedEvents: events.map((e) => e._id),
  };
}
