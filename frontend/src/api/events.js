import client from './client';

export async function getEvents(params = {}) {
  const { data } = await client.get('/events', { params });
  return data;
}

export async function getEventStats() {
  const { data } = await client.get('/events/stats');
  return data;
}

export async function createEvent(event) {
  const { data } = await client.post('/events', event);
  return data;
}
