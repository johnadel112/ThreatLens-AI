import Incident from '../../models/Incident.js';
import { CASE_PRIORITIES } from '../../config/constants.js';

const PRIORITY_BY_SEVERITY = {
  critical: 'P1',
  high: 'P2',
  medium: 'P3',
  low: 'P4',
  info: 'P4',
};

export function deriveCasePriority(severity) {
  return PRIORITY_BY_SEVERITY[severity] || 'P3';
}

export async function generateCaseNumber(userId) {
  const year = new Date().getFullYear();
  const prefix = `TL-${year}-`;

  const latest = await Incident.findOne({
    userId,
    caseNumber: new RegExp(`^${prefix}`),
  })
    .sort({ caseNumber: -1 })
    .select('caseNumber');

  let seq = 1;
  if (latest?.caseNumber) {
    const match = latest.caseNumber.match(/-(\d+)$/);
    if (match) seq = parseInt(match[1], 10) + 1;
  }

  return `${prefix}${String(seq).padStart(4, '0')}`;
}

export async function ensureCaseFields(incident) {
  if (!incident.caseNumber) {
    incident.caseNumber = await generateCaseNumber(incident.userId);
  }
  if (!incident.priority) {
    incident.priority = deriveCasePriority(incident.severity);
  }
  if (!incident.tags) {
    incident.tags = [];
  }
  if (!incident.slaDueAt) {
    const hours = incident.priority === 'P1' ? 4 : incident.priority === 'P2' ? 8 : 24;
    incident.slaDueAt = new Date(Date.now() + hours * 60 * 60 * 1000);
  }
  return incident;
}

export function addCaseNote(incident, user, body) {
  incident.notes = [
    ...(incident.notes || []),
    {
      authorId: user._id || user.id,
      authorName: user.name,
      body: body.trim(),
      createdAt: new Date(),
    },
  ];
  return incident.notes[incident.notes.length - 1];
}

export function addCaseTask(incident, user, { title, assignedTo, assignedName, dueAt }) {
  const task = {
    title: title.trim(),
    status: 'open',
    assignedTo,
    assignedName,
    dueAt: dueAt ? new Date(dueAt) : undefined,
    createdBy: user._id || user.id,
    createdByName: user.name,
    createdAt: new Date(),
  };
  incident.tasks = [...(incident.tasks || []), task];
  return task;
}

export function updateCaseTask(incident, taskId, updates) {
  const task = incident.tasks?.id(taskId);
  if (!task) {
    const err = new Error('Task not found');
    err.status = 404;
    throw err;
  }

  if (updates.title) task.title = updates.title.trim();
  if (updates.status) {
    task.status = updates.status;
    if (updates.status === 'done') task.completedAt = new Date();
  }
  if (updates.assignedTo !== undefined) {
    task.assignedTo = updates.assignedTo || undefined;
    task.assignedName = updates.assignedName || undefined;
  }
  if (updates.dueAt !== undefined) {
    task.dueAt = updates.dueAt ? new Date(updates.dueAt) : undefined;
  }

  return task;
}

export function validatePriority(priority) {
  if (!CASE_PRIORITIES.includes(priority)) {
    const err = new Error(`Priority must be one of: ${CASE_PRIORITIES.join(', ')}`);
    err.status = 400;
    throw err;
  }
}
