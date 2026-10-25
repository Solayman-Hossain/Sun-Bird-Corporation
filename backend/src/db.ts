import mongoose, { ClientSession, ConnectOptions } from 'mongoose';
import {
  connectDatabase,
  disconnectDatabase,
  isDatabaseConnected,
  runInTransaction,
  mongooseOptions,
  TransactionOptions,
} from './config/database';

export {
  connectDatabase,
  disconnectDatabase,
  isDatabaseConnected,
  runInTransaction,
  mongooseOptions,
  TransactionOptions,
  ClientSession,
  ConnectOptions,
  mongoose,
};

export default {
  connect: connectDatabase,
  disconnect: disconnectDatabase,
  isConnected: isDatabaseConnected,
  runInTransaction,
  options: mongooseOptions,
  mongoose,
};
