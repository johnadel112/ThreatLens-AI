import { body, param, query } from 'express-validator';
import { INCIDENT_STATUSES, SEVERITIES } from '../config/constants.js';

export const listIncidentsValidator = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('severity').optional().isIn(SEVERITIES),
  query('status').optional().isIn(INCIDENT_STATUSES),
  query('username').optional().trim().isLength({ max: 100 }),
  query('ip').optional().trim().isLength({ max: 45 }),
  query('search').optional().trim().isLength({ max: 200 }),
  query('from').optional().isISO8601(),
  query('to').optional().isISO8601(),
];

export const updateIncidentValidator = [
  param('id').isMongoId().withMessage('Invalid incident ID'),
  body('status').optional().isIn(INCIDENT_STATUSES),
  body('assignedAnalystId').optional({ values: 'null' }),
];
