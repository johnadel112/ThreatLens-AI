import { Router } from 'express';
import { refreshIncidentReport } from '../controllers/ai.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { PERMISSIONS } from '../config/permissions.js';

const router = Router();

router.post(
  '/report/:incidentId',
  authenticate,
  requirePermission(PERMISSIONS.REPORTS_GENERATE),
  refreshIncidentReport
);

export default router;
