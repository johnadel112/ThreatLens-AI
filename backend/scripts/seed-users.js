import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import User from '../src/models/User.js';
import { ROLES } from '../src/config/constants.js';

dotenv.config();

const users = [
  { name: 'SOC Admin', email: 'admin@threatlens.local', password: 'Admin123!', role: ROLES.ADMIN },
  { name: 'SOC Analyst', email: 'analyst@threatlens.local', password: 'Analyst123!', role: ROLES.ANALYST },
  { name: 'SOC Viewer', email: 'viewer@threatlens.local', password: 'Viewer123!', role: ROLES.VIEWER },
];

async function seed() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/threatlens';
  await mongoose.connect(uri);

  for (const entry of users) {
    const existing = await User.findOne({ email: entry.email });
    if (existing) {
      if (existing.role !== entry.role) {
        existing.role = entry.role;
        await existing.save();
        console.log(`[updated] ${entry.email} role → ${entry.role}`);
      } else {
        console.log(`[skip] ${entry.email} already exists`);
      }
      continue;
    }

    const passwordHash = await bcrypt.hash(entry.password, 12);
    await User.create({ ...entry, passwordHash });
    console.log(`[created] ${entry.email} (${entry.role})`);
  }

  await mongoose.disconnect();
  console.log('[done] Demo users seeded');
}

seed().catch((err) => {
  console.error('[error]', err.message);
  process.exit(1);
});
