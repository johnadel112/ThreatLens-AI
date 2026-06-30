import Incident from '../models/Incident.js';
import User from '../models/User.js';
import { INCIDENT_STATUSES } from '../config/constants.js';
import { rebuildIncidentTimeline } from '../services/incident/timelineBuilder.js';
import {
  loadIncidentBundle,
  toIncidentDetailJson,
} from '../services/incident/incidentLoader.js';
import {
  runBasicInvestigation,
  getAgentOutputs,
} from '../services/ai/investigateService.js';

function buildIncidentFilter(query) {
  const filter = {};

  if (query.severity) filter.severity = query.severity;
  if (query.status) filter.status = query.status;
  if (query.username) filter.username = new RegExp(query.username, 'i');
  if (query.ip) filter.ip = query.ip;

  if (query.from || query.to) {
    filter.createdAt = {};
    if (query.from) filter.createdAt.$gte = new Date(query.from);
    if (query.to) filter.createdAt.$lte = new Date(query.to);
  }

  if (query.search) {
    const pattern = new RegExp(query.search, 'i');
    filter.$or = [{ title: pattern }, { username: pattern }, { ip: pattern }];
  }

  return filter;
}

export async function listIncidents(req, res, next) {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '20', 10);
    const skip = (page - 1) * limit;
    const filter = buildIncidentFilter(req.query);

    const [incidents, total] = await Promise.all([
      Incident.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('assignedAnalyst', 'name email'),
      Incident.countDocuments(filter),
    ]);

    res.json({
      incidents: incidents.map((i) => {
        const json = i.toPublicJSON();
        if (i.assignedAnalyst) {
          json.assignedAnalyst = {
            id: i.assignedAnalyst._id,
            name: i.assignedAnalyst.name,
            email: i.assignedAnalyst.email,
          };
        }
        json.alertCount = i.alerts?.length || 0;
        return json;
      }),
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

export async function getIncident(req, res, next) {
  try {
    const bundle = await loadIncidentBundle(req.params.id);
    if (!bundle) {
      return res.status(404).json({ error: 'Incident not found', code: 'NOT_FOUND' });
    }

    const agentOutputs = await getAgentOutputs(req.params.id);
    const json = toIncidentDetailJson(
      bundle.incident,
      bundle.alerts,
      bundle.events,
      agentOutputs
    );

    res.json({ incident: json });
  } catch (err) {
    next(err);
  }
}

export async function updateIncident(req, res, next) {
  try {
    const incident = await Incident.findById(req.params.id);
    if (!incident) {
      return res.status(404).json({ error: 'Incident not found', code: 'NOT_FOUND' });
    }

    const { status, assignedAnalystId } = req.body;

    if (status) {
      if (!INCIDENT_STATUSES.includes(status)) {
        return res.status(400).json({
          error: `Status must be one of: ${INCIDENT_STATUSES.join(', ')}`,
          code: 'VALIDATION_ERROR',
        });
      }
      incident.status = status;
    }

    if (assignedAnalystId !== undefined) {
      if (assignedAnalystId === null || assignedAnalystId === '') {
        incident.assignedAnalyst = undefined;
      } else {
        const analyst = await User.findById(assignedAnalystId);
        if (!analyst) {
          return res.status(404).json({ error: 'Analyst not found', code: 'NOT_FOUND' });
        }
        incident.assignedAnalyst = analyst._id;
      }
    }

    await incident.save();

    const populated = await Incident.findById(incident._id).populate('assignedAnalyst', 'name email');
    const json = populated.toPublicJSON();
    if (populated.assignedAnalyst) {
      json.assignedAnalyst = {
        id: populated.assignedAnalyst._id,
        name: populated.assignedAnalyst.name,
        email: populated.assignedAnalyst.email,
      };
    }

    res.json({ incident: json });
  } catch (err) {
    next(err);
  }
}

export async function investigateIncident(req, res, next) {
  try {
    const result = await runBasicInvestigation(req.params.id);

    res.json({
      message: 'AI investigation completed',
      aiSource: result.aiSource,
      incident: result.incident,
      agentOutput: result.agentOutput,
    });
  } catch (err) {
    if (err.status === 404) {
      return res.status(404).json({ error: err.message, code: 'NOT_FOUND' });
    }
    next(err);
  }
}

export async function getIncidentAgentOutputs(req, res, next) {
  try {
    const bundle = await loadIncidentBundle(req.params.id);
    if (!bundle) {
      return res.status(404).json({ error: 'Incident not found', code: 'NOT_FOUND' });
    }

    const outputs = await getAgentOutputs(req.params.id);
    res.json({ agentOutputs: outputs.map((o) => o.toPublicJSON()) });
  } catch (err) {
    next(err);
  }
}

export async function refreshTimeline(req, res, next) {
  try {
    const incident = await Incident.findById(req.params.id);
    if (!incident) {
      return res.status(404).json({ error: 'Incident not found', code: 'NOT_FOUND' });
    }

    const { timeline, relatedEvents } = await rebuildIncidentTimeline(incident._id);
    incident.timeline = timeline;
    incident.relatedEvents = relatedEvents;
    await incident.save();

    res.json({ incident: incident.toPublicJSON() });
  } catch (err) {
    next(err);
  }
}

export async function getIncidentStats(_req, res, next) {
  try {
    const [total, openCount, bySeverity, byStatus] = await Promise.all([
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
