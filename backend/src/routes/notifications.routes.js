import { Router } from 'express';
import {
  getUnreadNotificationCount,
  listUserNotifications,
  markAllRead,
  markRead,
} from '../controllers/notifications.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticate, listUserNotifications);
router.get('/unread-count', authenticate, getUnreadNotificationCount);
router.post('/read-all', authenticate, markAllRead);
router.post('/:id/read', authenticate, markRead);

export default router;
