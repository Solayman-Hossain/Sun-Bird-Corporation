import mongoose from 'mongoose';
import { connectDatabase } from '../config/database';

beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    await connectDatabase();
  }
});
