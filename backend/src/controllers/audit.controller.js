import { listAuditLogs } from '../services/playbook/auditService.js';

export async function listAudit(req, res, next) {
  try {
    const result = await listAuditLogs({
      incidentId: req.query.incidentId,
      userId: req.user._id,
      action: req.query.action,
      entityType: req.query.entityType,
      from: req.query.from,
      to: req.query.to,
      page: parseInt(req.query.page || '1', 10),
      limit: parseInt(req.query.limit || '50', 10),
    });

    res.json({
      logs: result.logs.map((l) => l.toPublicJSON()),
      pagination: result.pagination,
    });
  } catch (err) {
    next(err);
  }
}
