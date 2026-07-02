import {
  getUnreadCount,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../services/notifications/notificationService.js';

export async function listUserNotifications(req, res, next) {
  try {
    const result = await listNotifications(req.user._id, {
      read: req.query.read,
      page: parseInt(req.query.page || '1', 10),
      limit: parseInt(req.query.limit || '30', 10),
    });

    res.json({
      notifications: result.notifications.map((n) => n.toPublicJSON()),
      unreadCount: result.unreadCount,
      pagination: result.pagination,
    });
  } catch (err) {
    next(err);
  }
}

export async function getUnreadNotificationCount(req, res, next) {
  try {
    const count = await getUnreadCount(req.user._id);
    res.json({ unreadCount: count });
  } catch (err) {
    next(err);
  }
}

export async function markRead(req, res, next) {
  try {
    const notification = await markNotificationRead(req.params.id, req.user._id);
    res.json({ notification: notification.toPublicJSON() });
  } catch (err) {
    if (err.status === 404) {
      return res.status(404).json({ error: err.message, code: 'NOT_FOUND' });
    }
    next(err);
  }
}

export async function markAllRead(req, res, next) {
  try {
    await markAllNotificationsRead(req.user._id);
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    next(err);
  }
}
