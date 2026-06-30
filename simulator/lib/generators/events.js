import { pick, randomInt, offsetTimestamp } from '../rng.js';
import {
  USERS, IPS, COUNTRIES, CITIES, USER_AGENTS, ENDPOINTS, FILE_NAMES, SOURCES, DEVICES, PROCESSES,
} from '../dataset/index.js';

function baseEvent({ source, eventType, username, ip, severity, timestamp, metadata = {} }) {
  return {
    source: source ?? pick(SOURCES),
    eventType,
    username,
    ip,
    severity,
    timestamp,
    metadata: {
      userAgent: pick(USER_AGENTS),
      country: pick(COUNTRIES),
      city: pick(CITIES),
      deviceId: pick(DEVICES),
      sessionId: `sess-${randomInt(100000, 999999)}`,
      department: USERS.find((u) => u.username === username)?.department,
      role: USERS.find((u) => u.username === username)?.role,
      ...metadata,
    },
  };
}

export function generateUser() {
  return pick(USERS);
}

export function generateIp(pool = 'internal') {
  if (pool === 'attacker') return IPS.attacker;
  if (pool === 'scanner') return IPS.scanner;
  return pick(pool === 'external' ? IPS.external : IPS.internal);
}

export function generateTimestamp(base, offsetSec) {
  return offsetTimestamp(base, offsetSec);
}

export function generateNormalLogin(base, offset, user = generateUser()) {
  return baseEvent({
    source: 'auth-service',
    eventType: 'login_success',
    username: user.username,
    ip: generateIp('internal'),
    severity: 'low',
    timestamp: generateTimestamp(base, offset),
    metadata: {
      endpoint: '/login',
      httpMethod: 'POST',
      statusCode: 200,
      mfaUsed: true,
      riskScore: randomInt(1, 15),
    },
  });
}

export function generateFailedLogin(base, offset, { username, ip, attempt = 1 } = {}) {
  const user = username || pick(USERS).username;
  return baseEvent({
    source: 'auth-service',
    eventType: 'failed_login',
    username: user,
    ip: ip || generateIp('external'),
    severity: 'medium',
    timestamp: generateTimestamp(base, offset),
    metadata: {
      endpoint: '/login',
      httpMethod: 'POST',
      statusCode: 401,
      attemptNumber: attempt,
      reason: pick(['invalid_password', 'unknown_user', 'account_locked']),
      riskScore: randomInt(20, 60),
    },
  });
}

export function generateMfaSuccess(base, offset, username) {
  return baseEvent({
    source: 'auth-service',
    eventType: 'mfa_success',
    username,
    ip: generateIp('internal'),
    severity: 'info',
    timestamp: generateTimestamp(base, offset),
    metadata: { endpoint: '/mfa/verify', statusCode: 200, riskScore: 5 },
  });
}

export function generateLogout(base, offset, user = generateUser()) {
  return baseEvent({
    source: 'auth-service',
    eventType: 'logout',
    username: user.username,
    ip: generateIp('internal'),
    severity: 'info',
    timestamp: generateTimestamp(base, offset),
    metadata: { sessionDurationMinutes: randomInt(10, 480) },
  });
}

export function generateFileDownload(base, offset, { username, ip, fileName, severity = 'low' } = {}) {
  const user = username || pick(USERS).username;
  return baseEvent({
    source: 'file-gateway',
    eventType: 'file_download',
    username: user,
    ip: ip || generateIp('internal'),
    severity,
    timestamp: generateTimestamp(base, offset),
    metadata: {
      fileName: fileName || pick(FILE_NAMES),
      fileSizeMB: randomInt(1, 25) / 10,
      endpoint: '/files/download',
      downloadCount: 1,
      riskScore: randomInt(5, 30),
    },
  });
}

export function generateBulkDownload(base, offset, { username, ip } = {}) {
  return baseEvent({
    source: 'file-gateway',
    eventType: 'bulk_file_download',
    username: username || 'jdoe',
    ip: ip || IPS.attacker,
    severity: 'high',
    timestamp: generateTimestamp(base, offset),
    metadata: {
      downloadCount: randomInt(15, 40),
      fileSizeMB: randomInt(50, 500),
      resource: 'finance-share',
      riskScore: 85,
    },
  });
}

export function generateAdminLogin(base, offset, { username = 'admin', ip, offHours = false } = {}) {
  const ts = generateTimestamp(base, offset);
  if (offHours) {
    const d = new Date(ts);
    d.setUTCHours(2, 30, 0, 0);
    return baseEvent({
      source: 'admin-console',
      eventType: 'admin_login',
      username,
      ip: ip || IPS.external[3],
      severity: 'medium',
      timestamp: d.toISOString(),
      metadata: {
        role: 'admin',
        isAdmin: true,
        endpoint: '/admin/login',
        country: 'CN',
        riskScore: 72,
      },
    });
  }
  const d = new Date(ts);
  d.setUTCHours(14, 0, 0, 0);
  return baseEvent({
    source: 'admin-console',
    eventType: 'admin_login',
    username,
    ip: ip || pick(IPS.internal),
    severity: 'low',
    timestamp: d.toISOString(),
    metadata: { role: 'admin', isAdmin: true, endpoint: '/admin/login', riskScore: 10 },
  });
}

export function generateApiRequest(base, offset, { ip, count = 1 } = {}) {
  return baseEvent({
    source: 'api-gateway',
    eventType: 'api_request',
    username: 'system',
    ip: ip || pick(IPS.internal),
    severity: 'info',
    timestamp: generateTimestamp(base, offset),
    metadata: {
      endpoint: pick(ENDPOINTS),
      httpMethod: pick(['GET', 'POST', 'PUT']),
      statusCode: 200,
      requestCount: count,
      riskScore: randomInt(1, 20),
    },
  });
}

export function generatePortScanEvent(base, offset, { ip, port, endpoint } = {}) {
  return baseEvent({
    source: 'network-monitor',
    eventType: pick(['port_scan', 'network_access', 'endpoint_probe', 'repeated_404']),
    username: 'system',
    ip: ip || IPS.scanner,
    severity: 'medium',
    timestamp: generateTimestamp(base, offset),
    metadata: {
      port: port || randomInt(20, 65535),
      endpoint: endpoint || pick(ENDPOINTS),
      protocol: 'TCP',
      statusCode: pick([404, 403, 200]),
      riskScore: randomInt(40, 80),
    },
  });
}

export function generateMalwareEvent(base, offset, { username, ip, eventType } = {}) {
  return baseEvent({
    source: 'endpoint-agent',
    eventType: eventType || pick(['malware_alert', 'suspicious_process', 'suspicious_script_execution']),
    username: username || 'emma.wilson',
    ip: ip || '10.0.2.19',
    severity: 'critical',
    timestamp: generateTimestamp(base, offset),
    metadata: {
      processName: pick(PROCESSES),
      commandLine: 'simulated-process --scan-only',
      riskScore: randomInt(80, 99),
      action: 'quarantine_recommended',
    },
  });
}

export function generatePermissionChange(base, offset, { username, ip } = {}) {
  return baseEvent({
    source: 'iam-service',
    eventType: pick(['permission_change', 'role_change']),
    username: username || 'jdoe',
    ip: ip || IPS.attacker,
    severity: 'high',
    timestamp: generateTimestamp(base, offset),
    metadata: {
      previousValue: 'user',
      newValue: 'admin',
      action: 'role_elevated',
      riskScore: 90,
    },
  });
}

export function generateBackupCompleted(base, offset) {
  return baseEvent({
    source: 'backup-service',
    eventType: 'backup_completed',
    username: 'svc-backup',
    ip: pick(IPS.internal),
    severity: 'info',
    timestamp: generateTimestamp(base, offset),
    metadata: { resource: 'nightly-backup', statusCode: 200 },
  });
}

export function generateAuditCleared(base, offset, { username, ip } = {}) {
  return baseEvent({
    source: 'admin-console',
    eventType: 'audit_log_cleared',
    username: username || 'jdoe',
    ip: ip || IPS.attacker,
    severity: 'critical',
    timestamp: generateTimestamp(base, offset),
    metadata: { action: 'clear_audit_logs', riskScore: 99, reason: 'simulated_attack' },
  });
}

export function generateRateLimitEvent(base, offset, ip) {
  return baseEvent({
    source: 'api-gateway',
    eventType: 'api_rate_limit_exceeded',
    username: 'system',
    ip,
    severity: 'high',
    timestamp: generateTimestamp(base, offset),
    metadata: { endpoint: '/api/v1/events', statusCode: 429, requestCount: 500 },
  });
}

export function generateRansomwareEvent(base, offset, { username, ip } = {}) {
  return baseEvent({
    source: 'endpoint-agent',
    eventType: 'ransomware_behavior',
    username: username || 'emma.wilson',
    ip: ip || '10.0.2.19',
    severity: 'critical',
    timestamp: generateTimestamp(base, offset),
    metadata: {
      processName: 'encrypt_sim.exe',
      filesModified: randomInt(100, 5000),
      riskScore: 99,
      action: 'isolate_host',
    },
  });
}

export function generateNewCountryLogin(base, offset, { username, ip } = {}) {
  return baseEvent({
    source: 'auth-service',
    eventType: 'login_from_new_country',
    username: username || 'jdoe',
    ip: ip || IPS.attacker,
    severity: 'high',
    timestamp: generateTimestamp(base, offset),
    metadata: { country: 'RU', city: 'Moscow', previousCountry: 'US', riskScore: 78 },
  });
}

export function generateSensitiveFileAccess(base, offset, { username, ip } = {}) {
  return baseEvent({
    source: 'file-gateway',
    eventType: 'sensitive_file_access',
    username: username || 'jdoe',
    ip: ip || IPS.attacker,
    severity: 'high',
    timestamp: generateTimestamp(base, offset),
    metadata: { fileName: 'customer-pii.xlsx', resource: 'restricted-share', riskScore: 88 },
  });
}

export function generateDatabaseExport(base, offset, { username, ip } = {}) {
  return baseEvent({
    source: 'file-gateway',
    eventType: 'database_export',
    username: username || 'jdoe',
    ip: ip || IPS.attacker,
    severity: 'critical',
    timestamp: generateTimestamp(base, offset),
    metadata: { fileSizeMB: randomInt(100, 800), resource: 'finance-db', riskScore: 95 },
  });
}

export function generateAttackChain(base) {
  const { username, ip } = { username: 'jdoe', ip: IPS.attacker };
  const events = [];
  let t = 0;

  for (let i = 0; i < 6; i++) {
    events.push(generateFailedLogin(base, (t += 12), { username, ip, attempt: i + 1 }));
  }
  events.push(baseEvent({
    source: 'auth-service',
    eventType: 'login_success',
    username, ip,
    severity: 'high',
    timestamp: generateTimestamp(base, (t += 30)),
    metadata: { mfaUsed: false, riskScore: 82, country: 'RU' },
  }));
  events.push(generateNewCountryLogin(base, (t += 10), { username, ip }));
  events.push(generatePermissionChange(base, (t += 20), { username, ip }));
  events.push(baseEvent({
    source: 'iam-service',
    eventType: 'role_change',
    username, ip,
    severity: 'critical',
    timestamp: generateTimestamp(base, (t += 15)),
    metadata: { previousValue: 'user', newValue: 'admin', riskScore: 92 },
  }));
  events.push(generateSensitiveFileAccess(base, (t += 25), { username, ip }));
  events.push(generateBulkDownload(base, (t += 10), { username, ip }));
  for (let i = 0; i < 32; i++) {
    events.push(generateFileDownload(base, (t += 5), { username, ip, severity: 'medium' }));
  }
  events.push(baseEvent({
    source: 'auth-service',
    eventType: 'password_change',
    username, ip,
    severity: 'high',
    timestamp: generateTimestamp(base, (t += 20)),
    metadata: { action: 'password_changed', riskScore: 75 },
  }));
  events.push(generateAuditCleared(base, (t += 10), { username, ip }));

  return events;
}
