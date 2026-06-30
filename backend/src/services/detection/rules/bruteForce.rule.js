import { DETECTION_EVENT_GROUPS } from '../../../config/eventTypes.js';
import {
  buildAlertPayload,
  queryRecentEvents,
  windowStart,
} from '../helpers.js';

export const bruteForceRule = {
  id: 'brute_force_v1',
  name: 'Brute Force Login Attempt',
  eventTypes: DETECTION_EVENT_GROUPS.failedAuth,
  severity: 'high',
  windowMinutes: 5,
  threshold: 5,

  evaluateLogic(event, failedEvents) {
    const until = new Date(event.timestamp);
    const since = windowStart(until, this.windowMinutes);

    const inWindow = failedEvents.filter(
      (e) => new Date(e.timestamp) >= since && new Date(e.timestamp) <= until
    );

    const byUsername = event.username
      ? inWindow.filter((e) => e.username === event.username)
      : [];
    const byIp = event.ip ? inWindow.filter((e) => e.ip === event.ip) : [];

    const userTriggered = byUsername.length > this.threshold;
    const ipTriggered = byIp.length > this.threshold;

    if (!userTriggered && !ipTriggered) return null;

    const matched = userTriggered ? byUsername : byIp;
    const trigger = userTriggered ? 'username' : 'ip';
    const value = userTriggered ? event.username : event.ip;

    return buildAlertPayload({
      title: 'Brute Force Login Attempt',
      severity: 'high',
      ruleId: this.id,
      summary: `Detected ${matched.length} failed login attempts for the same ${trigger} (${value}) within ${this.windowMinutes} minutes.`,
      eventIds: matched.map((e) => e._id || e.id),
      metrics: {
        failedCount: matched.length,
        windowMinutes: this.windowMinutes,
        trigger,
        triggerValue: value,
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

export async function evaluateBruteForce(event) {
  return bruteForceRule.evaluate(event);
}
