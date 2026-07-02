import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { deriveCasePriority } from '../../src/services/incident/caseService.js';
import { applyRuleOverrides } from '../../src/services/detection/ruleManager.service.js';
import { bruteForceRule } from '../../src/services/detection/rules/bruteForce.rule.js';

describe('Case management', () => {
  it('derives priority from severity', () => {
    assert.equal(deriveCasePriority('critical'), 'P1');
    assert.equal(deriveCasePriority('high'), 'P2');
    assert.equal(deriveCasePriority('low'), 'P4');
  });
});

describe('Detection rule overrides', () => {
  it('disables rule when override enabled is false', () => {
    const result = applyRuleOverrides(bruteForceRule, { enabled: false });
    assert.equal(result, null);
  });

  it('applies threshold override', () => {
    const result = applyRuleOverrides(bruteForceRule, { enabled: true, threshold: 10 });
    assert.equal(result.threshold, 10);
    assert.equal(result.id, bruteForceRule.id);
  });
});
