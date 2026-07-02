import Incident from '../models/Incident.js';
import User from '../models/User.js';
import { INCIDENT_STATUSES, ROLES } from '../config/constants.js';
import { rebuildIncidentTimeline } from '../services/incident/timelineBuilder.js';
import {
  loadIncidentBundle,
  toIncidentDetailJson,
} from '../services/incident/incidentLoader.js';
import {
  runBasicInvestigation,
  getAgentOutputs,
} from '../services/ai/investigateService.js';
import { buildReportForIncident } from '../services/reports/reportBuilder.js';
import { ownerFilter, assertDocumentOwner } from '../utils/ownerScope.js';
import { recordAudit } from '../services/playbook/auditService.js';
import { notifyUser } from '../services/notifications/notificationService.js';
import {
  addCaseNote,
  addCaseTask,
  updateCaseTask,
  validatePriority,
} from '../services/incident/caseService.js';

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
    filter.$or = [
      { title: pattern },
      { username: pattern },
      { ip: pattern },
      { caseNumber: pattern },
    ];
  }

  return filter;
}

export async function listIncidents(req, res, next) {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '20', 10);
    const skip = (page - 1) * limit;
    const filter = { ...buildIncidentFilter(req.query), ...ownerFilter(req.user._id) };

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
    assertDocumentOwner(bundle.incident, req.user._id);

    const agentOutputs = await getAgentOutputs(req.params.id);
    const json = toIncidentDetailJson(
      bundle.incident,
      bundle.alerts,
      bundle.events,
      agentOutputs
    );

    res.json({ incident: json });
  } catch (err) {
    if (err.status === 404) return res.status(404).json({ error: 'Incident not found', code: 'NOT_FOUND' });
    next(err);
  }
}

export async function updateIncident(req, res, next) {
  try {
    const incident = await Incident.findById(req.params.id);
    assertDocumentOwner(incident, req.user._id);

    const { status, assignedAnalystId, priority, tags } = req.body;
    const previousStatus = incident.status;
    const previousPriority = incident.priority;
    const previousAssignee = incident.assignedAnalyst?.toString();

    if (status) {
      if (!INCIDENT_STATUSES.includes(status)) {
        return res.status(400).json({
          error: `Status must be one of: ${INCIDENT_STATUSES.join(', ')}`,
          code: 'VALIDATION_ERROR',
        });
      }
      incident.status = status;
    }

    if (priority) {
      validatePriority(priority);
      incident.priority = priority;
    }

    if (tags !== undefined) {
      incident.tags = Array.isArray(tags) ? tags.filter(Boolean) : [];
    }

    if (assignedAnalystId !== undefined) {
      if (assignedAnalystId === null || assignedAnalystId === '') {
        if (req.user.role === ROLES.ANALYST) {
          return res.status(403).json({
            error: 'Forbidden: analysts cannot unassign cases from other analysts.',
            code: 'FORBIDDEN',
          });
        }
        incident.assignedAnalyst = undefined;
      } else {
        if (
          req.user.role === ROLES.ANALYST &&
          assignedAnalystId.toString() !== req.user._id.toString()
        ) {
          return res.status(403).json({
            error: 'Forbidden: analysts can only assign cases to themselves.',
            code: 'FORBIDDEN',
          });
        }

        const analyst = await User.findById(assignedAnalystId);
        if (!analyst) {
          return res.status(404).json({ error: 'Analyst not found', code: 'NOT_FOUND' });
        }
        incident.assignedAnalyst = analyst._id;

        if (analyst._id.toString() !== previousAssignee) {
          await notifyUser(analyst._id, {
            type: 'incident_assigned',
            title: `Case assigned: ${incident.caseNumber || incident.title}`,
            message: `You were assigned to ${incident.title}`,
            link: `/incidents/${incident._id}`,
            metadata: { incidentId: incident._id },
          });

          await recordAudit({
            action: 'incident_assigned',
            entityType: 'incident',
            entityId: incident._id,
            incidentId: incident._id,
            user: req.user,
            details: { assignedTo: analyst.email, caseNumber: incident.caseNumber },
          });
        }
      }
    }

    await incident.save();

    if (status && status !== previousStatus) {
      await recordAudit({
        action: 'incident_status_changed',
        entityType: 'incident',
        entityId: incident._id,
        incidentId: incident._id,
        user: req.user,
        details: { from: previousStatus, to: status, caseNumber: incident.caseNumber },
      });
    }

    if (priority && priority !== previousPriority) {
      await recordAudit({
        action: 'incident_priority_changed',
        entityType: 'incident',
        entityId: incident._id,
        incidentId: incident._id,
        user: req.user,
        details: { from: previousPriority, to: priority, caseNumber: incident.caseNumber },
      });
    }

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
    if (err.status === 404) return res.status(404).json({ error: 'Incident not found', code: 'NOT_FOUND' });
    next(err);
  }
}

export async function investigateIncident(req, res, next) {
  try {
    const incident = await Incident.findById(req.params.id);
    assertDocumentOwner(incident, req.user._id);

    const result = await runBasicInvestigation(req.params.id, req.user);

    res.json({
      message: 'AI investigation completed',
      aiSource: result.aiSource,
      incident: result.incident,
      agentOutputs: result.agentOutputs,
    });
  } catch (err) {
    if (err.status === 404) {
      return res.status(404).json({ error: err.message, code: 'NOT_FOUND' });
    }
    next(err);
  }
}

export async function generateIncidentReport(req, res, next) {
  try {
    const incident = await Incident.findById(req.params.id);
    assertDocumentOwner(incident, req.user._id);

    const report = await buildReportForIncident(req.params.id, req.user);
    if (!report) {
      return res.status(404).json({ error: 'Incident not found', code: 'NOT_FOUND' });
    }
    res.json({
      report: {
        incidentId: report.incident._id,
        title: report.incident.title,
        severity: report.incident.severity,
        status: report.incident.status,
        markdown: report.markdown,
        generatedAt: report.incident.report.generatedAt,
        version: report.incident.report.version,
      },
    });
  } catch (err) {
    if (err.status === 404) return res.status(404).json({ error: err.message, code: 'NOT_FOUND' });
    next(err);
  }
}

export async function getIncidentAgentOutputs(req, res, next) {
  try {
    const bundle = await loadIncidentBundle(req.params.id);
    if (!bundle) {
      return res.status(404).json({ error: 'Incident not found', code: 'NOT_FOUND' });
    }
    assertDocumentOwner(bundle.incident, req.user._id);

    const outputs = await getAgentOutputs(req.params.id);
    res.json({ agentOutputs: outputs.map((o) => o.toPublicJSON()) });
  } catch (err) {
    next(err);
  }
}

export async function refreshTimeline(req, res, next) {
  try {
    const incident = await Incident.findById(req.params.id);
    assertDocumentOwner(incident, req.user._id);

    const { timeline, relatedEvents } = await rebuildIncidentTimeline(incident._id);
    incident.timeline = timeline;
    incident.relatedEvents = relatedEvents;
    await incident.save();

    res.json({ incident: incident.toPublicJSON() });
  } catch (err) {
    if (err.status === 404) return res.status(404).json({ error: 'Incident not found', code: 'NOT_FOUND' });
    next(err);
  }
}

export async function addIncidentNote(req, res, next) {
  try {
    const incident = await Incident.findById(req.params.id);
    assertDocumentOwner(incident, req.user._id);

    const note = addCaseNote(incident, req.user, req.body.body);
    await incident.save();

    await recordAudit({
      action: 'case_note_added',
      entityType: 'incident',
      entityId: incident._id,
      incidentId: incident._id,
      user: req.user,
      details: { caseNumber: incident.caseNumber, preview: req.body.body.slice(0, 120) },
    });

    res.status(201).json({ note, incident: incident.toPublicJSON() });
  } catch (err) {
    if (err.status === 404) return res.status(404).json({ error: 'Incident not found', code: 'NOT_FOUND' });
    next(err);
  }
}

export async function addIncidentTask(req, res, next) {
  try {
    const incident = await Incident.findById(req.params.id);
    assertDocumentOwner(incident, req.user._id);

    const task = addCaseTask(incident, req.user, req.body);
    await incident.save();

    await recordAudit({
      action: 'case_task_added',
      entityType: 'incident',
      entityId: incident._id,
      incidentId: incident._id,
      user: req.user,
      details: { title: task.title, caseNumber: incident.caseNumber },
    });

    res.status(201).json({ task, incident: incident.toPublicJSON() });
  } catch (err) {
    if (err.status === 404) return res.status(404).json({ error: 'Incident not found', code: 'NOT_FOUND' });
    next(err);
  }
}

export async function updateIncidentTask(req, res, next) {
  try {
    const incident = await Incident.findById(req.params.id);
    assertDocumentOwner(incident, req.user._id);

    const task = updateCaseTask(incident, req.params.taskId, req.body);
    await incident.save();

    await recordAudit({
      action: 'case_task_updated',
      entityType: 'incident',
      entityId: incident._id,
      incidentId: incident._id,
      user: req.user,
      details: { taskId: req.params.taskId, status: task.status, caseNumber: incident.caseNumber },
    });

    res.json({ task, incident: incident.toPublicJSON() });
  } catch (err) {
    if (err.status === 404) return res.status(404).json({ error: err.message, code: 'NOT_FOUND' });
    next(err);
  }
}

export async function getIncidentStats(req, res, next) {
  try {
    const userMatch = ownerFilter(req.user._id);
    const [total, openCount, bySeverity, byStatus] = await Promise.all([
      Incident.countDocuments(userMatch),
      Incident.countDocuments({ ...userMatch, status: { $in: ['new', 'investigating'] } }),
      Incident.aggregate([
        { $match: userMatch },
        { $group: { _id: '$severity', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Incident.aggregate([
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
