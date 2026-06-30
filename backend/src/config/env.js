import dotenv from 'dotenv';

dotenv.config();

const required = ['MONGODB_URI', 'JWT_SECRET'];

for (const key of required) {
  if (!process.env[key]) {
    console.warn(`[config] Warning: ${key} is not set`);
  }
}

function parseCorsOrigins() {
  const raw = process.env.CORS_ORIGINS || process.env.CORS_ORIGIN || 'http://localhost:5173';
  return raw
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean)
    .map((o) => (o.startsWith('http') ? o : `https://${o}`));
}

function normalizeServiceUrl(url) {
  if (!url) return url;
  if (url.startsWith('http://') || url.startsWith('https://')) return url.replace(/\/$/, '');
  return `https://${url.replace(/\/$/, '')}`;
}

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/threatlens',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
  aiServiceUrl: normalizeServiceUrl(process.env.AI_SERVICE_URL || 'http://localhost:8000'),
  simulatorApiKey: process.env.SIMULATOR_API_KEY || '',
  corsOrigins: parseCorsOrigins(),
  nodeEnv: process.env.NODE_ENV || 'development',
};
