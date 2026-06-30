import { pick, randomInt } from '../rng.js';
import { SCENARIO_EXPECTATIONS } from '../dataset/index.js';
import {
  generateNormalLogin,
  generateFailedLogin,
  generateFileDownload,
  generateLogout,
  generateMfaSuccess,
  generateAdminLogin,
  generateApiRequest,
  generatePortScanEvent,
  generateMalwareEvent,
  generatePermissionChange,
  generateBackupCompleted,
  generateAttackChain,
  generateBulkDownload,
  generateDatabaseExport,
  generateRansomwareEvent,
  generateRateLimitEvent,
  generateSensitiveFileAccess,
  generateNewCountryLogin,
  generateUser,
} from '../generators/events.js';
import { IPS } from '../dataset/index.js';

function withMeta(scenario, events) {
  return { scenario, events, expectations: SCENARIO_EXPECTATIONS[scenario] || {} };
}

/** Scenario 1: Clean normal business day */
export function scenarioNormal(base, count = 40) {
  const events = [];
  for (let i = 0; i < count; i++) {
    const user = generateUser();
    const generators = [
      () => generateNormalLogin(base, i * 45, user),
      () => generateMfaSuccess(base, i * 45 + 5, user.username),
      () => generateFileDownload(base, i * 45 + 10, { username: user.username }),
      () => generateApiRequest(base, i * 45 + 15),
      () => generateLogout(base, i * 45 + 30, user),
      () => generateBackupCompleted(base, i * 45 + 35),
      () => generateAdminLogin(base, i * 45 + 40, { offHours: false }),
    ];
    events.push(pick(generators)());
  }
  return withMeta('normal', events.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)));
}

/** Scenario 2: Brute force */
export function scenarioBruteForce(base) {
  const events = [];
  const username = 'jdoe';
  const ip = IPS.attacker;
  for (let i = 0; i < 7; i++) {
    events.push(generateFailedLogin(base, i * 20, { username, ip, attempt: i + 1 }));
  }
  return withMeta('bruteForce', events);
}

/** Scenario 3: Account compromise */
export function scenarioAccountCompromise(base) {
  const events = [];
  const username = 'jdoe';
  const ip = IPS.attacker;
  for (let i = 0; i < 5; i++) {
    events.push(generateFailedLogin(base, i * 18, { username, ip, attempt: i + 1 }));
  }
  const loginEvent = generateNormalLogin(base, 120, { username, role: 'finance', department: 'finance' });
  loginEvent.ip = ip;
  loginEvent.severity = 'critical';
  loginEvent.metadata = { ...loginEvent.metadata, mfaUsed: false, country: 'RU', riskScore: 88 };
  events.push(loginEvent);
  events.push(generateNewCountryLogin(base, 130, { username, ip }));
  return withMeta('accountCompromise', events);
}

/** Scenario 4: Data exfiltration */
export function scenarioDataExfiltration(base) {
  const events = [];
  const username = 'jdoe';
  const ip = IPS.attacker;
  events.push(generateNormalLogin(base, 0, { username }));
  events[0].ip = ip;
  for (let i = 0; i < 35; i++) {
    events.push(generateFileDownload(base, 30 + i * 8, { username, ip }));
  }
  events.push(generateBulkDownload(base, 320, { username, ip }));
  events.push(generateDatabaseExport(base, 330, { username, ip }));
  return withMeta('dataExfiltration', events);
}

/** Scenario 5: Full attack chain */
export function scenarioFullAttackChain(base) {
  return withMeta('fullAttackChain', generateAttackChain(base));
}

/** Scenario 6: Suspicious admin */
export function scenarioSuspiciousAdmin(base) {
  const events = [
    generateAdminLogin(base, 0, { offHours: true }),
    generatePermissionChange(base, 60, { username: 'admin', ip: IPS.external[3] }),
    {
      source: 'admin-console',
      eventType: 'security_policy_change',
      username: 'admin',
      ip: IPS.external[3],
      severity: 'high',
      timestamp: new Date(base.getTime() + 120000).toISOString(),
      metadata: { action: 'weaken_mfa_policy', country: 'CN', riskScore: 85 },
    },
    {
      source: 'iam-service',
      eventType: 'api_key_created',
      username: 'admin',
      ip: IPS.external[3],
      severity: 'high',
      timestamp: new Date(base.getTime() + 180000).toISOString(),
      metadata: { keyName: 'emergency-access', country: 'CN', riskScore: 80 },
    },
  ];
  return withMeta('suspiciousAdmin', events);
}

/** Scenario 7: Port scan / recon */
export function scenarioPortScan(base) {
  const events = [];
  const ip = IPS.scanner;
  for (let i = 0; i < 15; i++) {
    events.push(generatePortScanEvent(base, i * 5, {
      ip,
      port: 20 + i * 100,
      endpoint: `/api/v1/port-${i}`,
    }));
  }
  return withMeta('portScan', events);
}

/** Scenario 8: Privilege escalation (needs prior alert in real run — paired with brute force preamble) */
export function scenarioPrivilegeEscalation(base) {
  const chain = scenarioBruteForce(base).events;
  chain.push({
    ...generateNormalLogin(base, 200, { username: 'jdoe' }),
    ip: IPS.attacker,
  });
  chain.push(generatePermissionChange(base, 220, { username: 'jdoe', ip: IPS.attacker }));
  chain.push({
    source: 'iam-service',
    eventType: 'privilege_escalation',
    username: 'jdoe',
    ip: IPS.attacker,
    severity: 'critical',
    timestamp: new Date(base.getTime() + 240000).toISOString(),
    metadata: { previousValue: 'user', newValue: 'superadmin', riskScore: 98 },
  });
  return withMeta('privilegeEscalation', chain);
}

/** Scenario 9: Malware */
export function scenarioMalware(base) {
  const events = [
    generateMalwareEvent(base, 0, { eventType: 'malware_alert' }),
    generateMalwareEvent(base, 30, { eventType: 'suspicious_process' }),
    generateMalwareEvent(base, 60, { eventType: 'suspicious_script_execution' }),
    generateMalwareEvent(base, 90, { eventType: 'command_and_control_beacon' }),
    {
      source: 'endpoint-agent',
      eventType: 'antivirus_quarantine',
      username: 'emma.wilson',
      ip: '10.0.2.19',
      severity: 'high',
      timestamp: new Date(base.getTime() + 120000).toISOString(),
      metadata: { processName: 'suspicious.bin', action: 'quarantined' },
    },
  ];
  return withMeta('malware', events);
}

/** Scenario 10: Ransomware */
export function scenarioRansomware(base) {
  const events = [
    generateMalwareEvent(base, 0, { eventType: 'suspicious_process' }),
    generateRansomwareEvent(base, 45),
    {
      source: 'backup-service',
      eventType: 'backup_failed',
      username: 'svc-backup',
      ip: pick(IPS.internal),
      severity: 'critical',
      timestamp: new Date(base.getTime() + 90000).toISOString(),
      metadata: { reason: 'destination_unreachable' },
    },
    {
      source: 'system-monitor',
      eventType: 'service_stopped',
      username: 'system',
      ip: '10.0.2.19',
      severity: 'high',
      timestamp: new Date(base.getTime() + 120000).toISOString(),
      metadata: { service: 'backup-agent' },
    },
  ];
  return withMeta('ransomware', events);
}

/** Scenario 11: API abuse */
export function scenarioApiAbuse(base) {
  const events = [];
  const ip = IPS.external[1];
  for (let i = 0; i < 85; i++) {
    events.push(generateApiRequest(base, i * 2, { ip }));
  }
  for (let i = 0; i < 4; i++) {
    events.push(generateRateLimitEvent(base, 200 + i * 10, ip));
  }
  return withMeta('apiAbuse', events);
}

/** Scenario 12: False positive testing */
export function scenarioFalsePositive(base) {
  const events = [];
  const username = 'alice.chen';
  const ip = pick(IPS.internal);
  for (let i = 0; i < 4; i++) {
    events.push(generateFailedLogin(base, i * 30, { username, ip, attempt: i + 1 }));
  }
  for (let i = 0; i < 20; i++) {
    events.push(generateFileDownload(base, 150 + i * 15, { username, ip }));
  }
  events.push(generateAdminLogin(base, 500, { offHours: false }));
  for (let i = 0; i < 10; i++) {
    events.push(generateApiRequest(base, 600 + i * 5, { ip }));
  }
  return withMeta('falsePositive', events);
}

/** Scenario 13: Edge cases */
export function scenarioEdge(base) {
  const ts = base.toISOString();
  const events = [
    { source: 'web-app', eventType: 'api_request', severity: 'info', timestamp: ts, metadata: {} },
    {
      source: 'auth-service',
      eventType: 'login_success',
      username: 'bob.martinez',
      ip: IPS.internal[0],
      severity: 'low',
      timestamp: ts,
      metadata: { country: 'Unknown', userAgent: 'Unknown' },
    },
    {
      source: 'auth-service',
      eventType: 'login_failed',
      username: 'carol.nguyen',
      ip: IPS.external[0],
      severity: 'medium',
      timestamp: ts,
      metadata: {},
    },
    generateFailedLogin(base, 1, { username: 'user_a', ip: IPS.external[0] }),
    generateFailedLogin(base, 1, { username: 'user_b', ip: IPS.external[0] }),
    generateNormalLogin(base, 2, generateUser()),
  ];
  // Out of order delivery — swap last two timestamps
  const last = events[events.length - 1];
  const prev = events[events.length - 2];
  const tmp = last.timestamp;
  last.timestamp = prev.timestamp;
  prev.timestamp = tmp;

  return withMeta('edge', events);
}

/** Scenario 14: Stress test */
export function scenarioStress(base, count = 500) {
  const events = [];
  const scenarios = [scenarioNormal, scenarioBruteForce, scenarioPortScan, scenarioApiAbuse];
  let offset = 0;
  while (events.length < count) {
    const fn = pick(scenarios);
    const batch = fn(new Date(base.getTime() + offset * 1000)).events;
    batch.forEach((e, i) => {
      e.timestamp = new Date(base.getTime() + (offset + i) * 1000).toISOString();
    });
    events.push(...batch);
    offset += batch.length + randomInt(5, 20);
  }
  return withMeta('stress', events.slice(0, count));
}

function offsetEvents(base, events, startOffsetSec, spacingSec = 8) {
  return events.map((e, i) => ({
    ...e,
    timestamp: new Date(base.getTime() + (startOffsetSec + i * spacingSec) * 1000).toISOString(),
  }));
}

/** Scenario 15: Full portfolio demo (~300 events, deterministic with seed 42) */
export function scenarioFullDemo(base) {
  let offset = 0;
  const segments = [];

  const add = (events, spacing = 8) => {
    segments.push(...offsetEvents(base, events, offset, spacing));
    if (events.length > 0) {
      offset += events.length * spacing + 30;
    }
  };

  // Morning baseline — fills info/low severity on dashboard
  add(scenarioNormal(base, 35).events, 12);

  // Primary attack narrative (brute force → compromise → exfil → priv esc)
  add(scenarioFullAttackChain(base).events, 10);

  // Secondary attack threads (different actors)
  add(scenarioSuspiciousAdmin(base).events, 45);
  add(scenarioPortScan(base).events, 4);
  add(scenarioMalware(base).events, 25);
  add(scenarioRansomware(base).events, 40);
  add(scenarioPrivilegeEscalation(base).events, 18);

  // API abuse volume — drives api_request charts
  add(scenarioApiAbuse(base).events, 2);

  // False-positive control group — should NOT alert
  add(scenarioFalsePositive(base).events, 14);

  // Afternoon baseline
  add(scenarioNormal(base, 30).events, 15);

  const events = segments.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  return withMeta('fullDemo', events);
}

/** Legacy attack scenario alias */
export function scenarioAttack(base) {
  return scenarioDataExfiltration(base);
}

/** Mixed normal + attack */
export function scenarioMixed(base) {
  const events = [
    ...scenarioNormal(base, 10).events,
    ...scenarioFullAttackChain(base).events.map((e, i) => ({
      ...e,
      timestamp: new Date(base.getTime() + (400 + i * 10) * 1000).toISOString(),
    })),
    ...scenarioNormal(base, 6).events.map((e, i) => ({
      ...e,
      timestamp: new Date(base.getTime() + (900 + i * 40) * 1000).toISOString(),
    })),
  ];
  return withMeta('mixed', events.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)));
}

export const SCENARIOS = {
  normal: scenarioNormal,
  bruteForce: scenarioBruteForce,
  accountCompromise: scenarioAccountCompromise,
  dataExfiltration: scenarioDataExfiltration,
  fullAttackChain: scenarioFullAttackChain,
  suspiciousAdmin: scenarioSuspiciousAdmin,
  portScan: scenarioPortScan,
  privilegeEscalation: scenarioPrivilegeEscalation,
  malware: scenarioMalware,
  ransomware: scenarioRansomware,
  apiAbuse: scenarioApiAbuse,
  falsePositive: scenarioFalsePositive,
  edge: scenarioEdge,
  stress: scenarioStress,
  fullDemo: scenarioFullDemo,
  attack: scenarioAttack,
  mixed: scenarioMixed,
};

export function runScenario(scenarioName, options = {}) {
  const fn = SCENARIOS[scenarioName];
  if (!fn) {
    throw new Error(`Unknown scenario: ${scenarioName}. Available: ${Object.keys(SCENARIOS).join(', ')}`);
  }
  const base = options.startTime ? new Date(options.startTime) : new Date();
  if (scenarioName === 'normal' || scenarioName === 'stress') {
    return fn(base, options.count);
  }
  return fn(base);
}
