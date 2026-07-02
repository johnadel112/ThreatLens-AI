import Notification from '../../models/Notification.js';

export async function createNotification({
  userId,
  type,
  title,
  message,
  link,
  metadata = {},
}) {
  return Notification.create({
    userId,
    type,
    title,
    message,
    link,
    metadata,
  });
}

export async function notifyUser(userId, payload) {
  if (!userId) return null;
  return createNotification({ userId, ...payload });
}

export async function listNotifications(userId, { read, page = 1, limit = 30 } = {}) {
  const filter = { userId };
  if (read !== undefined) filter.read = read === true || read === 'true';

  const skip = (page - 1) * limit;
  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Notification.countDocuments(filter),
    Notification.countDocuments({ userId, read: false }),
  ]);

  return {
    notifications,
    unreadCount,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit) || 1,
    },
  };
}

export async function markNotificationRead(notificationId, userId) {
  const notification = await Notification.findOne({ _id: notificationId, userId });
  if (!notification) {
    const err = new Error('Notification not found');
    err.status = 404;
    throw err;
  }
  notification.read = true;
  await notification.save();
  return notification;
}

export async function markAllNotificationsRead(userId) {
  await Notification.updateMany({ userId, read: false }, { $set: { read: true } });
  return { success: true };
}

export async function getUnreadCount(userId) {
  return Notification.countDocuments({ userId, read: false });
}
