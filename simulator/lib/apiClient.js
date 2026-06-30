import { config } from '../config.js';

export async function sendEvent(event) {
  if (!config.apiKey) {
    throw new Error('SIMULATOR_API_KEY is not set in simulator/.env');
  }

  const res = await fetch(`${config.backendUrl}/events`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': config.apiKey,
    },
    body: JSON.stringify(event),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Event ingestion failed (${res.status}): ${body}`);
  }

  return res.json();
}
