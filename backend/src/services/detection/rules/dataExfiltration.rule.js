import {
  buildAlertPayload,
  queryRecentEvents,
  windowStart,
} from '../helpers.js';

export const dataExfiltrationRule = {
  id: 'data_exfil_v1',
  name: 'Possible Data Exfiltration',
  eventTypes: ['file_download'],
  severity: 'high',
  windowMinutes: 10,
  threshold: 30,

  evaluateLogic(event, downloadEvents) {
    if (!event.username) return null;

    const until = new Date(event.timestamp);
    const since = windowStart(until, this.windowMinutes);

    const inWindow = downloadEvents.filter(
      (e) =>
        e.username === event.username &&
        new Date(e.timestamp) >= since &&
        new Date(e.timestamp) <= until
    );

    if (inWindow.length <= this.threshold) return null;

    return buildAlertPayload({
      title: 'Possible Data Exfiltration',
      severity: 'high',
      ruleId: this.id,
      summary: `User ${event.username} downloaded ${inWindow.length} files within ${this.windowMinutes} minutes.`,
      eventIds: inWindow.map((e) => e._id || e.id),
      metrics: {
        downloadCount: inWindow.length,
        windowMinutes: this.windowMinutes,
        username: event.username,
      },
      username: event.username,
      ip: event.ip,
    });
  },

  async evaluate(event) {
    if (!event.username) return null;

    const until = new Date(event.timestamp);
    const since = windowStart(until, this.windowMinutes);

    const downloadEvents = await queryRecentEvents({
      eventType: 'file_download',
      username: event.username,
      since,
      until,
    });

    return this.evaluateLogic(
      { ...event.toObject?.() ?? event, timestamp: until },
      downloadEvents
    );
  },
};

export async function evaluateDataExfiltration(event) {
  return dataExfiltrationRule.evaluate(event);
}
