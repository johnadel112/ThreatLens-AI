import client from './client';

export async function getAuditLogs(params = {}) {
  const { data } = await client.get('/audit', { params });
  return data;
}
