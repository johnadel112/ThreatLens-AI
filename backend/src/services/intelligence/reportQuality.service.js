/** Report quality scoring — mirrors ai-service reviewer metrics for backend-only use. */

export function computeReportQualityFromAgents(agentOutputs = [], incident = {}) {
  const byName = Object.fromEntries(agentOutputs.map((a) => [a.agentName, a.output || {}]));
  const investigation = byName.investigation || {};
  const classification = byName.classification || {};
  const report = byName.report || {};
  const reviewer = byName.reviewer || {};

  if (reviewer.reportQuality) {
    return {
      evidenceCompleteness: reviewer.reportQuality.evidenceCompleteness,
      timelineQuality: reviewer.reportQuality.timelineQuality,
      threatClassificationConfidence: reviewer.reportQuality.threatClassificationConfidence,
      mitigationQuality: reviewer.reportQuality.mitigationQuality,
      reportClarity: reviewer.reportQuality.reportClarity,
      overallConfidence: reviewer.reportQuality.overallConfidence,
      missingEvidence: reviewer.reportQuality.missingEvidence || [],
      warnings: reviewer.reportQuality.warnings || [],
    };
  }

  const eventCount = incident.events?.length || investigation.relatedEventIds?.length || 0;
  const alertCount = incident.alerts?.length || investigation.relatedAlertIds?.length || 0;
  const findingsLen = (investigation.keyFindings || []).length;
  const timelineLen = (investigation.timeline || []).length;

  const evidenceCompleteness = Math.min(100, 30 + findingsLen * 8 + Math.min(eventCount, 10) * 3);
  const timelineQuality = Math.min(100, 20 + timelineLen * 6);
  const threatClassificationConfidence = Math.round((classification.confidence || 0.7) * 100);
  const mitigationQuality = Math.min(100, 50 + (byName.mitigation?.actions?.length || 0) * 12);
  const reportClarity = report.executiveSummary ? 85 : 55;
  const overallConfidence = Math.round(
    evidenceCompleteness * 0.3
    + timelineQuality * 0.2
    + threatClassificationConfidence * 0.2
    + mitigationQuality * 0.15
    + reportClarity * 0.15
  );

  return {
    evidenceCompleteness,
    timelineQuality,
    threatClassificationConfidence,
    mitigationQuality,
    reportClarity,
    overallConfidence,
    missingEvidence: investigation.missingEvidence || [],
    warnings: reviewer.warnings || [],
  };
}

export function extractExplainability(agentOutputs = []) {
  const investigation = agentOutputs.find((a) => a.agentName === 'investigation')?.output || {};
  const classification = agentOutputs.find((a) => a.agentName === 'classification')?.output || {};
  const reviewer = agentOutputs.find((a) => a.agentName === 'reviewer')?.output || {};

  const knowledgeSources = [
    ...new Set([
      ...(investigation.knowledgeSources || []),
      ...(classification.knowledgeSources || []),
      ...(reviewer.knowledgeSources || []),
    ]),
  ];

  return {
    reasoningSummary: investigation.reasoningSummary || classification.rationale || '',
    reasoningPoints: investigation.reasoningPoints || [],
    relatedAlertIds: investigation.relatedAlertIds || classification.relatedAlertIds || [],
    relatedEventIds: investigation.relatedEventIds || classification.relatedEventIds || [],
    assumptions: investigation.assumptions || [],
    missingEvidence: [
      ...new Set([
        ...(investigation.missingEvidence || []),
        ...(reviewer.missingEvidence || []),
      ]),
    ],
    knowledgeSources,
  };
}
