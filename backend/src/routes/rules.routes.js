import { Router } from 'express';
import { listRules, syncRules, updateRule } from '../controllers/rules.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { PERMISSIONS } from '../config/permissions.js';
import { validate } from '../middleware/validate.js';
import { updateRuleValidator } from '../validators/rules.validator.js';

const router = Router();

router.get('/', authenticate, requirePermission(PERMISSIONS.DETECTION_RULES_READ), listRules);
router.post('/sync', authenticate, requirePermission(PERMISSIONS.DETECTION_RULES_MANAGE), syncRules);
router.patch(
  '/:ruleId',
  authenticate,
  requirePermission(PERMISSIONS.DETECTION_RULES_MANAGE),
  updateRuleValidator,
  validate,
  updateRule
);

export default router;
