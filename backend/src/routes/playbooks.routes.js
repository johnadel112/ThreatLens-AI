import { Router } from 'express';
import {
  approvePlaybook,
  executePlaybook,
  getAuditLog,
  getPlaybook,
  listPlaybooks,
  rejectPlaybook,
} from '../controllers/playbooks.controller.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import { ROLES } from '../config/constants.js';

const router = Router();

router.get('/audit', authenticate, getAuditLog);
router.get('/', authenticate, listPlaybooks);
router.get('/:actionId', authenticate, getPlaybook);

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
