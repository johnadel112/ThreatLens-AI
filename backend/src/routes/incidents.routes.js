import { Router } from 'express';
import {
  getIncident,
  getIncidentAgentOutputs,
  getIncidentStats,
  generateIncidentReport,
  investigateIncident,
  listIncidents,
  refreshTimeline,
  updateIncident,
} from '../controllers/incidents.controller.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import { ROLES } from '../config/constants.js';
import { validate } from '../middleware/validate.js';
import { listIncidentsValidator, updateIncidentValidator } from '../validators/incident.validator.js';

const router = Router();

router.get('/', authenticate, listIncidentsValidator, validate, listIncidents);
router.get('/stats', authenticate, getIncidentStats);
router.get('/:id/agents', authenticate, getIncidentAgentOutputs);
router.get('/:id', authenticate, getIncident);
router.patch(
  '/:id',
  authenticate,
  authorize(ROLES.ADMIN, ROLES.ANALYST),
  updateIncidentValidator,
  validate,
  updateIncident
);
router.post(
  '/:id/investigate',
  authenticate,
  authorize(ROLES.ADMIN, ROLES.ANALYST),
  investigateIncident
);
router.post(
  '/:id/report',
  authenticate,
  authorize(ROLES.ADMIN, ROLES.ANALYST),
  generateIncidentReport
);
router.post(
  '/:id/refresh-timeline',
  authenticate,
  authorize(ROLES.ADMIN, ROLES.ANALYST),
  refreshTimeline
);

export default router;
