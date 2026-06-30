import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/env.js';
import { getDBStatus } from './config/db.js';
import authRoutes from './routes/auth.routes.js';
import eventsRoutes from './routes/events.routes.js';
import alertsRoutes from './routes/alerts.routes.js';
import incidentsRoutes from './routes/incidents.routes.js';
import aiRoutes from './routes/ai.routes.js';
import playbooksRoutes from './routes/playbooks.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import reportsRoutes from './routes/reports.routes.js';

const app = express();

app.use(helmet());
app.use(cors({ origin: config.corsOrigin }));
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'threatlens-backend',
    version: '0.1.0',
    timestamp: new Date().toISOString(),
    database: getDBStatus(),
  });
});

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'threatlens-backend',
    version: '0.1.0',
    timestamp: new Date().toISOString(),
    database: getDBStatus(),
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/alerts', alertsRoutes);
app.use('/api/incidents', incidentsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/playbooks', playbooksRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportsRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((err, _req, res, _next) => {
  console.error('[error]', err.message);
  res.status(err.status || 500).json({
    error: config.nodeEnv === 'production' ? 'Internal server error' : err.message,
  });
});

export default app;
