import { ROLES } from './roles';

export function canWriteRole(role) {
  return role === ROLES.ADMIN || role === ROLES.ANALYST;
}

export function isAdminRole(role) {
  return role === ROLES.ADMIN;
}
