import dotenv from 'dotenv';

dotenv.config();

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000/api';
const API_KEY = process.env.SIMULATOR_API_KEY || 'change-me-simulator-key';

const sampleEvents = [
  {
    source: 'auth-service',
    eventType: 'login_failed',
    username: 'jdoe',
    ip: '203.0.113.45',
    severity: 'medium',
    timestamp: new Date().toISOString(),
    metadata: { reason: 'invalid_password', userAgent: 'Mozilla/5.0' },
  },
  {
    source: 'auth-service',
    eventType: 'login_success',
    username: 'jdoe',
    ip: '203.0.113.45',
    severity: 'low',
    timestamp: new Date().toISOString(),
    metadata: { method: 'password', mfa: false },
  },
  {
    source: 'file-gateway',
    eventType: 'file_download',
    username: 'jdoe',
    ip: '203.0.113.45',
    severity: 'low',
    timestamp: new Date().toISOString(),
    metadata: { fileName: 'report-Q2.pdf', sizeBytes: 245000 },
  },
  {
    source: 'network-monitor',
    eventType: 'network_access',
    username: 'system',
    ip: '198.51.100.22',
    severity: 'medium',
    timestamp: new Date().toISOString(),
    metadata: { port: 443, endpoint: '/api/v1/users', protocol: 'HTTPS' },
  },
];

async function sendEvent(event) {
  const res = await fetch(`${BACKEND_URL}/events`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY,
    },
    body: JSON.stringify(event),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`${res.status}: ${body}`);
  }

  return res.json();
}

async function main() {
  console.log('Sending test events to', BACKEND_URL);

  for (const event of sampleEvents) {
    const result = await sendEvent(event);
    console.log(`[ok] ${event.eventType} → ${result.event.id}`);
  }

  console.log('[done] Sent', sampleEvents.length, 'test events');
}

main().catch((err) => {
  console.error('[error]', err.message);
  process.exit(1);
});
