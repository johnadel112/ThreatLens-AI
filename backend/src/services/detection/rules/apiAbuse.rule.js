import { DETECTION_EVENT_GROUPS } from '../../../config/eventTypes.js';
import {
  buildAlertPayload,
  queryRecentEvents,
  windowStart,
} from '../helpers.js';

export const apiAbuseRule = {
  id: 'api_abuse_v1',
  name: 'API Abuse / Suspicious Volume',
  eventTypes: DETECTION_EVENT_GROUPS.apiTraffic,
  severity: 'high',
  windowMinutes: 5,
  requestThreshold: 80,
  rateLimitThreshold: 3,

  evaluateLogic(event, apiEvents) {
    if (!event.ip) return null;

    const until = new Date(event.timestamp);
    const since = windowStart(until, this.windowMinutes);

    const inWindow = apiEvents.filter(
      (e) =>
        e.ip === event.ip &&
        new Date(e.timestamp) >= since &&
        new Date(e.timestamp) <= until
    );

    const requests = inWindow.filter((e) => e.eventType === 'api_request');
    const rateLimits = inWindow.filter((e) => e.eventType === 'api_rate_limit_exceeded');

    const volumeTriggered = requests.length >= this.requestThreshold;
    const rateTriggered = rateLimits.length >= this.rateLimitThreshold;

    if (!volumeTriggered && !rateTriggered) return null;

    return buildAlertPayload({
      title: 'API Abuse / Suspicious Volume',
      severity: rateTriggered ? 'high' : 'medium',
      ruleId: this.id,
      summary: volumeTriggered
        ? `IP ${event.ip} made ${requests.length} API requests within ${this.windowMinutes} minutes.`
        : `IP ${event.ip} hit API rate limits ${rateLimits.length} times within ${this.windowMinutes} minutes.`,
      eventIds: inWindow.map((e) => e._id || e.id),
      metrics: {
        requestCount: requests.length,
        rateLimitCount: rateLimits.length,
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

    const apiEvents = await queryRecentEvents({
      userId: event.userId,
      eventTypes: DETECTION_EVENT_GROUPS.apiTraffic,
      ip: event.ip,
      since,
      until,
    });

    return this.evaluateLogic(event.toObject?.() ?? event, apiEvents);
  },
};
