import { Router } from 'express';
import { refreshIncidentReport } from '../controllers/ai.controller.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import { ROLES } from '../config/constants.js';

const router = Router();

router.post(
  '/report/:incidentId',
  authenticate,
  authorize(ROLES.ADMIN, ROLES.ANALYST),
  refreshIncidentReport
);

export default router;
