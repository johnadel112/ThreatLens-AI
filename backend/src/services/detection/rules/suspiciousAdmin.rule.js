import { buildAlertPayload } from '../helpers.js';

function isAdminLogin(event) {
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
  eventTypes: ['login_success'],
  severity: 'medium',
  windowMinutes: 60,

  evaluateLogic(event) {
    if (!isAdminLogin(event) || !isOffHours(event.timestamp)) return null;

    return buildAlertPayload({
      title: 'Suspicious Admin Activity',
      severity: 'medium',
      ruleId: this.id,
      summary: `Admin account "${event.username}" logged in during off-hours (${new Date(event.timestamp).toISOString()}).`,
      eventIds: [event._id || event.id],
      metrics: {
        loginHour: new Date(event.timestamp).getHours(),
        offHoursWindow: '00:00-06:00',
      },
      username: event.username,
      ip: event.ip,
    });
  },

  async evaluate(event) {
    return this.evaluateLogic(event.toObject?.() ?? event);
  },
};
