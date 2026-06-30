import { DETECTION_EVENT_GROUPS } from '../../../config/eventTypes.js';
import {
  buildAlertPayload,
  queryRecentEvents,
  windowStart,
} from '../helpers.js';

export const suspiciousLoginRule = {
  id: 'suspicious_login_v1',
  name: 'Possible Account Compromise',
  eventTypes: DETECTION_EVENT_GROUPS.successfulAuth,
  severity: 'critical',
  windowMinutes: 15,
  failureThreshold: 3,

  evaluateLogic(event, failedEvents) {
    const until = new Date(event.timestamp);
    const since = windowStart(until, this.windowMinutes);

    const inWindow = failedEvents.filter(
      (e) => new Date(e.timestamp) >= since && new Date(e.timestamp) < until
    );

    const byUsername = event.username
      ? inWindow.filter((e) => e.username === event.username)
      : [];
    const byIp = event.ip ? inWindow.filter((e) => e.ip === event.ip) : [];

    const userTriggered = byUsername.length >= this.failureThreshold;
    const ipTriggered = byIp.length >= this.failureThreshold;

    if (!userTriggered && !ipTriggered) return null;

    const failures = userTriggered ? byUsername : byIp;

    return buildAlertPayload({
      title: 'Possible Account Compromise',
      severity: 'critical',
      ruleId: this.id,
      summary: `Successful login for ${event.username || 'unknown'} after ${failures.length} failed attempts within ${this.windowMinutes} minutes.`,
      eventIds: [...failures.map((e) => e._id || e.id), event._id || event.id],
      metrics: {
        failedCount: failures.length,
        windowMinutes: this.windowMinutes,
        successfulLoginAt: until.toISOString(),
      },
      username: event.username,
      ip: event.ip,
    });
  },

  async evaluate(event) {
    const until = new Date(event.timestamp);
    const since = windowStart(until, this.windowMinutes);

    const failedEvents = await queryRecentEvents({
      userId: event.userId,
      eventTypes: DETECTION_EVENT_GROUPS.failedAuth,
      username: event.username,
      ip: event.ip,
      since,
      until,
    });

    return this.evaluateLogic(
      { ...event.toObject?.() ?? event, timestamp: until },
      failedEvents
    );
  },
};
