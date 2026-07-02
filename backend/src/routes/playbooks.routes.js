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
import { authorize } from '../middleware/rbac.js';
import { ROLES } from '../config/constants.js';

const router = Router();

router.get('/audit', authenticate, getAuditLog);
router.get('/templates', authenticate, listTemplates);
router.get('/', authenticate, listPlaybooks);
router.get('/:actionId', authenticate, getPlaybook);

router.post(
  '/manual',
  authenticate,
  authorize(ROLES.ADMIN, ROLES.ANALYST),
  createManualAction
);

router.post(
  '/run-template',
  authenticate,
  authorize(ROLES.ADMIN, ROLES.ANALYST),
  runTemplate
);

router.post(
  '/:actionId/approve',
  authenticate,
  authorize(ROLES.ADMIN, ROLES.ANALYST),
  approvePlaybook
);

router.post(
  '/:actionId/reject',
  authenticate,
  authorize(ROLES.ADMIN, ROLES.ANALYST),
  rejectPlaybook
);

router.post(
  '/:actionId/execute',
  authenticate,
  authorize(ROLES.ADMIN, ROLES.ANALYST),
  executePlaybook
);

export default router;
