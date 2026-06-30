import Alert from '../models/Alert.js';
import Incident from '../models/Incident.js';
import PlaybookAction from '../models/PlaybookAction.js';
import SecurityEvent from '../models/SecurityEvent.js';
import { ownerFilter } from '../utils/ownerScope.js';

function fillLast24Hours(timeline) {
  const map = Object.fromEntries(timeline.map((d) => [d.hour, d.count]));
  const buckets = [];
  const now = new Date();
  now.setMinutes(0, 0, 0);
  for (let i = 23; i >= 0; i -= 1) {
    const d = new Date(now.getTime() - i * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 13);
    buckets.push({
      hour: d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
      count: map[key] || 0,
      ts: d.getTime(),
    });
  }
  return buckets;
}

function fillLast7Days(timeline) {
  const map = Object.fromEntries(timeline.map((d) => [d.date, d.count]));
  const days = [];
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    days.push({ date: key, count: map[key] || 0 });
  }
  return days;
}

export async function getDashboardStats(req, res, next) {
  try {
    const userMatch = ownerFilter(req.user._id);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [
      eventTotal,
      eventsBySeverity,
      eventsByType,
      eventTimeline,
      eventHourlyTimeline,
      alertTotal,
      alertOpen,
      alertsBySeverity,
      alertsOpenBySeverity,
      alertsByStatus,
      incidentTotal,
      incidentOpen,
      incidentsBySeverity,
      incidentsOpenBySeverity,
      incidentsByStatus,
      playbookPending,
      playbookExecuted,
    ] = await Promise.all([
      SecurityEvent.countDocuments(userMatch),
      SecurityEvent.aggregate([
        { $match: userMatch },
        { $group: { _id: '$severity', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      SecurityEvent.aggregate([
        { $match: userMatch },
        { $group: { _id: '$eventType', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 8 },
      ]),
      SecurityEvent.aggregate([
        { $match: { ...userMatch, timestamp: { $gte: sevenDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      SecurityEvent.aggregate([
        { $match: { ...userMatch, timestamp: { $gte: twentyFourHoursAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%dT%H', date: '$timestamp' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Alert.countDocuments(userMatch),
      Alert.countDocuments({ ...userMatch, status: 'open' }),
      Alert.aggregate([
        { $match: userMatch },
        { $group: { _id: '$severity', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Alert.aggregate([
        { $match: { ...userMatch, status: 'open' } },
        { $group: { _id: '$severity', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Alert.aggregate([
        { $match: userMatch },
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Incident.countDocuments(userMatch),
      Incident.countDocuments({ ...userMatch, status: { $in: ['new', 'investigating'] } }),
      Incident.aggregate([
        { $match: userMatch },
        { $group: { _id: '$severity', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Incident.aggregate([
        { $match: { ...userMatch, status: { $in: ['new', 'investigating'] } } },
        { $group: { _id: '$severity', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Incident.aggregate([
        { $match: userMatch },
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      PlaybookAction.countDocuments({ ...userMatch, status: 'pending' }),
      PlaybookAction.countDocuments({ ...userMatch, status: 'executed' }),
    ]);

    res.json({
      events: {
        total: eventTotal,
        bySeverity: eventsBySeverity.map((s) => ({ severity: s._id, count: s.count })),
        byType: eventsByType.map((t) => ({ eventType: t._id, count: t.count })),
        timeline: fillLast7Days(
          eventTimeline.map((t) => ({ date: t._id, count: t.count }))
        ),
        hourlyTimeline: fillLast24Hours(
          eventHourlyTimeline.map((t) => ({ hour: t._id, count: t.count }))
        ),
      },
      alerts: {
        total: alertTotal,
        openCount: alertOpen,
        bySeverity: alertsBySeverity.map((s) => ({ severity: s._id, count: s.count })),
        openBySeverity: alertsOpenBySeverity.map((s) => ({ severity: s._id, count: s.count })),
        byStatus: alertsByStatus.map((s) => ({ status: s._id, count: s.count })),
      },
      incidents: {
        total: incidentTotal,
        openCount: incidentOpen,
        bySeverity: incidentsBySeverity.map((s) => ({ severity: s._id, count: s.count })),
        openBySeverity: incidentsOpenBySeverity.map((s) => ({ severity: s._id, count: s.count })),
        byStatus: incidentsByStatus.map((s) => ({ status: s._id, count: s.count })),
      },
      playbooks: {
        pendingCount: playbookPending,
        executedCount: playbookExecuted,
      },
    });
  } catch (err) {
    next(err);
  }
}
