import { body, param } from 'express-validator';
import { SEVERITIES } from '../config/constants.js';

export const updateRuleValidator = [
  param('ruleId').trim().notEmpty(),
  body('enabled').optional().isBoolean(),
  body('severity').optional().isIn(SEVERITIES),
  body('threshold').optional().isInt({ min: 1, max: 1000 }),
  body('windowMinutes').optional().isInt({ min: 1, max: 1440 }),
  body('description').optional().trim().isLength({ max: 500 }),
];
