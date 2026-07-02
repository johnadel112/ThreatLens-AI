import { roleHasAnyPermission, roleHasPermission, permissionDeniedMessage } from '../config/permissions.js';
import { recordAudit } from '../services/playbook/auditService.js';

export function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        code: 'FORBIDDEN',
        requiredRoles: allowedRoles,
      });
    }

    next();
  };
}

export function requirePermission(...permissions) {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
    }

    const allowed = roleHasAnyPermission(req.user.role, permissions);

    if (!allowed) {
      const permission = permissions[0];

      try {
        await recordAudit({
          action: 'forbidden_action_attempt',
          entityType: 'security',
          user: req.user,
          details: {
            permission: permissions.join(','),
            path: req.originalUrl,
            method: req.method,
            role: req.user.role,
          },
        });
      } catch {
        // Never block the forbidden response if audit logging fails
      }

      const message = permissionDeniedMessage(permission);
      return res.status(403).json({
        error: message,
        message,
        code: 'FORBIDDEN',
        requiredPermissions: permissions,
      });
    }

    next();
  };
}

export function requireAllPermissions(...permissions) {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
    }

    const missing = permissions.filter((p) => !roleHasPermission(req.user.role, p));

    if (missing.length > 0) {
      try {
        await recordAudit({
          action: 'forbidden_action_attempt',
          entityType: 'security',
          user: req.user,
          details: {
            permission: missing.join(','),
            path: req.originalUrl,
            method: req.method,
            role: req.user.role,
          },
        });
      } catch {
        // ignore
      }

      const message = permissionDeniedMessage(missing[0]);
      return res.status(403).json({
        error: message,
        message,
        code: 'FORBIDDEN',
        requiredPermissions: permissions,
      });
    }

    next();
  };
}
