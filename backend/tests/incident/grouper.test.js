import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { deriveIncidentTitle } from '../../src/services/incident/grouper.js';

describe('deriveIncidentTitle', () => {
  it('returns Possible Account Compromise for suspicious login + exfil', () => {
    const alerts = [
      { ruleId: 'suspicious_login_v1' },
      { ruleId: 'data_exfil_v1' },
    ];
    assert.equal(deriveIncidentTitle(alerts), 'Possible Account Compromise');
  });

  it('returns Brute Force Attack Detected for brute force only', () => {
    const alerts = [{ ruleId: 'brute_force_v1' }];
    assert.equal(deriveIncidentTitle(alerts), 'Brute Force Attack Detected');
  });

  it('returns Multi-Stage for unrelated rules', () => {
    const alerts = [{ ruleId: 'port_scan_v1' }];
    assert.equal(deriveIncidentTitle(alerts), 'Multi-Stage Suspicious Activity');
  });
});
