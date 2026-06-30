import { createSecurityEvent } from '../events/createSecurityEvent.js';

const SIM_USERS = [
  'jdoe', 'alice.chen', 'bob.martinez', 'emma.wilson', 'carol.nguyen',
  'david.kim', 'svc-backup', 'svc-api', 'admin.root', 'contractor.lee',
  'mike.ops', 'sarah.hr', 'james.dev', 'lisa.finance', 'tom.support',
];

const SIM_IPS = [
  '10.0.1.12', '10.0.1.34', '10.0.2.8', '10.0.2.19', '10.0.3.44',
  '192.0.2.99', '203.0.113.45', '198.51.100.22', '172.16.0.55',
  '10.0.4.71', '10.0.5.18', '203.0.113.88', '198.51.100.91',
];

const SOURCES = ['auth-gateway', 'endpoint-agent', 'api-gateway', 'file-server', 'siem-collector', 'waf-proxy', 'vpn-gateway'];

const DEPARTMENTS = ['Engineering', 'Finance', 'HR', 'Operations', 'IT Security', 'Sales'];
const DEVICES = ['WIN-LAPTOP-042', 'MACBOOK-PRO-19', 'SRV-DB-01', 'IOT-CAM-07', 'LINUX-APP-03'];
const ENDPOINTS = ['/api/v1/users', '/api/v1/files', '/api/v1/auth', '/dashboard', '/admin/config', '/api/v1/reports'];
const COUNTRIES = ['US', 'UK', 'DE', 'SG', 'IN', 'BR', 'JP', 'AU'];
const CITIES = ['New York', 'London', 'Berlin', 'Singapore', 'Mumbai', 'São Paulo', 'Tokyo', 'Sydney'];
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/122.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X) Safari/17.2',
  'curl/8.4.0', 'python-requests/2.31.0', 'ThreatLens-Simulator/1.0',
];
const FILE_NAMES = ['report-Q1.pdf', 'payroll.xlsx', 'credentials.csv', 'backup.zip', 'config.env', 'customer-export.json'];

const SEVERITY_WEIGHTS = [
  { severity: 'info', weight: 45 },
  { severity: 'low', weight: 25 },
  { severity: 'medium', weight: 15 },
  { severity: 'high', weight: 10 },
  { severity: 'critical', weight: 5 },
];

const NORMAL_TYPES = [
  'login_success', 'logout', 'mfa_success', 'api_request', 'file_download',
  'backup_completed', 'backup_started', 'service_started', 'admin_login', 'file_upload',
];

const SUSPICIOUS_TYPES = [
  'login_failed', 'mfa_failed', 'unauthorized_api_access', 'repeated_404',
  'endpoint_probe', 'suspicious_user_agent', 'login_from_new_device',
];

const ATTACK_TYPES = [
  'permission_change', 'role_change', 'bulk_file_download', 'database_export',
  'port_scan', 'malware_alert', 'ransomware_behavior', 'audit_log_cleared',
  'data_exfiltration_attempt', 'command_and_control_beacon',
];

/** @type {Map<string, { timer: NodeJS.Timeout, chain: object[], lastActivity: number, eventCount: number, chainOffset: number }>} */
const activeGenerators = new Map();

const INACTIVITY_MS = 30 * 60 * 1000;
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

let globalTimeOffsetMs = 0;

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickSeverity() {
  const total = SEVERITY_WEIGHTS.reduce((s, w) => s + w.weight, 0);
  let roll = Math.random() * total;
  for (const entry of SEVERITY_WEIGHTS) {
    roll -= entry.weight;
    if (roll <= 0) return entry.severity;
  }
  return 'info';
}

function randomDelayMs() {
  return 2000 + Math.floor(Math.random() * 6000);
}

/** Stagger timestamps within a chain so events don't share identical times */
function chainTimestamp(offsetSeconds = 0) {
  globalTimeOffsetMs += 800 + Math.floor(Math.random() * 3500);
  const ms = Date.now() - globalTimeOffsetMs + offsetSeconds * 1000;
  return new Date(ms).toISOString();
}

function liveTimestamp() {
  const jitter = Math.floor(Math.random() * 4000);
  return new Date(Date.now() - jitter).toISOString();
}

function randomOctet() {
  return Math.floor(Math.random() * 254) + 1;
}

function randomPublicIp() {
  return `${randomOctet()}.${randomOctet()}.${randomOctet()}.${randomOctet()}`;
}

function buildMetadata(eventType, overrides = {}) {
  const country = pick(COUNTRIES);
  const base = {
    sessionId: `sess-${Math.random().toString(36).slice(2, 10)}`,
    department: pick(DEPARTMENTS),
    device: pick(DEVICES),
    userAgent: pick(USER_AGENTS),
    country,
    city: pick(CITIES),
    requestMethod: pick(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']),
    statusCode: pick([200, 201, 401, 403, 404, 429, 500]),
    ...overrides,
  };

  if (eventType.includes('file') || eventType.includes('download') || eventType.includes('upload')) {
    base.fileName = overrides.fileName || pick(FILE_NAMES);
    base.fileSizeKb = overrides.fileSizeKb || Math.floor(Math.random() * 5000) + 12;
  }
  if (eventType.includes('api') || eventType === 'endpoint_probe') {
    base.endpoint = pick(ENDPOINTS);
    base.responseMs = Math.floor(Math.random() * 800) + 20;
  }
  if (eventType.includes('login') || eventType.includes('mfa')) {
    base.authMethod = pick(['password', 'sso', 'mfa_totp', 'api_key']);
  }

  return base;
}

function baseEvent(overrides = {}) {
  const username = overrides.username || pick(SIM_USERS);
  const ip = overrides.ip || (Math.random() < 0.3 ? randomPublicIp() : pick(SIM_IPS));
  const eventType = overrides.eventType || pick(NORMAL_TYPES);
  const severity = overrides.severity || pickSeverity();
  const timestamp = overrides.timestamp || liveTimestamp();

  return {
    source: overrides.source || pick(SOURCES),
    eventType,
    username,
    ip,
    severity,
    timestamp,
    metadata: buildMetadata(eventType, overrides.metadata || {}),
  };
}

function buildChainEvents(specs) {
  return specs.map((spec, i) =>
    baseEvent({
      ...spec,
      timestamp: chainTimestamp(i * (2 + Math.random() * 4)),
    })
  );
}

function buildChain(type, username, ip) {
  const u = username || pick(SIM_USERS);
  const addr = ip || (Math.random() < 0.5 ? randomPublicIp() : pick(SIM_IPS));
  globalTimeOffsetMs = 0;

  const chains = {
    brute_force: () =>
      buildChainEvents(
        Array.from({ length: 7 }, (_, i) => ({
          eventType: 'login_failed',
          username: u,
          ip: addr,
          severity: i >= 5 ? 'high' : 'medium',
          metadata: { attempt: i + 1 },
        }))
      ),
    account_compromise: () =>
      buildChainEvents([
        ...Array.from({ length: 4 }, () => ({ eventType: 'login_failed', username: u, ip: addr, severity: 'medium' })),
        { eventType: 'login_success', username: u, ip: addr, severity: 'high' },
        { eventType: 'login_from_new_country', username: u, ip: addr, severity: 'high', metadata: { country: pick(COUNTRIES) } },
        { eventType: 'mfa_failed', username: u, ip: addr, severity: 'high' },
        { eventType: 'password_change', username: u, ip: addr, severity: 'critical' },
      ]),
    data_exfil: () =>
      buildChainEvents([
        { eventType: 'login_success', username: u, ip: addr, severity: 'info' },
        ...Array.from({ length: 32 }, (_, i) => ({
          eventType: 'file_download',
          username: u,
          ip: addr,
          severity: i > 28 ? 'high' : 'low',
          metadata: { fileName: `export-${i + 1}.csv`, fileSizeKb: 200 + i * 15 },
        })),
        { eventType: 'bulk_file_download', username: u, ip: addr, severity: 'critical' },
        { eventType: 'large_data_transfer', username: u, ip: addr, severity: 'critical' },
      ]),
    full_attack: () =>
      buildChainEvents([
        ...Array.from({ length: 5 }, () => ({ eventType: 'login_failed', username: u, ip: addr, severity: 'medium' })),
        { eventType: 'login_success', username: u, ip: addr, severity: 'high' },
        { eventType: 'login_from_new_country', username: u, ip: addr, severity: 'high' },
        { eventType: 'permission_change', username: u, ip: addr, severity: 'critical', metadata: { change: 'elevated' } },
        { eventType: 'sensitive_file_access', username: u, ip: addr, severity: 'high' },
        { eventType: 'bulk_file_download', username: u, ip: addr, severity: 'critical' },
        { eventType: 'audit_log_cleared', username: u, ip: addr, severity: 'critical' },
      ]),
    port_scan: () =>
      buildChainEvents(
        Array.from({ length: 12 }, (_, i) => ({
          eventType: i % 2 === 0 ? 'port_scan' : 'endpoint_probe',
          username: 'system',
          ip: addr,
          severity: 'high',
          metadata: { port: 8000 + i, endpoint: pick(ENDPOINTS) },
        }))
      ),
    priv_esc: () =>
      buildChainEvents([
        ...Array.from({ length: 3 }, () => ({ eventType: 'login_failed', username: u, ip: addr, severity: 'medium' })),
        { eventType: 'login_success', username: u, ip: addr, severity: 'high' },
        { eventType: 'role_change', username: u, ip: addr, severity: 'critical', metadata: { change: 'admin' } },
      ]),
    malware: () =>
      buildChainEvents([
        { eventType: 'suspicious_process', username: u, ip: addr, severity: 'high' },
        { eventType: 'malware_alert', username: u, ip: addr, severity: 'critical' },
        { eventType: 'command_and_control_beacon', username: u, ip: addr, severity: 'critical' },
      ]),
    ransomware: () =>
      buildChainEvents([
        { eventType: 'suspicious_process', username: u, ip: addr, severity: 'high' },
        { eventType: 'ransomware_behavior', username: u, ip: addr, severity: 'critical' },
        { eventType: 'backup_failed', username: u, ip: addr, severity: 'high' },
        { eventType: 'service_stopped', username: u, ip: addr, severity: 'medium' },
      ]),
    suspicious_admin: () => {
      const adminIp = pick(SIM_IPS);
      const d = new Date();
      d.setHours(2, 30, 0, 0);
      return buildChainEvents([
        { eventType: 'admin_login', username: 'admin.root', ip: adminIp, severity: 'medium', timestamp: d.toISOString() },
        { eventType: 'security_policy_change', username: 'admin.root', ip: adminIp, severity: 'high' },
        { eventType: 'api_key_created', username: 'admin.root', ip: adminIp, severity: 'medium' },
      ]);
    },
    api_abuse: () =>
      buildChainEvents([
        ...Array.from({ length: 15 }, () => ({ eventType: 'api_request', username: u, ip: addr, severity: 'low' })),
        { eventType: 'api_rate_limit_exceeded', username: u, ip: addr, severity: 'high' },
        { eventType: 'unauthorized_api_access', username: u, ip: addr, severity: 'high' },
      ]),
    failed_login_noise: () =>
      buildChainEvents(
        Array.from({ length: 2 + Math.floor(Math.random() * 3) }, () => ({
          eventType: 'login_failed',
          username: u,
          ip: addr,
          severity: 'low',
        }))
      ),
  };
  return chains[type]?.() || [];
}

function maybeQueueChain(state) {
  const roll = Math.random();
  const username = pick(SIM_USERS);
  const ip = Math.random() < 0.4 ? randomPublicIp() : pick(SIM_IPS);

  if (roll < 0.02) state.chain.push(...buildChain('full_attack', username, ip));
  else if (roll < 0.05) state.chain.push(...buildChain('data_exfil', username, ip));
  else if (roll < 0.08) state.chain.push(...buildChain('account_compromise', username, ip));
  else if (roll < 0.12) state.chain.push(...buildChain('brute_force', username, ip));
  else if (roll < 0.15) state.chain.push(...buildChain('port_scan', username, ip));
  else if (roll < 0.18) state.chain.push(...buildChain('priv_esc', username, ip));
  else if (roll < 0.21) state.chain.push(...buildChain('malware', username, ip));
  else if (roll < 0.23) state.chain.push(...buildChain('ransomware', username, ip));
  else if (roll < 0.26) state.chain.push(...buildChain('suspicious_admin', username, ip));
  else if (roll < 0.30) state.chain.push(...buildChain('api_abuse', username, ip));
  else if (roll < 0.38) state.chain.push(...buildChain('failed_login_noise', username, ip));
}

function nextRandomEvent(state) {
  if (state.chain.length > 0) {
    return state.chain.shift();
  }

  maybeQueueChain(state);

  if (state.chain.length > 0) {
    return state.chain.shift();
  }

  const roll = Math.random();
  let eventType;
  if (roll < 0.7) eventType = pick(NORMAL_TYPES);
  else if (roll < 0.9) eventType = pick(SUSPICIOUS_TYPES);
  else eventType = pick(ATTACK_TYPES);

  if (eventType === 'admin_login') {
    const d = new Date();
    if (d.getHours() >= 6 && d.getHours() < 22) {
      return baseEvent({ eventType, severity: 'info' });
    }
    return baseEvent({ eventType, severity: 'medium' });
  }

  if (eventType === 'login_failed') {
    const u = pick(SIM_USERS);
    const ip = pick(SIM_IPS);
    const count = 1 + Math.floor(Math.random() * 2);
    if (count > 1) {
      state.chain.push(
        ...buildChainEvents(
          Array.from({ length: count - 1 }, () => ({
            eventType: 'login_failed',
            username: u,
            ip,
            severity: 'low',
          }))
        )
      );
    }
    return baseEvent({ eventType: 'login_failed', username: u, ip, severity: 'low' });
  }

  return baseEvent({ eventType });
}

async function tick(userId) {
  const state = activeGenerators.get(userId.toString());
  if (!state) return;

  state.lastActivity = Date.now();

  try {
    const eventData = nextRandomEvent(state);
    await createSecurityEvent(eventData, userId);
    state.eventCount += 1;
  } catch (err) {
    console.error(`[live-events] tick failed for ${userId}:`, err.message);
  }

  if (activeGenerators.has(userId.toString())) {
    state.timer = setTimeout(() => tick(userId), randomDelayMs());
  }
}

export function startLiveEventsForUser(userId) {
  const key = userId.toString();
  if (activeGenerators.has(key)) {
    const state = activeGenerators.get(key);
    state.lastActivity = Date.now();
    return { active: true, eventCount: state.eventCount, alreadyRunning: true };
  }

  const state = {
    timer: null,
    chain: [],
    lastActivity: Date.now(),
    eventCount: 0,
  };
  activeGenerators.set(key, state);
  state.timer = setTimeout(() => tick(userId), randomDelayMs());

  console.log(`[live-events] started for user ${key}`);
  return { active: true, eventCount: 0, alreadyRunning: false };
}

export function stopLiveEventsForUser(userId) {
  const key = userId.toString();
  const state = activeGenerators.get(key);
  if (!state) {
    return { active: false, eventCount: 0 };
  }

  if (state.timer) clearTimeout(state.timer);
  activeGenerators.delete(key);
  console.log(`[live-events] stopped for user ${key}`);
  return { active: false, eventCount: state.eventCount };
}

export function getLiveEventStatus(userId) {
  const state = activeGenerators.get(userId.toString());
  if (!state) {
    return { active: false, eventCount: 0, lastActivity: null };
  }
  return {
    active: true,
    eventCount: state.eventCount,
    lastActivity: new Date(state.lastActivity).toISOString(),
    queuedChainEvents: state.chain.length,
  };
}

export function cleanupInactiveGenerators() {
  const now = Date.now();
  for (const [userId, state] of activeGenerators.entries()) {
    if (now - state.lastActivity > INACTIVITY_MS) {
      if (state.timer) clearTimeout(state.timer);
      activeGenerators.delete(userId);
      console.log(`[live-events] cleaned up inactive user ${userId}`);
    }
  }
}

export function startLiveEventCleanupJob() {
  setInterval(cleanupInactiveGenerators, CLEANUP_INTERVAL_MS);
}
