export const ROLES = {
  ADMIN: 'admin',
  ANALYST: 'analyst',
  VIEWER: 'viewer',
};

export const ROLE_LIST = Object.values(ROLES);

export const PUBLIC_REGISTER_ROLES = [ROLES.ADMIN, ROLES.ANALYST];

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

export const AUDIT_ACTIONS = [
  'playbook_created',
  'playbook_approved',
  'playbook_rejected',
  'playbook_executed',
];
