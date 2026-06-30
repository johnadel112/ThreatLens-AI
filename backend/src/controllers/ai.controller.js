import { runBasicInvestigation } from '../services/ai/investigateService.js';

export async function refreshIncidentReport(req, res, next) {
  try {
    const result = await runBasicInvestigation(req.params.incidentId);

    res.json({
      message: 'SOC report refreshed',
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
