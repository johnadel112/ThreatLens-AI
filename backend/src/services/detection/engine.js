import Alert from '../../models/Alert.js';
import { getRulesForEventType } from './ruleRegistry.js';
import { hasOpenAlert } from './helpers.js';
import { groupAlertIntoIncident } from '../incident/grouper.js';
import { attachMitreToAlertPayload } from '../intelligence/mitreMapping.service.js';
import { enrichIp } from '../intelligence/threatIntel.service.js';
import { computeAlertRiskScore } from '../intelligence/riskScoring.service.js';

export async function runDetection(event) {
  const rules = await getRulesForEventType(event.eventType);
  if (rules.length === 0) return [];

  const alertsCreated = [];

  for (const rule of rules) {
    try {
      const payload = await rule.evaluate(event);
      if (!payload) continue;
      payload.userId = event.userId;

      const isDuplicate = await hasOpenAlert({
        userId: event.userId,
        ruleId: rule.id,
        username: payload.username,
        ip: payload.ip,
        sinceMinutes: rule.windowMinutes || 60,
      });

      if (isDuplicate) continue;

      const enriched = attachMitreToAlertPayload(payload, rule.id);
      const ipIntel = enriched.ip ? enrichIp(enriched.ip, event.metadata || {}) : null;
      enriched.threatIntel = ipIntel ? { ip: ipIntel } : undefined;
      enriched.riskScore = computeAlertRiskScore(enriched, ipIntel);

      const alert = await Alert.create({
        ...enriched,
        userId: event.userId,
      });
      await groupAlertIntoIncident(alert);
      alertsCreated.push(alert);
    } catch (err) {
      console.error(`[detection] Rule ${rule.id} failed:`, err.message);
    }
  }

  return alertsCreated;
}
