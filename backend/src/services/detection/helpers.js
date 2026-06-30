import SecurityEvent from '../../models/SecurityEvent.js';
import Alert from '../../models/Alert.js';

export function windowStart(timestamp, windowMinutes) {
  const ts = timestamp instanceof Date ? timestamp : new Date(timestamp);
  return new Date(ts.getTime() - windowMinutes * 60 * 1000);
}

export async function queryRecentEvents({
  userId,
  eventType,
  eventTypes,
  username,
  ip,
  since,
  until,
  limit = 200,
}) {
  const types = eventTypes || (eventType ? [eventType] : []);
  const filter = {
    timestamp: { $gte: since, $lte: until },
  };

  if (userId) filter.userId = userId;

  if (types.length === 1) {
    filter.eventType = types[0];
  } else if (types.length > 1) {
    filter.eventType = { $in: types };
  }

  if (username && ip) {
    filter.$or = [{ username }, { ip }];
  } else if (username) {
    filter.username = username;
  } else if (ip) {
    filter.ip = ip;
  }

  return SecurityEvent.find(filter).sort({ timestamp: 1 }).limit(limit);
}

export async function countRecentEvents({ userId, eventType, username, ip, since, until }) {
  const filter = {
    eventType,
    timestamp: { $gte: since, $lte: until },
  };

  if (userId) filter.userId = userId;

  if (username && ip) {
    filter.$or = [{ username }, { ip }];
  } else if (username) {
    filter.username = username;
  } else if (ip) {
    filter.ip = ip;
  }

  return SecurityEvent.countDocuments(filter);
}

export async function hasOpenAlert({ userId, ruleId, username, ip, sinceMinutes = 60 }) {
  const since = new Date(Date.now() - sinceMinutes * 60 * 1000);
  const filter = {
    ruleId,
    status: { $in: ['open', 'acknowledged'] },
    createdAt: { $gte: since },
  };

  if (userId) filter.userId = userId;

  if (username && ip) {
    filter.$or = [{ username }, { ip }];
  } else if (username) {
    filter.username = username;
  } else if (ip) {
    filter.ip = ip;
  }

  const existing = await Alert.findOne(filter);
  return !!existing;
}

export async function findRecentAlert({ userId, ruleId, username, ip, sinceMinutes }) {
  const since = windowStart(new Date(), sinceMinutes);
  const filter = {
    ruleId,
    status: { $in: ['open', 'acknowledged'] },
    createdAt: { $gte: since },
  };

  if (userId) filter.userId = userId;

  if (username) filter.username = username;
  if (ip) filter.ip = ip;

  return Alert.findOne(filter).sort({ createdAt: -1 });
}

export function buildAlertPayload({
  userId,
  title,
  severity,
  ruleId,
  summary,
  eventIds,
  metrics,
  username,
  ip,
}) {
  return {
    userId,
    title,
    severity,
    ruleId,
    evidence: { summary, eventIds, metrics },
    relatedEvents: eventIds,
    username,
    ip,
  };
}
