import Incident from '../../models/Incident.js';
import PlaybookAction from '../../models/PlaybookAction.js';
import { PLAYBOOK_ACTION_TYPES } from '../../config/constants.js';
import { recordAudit } from './auditService.js';
import { executePlaybookAction } from './executor.js';

function normalizeActionType(actionType) {
  if (PLAYBOOK_ACTION_TYPES.includes(actionType)) return actionType;
  return 'escalate';
}

function buildTarget(incident, actionType) {
  const target = {};
  if (['lock_account', 'force_password_reset', 'notify_user'].includes(actionType)) {
    target.username = incident.username;
  }
  if (['block_ip', 'isolate_host'].includes(actionType)) {
    target.ip = incident.ip;
  }
  return target;
}

export async function syncPlaybookActionsFromRecommendations(incident, recommendations = []) {
  if (!recommendations.length) return [];

  const existing = await PlaybookAction.find({
    incidentId: incident._id,
    source: 'ai_mitigation',
    status: { $in: ['pending', 'approved'] },
  });

  const existingTypes = new Set(existing.map((a) => a.actionType));
  const created = [];

  for (const rec of recommendations) {
    const actionType = normalizeActionType(rec.actionType);
    if (existingTypes.has(actionType)) continue;

    const action = await PlaybookAction.create({
      incidentId: incident._id,
      actionType,
      description: rec.description,
      justification: rec.justification || rec.description,
      priority: rec.priority || 'medium',
      status: 'pending',
      source: 'ai_mitigation',
      target: buildTarget(incident, actionType),
    });

    existingTypes.add(actionType);
    created.push(action);
  }

  return created;
}

export async function listPlaybookActions({ incidentId, status } = {}) {
  const filter = {};
  if (incidentId) filter.incidentId = incidentId;
  if (status) filter.status = status;

  return PlaybookAction.find(filter)
    .populate('approvedBy', 'name email')
    .populate('executedBy', 'name email')
    .sort({ createdAt: 1 });
}

export async function getPlaybookAction(actionId) {
  return PlaybookAction.findById(actionId)
    .populate('approvedBy', 'name email')
    .populate('executedBy', 'name email');
}

export async function approvePlaybookAction(actionId, user) {
  const action = await getPlaybookAction(actionId);
  if (!action) {
    const err = new Error('Playbook action not found');
    err.status = 404;
    throw err;
  }
  if (action.status !== 'pending') {
    const err = new Error(`Cannot approve action with status "${action.status}"`);
    err.status = 400;
    throw err;
  }

  action.status = 'approved';
  action.approvedBy = user._id || user.id;
  action.approvedAt = new Date();
  await action.save();

  await recordAudit({
    action: 'playbook_approved',
    entityId: action._id,
    incidentId: action.incidentId,
    user,
    details: { actionType: action.actionType, description: action.description },
  });

  const incident = await Incident.findById(action.incidentId);
  if (incident) {
    incident.timeline = [
      ...(incident.timeline || []),
      {
        timestamp: new Date(),
        source: 'analyst',
        title: `Playbook Approved: ${action.actionType.replace(/_/g, ' ')}`,
        description: action.description,
        refId: action._id,
      },
    ];
    await incident.save();
  }

  return action;
}

export async function rejectPlaybookAction(actionId, user, reason = '') {
  const action = await getPlaybookAction(actionId);
  if (!action) {
    const err = new Error('Playbook action not found');
    err.status = 404;
    throw err;
  }
  if (action.status !== 'pending') {
    const err = new Error(`Cannot reject action with status "${action.status}"`);
    err.status = 400;
    throw err;
  }

  action.status = 'rejected';
  action.rejectedBy = user._id || user.id;
  action.rejectedAt = new Date();
  action.rejectionReason = reason || 'Rejected by analyst';
  await action.save();

  await recordAudit({
    action: 'playbook_rejected',
    entityId: action._id,
    incidentId: action.incidentId,
    user,
    details: { actionType: action.actionType, reason: action.rejectionReason },
  });

  return action;
}

export async function executePlaybookActionById(actionId, user) {
  const action = await getPlaybookAction(actionId);
  if (!action) {
    const err = new Error('Playbook action not found');
    err.status = 404;
    throw err;
  }
  if (action.status !== 'approved') {
    const err = new Error('Action must be approved before execution');
    err.status = 400;
    throw err;
  }

  const result = executePlaybookAction(action);

  action.status = result.success ? 'executed' : 'failed';
  action.executedBy = user._id || user.id;
  action.executedAt = new Date();
  action.executionResult = result;
  await action.save();

  await recordAudit({
    action: 'playbook_executed',
    entityId: action._id,
    incidentId: action.incidentId,
    user,
    details: {
      actionType: action.actionType,
      success: result.success,
      message: result.message,
    },
  });

  const incident = await Incident.findById(action.incidentId);
  if (incident) {
    incident.timeline = [
      ...(incident.timeline || []),
      {
        timestamp: new Date(),
        source: 'analyst',
        title: `Playbook Executed: ${action.actionType.replace(/_/g, ' ')}`,
        description: result.message,
        refId: action._id,
      },
    ];
    if (incident.status === 'investigating') {
      incident.status = 'contained';
    }
    await incident.save();
  }

  return action;
}

export function toPlaybookPublicJSON(action) {
  const json = action.toPublicJSON();
  if (action.approvedBy?.name) {
    json.approvedBy = {
      id: action.approvedBy._id,
      name: action.approvedBy.name,
      email: action.approvedBy.email,
    };
  }
  if (action.executedBy?.name) {
    json.executedBy = {
      id: action.executedBy._id,
      name: action.executedBy.name,
      email: action.executedBy.email,
    };
  }
  return json;
}
