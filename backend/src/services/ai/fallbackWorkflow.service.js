/**
 * Evidence-based investigation workflow when the Python AI service is unavailable.
 * Mirrors ai-service fallback agents so investigations succeed in production without a separate AI deploy.
 */

import { mapRuleToMitre } from '../intelligence/mitreMapping.service.js';
import { extractExplainability, computeReportQualityFromAgents } from '../intelligence/reportQuality.service.js';

function inferAttackType(alerts) {
  const ruleIds = new Set(alerts.map((a) => a.rule_id || a.ruleId));
  if (ruleIds.has('suspicious_login_v1') && ruleIds.has('data_exfil_v1')) {
    return ['Account Compromise with Data Exfiltration', 'Credential Access / Exfiltration'];
  }
  if (ruleIds.has('suspicious_login_v1')) return ['Suspected Account Compromise', 'Credential Access'];
  if (ruleIds.has('brute_force_v1')) return ['Brute Force Attack', 'Credential Access'];
  if (ruleIds.has('data_exfil_v1')) return ['Data Exfiltration', 'Exfiltration'];
  if (ruleIds.has('port_scan_v1')) return ['Network Reconnaissance', 'Discovery'];
  return ['Suspicious Multi-Stage Activity', 'Unknown'];
}

function countEventTypes(events) {
  const counts = {};
  for (const e of events) {
    const t = e.event_type || e.eventType;
    counts[t] = (counts[t] || 0) + 1;
  }
  return counts;
}

function runTriage(context) {
  const priorityMap = { critical: 'P1', high: 'P2', medium: 'P3', low: 'P4' };
  const urgency = [];
  if (['critical', 'high'].includes(context.severity)) urgency.push('Immediate analyst attention required.');
  if (context.alerts?.some((a) => (a.rule_id || a.ruleId) === 'data_exfil_v1')) {
    urgency.push('Potential data exfiltration detected.');
  }
  if (context.alerts?.some((a) => (a.rule_id || a.ruleId) === 'suspicious_login_v1')) {
    urgency.push('Possible account compromise in progress.');
  }
  if (context.correlation_score >= 70) {
    urgency.push(`High correlation score (${context.correlation_score}) indicates multi-stage attack.`);
  }

  return {
    assessedSeverity: context.severity,
    priority: priorityMap[context.severity] || 'P3',
    urgencyExplanation: urgency.join(' ') || 'Standard investigation queue.',
    confidence: 0.8,
    knowledgeSources: ['soc-report-template'],
  };
}

function runInvestigation(context) {
  const counts = countEventTypes(context.events || []);
  const findings = [];
  if (counts.login_failed) findings.push(`${counts.login_failed} failed authentication events`);
  if (counts.login_success) findings.push('Successful login after failed attempts');
  if (counts.file_download) findings.push(`${counts.file_download} file download events`);
  if (counts.permission_change) findings.push('Permission or role change detected');

  for (const alert of context.alerts || []) {
    findings.push(`Alert [${alert.rule_id || alert.ruleId}]: ${alert.title}`);
  }

  const relatedAlertIds = (context.alerts || []).map((a) => a.alert_id || a.alertId).filter(Boolean);
  const relatedEventIds = (context.events || []).map((e) => e.event_id || e.eventId).filter(Boolean);

  const reasoningPoints = [];
  if (counts.login_failed >= 3) {
    reasoningPoints.push(`${counts.login_failed} failed login attempts indicate credential guessing`);
  }
  if (counts.login_success && counts.login_failed) {
    reasoningPoints.push('Successful login after failures suggests possible account takeover');
  }
  if (counts.file_download >= 5) {
    reasoningPoints.push(`${counts.file_download} downloads may indicate data exfiltration`);
  }
  if (context.correlation_narrative) reasoningPoints.push(context.correlation_narrative);

  const timeline = (context.timeline || []).map((t) => ({
    timestamp: t.timestamp,
    source: t.source,
    title: t.title,
    description: t.description,
  }));

  return {
    timeline,
    evidenceSummary: findings.join('; ') || 'Limited event evidence available.',
    keyFindings: findings,
    confidence: 0.78,
    evidenceUsed: findings,
    relatedAlertIds,
    relatedEventIds: relatedEventIds.slice(0, 25),
    reasoningSummary: reasoningPoints.join('. ') || `Analysis based on ${relatedAlertIds.length} alerts and ${relatedEventIds.length} events.`,
    reasoningPoints,
    assumptions: relatedEventIds.length ? [] : ['Limited event telemetry — conclusions weighted toward alerts'],
    missingEvidence: relatedEventIds.length ? [] : ['No event IDs available for deep forensic review'],
    knowledgeSources: ['detection-brute-force-rule'],
  };
}

function runClassification(context, investigation) {
  const [attackType, category] = inferAttackType(context.alerts || []);
  const mitre = context.alerts?.[0]
    ? mapRuleToMitre(context.alerts[0].rule_id || context.alerts[0].ruleId)
    : null;

  return {
    attackType,
    category: context.mitre_tactics?.[0] || category,
    mitreTactic: mitre?.tactic || category,
    mitreTechnique: mitre?.technique,
    techniqueId: mitre?.techniqueId,
    confidence: 0.76,
    rationale: investigation.reasoningSummary || investigation.evidenceSummary,
    evidenceUsed: investigation.evidenceUsed,
    relatedAlertIds: investigation.relatedAlertIds,
    relatedEventIds: investigation.relatedEventIds,
    knowledgeSources: mitre ? [`mitre-${(mitre.techniqueId || 'general').toLowerCase()}`] : [],
  };
}

function runMitigation(context, classification) {
  const actions = [
    {
      actionType: 'lock_account',
      description: `Lock account ${context.username || 'unknown'} pending verification`,
      justification: `Associated with ${classification.attackType}`,
      priority: 'high',
      knowledgeSource: 'playbook-account-compromise',
    },
    {
      actionType: 'block_ip',
      description: `Block or isolate IP ${context.ip || 'unknown'}`,
      justification: 'Source IP linked to suspicious events',
      priority: 'high',
      knowledgeSource: 'playbook-brute-force',
    },
    {
      actionType: 'force_password_reset',
      description: 'Force credential reset and enable MFA',
      justification: 'Credential compromise indicators present',
      priority: 'medium',
    },
  ];
  return {
    actions,
    confidence: 0.77,
    knowledgeSources: ['playbook-brute-force', 'playbook-account-compromise'],
    basedOnEvidence: classification.relatedAlertIds || [],
  };
}

function runReport(context, triage, investigation, classification, mitigation) {
  const executive = (
    `${context.title} (${context.severity}) affecting ${context.username || 'unknown user'} `
    + `from ${context.ip || 'unknown IP'}. Classification: ${classification.attackType}.`
  );

  const markdown = `# SOC Investigation Report

## Executive Summary
${executive}

## Explainable AI Analysis
${(investigation.reasoningPoints || []).map((p) => `- ${p}`).join('\n')}

## Threat Classification
- **Attack Type:** ${classification.attackType}
- **MITRE Tactic:** ${classification.mitreTactic}

## Mitigation Recommendations
${mitigation.actions.map((a) => `- **${a.actionType}**: ${a.description}`).join('\n')}

---
*ThreatLens AI — evidence-based fallback (AI service offline)*
`;

  return {
    executiveSummary: executive,
    technicalDetails: investigation.evidenceSummary,
    timeline: investigation.timeline,
    recommendations: mitigation.actions,
    markdown,
    confidence: 0.8,
    explainability: {
      reasoningSummary: investigation.reasoningSummary,
      relatedAlertIds: investigation.relatedAlertIds,
      relatedEventIds: investigation.relatedEventIds,
    },
  };
}

function runReviewer(triage, investigation, classification, report, context) {
  const eventCount = context.events?.length || 0;
  const alertCount = context.alerts?.length || 0;
  const findingsLen = (investigation.keyFindings || []).length;
  const timelineLen = (investigation.timeline || []).length;

  const evidenceCompleteness = Math.min(100, 30 + findingsLen * 8 + Math.min(eventCount, 10) * 3 + Math.min(alertCount, 5) * 5);
  const timelineQuality = Math.min(100, 20 + timelineLen * 6 + (timelineLen >= 3 ? 20 : 0));
  const threatClassificationConfidence = Math.round((classification.confidence || 0.76) * 100);
  const mitigationQuality = Math.min(100, 50 + (report.recommendations?.length || 0) * 12);
  const reportClarity = report.executiveSummary ? 85 : 55;

  const warnings = [];
  const missing = [...(investigation.missingEvidence || [])];
  if (evidenceCompleteness < 60) warnings.push('Evidence completeness is below recommended threshold.');

  const overallConfidence = Math.round(
    evidenceCompleteness * 0.3
    + timelineQuality * 0.2
    + threatClassificationConfidence * 0.2
    + mitigationQuality * 0.15
    + reportClarity * 0.15
  );

  return {
    consistent: warnings.length === 0,
    warnings,
    missingEvidence: missing,
    confidence: overallConfidence / 100,
    reportQuality: {
      evidenceCompleteness,
      timelineQuality,
      threatClassificationConfidence,
      mitigationQuality,
      reportClarity,
      overallConfidence,
      missingEvidence: missing,
      warnings,
    },
    knowledgeSources: ['soc-report-template'],
  };
}

/**
 * @returns Workflow response compatible with ai-service WorkflowResponse
 */
export function runFallbackInvestigationWorkflow(context) {
  const triage = runTriage(context);
  const investigation = runInvestigation(context);
  const classification = runClassification(context, investigation);
  const mitigation = runMitigation(context, classification);
  const report = runReport(context, triage, investigation, classification, mitigation);
  const reviewer = runReviewer(triage, investigation, classification, report, context);

  const agents = [
    { agent_name: 'triage', status: 'completed', output: triage, confidence: triage.confidence },
    { agent_name: 'investigation', status: 'completed', output: investigation, confidence: investigation.confidence },
    { agent_name: 'classification', status: 'completed', output: classification, confidence: classification.confidence },
    { agent_name: 'mitigation', status: 'completed', output: mitigation, confidence: mitigation.confidence },
    { agent_name: 'report', status: 'completed', output: report, confidence: report.confidence },
    { agent_name: 'reviewer', status: 'completed', output: reviewer, confidence: reviewer.confidence },
  ];

  const agentOutputsForExtract = agents.map((a) => ({
    agentName: a.agent_name,
    output: a.output,
  }));

  return {
    incident_id: context.incident_id,
    agents,
    source: 'fallback',
    summary: report.executiveSummary,
    markdown: report.markdown,
    threat_classification: {
      attackType: classification.attackType,
      category: classification.category,
      mitreTactic: classification.mitreTactic,
      mitreTechnique: classification.mitreTechnique,
      techniqueId: classification.techniqueId,
      confidence: classification.confidence,
    },
    recommendations: mitigation.actions,
    report_quality: reviewer.reportQuality,
    knowledge_sources: reviewer.knowledgeSources,
    _explainability: extractExplainability(agentOutputsForExtract),
    _reportQuality: computeReportQualityFromAgents(agentOutputsForExtract, context),
  };
}
