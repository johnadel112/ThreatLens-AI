import AuditLog from '../../models/AuditLog.js';

export async function recordAudit({
  action,
  entityId,
  incidentId,
  user,
  details = {},
  entityType = 'playbook_action',
}) {
  return AuditLog.create({
    action,
    entityType,
    entityId,
    incidentId,
    userId: user?._id || user?.id,
    userName: user?.name,
    userEmail: user?.email,
    details,
  });
}

export async function listAuditLogs({ incidentId, limit = 50 } = {}) {
  const filter = {};
  if (incidentId) filter.incidentId = incidentId;

  const logs = await AuditLog.find(filter).sort({ createdAt: -1 }).limit(limit);
  return logs;
}
