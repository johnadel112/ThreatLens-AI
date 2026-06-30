import { createSecurityEvent } from '../events/createSecurityEvent.js';

const SIM_USERS = [
  'jdoe', 'alice.chen', 'bob.martinez', 'emma.wilson', 'carol.nguyen',
  'david.kim', 'svc-backup', 'svc-api', 'admin.root', 'contractor.lee',
];

const SIM_IPS = [
  '10.0.1.12', '10.0.1.34', '10.0.2.8', '10.0.2.19', '10.0.3.44',
  '192.0.2.99', '203.0.113.45', '198.51.100.22', '172.16.0.55',
];

const SOURCES = ['auth-gateway', 'endpoint-agent', 'api-gateway', 'file-server', 'siem-collector'];

const SEVERITY_WEIGHTS = [
  { severity: 'info', weight: 45 },
  { severity: 'low', weight: 25 },
  { severity: 'medium', weight: 15 },
  { severity: 'high', weight: 10 },
  { severity: 'critical', weight: 5 },
];

const NORMAL_TYPES = [
  'login_success', 'logout', 'mfa_success', 'api_request', 'file_download',
  'backup_completed', 'backup_started', 'service_started', 'admin_login',
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

/** @type {Map<string, { timer: NodeJS.Timeout, chain: object[], lastActivity: number, eventCount: number }>} */
const activeGenerators = new Map();

const INACTIVITY_MS = 30 * 60 * 1000;
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

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

function baseEvent(overrides = {}) {
  const username = overrides.username || pick(SIM_USERS);
  const ip = overrides.ip || pick(SIM_IPS);
  return {
    source: overrides.source || pick(SOURCES),
    eventType: overrides.eventType || pick(NORMAL_TYPES),
    username,
    ip,
    severity: overrides.severity || pickSeverity(),
    timestamp: new Date().toISOString(),
    metadata: overrides.metadata || { sessionId: `sess-${Math.random().toString(36).slice(2, 9)}` },
  };
}

function buildChain(type, username, ip) {
  const ts = () => new Date().toISOString();
  const chains = {
    brute_force: () => {
      const events = [];
      for (let i = 0; i < 7; i += 1) {
        events.push(baseEvent({
          eventType: 'login_failed',
          username,
          ip,
          severity: 'medium',
          timestamp: ts(),
          metadata: { attempt: i + 1 },
        }));
      }
      return events;
    },
    account_compromise: () => [
      ...Array.from({ length: 4 }, () => baseEvent({ eventType: 'login_failed', username, ip, severity: 'medium', timestamp: ts() })),
      baseEvent({ eventType: 'login_success', username, ip, severity: 'high', timestamp: ts() }),
      baseEvent({ eventType: 'login_from_new_country', username, ip, severity: 'high', timestamp: ts() }),
      baseEvent({ eventType: 'password_change', username, ip, severity: 'critical', timestamp: ts() }),
    ],
    data_exfil: () => [
      baseEvent({ eventType: 'login_success', username, ip, severity: 'info', timestamp: ts() }),
      ...Array.from({ length: 32 }, (_, i) => baseEvent({
        eventType: 'file_download',
        username,
        ip,
        severity: i > 28 ? 'high' : 'low',
        timestamp: ts(),
        metadata: { file: `report-${i}.pdf` },
      })),
      baseEvent({ eventType: 'bulk_file_download', username, ip, severity: 'critical', timestamp: ts() }),
    ],
    full_attack: () => [
      ...Array.from({ length: 5 }, () => baseEvent({ eventType: 'login_failed', username, ip, severity: 'medium', timestamp: ts() })),
      baseEvent({ eventType: 'login_success', username, ip, severity: 'high', timestamp: ts() }),
      baseEvent({ eventType: 'login_from_new_country', username, ip, severity: 'high', timestamp: ts() }),
      baseEvent({ eventType: 'permission_change', username, ip, severity: 'critical', timestamp: ts(), metadata: { change: 'elevated' } }),
      baseEvent({ eventType: 'sensitive_file_access', username, ip, severity: 'high', timestamp: ts() }),
      baseEvent({ eventType: 'bulk_file_download', username, ip, severity: 'critical', timestamp: ts() }),
      baseEvent({ eventType: 'audit_log_cleared', username, ip, severity: 'critical', timestamp: ts() }),
    ],
    port_scan: () => Array.from({ length: 12 }, (_, i) => baseEvent({
      eventType: i % 2 === 0 ? 'port_scan' : 'endpoint_probe',
      username: 'system',
      ip,
      severity: 'high',
      timestamp: ts(),
      metadata: { port: 8000 + i },
    })),
    priv_esc: () => [
      ...Array.from({ length: 3 }, () => baseEvent({ eventType: 'login_failed', username, ip, severity: 'medium', timestamp: ts() })),
      baseEvent({ eventType: 'login_success', username, ip, severity: 'high', timestamp: ts() }),
      baseEvent({ eventType: 'permission_change', username, ip, severity: 'critical', timestamp: ts(), metadata: { change: 'admin' } }),
    ],
    malware: () => [
      baseEvent({ eventType: 'suspicious_process', username, ip, severity: 'high', timestamp: ts() }),
      baseEvent({ eventType: 'malware_alert', username, ip, severity: 'critical', timestamp: ts() }),
      baseEvent({ eventType: 'command_and_control_beacon', username, ip, severity: 'critical', timestamp: ts() }),
    ],
    ransomware: () => [
      baseEvent({ eventType: 'suspicious_process', username, ip, severity: 'high', timestamp: ts() }),
      baseEvent({ eventType: 'ransomware_behavior', username, ip, severity: 'critical', timestamp: ts() }),
      baseEvent({ eventType: 'backup_failed', username, ip, severity: 'high', timestamp: ts() }),
      baseEvent({ eventType: 'service_stopped', username, ip, severity: 'medium', timestamp: ts() }),
    ],
    suspicious_admin: () => {
      const d = new Date();
      d.setHours(2, 30, 0, 0);
      return [
        baseEvent({ eventType: 'admin_login', username: 'admin.root', ip, severity: 'medium', timestamp: d.toISOString() }),
        baseEvent({ eventType: 'security_policy_change', username: 'admin.root', ip, severity: 'high', timestamp: ts() }),
        baseEvent({ eventType: 'api_key_created', username: 'admin.root', ip, severity: 'medium', timestamp: ts() }),
      ];
    },
    api_abuse: () => [
      ...Array.from({ length: 15 }, () => baseEvent({ eventType: 'api_request', username, ip, severity: 'low', timestamp: ts() })),
      baseEvent({ eventType: 'api_rate_limit_exceeded', username, ip, severity: 'high', timestamp: ts() }),
      baseEvent({ eventType: 'unauthorized_api_access', username, ip, severity: 'high', timestamp: ts() }),
    ],
  };
  return chains[type]?.() || [];
}

function maybeQueueChain(state) {
  const roll = Math.random();
  const username = pick(SIM_USERS);
  const ip = pick(SIM_IPS);

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
    const count = 1 + Math.floor(Math.random() * 3);
    state.chain.push(
      ...Array.from({ length: count - 1 }, () => baseEvent({ eventType: 'login_failed', severity: 'low' }))
    );
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
