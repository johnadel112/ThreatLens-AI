import { ROLES } from './constants.js';

/** Central permission keys — keep in sync with frontend/src/utils/permissions.js */
export const PERMISSIONS = {
  DASHBOARD_READ: 'dashboard:read',
  EVENTS_READ: 'events:read',
  EVENTS_DELETE: 'events:delete',
  ALERTS_READ: 'alerts:read',
  ALERTS_UPDATE: 'alerts:update',
  ALERTS_DELETE: 'alerts:delete',
  CASES_READ: 'cases:read',
  CASES_UPDATE: 'cases:update',
  CASES_ASSIGN: 'cases:assign',
  CASES_DELETE: 'cases:delete',
  AI_INVESTIGATE: 'ai:investigate',
  REPORTS_READ: 'reports:read',
  REPORTS_GENERATE: 'reports:generate',
  REPORTS_DOWNLOAD: 'reports:download',
  REPORTS_DELETE: 'reports:delete',
  PLAYBOOKS_READ: 'playbooks:read',
  PLAYBOOKS_REQUEST: 'playbooks:request',
  PLAYBOOKS_APPROVE: 'playbooks:approve',
  PLAYBOOKS_EXECUTE: 'playbooks:execute',
  PLAYBOOKS_REJECT: 'playbooks:reject',
  DETECTION_RULES_READ: 'detectionRules:read',
  DETECTION_RULES_MANAGE: 'detectionRules:manage',
  AUDIT_LOGS_READ: 'auditLogs:read',
  USERS_MANAGE: 'users:manage',
  SETTINGS_MANAGE: 'settings:manage',
};

const ANALYST_PERMISSIONS = [
  PERMISSIONS.DASHBOARD_READ,
  PERMISSIONS.EVENTS_READ,
  PERMISSIONS.ALERTS_READ,
  PERMISSIONS.ALERTS_UPDATE,
  PERMISSIONS.CASES_READ,
  PERMISSIONS.CASES_UPDATE,
  PERMISSIONS.CASES_ASSIGN,
  PERMISSIONS.AI_INVESTIGATE,
  PERMISSIONS.REPORTS_READ,
  PERMISSIONS.REPORTS_GENERATE,
  PERMISSIONS.REPORTS_DOWNLOAD,
  PERMISSIONS.PLAYBOOKS_READ,
  PERMISSIONS.PLAYBOOKS_REQUEST,
  PERMISSIONS.DETECTION_RULES_READ,
];

const VIEWER_PERMISSIONS = [
  PERMISSIONS.DASHBOARD_READ,
  PERMISSIONS.EVENTS_READ,
  PERMISSIONS.ALERTS_READ,
  PERMISSIONS.CASES_READ,
  PERMISSIONS.REPORTS_READ,
  PERMISSIONS.REPORTS_DOWNLOAD,
  PERMISSIONS.PLAYBOOKS_READ,
  PERMISSIONS.DETECTION_RULES_READ,
];

export const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: Object.values(PERMISSIONS),
  [ROLES.ANALYST]: ANALYST_PERMISSIONS,
  [ROLES.VIEWER]: VIEWER_PERMISSIONS,
};

export function roleHasPermission(role, permission) {
  if (!role || !permission) return false;
  if (role === ROLES.ADMIN) return true;
  return (ROLE_PERMISSIONS[role] || []).includes(permission);
}

export function roleHasAnyPermission(role, permissions = []) {
  return permissions.some((p) => roleHasPermission(role, p));
}

export const PERMISSION_MESSAGES = {
  [PERMISSIONS.PLAYBOOKS_APPROVE]: 'approve playbook actions',
  [PERMISSIONS.PLAYBOOKS_EXECUTE]: 'execute playbook actions',
  [PERMISSIONS.PLAYBOOKS_REJECT]: 'reject playbook actions',
  [PERMISSIONS.DETECTION_RULES_MANAGE]: 'manage detection rules',
  [PERMISSIONS.AUDIT_LOGS_READ]: 'view audit logs',
  [PERMISSIONS.USERS_MANAGE]: 'manage users',
  [PERMISSIONS.SETTINGS_MANAGE]: 'manage settings',
};

export function permissionDeniedMessage(permission) {
  const action = PERMISSION_MESSAGES[permission] || `perform ${permission}`;
  return `Forbidden: you do not have permission to ${action}.`;
}
