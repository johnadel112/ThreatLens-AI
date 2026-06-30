import { Router } from 'express';
import { getReport, listReports } from '../controllers/reports.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticate, listReports);
router.get('/:incidentId', authenticate, getReport);

export default router;
