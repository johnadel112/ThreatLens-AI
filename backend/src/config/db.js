import mongoose from 'mongoose';
import { config } from './env.js';

export async function connectDB(retries = 10, delayMs = 3000) {
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      await mongoose.connect(config.mongodbUri);
      console.log('[db] Connected to MongoDB');
      return;
    } catch (err) {
      if (attempt === retries) {
        console.error('[db] MongoDB connection failed:', err.message);
        throw err;
      }
      console.warn(`[db] MongoDB not ready (attempt ${attempt}/${retries}), retrying...`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}

export function getDBStatus() {
  const state = mongoose.connection.readyState;
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  return states[state] || 'unknown';
}
