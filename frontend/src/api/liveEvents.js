import client from './client';

export async function startLiveEvents() {
  const { data } = await client.post('/live-events/start');
  return data;
}

export async function stopLiveEvents() {
  const { data } = await client.post('/live-events/stop');
  return data;
}

export async function getLiveEventsStatus() {
  const { data } = await client.get('/live-events/status');
  return data;
}
