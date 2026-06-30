export const ROLES = {
  ADMIN: 'admin',
  ANALYST: 'analyst',
  VIEWER: 'viewer',
};

export const ROLE_LIST = Object.values(ROLES);

export const PUBLIC_REGISTER_ROLES = [ROLES.VIEWER, ROLES.ANALYST];

export const SEVERITIES = ['low', 'medium', 'high', 'critical'];
export const SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
};

export const EVENT_TYPES = [
  'login_failed',
  'login_success',
  'file_download',
  'network_access',
  'permission_change',
  'logout',
  'file_upload',
  'admin_action',
];

export const INCIDENT_STATUSES = ['new', 'investigating', 'contained', 'resolved', 'closed'];

export const INVESTIGATION_STATUSES = [
  'not_started',
  'queued',
  'running',
  'completed',
  'failed',
];

export const SEVERITY_RANK = {
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
