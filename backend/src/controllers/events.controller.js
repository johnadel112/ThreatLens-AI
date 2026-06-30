import SecurityEvent from '../models/SecurityEvent.js';
import { runDetection } from '../services/detection/engine.js';

function buildEventFilter(query) {
  const filter = {};

  if (query.eventType) filter.eventType = query.eventType;
  if (query.severity) filter.severity = query.severity;
  if (query.username) filter.username = new RegExp(query.username, 'i');
  if (query.ip) filter.ip = query.ip;
  if (query.source) filter.source = new RegExp(query.source, 'i');

  if (query.from || query.to) {
    filter.timestamp = {};
    if (query.from) filter.timestamp.$gte = new Date(query.from);
    if (query.to) filter.timestamp.$lte = new Date(query.to);
  }

  if (query.search) {
    const pattern = new RegExp(query.search, 'i');
    filter.$or = [
      { username: pattern },
      { ip: pattern },
      { source: pattern },
      { eventType: pattern },
    ];
  }

  return filter;
}

export async function createEvent(req, res, next) {
  try {
    const { source, eventType, username, ip, metadata, severity, timestamp } = req.body;

    const event = await SecurityEvent.create({
      source,
      eventType,
      username: username || undefined,
      ip: ip || undefined,
      metadata: metadata || {},
      severity: severity || 'low',
      timestamp: new Date(timestamp),
    });

    const alerts = await runDetection(event);

    const incidentId =
      alerts.find((a) => a.incidentId)?.incidentId?.toString() || null;

    res.status(201).json({
      event: event.toPublicJSON(),
      alertsCreated: alerts.length,
      alerts: alerts.map((a) => a.toPublicJSON()),
      incidentId,
    });
  } catch (err) {
    next(err);
  }
}

export async function listEvents(req, res, next) {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '20', 10);
    const skip = (page - 1) * limit;
    const filter = buildEventFilter(req.query);

    const [events, total] = await Promise.all([
      SecurityEvent.find(filter).sort({ timestamp: -1 }).skip(skip).limit(limit),
      SecurityEvent.countDocuments(filter),
    ]);

    res.json({
      events: events.map((e) => e.toPublicJSON()),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getEventStats(_req, res, next) {
  try {
    const [total, bySeverity, byType] = await Promise.all([
      SecurityEvent.countDocuments(),
      SecurityEvent.aggregate([
        { $group: { _id: '$severity', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      SecurityEvent.aggregate([
        { $group: { _id: '$eventType', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
    ]);

    res.json({
      total,
      bySeverity: bySeverity.map((s) => ({ severity: s._id, count: s.count })),
      byType: byType.map((t) => ({ eventType: t._id, count: t.count })),
    });
  } catch (err) {
    next(err);
  }
}
