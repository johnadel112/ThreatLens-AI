import { Router } from 'express';
import { listAudit } from '../controllers/audit.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { PERMISSIONS } from '../config/permissions.js';

const router = Router();

router.get('/', authenticate, requirePermission(PERMISSIONS.AUDIT_LOGS_READ), listAudit);

export default router;
