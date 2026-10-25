import { Types } from 'mongoose';
import { SupplierModel, ISupplier, SupplierType, SupplierCurrency } from '../models/Supplier';
import { UserModel } from '../models/User';
import {
  NotFoundError,
  DuplicateKeyError,
  ValidationError,
} from '../errors/AppError';
import logger from '../config/logger';

export interface CreateSupplierDTO {
  supplierCode: string;
  companyName: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  country: string;
  currency: SupplierCurrency;
  supplierType: SupplierType;
  paymentTerms?: string;
  bankDetails?: string;
  swiftCode?: string;
  userId?: string | Types.ObjectId;
  aiRiskScore?: number;
}

export interface UpdateSupplierDTO {
  companyName?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  country?: string;
  currency?: SupplierCurrency;
  supplierType?: SupplierType;
  paymentTerms?: string;
  bankDetails?: string;
  swiftCode?: string;
  userId?: string | Types.ObjectId;
  isActive?: boolean;
  aiRiskScore?: number;
}

export interface HistoricalMetricsDTO {
  totalOrders?: number;
  onTimeDeliveryRate?: number;
  qualityRating?: number;
}

export class SupplierService {
  /**
   * Registers a new vendor / supplier record in the master directory.
   */
  public static async createSupplier(data: CreateSupplierDTO): Promise<ISupplier> {
    const normalizedCode = data.supplierCode.trim().toUpperCase();

    const existing = await SupplierModel.findOne({ supplierCode: normalizedCode });
    if (existing) {
      throw new DuplicateKeyError(`Supplier with code '${normalizedCode}' already exists`);
    }

    if (data.userId) {
      const user = await UserModel.findById(data.userId);
      if (!user) {
        throw new NotFoundError('User', data.userId.toString());
      }
    }

    const supplier = await SupplierModel.create({
      ...data,
      supplierCode: normalizedCode,
      userId: data.userId ? new Types.ObjectId(data.userId) : undefined,
    });

    logger.info(`Supplier registered: ${supplier.companyName} (${supplier.supplierCode})`);
    return supplier;
  }

  /**
   * Updates an existing supplier's details, bank details, or SWIFT code.
   */
  public static async updateSupplier(
    id: string | Types.ObjectId,
    data: UpdateSupplierDTO
  ): Promise<ISupplier> {
    const sId = new Types.ObjectId(id);

    if (data.userId) {
      const user = await UserModel.findById(data.userId);
      if (!user) {
        throw new NotFoundError('User', data.userId.toString());
      }
    }

    const updated = await SupplierModel.findByIdAndUpdate(
      sId,
      {
        $set: {
          ...data,
          userId: data.userId ? new Types.ObjectId(data.userId) : undefined,
        },
      },
      { new: true, runValidators: true }
    );

    if (!updated) {
      throw new NotFoundError('Supplier', sId.toString());
    }

    logger.info(`Supplier updated: ${updated.companyName} (${updated.supplierCode})`);
    return updated;
  }

  /**
   * Links a vendor user to a supplier record.
   */
  public static async linkUserToSupplier(
    supplierId: string | Types.ObjectId,
    userId: string | Types.ObjectId
  ): Promise<ISupplier> {
    const sId = new Types.ObjectId(supplierId);
    const uId = new Types.ObjectId(userId);

    const user = await UserModel.findById(uId);
    if (!user) {
      throw new NotFoundError('User', uId.toString());
    }

    const supplier = await SupplierModel.findByIdAndUpdate(
      sId,
      { $set: { userId: uId } },
      { new: true }
    );

    if (!supplier) {
      throw new NotFoundError('Supplier', sId.toString());
    }

    logger.info(`Linked User ${uId} to Supplier ${supplier.companyName} (${sId})`);
    return supplier;
  }

  /**
   * Retrieves a supplier by MongoDB ObjectId.
   */
  public static async getSupplierById(id: string | Types.ObjectId): Promise<ISupplier> {
    const sId = new Types.ObjectId(id);
    const supplier = await SupplierModel.findById(sId).populate('userId', 'fullName email mobile');

    if (!supplier) {
      throw new NotFoundError('Supplier', sId.toString());
    }

    return supplier;
  }

  /**
   * Retrieves a supplier by linked portal userId.
   */
  public static async getSupplierByUserId(userId: string | Types.ObjectId): Promise<ISupplier> {
    const uId = new Types.ObjectId(userId);
    const supplier = await SupplierModel.findOne({ userId: uId });

    if (!supplier) {
      throw new NotFoundError('Supplier linked to user', uId.toString());
    }

    return supplier;
  }

  /**
   * Updates historical performance metrics (orders count, on-time rate, quality rating).
   */
  public static async updatePerformanceMetrics(
    id: string | Types.ObjectId,
    metrics: HistoricalMetricsDTO
  ): Promise<ISupplier> {
    const sId = new Types.ObjectId(id);
    const supplier = await SupplierModel.findById(sId);

    if (!supplier) {
      throw new NotFoundError('Supplier', sId.toString());
    }

    const currentMetrics = supplier.historicalMetrics || {
      totalOrders: 0,
      onTimeDeliveryRate: 100,
      qualityRating: 5.0,
    };

    const updated = await SupplierModel.findByIdAndUpdate(
      sId,
      {
        $set: {
          historicalMetrics: {
            totalOrders: metrics.totalOrders ?? currentMetrics.totalOrders,
            onTimeDeliveryRate: metrics.onTimeDeliveryRate ?? currentMetrics.onTimeDeliveryRate,
            qualityRating: metrics.qualityRating ?? currentMetrics.qualityRating,
          },
        },
      },
      { new: true }
    );

    return updated!;
  }

  /**
   * Lists suppliers with search, filtering, and pagination.
   */
  public static async listSuppliers(
    filterParams: {
      supplierType?: string;
      country?: string;
      currency?: string;
      isActive?: boolean;
      search?: string;
    },
    pagination: { page?: number; limit?: number }
  ): Promise<{ data: ISupplier[]; total: number; page: number; limit: number; totalPages: number }> {
    const filter: Record<string, any> = {};

    if (filterParams.supplierType) {
      filter.supplierType = filterParams.supplierType;
    }
    if (filterParams.country) {
      filter.country = new RegExp(filterParams.country.trim(), 'i');
    }
    if (filterParams.currency) {
      filter.currency = filterParams.currency.toUpperCase().trim();
    }
    if (filterParams.isActive !== undefined) {
      filter.isActive = filterParams.isActive;
    }
    if (filterParams.search) {
      const searchRegex = new RegExp(filterParams.search.trim(), 'i');
      filter.$or = [
        { supplierCode: searchRegex },
        { companyName: searchRegex },
        { contactPerson: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
      ];
    }

    const page = Math.max(1, pagination.page || 1);
    const limit = Math.min(100, Math.max(1, pagination.limit || 20));
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      SupplierModel.find(filter)
        .populate('userId', 'fullName email mobile')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      SupplierModel.countDocuments(filter),
    ]);

    return {
      data: data as unknown as ISupplier[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}

export default SupplierService;
