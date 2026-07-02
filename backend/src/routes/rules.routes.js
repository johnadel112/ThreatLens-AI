import { Router } from 'express';
import { listRules, syncRules, updateRule } from '../controllers/rules.controller.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import { ROLES } from '../config/constants.js';
import { validate } from '../middleware/validate.js';
import { updateRuleValidator } from '../validators/rules.validator.js';

const router = Router();

router.get('/', authenticate, listRules);
router.post('/sync', authenticate, authorize(ROLES.ADMIN), syncRules);
router.patch(
  '/:ruleId',
  authenticate,
  authorize(ROLES.ADMIN, ROLES.ANALYST),
  updateRuleValidator,
  validate,
  updateRule
);

export default router;
