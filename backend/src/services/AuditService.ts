import { Types } from 'mongoose';
import { AuditLogModel, IAuditLog } from '../models/AuditLog';
import { NotFoundError } from '../errors/AppError';

export class AuditService {
  /**
   * List immutable audit logs with search and pagination
   */
  public static async listAuditLogs(
    filterParams: {
      organizationId?: string;
      module?: string;
      action?: string;
      actorId?: string;
      targetCollection?: string;
      targetId?: string;
      search?: string;
      startDate?: string;
      endDate?: string;
    } = {},
    page: number = 1,
    limit: number = 50
  ) {
    const query: Record<string, any> = {};

    if (filterParams.organizationId && Types.ObjectId.isValid(filterParams.organizationId)) {
      query.$or = [
        { organizationId: new Types.ObjectId(filterParams.organizationId) },
        { organizationId: null },
      ];
    }

    if (filterParams.module) {
      query.module = filterParams.module.toUpperCase().trim();
    }

    if (filterParams.action) {
      query.action = new RegExp(filterParams.action.trim(), 'i');
    }

    if (filterParams.actorId && Types.ObjectId.isValid(filterParams.actorId)) {
      query.actorId = new Types.ObjectId(filterParams.actorId);
    }

    if (filterParams.targetCollection) {
      query.targetCollection = filterParams.targetCollection.trim();
    }

    if (filterParams.targetId && Types.ObjectId.isValid(filterParams.targetId)) {
      query.targetId = new Types.ObjectId(filterParams.targetId);
    }

    if (filterParams.startDate || filterParams.endDate) {
      query.createdAt = {};
      if (filterParams.startDate) query.createdAt.$gte = new Date(filterParams.startDate);
      if (filterParams.endDate) query.createdAt.$lte = new Date(filterParams.endDate);
    }

    if (filterParams.search) {
      const searchRegex = new RegExp(filterParams.search.trim(), 'i');
      query.$or = [
        { action: searchRegex },
        { notes: searchRegex },
        { targetCollection: searchRegex },
        { actorNameSnapshot: searchRegex },
      ];
    }

    const safePage = Math.max(1, page);
    const safeLimit = Math.min(100, Math.max(1, limit));
    const skip = (safePage - 1) * safeLimit;

    const [logs, total] = await Promise.all([
      AuditLogModel.find(query)
        .populate('actorId', 'fullName email userType designation')
        .populate('organizationId', 'organizationCode displayName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLimit)
        .lean(),
      AuditLogModel.countDocuments(query),
    ]);

    return {
      logs,
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit),
    };
  }

  /**
   * Get single audit record by ID
   */
  public static async getAuditLogById(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundError('AuditLog', id);
    }

    const log = await AuditLogModel.findById(id)
      .populate('actorId', 'fullName email userType designation department')
      .populate('organizationId', 'organizationCode displayName legalName');

    if (!log) {
      throw new NotFoundError('AuditLog', id);
    }

    return log;
  }

  /**
   * Aggregate audit reporting metrics
   */
  public static async getAuditReports(organizationId?: string) {
    const baseMatch: Record<string, any> = {};
    if (organizationId && Types.ObjectId.isValid(organizationId)) {
      baseMatch.$or = [
        { organizationId: new Types.ObjectId(organizationId) },
        { organizationId: null },
      ];
    }

    const [byAction, byModule, byActor, totalEvents] = await Promise.all([
      AuditLogModel.aggregate([
        { $match: baseMatch },
        { $group: { _id: '$action', count: { $sum: 1 } } },
        { $project: { action: '$_id', count: 1, _id: 0 } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      AuditLogModel.aggregate([
        { $match: baseMatch },
        { $group: { _id: { $ifNull: ['$module', 'SYSTEM'] }, count: { $sum: 1 } } },
        { $project: { module: '$_id', count: 1, _id: 0 } },
        { $sort: { count: -1 } },
      ]),
      AuditLogModel.aggregate([
        { $match: baseMatch },
        {
          $lookup: {
            from: 'users',
            localField: 'actorId',
            foreignField: '_id',
            as: 'user',
          },
        },
        { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: { $ifNull: ['$user.fullName', '$actorNameSnapshot', 'System'] },
            count: { $sum: 1 },
          },
        },
        { $project: { actorName: '$_id', count: 1, _id: 0 } },
        { $sort: { count: -1 } },
        { $limit: 8 },
      ]),
      AuditLogModel.countDocuments(baseMatch),
    ]);

    return {
      totalEvents,
      byAction,
      byModule,
      byActor,
    };
  }

  /**
   * Field-level change detection utility
   */
  public static computeFieldDiffs(before: any, after: any): Array<{ field: string; before: any; after: any }> {
    if (!before && !after) return [];
    if (!before) return Object.keys(after).map((k) => ({ field: k, before: null, after: after[k] }));
    if (!after) return Object.keys(before).map((k) => ({ field: k, before: before[k], after: null }));

    const diffs: Array<{ field: string; before: any; after: any }> = [];
    const allKeys = Array.from(new Set([...Object.keys(before), ...Object.keys(after)]));

    for (const key of allKeys) {
      if (key === '_id' || key === '__v' || key === 'updatedAt' || key === 'createdAt') continue;
      const bVal = JSON.stringify(before[key]);
      const aVal = JSON.stringify(after[key]);
      if (bVal !== aVal) {
        diffs.push({
          field: key,
          before: before[key],
          after: after[key],
        });
      }
    }

    return diffs;
  }
}

export default AuditService;

