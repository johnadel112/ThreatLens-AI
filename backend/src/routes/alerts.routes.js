import { Router } from 'express';
import {
  getAlert,
  getAlertStats,
  listAlerts,
  updateAlertStatus,
} from '../controllers/alerts.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { PERMISSIONS } from '../config/permissions.js';
import { validate } from '../middleware/validate.js';
import { listAlertsValidator, updateAlertStatusValidator } from '../validators/alert.validator.js';

const router = Router();

router.get('/', authenticate, requirePermission(PERMISSIONS.ALERTS_READ), listAlertsValidator, validate, listAlerts);
router.get('/stats', authenticate, requirePermission(PERMISSIONS.ALERTS_READ), getAlertStats);
router.get('/:id', authenticate, requirePermission(PERMISSIONS.ALERTS_READ), getAlert);
router.patch(
  '/:id/status',
  authenticate,
  requirePermission(PERMISSIONS.ALERTS_UPDATE),
  updateAlertStatusValidator,
  validate,
  updateAlertStatus
);

export default router;
