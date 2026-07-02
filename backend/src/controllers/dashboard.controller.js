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

function aggregateMitreTactics(incidents = []) {
  const counts = {};
  for (const inc of incidents) {
    const tactic = inc.mitre?.primaryTactic;
    if (!tactic || tactic === 'Unknown') continue;
    counts[tactic] = (counts[tactic] || 0) + 1;
  }
  return Object.entries(counts).map(([tactic, count]) => ({ tactic, count }));
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
      topRiskyIncidents,
      eventsLastHour,
      eventsPreviousHour,
      casesNeedingAction,
      aiInvestigationsToday,
      reportsGeneratedToday,
      topSuspiciousIps,
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
      Incident.find(userMatch)
        .sort({ riskScore: -1, correlationScore: -1 })
        .limit(5)
        .select('title severity status riskScore correlationScore confidenceScore username ip mitre')
        .lean(),
      SecurityEvent.countDocuments({ ...userMatch, timestamp: { $gte: new Date(Date.now() - 60 * 60 * 1000) } }),
      SecurityEvent.countDocuments({
        ...userMatch,
        timestamp: {
          $gte: new Date(Date.now() - 2 * 60 * 60 * 1000),
          $lt: new Date(Date.now() - 60 * 60 * 1000),
        },
      }),
      Incident.countDocuments({
        ...userMatch,
        status: { $in: ['new', 'investigating'] },
        $or: [{ assignedAnalyst: { $exists: false } }, { assignedAnalyst: null }],
      }),
      Incident.countDocuments({
        ...userMatch,
        investigationStatus: 'completed',
        updatedAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      }),
      Incident.countDocuments({
        ...userMatch,
        'report.generatedAt': { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      }),
      SecurityEvent.aggregate([
        { $match: { ...userMatch, timestamp: { $gte: twentyFourHoursAgo }, ip: { $exists: true, $ne: null } } },
        { $group: { _id: '$ip', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]),
    ]);

    const openCriticalAlerts = alertsOpenBySeverity.find((s) => s._id === 'critical')?.count || 0;
    const openHighAlerts = alertsOpenBySeverity.find((s) => s._id === 'high')?.count || 0;
    const openCriticalCases = incidentsOpenBySeverity.find((s) => s._id === 'critical')?.count || 0;

    res.json({
      events: {
        total: eventTotal,
        lastHour: eventsLastHour,
        previousHour: eventsPreviousHour,
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
      pipeline: {
        eventsProcessed: eventTotal,
        alertsGenerated: alertTotal,
        alertsOpen: alertOpen,
        alertsOpenCritical: openCriticalAlerts,
        casesActive: incidentOpen,
        casesOpenCritical: openCriticalCases,
        aiInvestigationsToday,
        reportsGeneratedToday,
        playbooksPending: playbookPending,
      },
      operations: {
        casesNeedingAction: casesNeedingAction + playbookPending,
        unassignedCases: casesNeedingAction,
        playbooksAwaitingApproval: playbookPending,
      },
      intelligence: {
        topRiskyIncidents: topRiskyIncidents.map((inc) => ({
          id: inc._id,
          title: inc.title,
          severity: inc.severity,
          status: inc.status,
          riskScore: inc.riskScore || 0,
          correlationScore: inc.correlationScore || 0,
          confidenceScore: inc.confidenceScore || 0,
          username: inc.username,
          ip: inc.ip,
          mitreTactic: inc.mitre?.primaryTactic,
        })),
        mitreByTactic: aggregateMitreTactics(topRiskyIncidents),
        topSuspiciousIps: topSuspiciousIps.map((row) => ({ ip: row._id, count: row.count })),
      },
    });
  } catch (err) {
    next(err);
  }
}
