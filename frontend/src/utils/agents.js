export const WORKFLOW_AGENTS = [
  'triage',
  'investigation',
  'classification',
  'mitigation',
  'report',
  'reviewer',
];

export const AGENT_LABELS = {
  triage: 'Triage Agent',
  investigation: 'Investigation Agent',
  classification: 'Threat Classification Agent',
  mitigation: 'Mitigation Agent',
  report: 'Report Agent',
  reviewer: 'Reviewer Agent',
  summary: 'Summary Agent',
};

export const AGENT_DESCRIPTIONS = {
  triage: 'Assesses severity, priority, and urgency',
  investigation: 'Builds timeline and evidence summary',
  classification: 'Determines attack type and category',
  mitigation: 'Recommends safe response actions',
  report: 'Generates professional SOC report',
  reviewer: 'Checks consistency and missing evidence',
  summary: 'Legacy single-agent summary',
};
