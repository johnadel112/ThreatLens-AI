import { body, query } from 'express-validator';
import { EVENT_TYPES, SEVERITIES } from '../config/constants.js';

export const createEventValidator = [
  body('source').trim().notEmpty().withMessage('Source is required').isLength({ max: 100 }),
  body('eventType')
    .trim()
    .notEmpty()
    .withMessage('Event type is required')
    .isIn(EVENT_TYPES)
    .withMessage(`Event type must be one of: ${EVENT_TYPES.join(', ')}`),
  body('username').optional({ values: 'null' }).trim().isLength({ max: 100 }),
  body('ip').optional({ values: 'null' }).trim().isLength({ max: 45 }),
  body('severity').optional().isIn(SEVERITIES).withMessage('Invalid severity level'),
  body('timestamp').isISO8601().withMessage('Timestamp must be a valid ISO 8601 date'),
  body('metadata').optional().isObject().withMessage('Metadata must be an object'),
];

export const listEventsValidator = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('eventType').optional().isIn(EVENT_TYPES),
  query('severity').optional().isIn(SEVERITIES),
  query('username').optional().trim().isLength({ max: 100 }),
  query('ip').optional().trim().isLength({ max: 45 }),
  query('source').optional().trim().isLength({ max: 100 }),
  query('search').optional().trim().isLength({ max: 200 }),
  query('from').optional().isISO8601().withMessage('from must be ISO 8601'),
  query('to').optional().isISO8601().withMessage('to must be ISO 8601'),
];
