import client from './client';

export async function getDetectionRules() {
  const { data } = await client.get('/rules');
  return data;
}

export async function updateDetectionRule(ruleId, payload) {
  const { data } = await client.patch(`/rules/${ruleId}`, payload);
  return data;
}

export async function syncDetectionRules() {
  const { data } = await client.post('/rules/sync');
  return data;
}
