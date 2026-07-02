import { Router } from 'express';
import {
  approvePlaybook,
  createManualAction,
  executePlaybook,
  getAuditLog,
  getPlaybook,
  listPlaybooks,
  listTemplates,
  rejectPlaybook,
  runTemplate,
} from '../controllers/playbooks.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { PERMISSIONS } from '../config/permissions.js';

const router = Router();

router.get(
  '/audit',
  authenticate,
  requirePermission(PERMISSIONS.AUDIT_LOGS_READ),
  getAuditLog
);
router.get('/templates', authenticate, requirePermission(PERMISSIONS.PLAYBOOKS_READ), listTemplates);
router.get('/', authenticate, requirePermission(PERMISSIONS.PLAYBOOKS_READ), listPlaybooks);
router.get('/:actionId', authenticate, requirePermission(PERMISSIONS.PLAYBOOKS_READ), getPlaybook);

router.post(
  '/manual',
  authenticate,
  requirePermission(PERMISSIONS.PLAYBOOKS_REQUEST),
  createManualAction
);

router.post(
  '/run-template',
  authenticate,
  requirePermission(PERMISSIONS.PLAYBOOKS_REQUEST),
  runTemplate
);

router.post(
  '/:actionId/approve',
  authenticate,
  requirePermission(PERMISSIONS.PLAYBOOKS_APPROVE),
  approvePlaybook
);

router.post(
  '/:actionId/reject',
  authenticate,
  requirePermission(PERMISSIONS.PLAYBOOKS_REJECT),
  rejectPlaybook
);

router.post(
  '/:actionId/execute',
  authenticate,
  requirePermission(PERMISSIONS.PLAYBOOKS_EXECUTE),
  executePlaybook
);

export default router;
