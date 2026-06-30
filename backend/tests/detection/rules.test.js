import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { bruteForceRule } from '../../src/services/detection/rules/bruteForce.rule.js';
import { dataExfiltrationRule } from '../../src/services/detection/rules/dataExfiltration.rule.js';
import { suspiciousLoginRule } from '../../src/services/detection/rules/suspiciousLogin.rule.js';

const BASE = new Date('2026-06-28T10:00:00Z');

function minutesAfter(n) {
  return new Date(BASE.getTime() + n * 60 * 1000);
}

function failedLogin(n, username = 'jdoe', ip = '203.0.113.45') {
  return {
    _id: `fail-${n}`,
    eventType: 'login_failed',
    username,
    ip,
    timestamp: minutesAfter(n * 0.5),
  };
}

function download(n, username = 'jdoe', ip = '203.0.113.45') {
  return {
    _id: `dl-${n}`,
    eventType: 'file_download',
    username,
    ip,
    timestamp: minutesAfter(n * 0.2),
  };
}

describe('bruteForceRule', () => {
  it('does not trigger with 5 or fewer failed logins', () => {
    const events = Array.from({ length: 5 }, (_, i) => failedLogin(i));
    const current = failedLogin(5);
    const result = bruteForceRule.evaluateLogic(current, events);
    assert.equal(result, null);
  });

  it('triggers on the 6th failed login for same username', () => {
    const events = Array.from({ length: 6 }, (_, i) => failedLogin(i));
    const current = events[5];
    const result = bruteForceRule.evaluateLogic(current, events);
    assert.ok(result);
    assert.equal(result.title, 'Brute Force Login Attempt');
    assert.equal(result.severity, 'high');
    assert.equal(result.ruleId, 'brute_force_v1');
    assert.equal(result.evidence.metrics.failedCount, 6);
  });

  it('triggers on failed logins from same IP with different usernames', () => {
    const events = Array.from({ length: 6 }, (_, i) =>
      failedLogin(i, `user${i}`, '203.0.113.45')
    );
    const current = events[5];
    const result = bruteForceRule.evaluateLogic(current, events);
    assert.ok(result);
    assert.equal(result.evidence.metrics.trigger, 'ip');
  });
});

describe('suspiciousLoginRule', () => {
  it('triggers after 3 failures followed by success', () => {
    const failures = Array.from({ length: 3 }, (_, i) => failedLogin(i));
    const success = {
      _id: 'success-1',
      eventType: 'login_success',
      username: 'jdoe',
      ip: '203.0.113.45',
      timestamp: minutesAfter(2),
    };
    const result = suspiciousLoginRule.evaluateLogic(success, failures);
    assert.ok(result);
    assert.equal(result.title, 'Possible Account Compromise');
    assert.equal(result.severity, 'critical');
  });

  it('does not trigger with fewer than 3 prior failures', () => {
    const failures = Array.from({ length: 2 }, (_, i) => failedLogin(i));
    const success = {
      _id: 'success-1',
      eventType: 'login_success',
      username: 'jdoe',
      ip: '203.0.113.45',
      timestamp: minutesAfter(2),
    };
    const result = suspiciousLoginRule.evaluateLogic(success, failures);
    assert.equal(result, null);
  });
});

describe('dataExfiltrationRule', () => {
  it('does not trigger with 30 or fewer downloads', () => {
    const events = Array.from({ length: 30 }, (_, i) => download(i));
    const current = download(30);
    const result = dataExfiltrationRule.evaluateLogic(current, events);
    assert.equal(result, null);
  });

  it('triggers on the 31st download within window', () => {
    const events = Array.from({ length: 31 }, (_, i) => download(i));
    const current = events[30];
    const result = dataExfiltrationRule.evaluateLogic(current, events);
    assert.ok(result);
    assert.equal(result.title, 'Possible Data Exfiltration');
    assert.equal(result.severity, 'high');
    assert.equal(result.evidence.metrics.downloadCount, 31);
  });

  it('does not trigger without username', () => {
    const events = Array.from({ length: 35 }, (_, i) => download(i));
    const current = { ...events[34], username: null };
    const result = dataExfiltrationRule.evaluateLogic(current, events);
    assert.equal(result, null);
  });
});
