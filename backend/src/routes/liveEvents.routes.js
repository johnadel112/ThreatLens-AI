import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  liveEventsStatus,
  startLiveEvents,
  stopLiveEvents,
} from '../controllers/liveEvents.controller.js';

const router = Router();

router.post('/start', authenticate, startLiveEvents);
router.post('/stop', authenticate, stopLiveEvents);
router.get('/status', authenticate, liveEventsStatus);

export default router;
