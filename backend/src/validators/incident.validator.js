import { body, param, query } from 'express-validator';
import { CASE_PRIORITIES, INCIDENT_STATUSES, SEVERITIES } from '../config/constants.js';

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
  body('priority').optional().isIn(CASE_PRIORITIES),
  body('tags').optional().isArray({ max: 20 }),
  body('assignedAnalystId').optional({ values: 'null' }),
];

export const addNoteValidator = [
  param('id').isMongoId(),
  body('body').trim().isLength({ min: 1, max: 2000 }),
];

export const addTaskValidator = [
  param('id').isMongoId(),
  body('title').trim().isLength({ min: 1, max: 200 }),
  body('dueAt').optional().isISO8601(),
];

export const updateTaskValidator = [
  param('id').isMongoId(),
  param('taskId').isMongoId(),
  body('title').optional().trim().isLength({ min: 1, max: 200 }),
  body('status').optional().isIn(['open', 'in_progress', 'done', 'cancelled']),
  body('dueAt').optional({ values: 'null' }).isISO8601(),
];
