import client from './client';

export async function getIncidents(params = {}) {
  const { data } = await client.get('/incidents', { params });
  return data;
}

export async function getIncident(id) {
  const { data } = await client.get(`/incidents/${id}`);
  return data.incident;
}

export async function updateIncident(id, payload) {
  const { data } = await client.patch(`/incidents/${id}`, payload);
  return data.incident;
}

export async function investigateIncident(id) {
  const { data } = await client.post(`/incidents/${id}/investigate`);
  return data;
}

export async function getAgentOutputs(id) {
  const { data } = await client.get(`/incidents/${id}/agents`);
  return data;
}

export async function generateIncidentReport(id) {
  const { data } = await client.post(`/incidents/${id}/report`);
  return data.report;
}

export async function getIncidentStats() {
  const { data } = await client.get('/incidents/stats');
  return data;
}

export async function addIncidentNote(id, body) {
  const { data } = await client.post(`/incidents/${id}/notes`, { body });
  return data;
}

export async function addIncidentTask(id, payload) {
  const { data } = await client.post(`/incidents/${id}/tasks`, payload);
  return data;
}

export async function updateIncidentTask(id, taskId, payload) {
  const { data } = await client.patch(`/incidents/${id}/tasks/${taskId}`, payload);
  return data;
}
