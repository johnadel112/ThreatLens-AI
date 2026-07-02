import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  PERMISSIONS,
  roleHasPermission,
  roleHasAnyPermission,
} from '../../src/config/permissions.js';
import { ROLES } from '../../src/config/constants.js';

describe('RBAC permissions', () => {
  it('admin has all permissions', () => {
    assert.equal(roleHasPermission(ROLES.ADMIN, PERMISSIONS.PLAYBOOKS_APPROVE), true);
    assert.equal(roleHasPermission(ROLES.ADMIN, PERMISSIONS.AUDIT_LOGS_READ), true);
    assert.equal(roleHasPermission(ROLES.ADMIN, PERMISSIONS.DETECTION_RULES_MANAGE), true);
  });

  it('analyst can investigate and update alerts but not approve playbooks', () => {
    assert.equal(roleHasPermission(ROLES.ANALYST, PERMISSIONS.AI_INVESTIGATE), true);
    assert.equal(roleHasPermission(ROLES.ANALYST, PERMISSIONS.ALERTS_UPDATE), true);
    assert.equal(roleHasPermission(ROLES.ANALYST, PERMISSIONS.PLAYBOOKS_REQUEST), true);
    assert.equal(roleHasPermission(ROLES.ANALYST, PERMISSIONS.PLAYBOOKS_APPROVE), false);
    assert.equal(roleHasPermission(ROLES.ANALYST, PERMISSIONS.PLAYBOOKS_EXECUTE), false);
    assert.equal(roleHasPermission(ROLES.ANALYST, PERMISSIONS.PLAYBOOKS_REJECT), false);
    assert.equal(roleHasPermission(ROLES.ANALYST, PERMISSIONS.DETECTION_RULES_MANAGE), false);
    assert.equal(roleHasPermission(ROLES.ANALYST, PERMISSIONS.AUDIT_LOGS_READ), false);
  });

  it('viewer is read-only', () => {
    assert.equal(roleHasPermission(ROLES.VIEWER, PERMISSIONS.EVENTS_READ), true);
    assert.equal(roleHasPermission(ROLES.VIEWER, PERMISSIONS.ALERTS_UPDATE), false);
    assert.equal(roleHasPermission(ROLES.VIEWER, PERMISSIONS.AI_INVESTIGATE), false);
    assert.equal(roleHasPermission(ROLES.VIEWER, PERMISSIONS.PLAYBOOKS_APPROVE), false);
  });

  it('roleHasAnyPermission works for route guards', () => {
    assert.equal(
      roleHasAnyPermission(ROLES.ANALYST, [PERMISSIONS.PLAYBOOKS_APPROVE, PERMISSIONS.PLAYBOOKS_READ]),
      true
    );
    assert.equal(
      roleHasAnyPermission(ROLES.VIEWER, [PERMISSIONS.PLAYBOOKS_APPROVE, PERMISSIONS.PLAYBOOKS_EXECUTE]),
      false
    );
  });
});
