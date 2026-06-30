import dotenv from 'dotenv';

dotenv.config();

export const config = {
  backendUrl: process.env.BACKEND_URL || 'http://localhost:4000/api',
  apiKey: process.env.SIMULATOR_API_KEY || '',
};
