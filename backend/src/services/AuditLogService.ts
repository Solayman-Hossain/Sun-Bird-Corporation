import { ClientSession, Types } from 'mongoose';
import { AuditLogModel, IAuditLog } from '../models/AuditLog';
import { ValidationError, NotFoundError } from '../errors/AppError';
import logger from '../config/logger';

export interface AuditEntryDTO {
  actorId: string | Types.ObjectId;
  actorRole: string;
  action: string;
  targetCollection: string;
  targetId: string | Types.ObjectId;
  beforeSnapshot?: any;
  afterSnapshot?: any;
  ipAddress?: string;
  userAgent?: string;
  notes?: string;
}

export interface AuditLogFilterDTO {
  actorId?: string | Types.ObjectId;
  action?: string;
  targetCollection?: string;
  targetId?: string | Types.ObjectId;
  startDate?: Date | string;
  endDate?: Date | string;
  page?: number;
  limit?: number;
}

export class AuditLogService {
  /**
   * Appends an immutable, tamper-proof record to the system audit trail.
   */
  public static async logAction(
    entry: AuditEntryDTO,
    session?: ClientSession
  ): Promise<IAuditLog> {
    if (!entry.actorId) {
      throw new ValidationError('actorId is required for audit logging');
    }
    if (!entry.action) {
      throw new ValidationError('action name is required for audit logging');
    }
    if (!entry.targetCollection) {
      throw new ValidationError('targetCollection is required for audit logging');
    }
    if (!entry.targetId) {
      throw new ValidationError('targetId is required for audit logging');
    }

    const log = new AuditLogModel({
      actorId: new Types.ObjectId(entry.actorId),
      actorRole: entry.actorRole || 'SYSTEM',
      action: entry.action.trim().toUpperCase(),
      targetCollection: entry.targetCollection.trim(),
      targetId: new Types.ObjectId(entry.targetId),
      beforeSnapshot: entry.beforeSnapshot,
      afterSnapshot: entry.afterSnapshot,
      ipAddress: entry.ipAddress,
      userAgent: entry.userAgent,
      notes: entry.notes,
    });

    await log.save({ session });
    logger.debug(
      `Audit entry recorded: ${log.action} on ${log.targetCollection}:${log.targetId} by actor ${log.actorId}`
    );

    return log;
  }

  /**
   * Queries chronological audit records with multi-dimensional filtering.
   */
  public static async queryAuditLogs(filter: AuditLogFilterDTO = {}) {
    const query: any = {};

    if (filter.actorId) {
      query.actorId = new Types.ObjectId(filter.actorId);
    }
    if (filter.action) {
      query.action = filter.action.trim().toUpperCase();
    }
    if (filter.targetCollection) {
      query.targetCollection = filter.targetCollection.trim();
    }
    if (filter.targetId) {
      query.targetId = new Types.ObjectId(filter.targetId);
    }
    if (filter.startDate || filter.endDate) {
      query.createdAt = {};
      if (filter.startDate) query.createdAt.$gte = new Date(filter.startDate);
      if (filter.endDate) query.createdAt.$lte = new Date(filter.endDate);
    }

    const page = Math.max(1, filter.page || 1);
    const limit = Math.min(100, Math.max(1, filter.limit || 20));
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      AuditLogModel.find(query)
        .populate('actorId', 'fullName email mobile userType')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      AuditLogModel.countDocuments(query),
    ]);

    return {
      logs,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Retrieves full chronological change history for a specific business document.
   */
  public static async getHistoryForResource(
    targetCollection: string,
    targetId: string | Types.ObjectId
  ): Promise<IAuditLog[]> {
    return AuditLogModel.find({
      targetCollection: targetCollection.trim(),
      targetId: new Types.ObjectId(targetId),
    })
      .populate('actorId', 'fullName email userType')
      .sort({ createdAt: -1 });
  }
}

export default AuditLogService;
