import { DETECTION_EVENT_GROUPS } from '../../../config/eventTypes.js';
import { buildAlertPayload, findRecentAlert } from '../helpers.js';

const PRECURSOR_RULES = ['suspicious_login_v1', 'brute_force_v1'];

export const privilegeEscalationRule = {
  id: 'priv_esc_v1',
  name: 'Possible Privilege Escalation',
  eventTypes: DETECTION_EVENT_GROUPS.privilegeChange,
  severity: 'critical',
  windowMinutes: 30,

  evaluateLogic(event, precursorAlert) {
    if (!precursorAlert) return null;

    return buildAlertPayload({
      title: 'Possible Privilege Escalation',
      severity: 'critical',
      ruleId: this.id,
      summary: `Permission change for ${event.username || 'unknown'} within ${this.windowMinutes} minutes of suspicious login activity (${precursorAlert.title}).`,
      eventIds: [event._id || event.id],
      metrics: {
        precursorAlertId: precursorAlert._id?.toString?.() || precursorAlert.id,
        precursorRuleId: precursorAlert.ruleId,
        windowMinutes: this.windowMinutes,
        change: event.metadata?.change,
      },
      username: event.username,
      ip: event.ip,
    });
  },

  async evaluate(event) {
    let precursorAlert = null;

    for (const ruleId of PRECURSOR_RULES) {
      precursorAlert = await findRecentAlert({
        ruleId,
        username: event.username,
        ip: event.ip,
        sinceMinutes: this.windowMinutes,
      });
      if (precursorAlert) break;
    }

    if (!precursorAlert) return null;

    return this.evaluateLogic(event.toObject?.() ?? event, precursorAlert);
  },
};
