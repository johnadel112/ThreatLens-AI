import { Router } from 'express';
import { getReport, listReports } from '../controllers/reports.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { PERMISSIONS } from '../config/permissions.js';

const router = Router();

router.get('/', authenticate, requirePermission(PERMISSIONS.REPORTS_READ), listReports);
router.get('/:incidentId', authenticate, requirePermission(PERMISSIONS.REPORTS_READ), getReport);

export default router;
