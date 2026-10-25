import { ClientSession, Types } from 'mongoose';
import {
  CrmActivityModel,
  ICrmActivity,
  CrmActivityType,
  CrmActivityStatus,
} from '../models/CrmActivity';
import { CustomerModel } from '../models/Customer';
import { UserModel } from '../models/User';
import { CounterService } from './CounterService';
import { ValidationError, NotFoundError } from '../errors/AppError';
import logger from '../config/logger';

export interface CreateCrmActivityDTO {
  activityNumber?: string;
  activityType: CrmActivityType;
  customerId?: string | Types.ObjectId;
  leadName?: string;
  contactMobile: string;
  assignedStaffId?: string | Types.ObjectId;
  notes: string;
  followUpDate?: Date | string;
  status?: CrmActivityStatus;
  outcome?: string;
}

export interface UpdateCrmActivityDTO {
  notes?: string;
  followUpDate?: Date | string;
  status?: CrmActivityStatus;
  outcome?: string;
  assignedStaffId?: string | Types.ObjectId;
}

export interface CrmFilterDTO {
  activityType?: CrmActivityType;
  status?: CrmActivityStatus;
  assignedStaffId?: string | Types.ObjectId;
  customerId?: string | Types.ObjectId;
  contactMobile?: string;
  upcomingFollowUps?: boolean;
  page?: number;
  limit?: number;
}

export class CrmService {
  /**
   * Creates a new CRM activity (Doctor visit, Lead, Hospital equipment demo, Complaint).
   */
  public static async createActivity(
    dto: CreateCrmActivityDTO,
    session?: ClientSession
  ): Promise<ICrmActivity> {
    if (!dto.activityType) {
      throw new ValidationError('activityType is required');
    }
    if (!dto.contactMobile || !dto.contactMobile.trim()) {
      throw new ValidationError('contactMobile is required for CRM activity');
    }
    if (!dto.notes || !dto.notes.trim()) {
      throw new ValidationError('notes/meeting summary is required');
    }

    if (dto.customerId) {
      const customer = await CustomerModel.findById(dto.customerId).session(session || null);
      if (!customer) {
        throw new NotFoundError(`Customer with ID ${dto.customerId} not found`);
      }
    }

    if (dto.assignedStaffId) {
      const staff = await UserModel.findById(dto.assignedStaffId).session(session || null);
      if (!staff) {
        throw new NotFoundError(`Assigned Staff with ID ${dto.assignedStaffId} not found`);
      }
    }

    // Atomic sequence number generation (e.g. CRM-2026-00001)
    const activityNumber =
      dto.activityNumber?.trim().toUpperCase() ||
      (await CounterService.getNextSequence('CRM', session));

    const activity = new CrmActivityModel({
      activityNumber,
      activityType: dto.activityType,
      customerId: dto.customerId ? new Types.ObjectId(dto.customerId) : undefined,
      leadName: dto.leadName?.trim(),
      contactMobile: dto.contactMobile.trim(),
      assignedStaffId: dto.assignedStaffId ? new Types.ObjectId(dto.assignedStaffId) : undefined,
      notes: dto.notes.trim(),
      followUpDate: dto.followUpDate ? new Date(dto.followUpDate) : undefined,
      status: dto.status || 'OPEN',
      outcome: dto.outcome?.trim(),
    });

    await activity.save({ session });
    logger.info(
      `CRM Activity created: ${activity.activityNumber} [${activity.activityType}] for contact ${activity.contactMobile}`
    );

    return activity;
  }

  /**
   * Updates an existing CRM activity (notes, follow-up date, resolution outcome).
   */
  public static async updateActivity(
    id: string | Types.ObjectId,
    dto: UpdateCrmActivityDTO,
    session?: ClientSession
  ): Promise<ICrmActivity> {
    const activity = await CrmActivityModel.findById(id).session(session || null);
    if (!activity) {
      throw new NotFoundError(`CRM Activity with ID ${id} not found`);
    }

    if (dto.notes !== undefined) activity.notes = dto.notes.trim();
    if (dto.followUpDate !== undefined) {
      activity.followUpDate = dto.followUpDate ? new Date(dto.followUpDate) : undefined;
    }
    if (dto.status !== undefined) activity.status = dto.status;
    if (dto.outcome !== undefined) activity.outcome = dto.outcome.trim();
    if (dto.assignedStaffId !== undefined) {
      activity.assignedStaffId = dto.assignedStaffId
        ? new Types.ObjectId(dto.assignedStaffId)
        : undefined;
    }

    await activity.save({ session });
    logger.info(`CRM Activity updated: ${activity.activityNumber}`);
    return activity;
  }

  /**
   * Queries CRM activities with multi-field filtering and pagination.
   */
  public static async listActivities(filter: CrmFilterDTO = {}) {
    const query: any = {};

    if (filter.activityType) query.activityType = filter.activityType;
    if (filter.status) query.status = filter.status;
    if (filter.assignedStaffId) {
      query.assignedStaffId = new Types.ObjectId(filter.assignedStaffId);
    }
    if (filter.customerId) query.customerId = new Types.ObjectId(filter.customerId);
    if (filter.contactMobile) {
      query.contactMobile = { $regex: filter.contactMobile.trim(), $options: 'i' };
    }
    if (filter.upcomingFollowUps) {
      query.followUpDate = { $gte: new Date() };
    }

    const page = Math.max(1, filter.page || 1);
    const limit = Math.min(100, Math.max(1, filter.limit || 20));
    const skip = (page - 1) * limit;

    const [activities, total] = await Promise.all([
      CrmActivityModel.find(query)
        .populate('customerId', 'name mobile email companyName')
        .populate('assignedStaffId', 'fullName email mobile')
        .sort({ followUpDate: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      CrmActivityModel.countDocuments(query),
    ]);

    return {
      activities,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Retrieves upcoming scheduled follow-ups (e.g. for the next 7 days).
   */
  public static async getUpcomingFollowUps(
    daysAhead: number = 7,
    staffId?: string | Types.ObjectId
  ): Promise<ICrmActivity[]> {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(now.getDate() + daysAhead);

    const query: any = {
      followUpDate: { $gte: now, $lte: futureDate },
      status: { $in: ['OPEN', 'IN_PROGRESS'] },
    };

    if (staffId) {
      query.assignedStaffId = new Types.ObjectId(staffId);
    }

    return CrmActivityModel.find(query)
      .populate('customerId', 'name mobile email')
      .populate('assignedStaffId', 'fullName email')
      .sort({ followUpDate: 1 });
  }

  /**
   * Retrieves single CRM activity by ID.
   */
  public static async getActivityById(id: string | Types.ObjectId) {
    const activity = await CrmActivityModel.findById(id)
      .populate('customerId', 'name mobile email companyName address')
      .populate('assignedStaffId', 'fullName email mobile');

    if (!activity) {
      throw new NotFoundError(`CRM Activity with ID ${id} not found`);
    }
    return activity;
  }
}

export default CrmService;
