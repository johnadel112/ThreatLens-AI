import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { analyzeCorrelation } from '../../src/services/intelligence/correlation.service.js';
import { mapRuleToMitre } from '../../src/services/intelligence/mitreMapping.service.js';
import {
  computeEventRiskScore,
  computeIncidentRiskScore,
  riskLabel,
} from '../../src/services/intelligence/riskScoring.service.js';
import { enrichIp } from '../../src/services/intelligence/threatIntel.service.js';

describe('MITRE mapping', () => {
  it('maps brute force rule to Credential Access', () => {
    const m = mapRuleToMitre('brute_force_v1');
    assert.equal(m.tactic, 'Credential Access');
    assert.equal(m.techniqueId, 'T1110');
  });
});

describe('Threat intelligence', () => {
  it('enriches IP deterministically', () => {
    const a = enrichIp('198.51.100.22');
    const b = enrichIp('198.51.100.22');
    assert.equal(a.reputation, 'malicious');
    assert.equal(a.ip, b.ip);
    assert.equal(a.country, b.country);
    assert.equal(a.confidence, b.confidence);
    assert.equal(a.simulated, true);
  });
});

describe('Risk scoring', () => {
  it('labels score bands correctly', () => {
    assert.equal(riskLabel(10), 'Low');
    assert.equal(riskLabel(40), 'Guarded');
    assert.equal(riskLabel(60), 'Elevated');
    assert.equal(riskLabel(80), 'High');
    assert.equal(riskLabel(95), 'Critical');
  });

  it('caps critical incident risk without multiple open critical alerts', () => {
    const score = computeIncidentRiskScore({
      severity: 'critical',
      alerts: [{ severity: 'critical', status: 'open' }],
      events: Array.from({ length: 5 }, () => ({ severity: 'high' })),
      correlationScore: 90,
      mitreSummary: { tacticCount: 3 },
      threatIntel: { reputation: 'malicious' },
    });
    assert.ok(score <= 90);
  });

  it('scores events with severity baseline', () => {
    const low = computeEventRiskScore({ severity: 'low', eventType: 'login_success' });
    const critical = computeEventRiskScore({ severity: 'critical', eventType: 'ransomware_behavior' });
    assert.ok(critical > low);
  });
});

describe('Correlation engine', () => {
  it('detects brute force to exfiltration chain', () => {
    const now = Date.now();
    const events = [
      { eventType: 'login_failed', severity: 'medium', timestamp: new Date(now), username: 'alice', ip: '10.0.0.1' },
      { eventType: 'login_failed', severity: 'medium', timestamp: new Date(now + 60000), username: 'alice', ip: '10.0.0.1' },
      { eventType: 'login_success', severity: 'high', timestamp: new Date(now + 120000), username: 'alice', ip: '10.0.0.1' },
      { eventType: 'file_download', severity: 'high', timestamp: new Date(now + 180000), username: 'alice', ip: '10.0.0.1' },
    ];
    const alerts = [
      { ruleId: 'brute_force_v1', severity: 'high', status: 'open', username: 'alice', ip: '10.0.0.1' },
      { ruleId: 'data_exfil_v1', severity: 'critical', status: 'open', username: 'alice', ip: '10.0.0.1' },
    ];

    const result = analyzeCorrelation({ events, alerts, username: 'alice', ip: '10.0.0.1' });
    assert.ok(result.correlationScore >= 50);
    assert.ok(result.matchedChains.some((c) => c.id === 'credential_compromise_exfil'));
    assert.ok(result.narrative.includes('alice'));
  });
});
