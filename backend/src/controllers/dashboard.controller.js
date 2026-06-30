import Alert from '../models/Alert.js';
import Incident from '../models/Incident.js';
import PlaybookAction from '../models/PlaybookAction.js';
import SecurityEvent from '../models/SecurityEvent.js';

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

export async function getDashboardStats(_req, res, next) {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      eventTotal,
      eventsBySeverity,
      eventsByType,
      eventTimeline,
      alertTotal,
      alertOpen,
      alertsBySeverity,
      alertsByStatus,
      incidentTotal,
      incidentOpen,
      incidentsBySeverity,
      incidentsByStatus,
      playbookPending,
      playbookExecuted,
    ] = await Promise.all([
      SecurityEvent.countDocuments(),
      SecurityEvent.aggregate([
        { $group: { _id: '$severity', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      SecurityEvent.aggregate([
        { $group: { _id: '$eventType', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 8 },
      ]),
      SecurityEvent.aggregate([
        { $match: { timestamp: { $gte: sevenDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Alert.countDocuments(),
      Alert.countDocuments({ status: 'open' }),
      Alert.aggregate([
        { $group: { _id: '$severity', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Alert.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Incident.countDocuments(),
      Incident.countDocuments({ status: { $in: ['new', 'investigating'] } }),
      Incident.aggregate([
        { $group: { _id: '$severity', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Incident.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      PlaybookAction.countDocuments({ status: 'pending' }),
      PlaybookAction.countDocuments({ status: 'executed' }),
    ]);

    res.json({
      events: {
        total: eventTotal,
        bySeverity: eventsBySeverity.map((s) => ({ severity: s._id, count: s.count })),
        byType: eventsByType.map((t) => ({ eventType: t._id, count: t.count })),
        timeline: fillLast7Days(
          eventTimeline.map((t) => ({ date: t._id, count: t.count }))
        ),
      },
      alerts: {
        total: alertTotal,
        openCount: alertOpen,
        bySeverity: alertsBySeverity.map((s) => ({ severity: s._id, count: s.count })),
        byStatus: alertsByStatus.map((s) => ({ status: s._id, count: s.count })),
      },
      incidents: {
        total: incidentTotal,
        openCount: incidentOpen,
        bySeverity: incidentsBySeverity.map((s) => ({ severity: s._id, count: s.count })),
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
