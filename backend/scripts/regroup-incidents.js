import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { regroupOrphanAlerts } from '../src/services/incident/grouper.js';

dotenv.config();

async function main() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/threatlens';
  await mongoose.connect(uri);

  const incidentIds = await regroupOrphanAlerts();
  console.log(`[done] Grouped orphan alerts into ${incidentIds.length} incident(s)`);
  incidentIds.forEach((id) => console.log(`  → ${id}`));

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('[error]', err.message);
  process.exit(1);
});
