import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { runFallbackInvestigationWorkflow } from '../../src/services/ai/fallbackWorkflow.service.js';

describe('Fallback investigation workflow', () => {
  const context = {
    incident_id: 'inc-1',
    title: 'Possible Account Compromise',
    severity: 'critical',
    username: 'tom.support',
    ip: '87.171.198.28',
    correlation_score: 72,
    correlation_narrative: 'Failed logins followed by successful access',
    alerts: [
      { alert_id: 'a1', rule_id: 'suspicious_login_v1', title: 'Suspicious Login', severity: 'high' },
    ],
    events: [
      { event_id: 'e1', event_type: 'login_failed', severity: 'medium' },
      { event_id: 'e2', event_type: 'login_failed', severity: 'medium' },
      { event_id: 'e3', event_type: 'login_success', severity: 'high' },
    ],
    timeline: [],
  };

  it('returns completed agents when AI service is unavailable', () => {
    const result = runFallbackInvestigationWorkflow(context);

    assert.equal(result.source, 'fallback');
    assert.equal(result.agents.length, 6);
    assert.ok(result.agents.every((a) => a.status === 'completed'));
    assert.ok(result.summary);
    assert.ok(result.markdown);
    assert.equal(result.threat_classification.attackType, 'Suspected Account Compromise');
    assert.ok(result.report_quality?.overallConfidence > 0);
    assert.ok(result._explainability?.reasoningSummary);
  });
});
