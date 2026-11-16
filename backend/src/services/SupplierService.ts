import { Types, PipelineStage } from 'mongoose';
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

  // ─────────────────────────────────────────────────────────
  // Module 05 Extensions
  // ─────────────────────────────────────────────────────────

  /**
   * Supplier ledger: running balance from PurchaseInvoice + SupplierPayment + PurchaseReturn
   */
  public static async getSupplierLedger(
    supplierId: string,
    orgId: string,
    filters?: { startDate?: string; endDate?: string; page?: number; limit?: number }
  ) {
    if (!Types.ObjectId.isValid(supplierId)) throw new NotFoundError('Supplier', supplierId);
    if (!Types.ObjectId.isValid(orgId)) throw new ValidationError('Invalid orgId');

    const supplierObjId = new Types.ObjectId(supplierId);
    const orgObjId = new Types.ObjectId(orgId);

    const supplier = await SupplierModel.findOne({ _id: supplierObjId, organizationId: orgObjId });
    if (!supplier) throw new NotFoundError('Supplier', supplierId);

    // Dynamic model loads
    let PurchaseInvoiceModel: any;
    let SupplierPaymentModel: any;
    let PurchaseReturnModel: any;
    try {
      [PurchaseInvoiceModel, SupplierPaymentModel, PurchaseReturnModel] = await Promise.all([
        import('../models/PurchaseInvoice.js').then((m) => m.PurchaseInvoiceModel),
        import('../models/SupplierPayment.js').then((m) => m.SupplierPaymentModel),
        import('../models/PurchaseReturn.js').then((m) => m.PurchaseReturnModel),
      ]);
    } catch {
      logger.warn('Some purchase models not yet available for ledger computation.');
    }

    const dateMatch: Record<string, any> = {};
    if (filters?.startDate) dateMatch.$gte = new Date(filters.startDate);
    if (filters?.endDate) dateMatch.$lte = new Date(filters.endDate);
    const hasDateFilter = Object.keys(dateMatch).length > 0;

    const ledgerEntries: Array<{
      date: Date;
      type: 'INVOICE' | 'PAYMENT' | 'RETURN';
      reference: string;
      debit: number;
      credit: number;
    }> = [];

    // Invoices (DR: add to payable)
    if (PurchaseInvoiceModel) {
      const invQuery: Record<string, any> = {
        supplierId: supplierObjId,
        organizationId: orgObjId,
        status: { $in: ['POSTED', 'PARTIALLY_PAID', 'PAID', 'OVERDUE'] },
      };
      if (hasDateFilter) invQuery.invoiceDate = dateMatch;
      const invoices = await PurchaseInvoiceModel.find(invQuery).lean();
      for (const inv of invoices) {
        ledgerEntries.push({
          date: inv.invoiceDate,
          type: 'INVOICE',
          reference: inv.invoiceNumber,
          debit: inv.grandTotal,
          credit: 0,
        });
      }
    }

    // Payments (CR: reduce payable)
    if (SupplierPaymentModel) {
      const payQuery: Record<string, any> = {
        supplierId: supplierObjId,
        organizationId: orgObjId,
        status: 'POSTED',
      };
      if (hasDateFilter) payQuery.paymentDate = dateMatch;
      const payments = await SupplierPaymentModel.find(payQuery).lean();
      for (const pay of payments) {
        ledgerEntries.push({
          date: pay.paymentDate,
          type: 'PAYMENT',
          reference: pay.paymentNumber,
          debit: 0,
          credit: pay.paymentAmount,
        });
      }
    }

    // Returns (CR: reduce payable)
    if (PurchaseReturnModel) {
      const retQuery: Record<string, any> = {
        supplierId: supplierObjId,
        organizationId: orgObjId,
        status: 'POSTED',
      };
      if (hasDateFilter) retQuery.returnDate = dateMatch;
      const returns = await PurchaseReturnModel.find(retQuery).lean();
      for (const ret of returns) {
        ledgerEntries.push({
          date: ret.returnDate,
          type: 'RETURN',
          reference: ret.returnNumber,
          debit: 0,
          credit: ret.totalReturnValue,
        });
      }
    }

    // Sort by date
    ledgerEntries.sort((a, b) => a.date.getTime() - b.date.getTime());

    // Compute running balance
    let runningBalance = 0;
    const ledgerWithBalance = ledgerEntries.map((entry) => {
      runningBalance += entry.debit - entry.credit;
      return { ...entry, runningBalance };
    });

    // Pagination
    const page = Math.max(1, filters?.page || 1);
    const limit = Math.min(100, Math.max(1, filters?.limit || 20));
    const total = ledgerWithBalance.length;
    const paginated = ledgerWithBalance.slice((page - 1) * limit, page * limit);

    return {
      supplier: { _id: supplier._id, companyName: supplier.companyName, supplierCode: supplier.supplierCode },
      entries: paginated,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      closingBalance: runningBalance,
    };
  }

  /**
   * Supplier stats: total, active, inactive, by type
   */
  public static async getSupplierStats(
    orgId: string,
    dateRange?: { startDate?: string; endDate?: string }
  ) {
    if (!Types.ObjectId.isValid(orgId)) throw new ValidationError('Invalid orgId');

    const matchStage: Record<string, any> = { organizationId: new Types.ObjectId(orgId) };
    if (dateRange?.startDate || dateRange?.endDate) {
      matchStage.createdAt = {};
      if (dateRange.startDate) matchStage.createdAt.$gte = new Date(dateRange.startDate);
      if (dateRange.endDate) matchStage.createdAt.$lte = new Date(dateRange.endDate);
    }

    const pipeline: PipelineStage[] = [
      { $match: matchStage },
      {
        $group: {
          _id: '$supplierType',
          count: { $sum: 1 },
          active: { $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] } },
          inactive: { $sum: { $cond: [{ $eq: ['$isActive', false] }, 1, 0] } },
        },
      },
      { $sort: { count: -1 } },
    ];

    const byType = await SupplierModel.aggregate<{
      _id: string;
      count: number;
      active: number;
      inactive: number;
    }>(pipeline);

    const totals = byType.reduce(
      (acc, r) => {
        acc.total += r.count;
        acc.active += r.active;
        acc.inactive += r.inactive;
        return acc;
      },
      { total: 0, active: 0, inactive: 0 }
    );

    return {
      ...totals,
      byType: byType.map((r) => ({
        supplierType: r._id,
        count: r.count,
        active: r.active,
        inactive: r.inactive,
      })),
    };
  }

  /**
   * Check for duplicate supplier by phone, email, or BIN (org-scoped)
   */
  public static async checkDuplicateSupplier(
    dto: { phone?: string; email?: string; bin?: string },
    orgId: string
  ) {
    if (!Types.ObjectId.isValid(orgId)) throw new ValidationError('Invalid orgId');

    const checks: Record<string, any>[] = [];
    if (dto.phone) checks.push({ phone: dto.phone.trim(), organizationId: new Types.ObjectId(orgId) });
    if (dto.email) checks.push({ email: dto.email.trim().toLowerCase(), organizationId: new Types.ObjectId(orgId) });
    if (dto.bin) checks.push({ bin: dto.bin.trim(), organizationId: new Types.ObjectId(orgId) });

    if (checks.length === 0) return { isDuplicate: false, matches: [] };

    const matches = await SupplierModel.find({ $or: checks })
      .select('companyName supplierCode email phone bin organizationId')
      .lean();

    return {
      isDuplicate: matches.length > 0,
      matches,
    };
  }

  /**
   * Org-scoped supplier update
   */
  public static async updateSupplierWithOrg(
    id: string,
    dto: UpdateSupplierDTO,
    orgId: string,
    userId: string
  ) {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundError('Supplier', id);
    if (!Types.ObjectId.isValid(orgId)) throw new ValidationError('Invalid orgId');

    const supplier = await SupplierModel.findOne({
      _id: new Types.ObjectId(id),
      organizationId: new Types.ObjectId(orgId),
    });
    if (!supplier) throw new NotFoundError('Supplier', id);

    Object.assign(supplier, {
      ...dto,
      userId: userId ? new Types.ObjectId(userId) : supplier.userId,
    });
    await supplier.save();

    logger.info(`Supplier updated: ${supplier.supplierCode} by user ${userId}`);
    return supplier;
  }
}

export default SupplierService;
