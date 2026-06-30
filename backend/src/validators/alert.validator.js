import { body, param, query } from 'express-validator';
import { ALERT_STATUSES } from '../models/Alert.js';
import { SEVERITIES } from '../config/constants.js';

export const listAlertsValidator = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('severity').optional().isIn(SEVERITIES),
  query('status').optional().isIn(ALERT_STATUSES),
  query('username').optional().trim().isLength({ max: 100 }),
  query('ip').optional().trim().isLength({ max: 45 }),
  query('search').optional().trim().isLength({ max: 200 }),
  query('from').optional().isISO8601(),
  query('to').optional().isISO8601(),
];

export const updateAlertStatusValidator = [
  param('id').isMongoId().withMessage('Invalid alert ID'),
  body('status').isIn(ALERT_STATUSES).withMessage(`Status must be one of: ${ALERT_STATUSES.join(', ')}`),
];
