import {
  ATTACK_TARGET,
  DEMO_IPS,
  FILE_NAMES,
  NORMAL_USERS,
  USER_AGENTS,
  isoNow,
  offsetTimestamp,
  pick,
  randomInt,
} from '../utils.js';

export function loginFailed({ username, ip, timestamp, reason = 'invalid_password' } = {}) {
  return {
    source: 'auth-service',
    eventType: 'login_failed',
    username: username ?? ATTACK_TARGET.username,
    ip: ip ?? DEMO_IPS.attacker,
    severity: 'medium',
    timestamp: timestamp ?? isoNow(),
    metadata: {
      reason,
      userAgent: pick(USER_AGENTS),
      attemptNumber: randomInt(1, 10),
    },
  };
}

export function loginSuccess({ username, ip, timestamp, mfa = false } = {}) {
  return {
    source: 'auth-service',
    eventType: 'login_success',
    username,
    ip,
    severity: 'low',
    timestamp: timestamp ?? isoNow(),
    metadata: {
      method: 'password',
      mfa,
      userAgent: pick(USER_AGENTS),
    },
  };
}

export function fileDownload({ username, ip, timestamp, fileName } = {}) {
  return {
    source: 'file-gateway',
    eventType: 'file_download',
    username,
    ip,
    severity: 'low',
    timestamp: timestamp ?? isoNow(),
    metadata: {
      fileName: fileName ?? pick(FILE_NAMES),
      sizeBytes: randomInt(50000, 2500000),
      protocol: 'HTTPS',
    },
  };
}

export function fileUpload({ username, ip, timestamp } = {}) {
  const user = pick(NORMAL_USERS);
  return {
    source: 'file-gateway',
    eventType: 'file_upload',
    username: username ?? user.username,
    ip: ip ?? pick(DEMO_IPS.internal),
    severity: 'low',
    timestamp: timestamp ?? isoNow(),
    metadata: {
      fileName: `upload-${randomInt(1000, 9999)}.pdf`,
      sizeBytes: randomInt(10000, 500000),
    },
  };
}

export function logout({ username, ip, timestamp } = {}) {
  const user = pick(NORMAL_USERS);
  return {
    source: 'auth-service',
    eventType: 'logout',
    username: username ?? user.username,
    ip: ip ?? pick(DEMO_IPS.internal),
    severity: 'low',
    timestamp: timestamp ?? isoNow(),
    metadata: { sessionDurationMinutes: randomInt(5, 480) },
  };
}

export function networkAccess({ ip, timestamp, port, endpoint } = {}) {
  return {
    source: 'network-monitor',
    eventType: 'network_access',
    username: 'system',
    ip: ip ?? pick(DEMO_IPS.external),
    severity: 'low',
    timestamp: timestamp ?? isoNow(),
    metadata: {
      port: port ?? pick([80, 443, 8080, 8443]),
      endpoint: endpoint ?? pick(['/api/v1/health', '/api/v1/users', '/api/v1/reports']),
      protocol: 'HTTPS',
    },
  };
}

export function permissionChange({ username, ip, timestamp, change } = {}) {
  return {
    source: 'iam-service',
    eventType: 'permission_change',
    username: username ?? ATTACK_TARGET.username,
    ip: ip ?? DEMO_IPS.attacker,
    severity: 'high',
    timestamp: timestamp ?? isoNow(),
    metadata: {
      change: change ?? 'role_elevated',
      previousRole: 'user',
      newRole: 'admin',
      changedBy: 'system',
    },
  };
}

export function adminAction({ username, ip, timestamp, action } = {}) {
  return {
    source: 'admin-console',
    eventType: 'admin_action',
    username: username ?? 'admin',
    ip: ip ?? pick(DEMO_IPS.internal),
    severity: 'medium',
    timestamp: timestamp ?? isoNow(),
    metadata: {
      action: action ?? pick(['user_list', 'config_view', 'audit_log_view']),
    },
  };
}

export function normalLoginEvent() {
  const user = pick(NORMAL_USERS);
  return loginSuccess({
    username: user.username,
    ip: pick(DEMO_IPS.internal),
  });
}

export function normalActivityEvent() {
  const generators = [normalLoginEvent, fileDownload, fileUpload, logout, networkAccess];
  const fn = pick(generators);
  if (fn === fileDownload) {
    const user = pick(NORMAL_USERS);
    return fileDownload({ username: user.username, ip: pick(DEMO_IPS.internal) });
  }
  return fn();
}

/** Build attack scenario events with realistic timestamps for detection windows */
export function buildAttackScenarioEvents() {
  const base = new Date();
  const attackerIp = DEMO_IPS.attacker;
  const target = ATTACK_TARGET.username;
  const events = [];

  // Phase 1: Brute force — 6 failed logins over ~90 seconds
  for (let i = 0; i < 6; i++) {
    events.push(
      loginFailed({
        username: target,
        ip: attackerIp,
        timestamp: offsetTimestamp(base, i * 15),
        reason: i < 5 ? 'invalid_password' : 'account_locked_warning',
      })
    );
  }

  // Phase 2: Successful login after brute force (~2 min after first attempt)
  events.push(
    loginSuccess({
      username: target,
      ip: attackerIp,
      timestamp: offsetTimestamp(base, 120),
      mfa: false,
    })
  );

  // Phase 3: Data exfiltration — 35 file downloads over ~5 minutes
  for (let i = 0; i < 35; i++) {
    events.push(
      fileDownload({
        username: target,
        ip: attackerIp,
        timestamp: offsetTimestamp(base, 150 + i * 8),
        fileName: FILE_NAMES[i % FILE_NAMES.length],
      })
    );
  }

  return events;
}

/** Build a batch of benign baseline events */
export function buildNormalTrafficEvents(count = 15) {
  const events = [];
  const base = new Date();

  for (let i = 0; i < count; i++) {
    const event = normalActivityEvent();
    event.timestamp = offsetTimestamp(base, i * randomInt(20, 90));
    events.push(event);
  }

  return events.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
}

/** Interleave normal traffic with attack scenario */
export function buildMixedTrafficEvents() {
  const base = new Date();
  const preamble = buildNormalTrafficEvents(8).map((e, i) => ({
    ...e,
    timestamp: offsetTimestamp(base, i * 30),
  }));

  const attack = buildAttackScenarioEvents().map((e, i) => ({
    ...e,
    timestamp: offsetTimestamp(base, 240 + i * (i < 6 ? 15 : 8)),
  }));

  const postamble = buildNormalTrafficEvents(6).map((e, i) => ({
    ...e,
    timestamp: offsetTimestamp(base, 600 + i * 45),
  }));

  return [...preamble, ...attack, ...postamble].sort(
    (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
  );
}
