/** Permission keys — must match backend/src/config/permissions.js */
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

export { ROLES } from './roles';

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

const ROLE_PERMISSIONS = {
  admin: Object.values(PERMISSIONS),
  analyst: ANALYST_PERMISSIONS,
  viewer: VIEWER_PERMISSIONS,
};

function resolveRole(userOrRole) {
  if (!userOrRole) return null;
  return typeof userOrRole === 'string' ? userOrRole : userOrRole.role;
}

export function roleHasPermission(role, permission) {
  if (!role || !permission) return false;
  if (role === 'admin') return true;
  return (ROLE_PERMISSIONS[role] || []).includes(permission);
}

export function can(userOrRole, permission) {
  return roleHasPermission(resolveRole(userOrRole), permission);
}

export function canAny(userOrRole, permissions = []) {
  const role = resolveRole(userOrRole);
  return permissions.some((p) => roleHasPermission(role, p));
}

export function canAll(userOrRole, permissions = []) {
  const role = resolveRole(userOrRole);
  return permissions.every((p) => roleHasPermission(role, p));
}

/** @deprecated Use can(user, PERMISSIONS.CASES_UPDATE) etc. */
export function canWriteRole(role) {
  return role === 'admin' || role === 'analyst';
}

export function isAdminRole(role) {
  return role === 'admin';
}

export function isViewerRole(role) {
  return role === 'viewer';
}
