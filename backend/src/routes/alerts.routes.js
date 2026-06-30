import { Router } from 'express';
import {
  getAlert,
  getAlertStats,
  listAlerts,
  updateAlertStatus,
} from '../controllers/alerts.controller.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import { ROLES } from '../config/constants.js';
import { validate } from '../middleware/validate.js';
import { listAlertsValidator, updateAlertStatusValidator } from '../validators/alert.validator.js';

const router = Router();

router.get('/', authenticate, listAlertsValidator, validate, listAlerts);
router.get('/stats', authenticate, getAlertStats);
router.get('/:id', authenticate, getAlert);
router.patch(
  '/:id/status',
  authenticate,
  authorize(ROLES.ADMIN, ROLES.ANALYST),
  updateAlertStatusValidator,
  validate,
  updateAlertStatus
);

export default router;
