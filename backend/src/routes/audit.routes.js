import { Router } from 'express';
import { listAudit } from '../controllers/audit.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticate, listAudit);

export default router;
