import { DETECTION_EVENT_GROUPS } from '../../../config/eventTypes.js';
import {
  buildAlertPayload,
  queryRecentEvents,
  windowStart,
} from '../helpers.js';

export const portScanRule = {
  id: 'port_scan_v1',
  name: 'Port Scan / Reconnaissance',
  eventTypes: DETECTION_EVENT_GROUPS.recon,
  severity: 'high',
  windowMinutes: 2,
  threshold: 10,

  evaluateLogic(event, networkEvents) {
    if (!event.ip) return null;

    const until = new Date(event.timestamp);
    const since = windowStart(until, this.windowMinutes);

    const inWindow = networkEvents.filter(
      (e) =>
        e.ip === event.ip &&
        new Date(e.timestamp) >= since &&
        new Date(e.timestamp) <= until
    );

    const uniqueTargets = new Set(
      inWindow.map((e) => {
        const port = e.metadata?.port ?? 'unknown';
        const endpoint = e.metadata?.endpoint ?? 'unknown';
        return `${port}:${endpoint}`;
      })
    );

    if (uniqueTargets.size < this.threshold) return null;

    return buildAlertPayload({
      title: 'Port Scan / Reconnaissance',
      severity: 'high',
      ruleId: this.id,
      summary: `IP ${event.ip} accessed ${uniqueTargets.size} unique ports/endpoints within ${this.windowMinutes} minutes.`,
      eventIds: inWindow.map((e) => e._id || e.id),
      metrics: {
        uniqueTargets: uniqueTargets.size,
        windowMinutes: this.windowMinutes,
        ip: event.ip,
      },
      username: event.username,
      ip: event.ip,
    });
  },

  async evaluate(event) {
    if (!event.ip) return null;

    const until = new Date(event.timestamp);
    const since = windowStart(until, this.windowMinutes);

    const networkEvents = await queryRecentEvents({
      eventTypes: DETECTION_EVENT_GROUPS.recon,
      ip: event.ip,
      since,
      until,
    });

    return this.evaluateLogic(
      { ...event.toObject?.() ?? event, timestamp: until },
      networkEvents
    );
  },
};
