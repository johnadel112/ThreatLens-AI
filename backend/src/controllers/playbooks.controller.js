import {
  approvePlaybookAction,
  executePlaybookActionById,
  getPlaybookAction,
  listPlaybookActions,
  rejectPlaybookAction,
  toPlaybookPublicJSON,
} from '../services/playbook/playbookService.js';
import { listAuditLogs } from '../services/playbook/auditService.js';
import {
  createManualPlaybookAction,
  listPlaybookTemplates,
  runPlaybookTemplate,
} from '../services/playbook/playbookOrchestrator.js';
import { assertDocumentOwner } from '../utils/ownerScope.js';

export async function listPlaybooks(req, res, next) {
  try {
    const actions = await listPlaybookActions({
      incidentId: req.query.incidentId,
      status: req.query.status,
      userId: req.user._id,
    });

    res.json({
      actions: actions.map(toPlaybookPublicJSON),
    });
  } catch (err) {
    next(err);
  }
}

export async function getPlaybook(req, res, next) {
  try {
    const action = await getPlaybookAction(req.params.actionId);
    if (!action) {
      return res.status(404).json({ error: 'Playbook action not found', code: 'NOT_FOUND' });
    }
    assertDocumentOwner(action, req.user._id);

    res.json({ action: toPlaybookPublicJSON(action) });
  } catch (err) {
    next(err);
  }
}

export async function approvePlaybook(req, res, next) {
  try {
    const action = await approvePlaybookAction(req.params.actionId, req.user);

    res.json({
      message: 'Playbook action approved',
      action: toPlaybookPublicJSON(action),
    });
  } catch (err) {
    if (err.status === 404) {
      return res.status(404).json({ error: err.message, code: 'NOT_FOUND' });
    }
    if (err.status === 400) {
      return res.status(400).json({ error: err.message, code: 'INVALID_STATE' });
    }
    next(err);
  }
}

export async function rejectPlaybook(req, res, next) {
  try {
    const action = await rejectPlaybookAction(
      req.params.actionId,
      req.user,
      req.body?.reason
    );

    res.json({
      message: 'Playbook action rejected',
      action: toPlaybookPublicJSON(action),
    });
  } catch (err) {
    if (err.status === 404) {
      return res.status(404).json({ error: err.message, code: 'NOT_FOUND' });
    }
    if (err.status === 400) {
      return res.status(400).json({ error: err.message, code: 'INVALID_STATE' });
    }
    next(err);
  }
}

export async function executePlaybook(req, res, next) {
  try {
    const action = await executePlaybookActionById(req.params.actionId, req.user);

    res.json({
      message: 'Playbook action executed (simulated)',
      action: toPlaybookPublicJSON(action),
    });
  } catch (err) {
    if (err.status === 404) {
      return res.status(404).json({ error: err.message, code: 'NOT_FOUND' });
    }
    if (err.status === 400) {
      return res.status(400).json({ error: err.message, code: 'INVALID_STATE' });
    }
    next(err);
  }
}

export async function getAuditLog(req, res, next) {
  try {
    const result = await listAuditLogs({
      incidentId: req.query.incidentId,
      userId: req.user._id,
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

export async function listTemplates(req, res, next) {
  try {
    const templates = await listPlaybookTemplates();
    res.json({ templates: templates.map((t) => t.toPublicJSON()) });
  } catch (err) {
    next(err);
  }
}

export async function createManualAction(req, res, next) {
  try {
    const action = await createManualPlaybookAction(
      req.body.incidentId,
      req.user,
      req.body
    );
    res.status(201).json({ action: toPlaybookPublicJSON(action) });
  } catch (err) {
    if (err.status === 400) return res.status(400).json({ error: err.message, code: 'VALIDATION_ERROR' });
    if (err.status === 404) return res.status(404).json({ error: err.message, code: 'NOT_FOUND' });
    next(err);
  }
}

export async function runTemplate(req, res, next) {
  try {
    const result = await runPlaybookTemplate(
      req.body.incidentId,
      req.body.templateId,
      req.user
    );
    res.status(201).json({
      message: `Playbook "${result.template.name}" started`,
      playbookRunId: result.playbookRunId,
      actions: result.actions.map(toPlaybookPublicJSON),
    });
  } catch (err) {
    if (err.status === 400) return res.status(400).json({ error: err.message, code: 'VALIDATION_ERROR' });
    if (err.status === 404) return res.status(404).json({ error: err.message, code: 'NOT_FOUND' });
    next(err);
  }
}
