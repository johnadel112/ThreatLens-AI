import { buildAlertPayload } from '../helpers.js';

function isAdminLogin(event) {
  if (event.eventType === 'admin_login') return true;
  const role = event.metadata?.role || event.metadata?.userRole;
  return (
    event.username === 'admin' ||
    role === 'admin' ||
    event.metadata?.isAdmin === true
  );
}

function isOffHours(timestamp) {
  const hour = new Date(timestamp).getHours();
  return hour >= 0 && hour < 6;
}

export const suspiciousAdminRule = {
  id: 'suspicious_admin_v1',
  name: 'Suspicious Admin Activity',
  eventTypes: ['admin_login', 'login_success', 'security_policy_change', 'api_key_created'],
  severity: 'medium',
  windowMinutes: 60,

  evaluateLogic(event) {
    const offHoursAdmin =
      (event.eventType === 'admin_login' || isAdminLogin(event)) && isOffHours(event.timestamp);
    const riskyPolicy =
      ['security_policy_change', 'api_key_created'].includes(event.eventType) &&
      isOffHours(event.timestamp);

    if (!offHoursAdmin && !riskyPolicy) return null;

    const summary = offHoursAdmin
      ? `Admin account "${event.username}" logged in during off-hours (${new Date(event.timestamp).toISOString()}).`
      : `Risky admin action "${event.eventType}" during off-hours for ${event.username || 'unknown'}.`;

    return buildAlertPayload({
      title: 'Suspicious Admin Activity',
      severity: riskyPolicy ? 'high' : 'medium',
      ruleId: this.id,
      summary,
      eventIds: [event._id || event.id],
      metrics: {
        loginHour: new Date(event.timestamp).getHours(),
        offHoursWindow: '00:00-06:00',
        eventType: event.eventType,
      },
      username: event.username,
      ip: event.ip,
    });
  },

  async evaluate(event) {
    return this.evaluateLogic(event.toObject?.() ?? event);
  },
};
