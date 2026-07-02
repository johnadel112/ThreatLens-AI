import { Router } from 'express';
import {
  addIncidentNote,
  addIncidentTask,
  getIncident,
  getIncidentAgentOutputs,
  getIncidentStats,
  generateIncidentReport,
  investigateIncident,
  listIncidents,
  refreshTimeline,
  updateIncident,
  updateIncidentTask,
} from '../controllers/incidents.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { PERMISSIONS } from '../config/permissions.js';
import { validate } from '../middleware/validate.js';
import { listIncidentsValidator, updateIncidentValidator, addNoteValidator, addTaskValidator, updateTaskValidator } from '../validators/incident.validator.js';

const router = Router();

router.get(
  '/',
  authenticate,
  requirePermission(PERMISSIONS.CASES_READ),
  listIncidentsValidator,
  validate,
  listIncidents
);
router.get('/stats', authenticate, requirePermission(PERMISSIONS.CASES_READ), getIncidentStats);
router.get('/:id/agents', authenticate, requirePermission(PERMISSIONS.CASES_READ), getIncidentAgentOutputs);
router.get('/:id', authenticate, requirePermission(PERMISSIONS.CASES_READ), getIncident);
router.patch(
  '/:id',
  authenticate,
  requirePermission(PERMISSIONS.CASES_UPDATE),
  updateIncidentValidator,
  validate,
  updateIncident
);
router.post(
  '/:id/investigate',
  authenticate,
  requirePermission(PERMISSIONS.AI_INVESTIGATE),
  investigateIncident
);
router.post(
  '/:id/report',
  authenticate,
  requirePermission(PERMISSIONS.REPORTS_GENERATE),
  generateIncidentReport
);
router.post(
  '/:id/refresh-timeline',
  authenticate,
  requirePermission(PERMISSIONS.CASES_UPDATE),
  refreshTimeline
);
router.post(
  '/:id/notes',
  authenticate,
  requirePermission(PERMISSIONS.CASES_UPDATE),
  addNoteValidator,
  validate,
  addIncidentNote
);
router.post(
  '/:id/tasks',
  authenticate,
  requirePermission(PERMISSIONS.CASES_UPDATE),
  addTaskValidator,
  validate,
  addIncidentTask
);
router.patch(
  '/:id/tasks/:taskId',
  authenticate,
  requirePermission(PERMISSIONS.CASES_UPDATE),
  updateTaskValidator,
  validate,
  updateIncidentTask
);

export default router;
