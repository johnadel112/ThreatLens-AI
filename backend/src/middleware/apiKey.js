import { config } from '../config/env.js';
import { authenticate } from './auth.js';
import { ROLES } from '../config/constants.js';

/**
 * Accept simulator API key or authenticated admin JWT for event ingestion.
 */
export async function authenticateIngestion(req, res, next) {
  const apiKey = req.headers['x-api-key'];

  if (apiKey) {
    if (!config.simulatorApiKey) {
      return res.status(503).json({
        error: 'Simulator API key is not configured',
        code: 'SERVICE_UNAVAILABLE',
      });
    }

    if (apiKey !== config.simulatorApiKey) {
      return res.status(401).json({ error: 'Invalid API key', code: 'UNAUTHORIZED' });
    }

    req.ingestionSource = 'simulator';
    return next();
  }

  return authenticate(req, res, () => {
    if (req.user?.role !== ROLES.ADMIN) {
      return res.status(403).json({
        error: 'Admin role or simulator API key required for event ingestion',
        code: 'FORBIDDEN',
      });
    }

    req.ingestionSource = 'admin';
    next();
  });
}
