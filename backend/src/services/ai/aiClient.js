import { config } from '../../config/env.js';

export async function requestIncidentSummary(context) {
  const url = `${config.aiServiceUrl}/investigate/summary`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(context),
    signal: AbortSignal.timeout(60000),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`AI service error (${response.status}): ${body}`);
  }

  return response.json();
}

export async function requestInvestigationWorkflow(context) {
  const url = `${config.aiServiceUrl}/investigate/workflow`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(context),
    signal: AbortSignal.timeout(120000),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`AI service error (${response.status}): ${body}`);
  }

  return response.json();
}

export async function checkAiServiceHealth() {
  try {
    const response = await fetch(`${config.aiServiceUrl}/health`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return { ok: false };
    return response.json();
  } catch {
    return { ok: false };
  }
}
