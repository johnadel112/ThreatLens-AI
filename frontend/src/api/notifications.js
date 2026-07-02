import client from './client';

export async function getNotifications(params = {}) {
  const { data } = await client.get('/notifications', { params });
  return data;
}

export async function getUnreadCount() {
  const { data } = await client.get('/notifications/unread-count');
  return data;
}

export async function markNotificationRead(id) {
  const { data } = await client.post(`/notifications/${id}/read`);
  return data;
}

export async function markAllNotificationsRead() {
  const { data } = await client.post('/notifications/read-all');
  return data;
}
