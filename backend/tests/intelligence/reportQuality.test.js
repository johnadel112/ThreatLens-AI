import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  computeReportQualityFromAgents,
  extractExplainability,
} from '../../src/services/intelligence/reportQuality.service.js';

describe('Report quality service', () => {
  it('extracts explainability from investigation agent output', () => {
    const agentOutputs = [
      {
        agentName: 'investigation',
        output: {
          reasoningSummary: 'Brute force followed by exfiltration',
          reasoningPoints: ['6 failed logins', 'bulk downloads'],
          relatedAlertIds: ['alert-1'],
          relatedEventIds: ['evt-1', 'evt-2'],
          knowledgeSources: ['mitre-t1110-brute-force'],
        },
      },
    ];

    const result = extractExplainability(agentOutputs);
    assert.equal(result.reasoningSummary, 'Brute force followed by exfiltration');
    assert.equal(result.relatedAlertIds.length, 1);
    assert.ok(result.knowledgeSources.includes('mitre-t1110-brute-force'));
  });

  it('uses reviewer reportQuality when present', () => {
    const agentOutputs = [
      {
        agentName: 'reviewer',
        output: {
          reportQuality: {
            evidenceCompleteness: 85,
            timelineQuality: 90,
            threatClassificationConfidence: 76,
            mitigationQuality: 80,
            reportClarity: 88,
            overallConfidence: 86,
            missingEvidence: [],
            warnings: [],
          },
        },
      },
    ];

    const quality = computeReportQualityFromAgents(agentOutputs, {});
    assert.equal(quality.overallConfidence, 86);
    assert.equal(quality.evidenceCompleteness, 85);
  });
});
