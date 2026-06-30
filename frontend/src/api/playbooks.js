import client from './client';

export async function getPlaybookActions(incidentId) {
  const { data } = await client.get('/playbooks', { params: { incidentId } });
  return data;
}

export async function approvePlaybookAction(actionId) {
  const { data } = await client.post(`/playbooks/${actionId}/approve`);
  return data;
}

export async function rejectPlaybookAction(actionId, reason = '') {
  const { data } = await client.post(`/playbooks/${actionId}/reject`, { reason });
  return data;
}

export async function executePlaybookAction(actionId) {
  const { data } = await client.post(`/playbooks/${actionId}/execute`);
  return data;
}

export async function getAuditLog(incidentId) {
  const { data } = await client.get('/playbooks/audit', { params: { incidentId } });
  return data;
}
