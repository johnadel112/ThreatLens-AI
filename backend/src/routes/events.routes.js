import { Router } from 'express';
import { createEvent, getEventStats, listEvents } from '../controllers/events.controller.js';
import { authenticate } from '../middleware/auth.js';
import { authenticateIngestion } from '../middleware/apiKey.js';
import { requirePermission } from '../middleware/rbac.js';
import { PERMISSIONS } from '../config/permissions.js';
import { eventIngestionRateLimiter } from '../middleware/rateLimit.js';
import { validate } from '../middleware/validate.js';
import { createEventValidator, listEventsValidator } from '../validators/event.validator.js';

const router = Router();

router.post(
  '/',
  eventIngestionRateLimiter,
  authenticateIngestion,
  createEventValidator,
  validate,
  createEvent
);

router.get('/', authenticate, requirePermission(PERMISSIONS.EVENTS_READ), listEventsValidator, validate, listEvents);
router.get('/stats', authenticate, requirePermission(PERMISSIONS.EVENTS_READ), getEventStats);

export default router;
