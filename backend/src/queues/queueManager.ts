import { Queue, Worker, Job, ConnectionOptions } from 'bullmq';
import { env } from '../config/env';
import { isRedisConnected, redis } from '../config/redis';
import logger from '../config/logger';

export const DEFAULT_JOB_OPTIONS = {
  attempts: 3,
  backoff: {
    type: 'exponential' as const,
    delay: 1000,
  },
  removeOnComplete: true,
  removeOnFail: false,
};

export interface QueueJobResult {
  jobId: string;
  queue: string;
  name: string;
  status: 'COMPLETED' | 'FAILED';
  processedAt: Date;
  data: any;
  result?: any;
}

export const inMemoryJobLog: QueueJobResult[] = [];

// Lazy Queue & Worker instances
let emailQueue: Queue | null = null;
let smsQueue: Queue | null = null;
let inventoryAlertQueue: Queue | null = null;
let dailyCronQueue: Queue | null = null;

let emailWorker: Worker | null = null;
let smsWorker: Worker | null = null;
let inventoryAlertWorker: Worker | null = null;
let dailyCronWorker: Worker | null = null;

function getQueues() {
  if (!isRedisConnected()) {
    return { emailQueue: null, smsQueue: null, inventoryAlertQueue: null, dailyCronQueue: null };
  }

  if (!emailQueue) {
    const connection = redis as any;
    emailQueue = new Queue('email-queue', { connection, defaultJobOptions: DEFAULT_JOB_OPTIONS });
    smsQueue = new Queue('sms-queue', { connection, defaultJobOptions: DEFAULT_JOB_OPTIONS });
    inventoryAlertQueue = new Queue('inventory-alert-queue', { connection, defaultJobOptions: DEFAULT_JOB_OPTIONS });
    dailyCronQueue = new Queue('daily-cron-queue', { connection, defaultJobOptions: DEFAULT_JOB_OPTIONS });

    // Initialize workers with duplicate connections
    emailWorker = new Worker(
      'email-queue',
      async (job: Job) => {
        logger.info(`[EmailQueue] Processing job '${job.name}' (ID: ${job.id})`);
        return { sent: true, deliveredTo: job.data.to, timestamp: new Date() };
      },
      { connection: redis.duplicate() as any }
    );

    smsWorker = new Worker(
      'sms-queue',
      async (job: Job) => {
        logger.info(`[SmsQueue] Processing SMS job '${job.name}' (ID: ${job.id})`);
        return { dispatched: true, mobile: job.data.mobile, timestamp: new Date() };
      },
      { connection: redis.duplicate() as any }
    );

    inventoryAlertWorker = new Worker(
      'inventory-alert-queue',
      async (job: Job) => {
        logger.info(`[InventoryAlertQueue] Processing alert job '${job.name}' for SKU: ${job.data.sku}`);
        return { alertTriggered: true, sku: job.data.sku, timestamp: new Date() };
      },
      { connection: redis.duplicate() as any }
    );

    dailyCronWorker = new Worker(
      'daily-cron-queue',
      async (job: Job) => {
        logger.info(`[DailyCronQueue] Processing midnight cron job '${job.name}'`);
        return { executed: true, jobType: job.name, timestamp: new Date() };
      },
      { connection: redis.duplicate() as any }
    );
  }

  return { emailQueue, smsQueue, inventoryAlertQueue, dailyCronQueue };
}

// ── Fallback In-Memory Processors ───────────────────────────────────────────

async function processInMemory(queue: string, name: string, data: any): Promise<any> {
  const jobId = `job-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  logger.info(`[BullMQ:${queue}] Processing job '${name}' (ID: ${jobId})`);

  let result: any = { executed: true, timestamp: new Date() };
  if (queue === 'email-queue') {
    result = { sent: true, deliveredTo: data.to, timestamp: new Date() };
  } else if (queue === 'sms-queue') {
    result = { dispatched: true, mobile: data.mobile, timestamp: new Date() };
  } else if (queue === 'inventory-alert-queue') {
    result = { alertTriggered: true, sku: data.sku, timestamp: new Date() };
  } else if (queue === 'daily-cron-queue') {
    result = { executed: true, jobType: name, timestamp: new Date() };
  }

  inMemoryJobLog.push({
    jobId,
    queue,
    name,
    status: 'COMPLETED',
    processedAt: new Date(),
    data,
    result,
  });

  return { id: jobId, name, data, returnvalue: result };
}

// ── QueueManager Dispatcher ─────────────────────────────────────────────────

export class QueueManager {
  /**
   * Adds an email notification job (order receipts, purchase orders)
   */
  public static async queueEmail(name: string, data: any): Promise<any> {
    const { emailQueue } = getQueues();
    if (emailQueue) {
      try {
        return await emailQueue.add(name, data);
      } catch (err: any) {
        logger.warn(`Redis queue error. Falling back to local processor: ${err.message}`);
      }
    }
    return processInMemory('email-queue', name, data);
  }

  /**
   * Adds an SMS notification job (OTP dispatch, delivery notifications)
   */
  public static async queueSms(name: string, data: any): Promise<any> {
    const { smsQueue } = getQueues();
    if (smsQueue) {
      try {
        return await smsQueue.add(name, data);
      } catch (err: any) {
        logger.warn(`Redis queue error. Falling back to local processor: ${err.message}`);
      }
    }
    return processInMemory('sms-queue', name, data);
  }

  /**
   * Adds an inventory alert job (near-expiry, low-stock threshold)
   */
  public static async queueInventoryAlert(name: string, data: any): Promise<any> {
    const { inventoryAlertQueue } = getQueues();
    if (inventoryAlertQueue) {
      try {
        return await inventoryAlertQueue.add(name, data);
      } catch (err: any) {
        logger.warn(`Redis queue error. Falling back to local processor: ${err.message}`);
      }
    }
    return processInMemory('inventory-alert-queue', name, data);
  }

  /**
   * Schedules a daily midnight cron task (depreciation, credit profile check)
   */
  public static async queueDailyCron(name: string, data: any): Promise<any> {
    const { dailyCronQueue } = getQueues();
    if (dailyCronQueue) {
      try {
        return await dailyCronQueue.add(name, data);
      } catch (err: any) {
        logger.warn(`Redis queue error. Falling back to local processor: ${err.message}`);
      }
    }
    return processInMemory('daily-cron-queue', name, data);
  }

  /**
   * Cleanly closes all queues and workers
   */
  public static async closeAll(): Promise<void> {
    const closers: Promise<any>[] = [];
    if (emailQueue) closers.push(emailQueue.close());
    if (smsQueue) closers.push(smsQueue.close());
    if (inventoryAlertQueue) closers.push(inventoryAlertQueue.close());
    if (dailyCronQueue) closers.push(dailyCronQueue.close());
    if (emailWorker) closers.push(emailWorker.close());
    if (smsWorker) closers.push(smsWorker.close());
    if (inventoryAlertWorker) closers.push(inventoryAlertWorker.close());
    if (dailyCronWorker) closers.push(dailyCronWorker.close());
    await Promise.allSettled(closers);
  }
}

export default QueueManager;
