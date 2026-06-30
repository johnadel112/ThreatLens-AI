import client from './client';

export async function getAlerts(params = {}) {
  const { data } = await client.get('/alerts', { params });
  return data;
}

export async function getAlert(id) {
  const { data } = await client.get(`/alerts/${id}`);
  return data.alert;
}

export async function updateAlertStatus(id, status) {
  const { data } = await client.patch(`/alerts/${id}/status`, { status });
  return data.alert;
}

export async function getAlertStats() {
  const { data } = await client.get('/alerts/stats');
  return data;
}
