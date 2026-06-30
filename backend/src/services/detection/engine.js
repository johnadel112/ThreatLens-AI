import Alert from '../../models/Alert.js';
import { getRulesForEventType } from './ruleRegistry.js';
import { hasOpenAlert } from './helpers.js';
import { groupAlertIntoIncident } from '../incident/grouper.js';

export async function runDetection(event) {
  const rules = getRulesForEventType(event.eventType);
  if (rules.length === 0) return [];

  const alertsCreated = [];

  for (const rule of rules) {
    try {
      const payload = await rule.evaluate(event);
      if (!payload) continue;

      const isDuplicate = await hasOpenAlert({
        ruleId: rule.id,
        username: payload.username,
        ip: payload.ip,
        sinceMinutes: rule.windowMinutes || 60,
      });

      if (isDuplicate) continue;

      const alert = await Alert.create(payload);
      await groupAlertIntoIncident(alert);
      alertsCreated.push(alert);
    } catch (err) {
      console.error(`[detection] Rule ${rule.id} failed:`, err.message);
    }
  }

  return alertsCreated;
}
