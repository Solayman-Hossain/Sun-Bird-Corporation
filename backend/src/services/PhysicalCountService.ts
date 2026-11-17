import { Types, ClientSession } from 'mongoose';
import {
  PhysicalCountModel,
  IPhysicalCount,
  IPhysicalCountItem,
  PhysicalCountType,
  PhysicalCountStatus,
} from '../models/PhysicalCount';
import { ProductBatchModel } from '../models/ProductBatch';
import { WarehouseModel } from '../models/Warehouse';
import { StockAdjustmentService } from './StockAdjustmentService';
import { CounterService } from './CounterService';
import { NotFoundError, ValidationError } from '../errors/AppError';
import logger from '../config/logger';

export interface CreatePhysicalCountDTO {
  organizationId?: string | Types.ObjectId;
  warehouseId: string | Types.ObjectId;
  countType?: PhysicalCountType;
  countDate?: Date;
  remarks?: string;
  categoryIds?: string[];
  binIds?: string[];
}

export interface RecordCountItemDTO {
  batchId: string | Types.ObjectId;
  countedQty: number;
  notes?: string;
}

export class PhysicalCountService {
  public static async createCount(
    data: CreatePhysicalCountDTO,
    userId: string | Types.ObjectId,
    session?: ClientSession
  ): Promise<IPhysicalCount> {
    const warehouse = await WarehouseModel.findById(data.warehouseId);
    if (!warehouse) throw new NotFoundError(`Warehouse not found with ID ${data.warehouseId}`);

    const countNumber = await CounterService.getNextSequence('STK_CNT', session);

    // Query active batches in this warehouse
    const batchQuery: any = { warehouseId: data.warehouseId };
    if (data.organizationId) batchQuery.organizationId = data.organizationId;
    if (data.binIds && data.binIds.length > 0) {
      batchQuery.binId = { $in: data.binIds.map((b) => new Types.ObjectId(b)) };
    }

    const batches = await ProductBatchModel.find(batchQuery).populate('productId', 'name sku uom category');

    const items: IPhysicalCountItem[] = batches.map((batch) => {
      const systemQty = batch.currentQty || 0;
      const countedQty = 0;
      const varianceQty = countedQty - systemQty;
      const unitCost = batch.unitCost || 0;
      const varianceValue = varianceQty * unitCost;

      return {
        productId: batch.productId._id as Types.ObjectId,
        batchId: batch._id,
        binId: batch.binId,
        sku: batch.sku,
        batchNumber: batch.batchNumber,
        systemQty,
        countedQty,
        varianceQty,
        unitCost,
        varianceValue,
      };
    });

    const totalVarianceValue = items.reduce((sum, it) => sum + it.varianceValue, 0);

    const physicalCount = new PhysicalCountModel({
      countNumber,
      organizationId: data.organizationId ? new Types.ObjectId(data.organizationId) : undefined,
      warehouseId: new Types.ObjectId(data.warehouseId),
      countDate: data.countDate || new Date(),
      countType: data.countType || 'FULL',
      status: 'PLANNED',
      items,
      totalVarianceValue,
      conductedBy: new Types.ObjectId(userId),
      remarks: data.remarks,
    });

    await physicalCount.save({ session });
    logger.info(`Physical stock count ${countNumber} created with ${items.length} items`);
    return physicalCount;
  }

  public static async recordCountItems(
    id: string | Types.ObjectId,
    countedItems: RecordCountItemDTO[],
    userId: string | Types.ObjectId
  ): Promise<IPhysicalCount> {
    const count = await PhysicalCountModel.findById(id);
    if (!count) throw new NotFoundError(`Physical count not found with ID ${id}`);

    if (count.status === 'RECONCILED' || count.status === 'CANCELLED') {
      throw new ValidationError(`Cannot record counts when status is ${count.status}`);
    }

    const countMap = new Map<string, { countedQty: number; notes?: string }>();
    for (const ci of countedItems) {
      countMap.set(ci.batchId.toString(), {
        countedQty: Math.max(0, Number(ci.countedQty)),
        notes: ci.notes,
      });
    }

    let totalVarianceValue = 0;

    for (const item of count.items) {
      const rec = countMap.get(item.batchId.toString());
      if (rec !== undefined) {
        item.countedQty = rec.countedQty;
        item.varianceQty = item.countedQty - item.systemQty;
        item.varianceValue = item.varianceQty * item.unitCost;
        item.countedBy = new Types.ObjectId(userId);
        item.countedAt = new Date();
        if (rec.notes) item.notes = rec.notes;
      }
      totalVarianceValue += item.varianceValue;
    }

    count.totalVarianceValue = totalVarianceValue;
    count.status = 'COMPLETED';
    await count.save();

    logger.info(`Physical count ${count.countNumber} updated and marked COMPLETED`);
    return count;
  }

  public static async reconcileCount(
    id: string | Types.ObjectId,
    userId: string | Types.ObjectId
  ): Promise<IPhysicalCount> {
    const count = await PhysicalCountModel.findById(id);
    if (!count) throw new NotFoundError(`Physical count not found with ID ${id}`);

    if (count.status === 'RECONCILED') {
      throw new ValidationError('Physical count has already been reconciled');
    }

    if (count.status !== 'COMPLETED') {
      throw new ValidationError(`Physical count must be COMPLETED before reconciliation. Current: ${count.status}`);
    }

    const varianceItems = count.items.filter((it) => it.varianceQty !== 0);

    if (varianceItems.length > 0) {
      // Create and post auto Stock Adjustment
      const adjustment = await StockAdjustmentService.createAdjustment(
        {
          organizationId: count.organizationId,
          warehouseId: count.warehouseId,
          adjustmentType: 'COUNT_VARIANCE',
          items: varianceItems.map((vi) => ({
            productId: vi.productId,
            batchId: vi.batchId,
            binId: vi.binId,
            sku: vi.sku,
            batchNumber: vi.batchNumber,
            adjustedQty: vi.countedQty,
            reason: `Reconciliation from count ${count.countNumber}: variance of ${vi.varianceQty}`,
          })),
          remarks: `Auto-reconciliation for physical count ${count.countNumber}`,
        },
        userId
      );

      await StockAdjustmentService.approveAdjustment(adjustment._id, userId);
      await StockAdjustmentService.postAdjustment(adjustment._id, userId);

      count.reconciliationAdjustmentId = adjustment._id;
    }

    count.status = 'RECONCILED';
    count.reconciledBy = new Types.ObjectId(userId);
    count.reconciledAt = new Date();
    await count.save();

    logger.info(`Physical count ${count.countNumber} successfully RECONCILED`);
    return count;
  }

  public static async getCounts(filters: {
    warehouseId?: string | Types.ObjectId;
    countType?: PhysicalCountType;
    status?: PhysicalCountStatus;
    organizationId?: string | Types.ObjectId;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, Number(filters.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(filters.limit) || 20));
    const skip = (page - 1) * limit;

    const query: any = {};
    if (filters.organizationId) query.organizationId = filters.organizationId;
    if (filters.warehouseId) query.warehouseId = filters.warehouseId;
    if (filters.countType) query.countType = filters.countType;
    if (filters.status) query.status = filters.status;
    if (filters.search) {
      const regex = new RegExp(filters.search.trim(), 'i');
      query.$or = [{ countNumber: regex }, { remarks: regex }];
    }

    const [items, total] = await Promise.all([
      PhysicalCountModel.find(query)
        .populate('warehouseId', 'name warehouseCode')
        .populate('conductedBy', 'name email')
        .populate('reconciledBy', 'name email')
        .populate('reconciliationAdjustmentId', 'adjustmentNumber status')
        .sort({ countDate: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      PhysicalCountModel.countDocuments(query),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  public static async getCountById(id: string | Types.ObjectId): Promise<IPhysicalCount> {
    const count = await PhysicalCountModel.findById(id)
      .populate('warehouseId', 'name warehouseCode address')
      .populate('items.productId', 'name sku uom category')
      .populate('items.batchId', 'batchNumber expiryDate unitCost')
      .populate('items.binId', 'binCode zone aisle')
      .populate('conductedBy', 'name email')
      .populate('reconciledBy', 'name email')
      .populate('reconciliationAdjustmentId');

    if (!count) throw new NotFoundError(`Physical count not found with ID ${id}`);
    return count;
  }
}
