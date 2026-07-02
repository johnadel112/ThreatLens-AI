import AuditLog from '../../models/AuditLog.js';
import Incident from '../../models/Incident.js';

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

export async function listAuditLogs({
  incidentId,
  userId,
  action,
  entityType,
  from,
  to,
  page = 1,
  limit = 50,
} = {}) {
  const filter = {};
  if (incidentId) {
    filter.incidentId = incidentId;
  } else if (userId) {
    const ownedIncidents = await Incident.find({ userId }).select('_id');
    const incidentIds = ownedIncidents.map((i) => i._id);
    filter.$or = [
      { userId },
      { incidentId: { $in: incidentIds } },
    ];
  }
  if (action) filter.action = action;
  if (entityType) filter.entityType = entityType;

  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to) filter.createdAt.$lte = new Date(to);
  }

  const skip = (page - 1) * limit;
  const [logs, total] = await Promise.all([
    AuditLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    AuditLog.countDocuments(filter),
  ]);

  return {
    logs,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit) || 1,
    },
  };
}
