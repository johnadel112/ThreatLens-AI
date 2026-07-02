export const ROLES = {
  ADMIN: 'admin',
  ANALYST: 'analyst',
  VIEWER: 'viewer',
};

export const ROLE_LIST = Object.values(ROLES);

export const PUBLIC_REGISTER_ROLES = [ROLES.VIEWER, ROLES.ANALYST, ROLES.ADMIN];

import { ACCEPTED_EVENT_TYPES, EVENT_TYPES } from './eventTypes.js';

export { ACCEPTED_EVENT_TYPES, EVENT_TYPES };

export const SEVERITIES = ['info', 'low', 'medium', 'high', 'critical'];
export const SEVERITY = {
  INFO: 'info',
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
};

export const INCIDENT_STATUSES = ['new', 'investigating', 'contained', 'resolved', 'closed'];

export const INVESTIGATION_STATUSES = [
  'not_started',
  'queued',
  'running',
  'completed',
  'failed',
];

export const SEVERITY_RANK = {
  info: 0,
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

export function maxSeverity(severities) {
  return severities.reduce(
    (max, s) => (SEVERITY_RANK[s] > SEVERITY_RANK[max] ? s : max),
    'low'
  );
}

export const PLAYBOOK_ACTION_TYPES = [
  'lock_account',
  'block_ip',
  'force_password_reset',
  'isolate_host',
  'notify_user',
  'escalate',
];

export const PLAYBOOK_STATUSES = ['pending', 'approved', 'rejected', 'executed', 'failed'];

export const PLAYBOOK_PRIORITIES = ['low', 'medium', 'high'];

export const CASE_PRIORITIES = ['P1', 'P2', 'P3', 'P4'];

export const CASE_TASK_STATUSES = ['open', 'in_progress', 'done', 'cancelled'];

export const NOTIFICATION_TYPES = [
  'incident_created',
  'incident_assigned',
  'playbook_pending',
  'playbook_executed',
  'rule_updated',
  'case_note_added',
];

export const ENTITY_TYPES = [
  'playbook_action',
  'incident',
  'detection_rule',
  'playbook_template',
  'notification',
];

export const AUDIT_ACTIONS = [
  'playbook_created',
  'playbook_approved',
  'playbook_rejected',
  'playbook_executed',
  'playbook_template_run',
  'incident_created',
  'incident_status_changed',
  'incident_assigned',
  'incident_priority_changed',
  'case_note_added',
  'case_task_added',
  'case_task_updated',
  'rule_enabled',
  'rule_disabled',
  'rule_updated',
];
