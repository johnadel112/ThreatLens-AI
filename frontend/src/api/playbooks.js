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

export async function getPlaybookTemplates() {
  const { data } = await client.get('/playbooks/templates');
  return data;
}

export async function runPlaybookTemplate(incidentId, templateId) {
  const { data } = await client.post('/playbooks/run-template', { incidentId, templateId });
  return data;
}

export async function createManualPlaybookAction(incidentId, payload) {
  const { data } = await client.post('/playbooks/manual', { incidentId, ...payload });
  return data;
}

export async function getPlaybookQueue(status = 'pending') {
  const { data } = await client.get('/playbooks', { params: { status } });
  return data;
}
