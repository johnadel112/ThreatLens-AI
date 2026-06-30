import app from './app.js';
import { config } from './config/env.js';
import { connectDB } from './config/db.js';

async function start() {
  try {
    await connectDB();
    app.listen(config.port, () => {
      console.log(`[server] ThreatLens backend running on http://localhost:${config.port}`);
      console.log(`[server] Health check: http://localhost:${config.port}/health`);
    });
  } catch (err) {
    console.error('[server] Failed to start:', err.message);
    process.exit(1);
  }
}

start();
