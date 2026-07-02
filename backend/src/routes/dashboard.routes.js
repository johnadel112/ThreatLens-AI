import { Router } from 'express';
import { getDashboardStats } from '../controllers/dashboard.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { PERMISSIONS } from '../config/permissions.js';

const router = Router();

router.get('/stats', authenticate, requirePermission(PERMISSIONS.DASHBOARD_READ), getDashboardStats);

export default router;
