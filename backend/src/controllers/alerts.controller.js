import Alert, { ALERT_STATUSES } from '../models/Alert.js';
import { ownerFilter, assertDocumentOwner } from '../utils/ownerScope.js';

function buildAlertFilter(query) {
  const filter = {};

  if (query.severity) filter.severity = query.severity;
  if (query.status) filter.status = query.status;
  if (query.ruleId) filter.ruleId = query.ruleId;
  if (query.username) filter.username = new RegExp(query.username, 'i');
  if (query.ip) filter.ip = query.ip;

  if (query.from || query.to) {
    filter.createdAt = {};
    if (query.from) filter.createdAt.$gte = new Date(query.from);
    if (query.to) filter.createdAt.$lte = new Date(query.to);
  }

  if (query.search) {
    const pattern = new RegExp(query.search, 'i');
    filter.$or = [{ title: pattern }, { username: pattern }, { ip: pattern }, { ruleId: pattern }];
  }

  return filter;
}

export async function listAlerts(req, res, next) {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '20', 10);
    const skip = (page - 1) * limit;
    const filter = { ...buildAlertFilter(req.query), ...ownerFilter(req.user._id) };

    const [alerts, total] = await Promise.all([
      Alert.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Alert.countDocuments(filter),
    ]);

    res.json({
      alerts: alerts.map((a) => a.toPublicJSON()),
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

export async function getAlert(req, res, next) {
  try {
    const alert = await Alert.findById(req.params.id);
    assertDocumentOwner(alert, req.user._id);
    res.json({ alert: alert.toPublicJSON() });
  } catch (err) {
    if (err.status === 404) return res.status(404).json({ error: 'Alert not found', code: 'NOT_FOUND' });
    next(err);
  }
}

export async function updateAlertStatus(req, res, next) {
  try {
    const { status } = req.body;

    if (!ALERT_STATUSES.includes(status)) {
      return res.status(400).json({
        error: `Status must be one of: ${ALERT_STATUSES.join(', ')}`,
        code: 'VALIDATION_ERROR',
      });
    }

    const alert = await Alert.findById(req.params.id);
    assertDocumentOwner(alert, req.user._id);

    alert.status = status;
    await alert.save();

    res.json({ alert: alert.toPublicJSON() });
  } catch (err) {
    if (err.status === 404) return res.status(404).json({ error: 'Alert not found', code: 'NOT_FOUND' });
    next(err);
  }
}

export async function getAlertStats(req, res, next) {
  try {
    const userMatch = ownerFilter(req.user._id);
    const [total, openCount, bySeverity, byStatus] = await Promise.all([
      Alert.countDocuments(userMatch),
      Alert.countDocuments({ ...userMatch, status: 'open' }),
      Alert.aggregate([
        { $match: userMatch },
        { $group: { _id: '$severity', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Alert.aggregate([
        { $match: userMatch },
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ]);

    res.json({
      total,
      openCount,
      bySeverity: bySeverity.map((s) => ({ severity: s._id, count: s.count })),
      byStatus: byStatus.map((s) => ({ status: s._id, count: s.count })),
    });
  } catch (err) {
    next(err);
  }
}
