import { Types, ClientSession } from 'mongoose';
import {
  StockAdjustmentModel,
  IStockAdjustment,
  IStockAdjustmentItem,
  StockAdjustmentType,
  StockAdjustmentStatus,
} from '../models/StockAdjustment';
import { ProductBatchModel } from '../models/ProductBatch';
import { WarehouseModel } from '../models/Warehouse';
import { StockLedgerModel, StockMovementType } from '../models/StockLedger';
import { ChartOfAccountsModel } from '../models/ChartOfAccounts';
import { AccountingService } from './AccountingService';
import { CounterService } from './CounterService';
import { NotFoundError, ValidationError } from '../errors/AppError';
import logger from '../config/logger';

export interface CreateStockAdjustmentItemDTO {
  productId: string | Types.ObjectId;
  batchId: string | Types.ObjectId;
  binId?: string | Types.ObjectId;
  sku: string;
  batchNumber: string;
  adjustedQty: number;
  reason?: string;
}

export interface CreateStockAdjustmentDTO {
  organizationId?: string | Types.ObjectId;
  warehouseId: string | Types.ObjectId;
  adjustmentType: StockAdjustmentType;
  items: CreateStockAdjustmentItemDTO[];
  remarks?: string;
}

export class StockAdjustmentService {
  private static async ensureAdjustmentAccounts(): Promise<{
    inventoryAssetId: Types.ObjectId;
    shrinkageExpenseId: Types.ObjectId;
    damageExpenseId: Types.ObjectId;
  }> {
    let invAccount = await ChartOfAccountsModel.findOne({ accountCode: 1300 });
    if (!invAccount) {
      invAccount = await ChartOfAccountsModel.create({
        accountCode: 1300,
        accountName: 'Merchandise Inventory Asset',
        accountType: 'ASSET',
        normalBalance: 'DEBIT',
        isControl: true,
        isActive: true,
      });
    }

    let shrinkageAccount = await ChartOfAccountsModel.findOne({ accountCode: 5300 });
    if (!shrinkageAccount) {
      shrinkageAccount = await ChartOfAccountsModel.create({
        accountCode: 5300,
        accountName: 'Inventory Shrinkage & Loss',
        accountType: 'EXPENSE',
        normalBalance: 'DEBIT',
        isControl: false,
        isActive: true,
      });
    }

    let damageAccount = await ChartOfAccountsModel.findOne({ accountCode: 5400 });
    if (!damageAccount) {
      damageAccount = await ChartOfAccountsModel.create({
        accountCode: 5400,
        accountName: 'Damaged & Expired Inventory Expense',
        accountType: 'EXPENSE',
        normalBalance: 'DEBIT',
        isControl: false,
        isActive: true,
      });
    }

    return {
      inventoryAssetId: invAccount._id,
      shrinkageExpenseId: shrinkageAccount._id,
      damageExpenseId: damageAccount._id,
    };
  }

  public static async createAdjustment(
    data: CreateStockAdjustmentDTO,
    userId: string | Types.ObjectId,
    session?: ClientSession
  ): Promise<IStockAdjustment> {
    if (!data.items || data.items.length === 0) {
      throw new ValidationError('Stock adjustment must contain at least one item');
    }

    const warehouse = await WarehouseModel.findById(data.warehouseId);
    if (!warehouse) throw new NotFoundError(`Warehouse not found with ID ${data.warehouseId}`);

    const adjustmentNumber = await CounterService.getNextSequence('ADJ', session);

    let totalValuationChange = 0;
    const items: IStockAdjustmentItem[] = [];

    for (const item of data.items) {
      const batch = await ProductBatchModel.findById(item.batchId);
      if (!batch) {
        throw new NotFoundError(`Batch not found with ID ${item.batchId}`);
      }

      const currentQty = batch.currentQty;
      const adjustedQty = Math.max(0, Number(item.adjustedQty));
      const differenceQty = adjustedQty - currentQty;
      const unitCost = batch.unitCost || 0;
      const totalValueChange = differenceQty * unitCost;

      totalValuationChange += totalValueChange;

      items.push({
        productId: new Types.ObjectId(item.productId),
        batchId: new Types.ObjectId(item.batchId),
        binId: item.binId ? new Types.ObjectId(item.binId) : batch.binId,
        sku: item.sku.toUpperCase().trim(),
        batchNumber: item.batchNumber.trim(),
        currentQty,
        adjustedQty,
        differenceQty,
        unitCost,
        totalValueChange,
        reason: item.reason,
      });
    }

    const adjustment = new StockAdjustmentModel({
      adjustmentNumber,
      organizationId: data.organizationId ? new Types.ObjectId(data.organizationId) : undefined,
      warehouseId: new Types.ObjectId(data.warehouseId),
      adjustmentType: data.adjustmentType,
      status: 'DRAFT',
      items,
      totalValuationChange,
      requestedBy: new Types.ObjectId(userId),
      remarks: data.remarks,
    });

    await adjustment.save({ session });
    logger.info(`Stock adjustment ${adjustmentNumber} created in DRAFT state`);
    return adjustment;
  }

  public static async submitAdjustment(
    id: string | Types.ObjectId,
    userId: string | Types.ObjectId
  ): Promise<IStockAdjustment> {
    const adjustment = await StockAdjustmentModel.findById(id);
    if (!adjustment) throw new NotFoundError(`Stock adjustment not found with ID ${id}`);

    if (adjustment.status !== 'DRAFT') {
      throw new ValidationError(`Adjustment cannot be submitted from status ${adjustment.status}`);
    }

    adjustment.status = 'SUBMITTED';
    await adjustment.save();
    return adjustment;
  }

  public static async approveAdjustment(
    id: string | Types.ObjectId,
    userId: string | Types.ObjectId
  ): Promise<IStockAdjustment> {
    const adjustment = await StockAdjustmentModel.findById(id);
    if (!adjustment) throw new NotFoundError(`Stock adjustment not found with ID ${id}`);

    if (adjustment.status !== 'SUBMITTED' && adjustment.status !== 'DRAFT') {
      throw new ValidationError(`Adjustment cannot be approved from status ${adjustment.status}`);
    }

    adjustment.status = 'APPROVED';
    adjustment.approvedBy = new Types.ObjectId(userId);
    adjustment.approvedAt = new Date();
    await adjustment.save();
    return adjustment;
  }

  public static async postAdjustment(
    id: string | Types.ObjectId,
    userId: string | Types.ObjectId
  ): Promise<IStockAdjustment> {
    const adjustment = await StockAdjustmentModel.findById(id);
    if (!adjustment) throw new NotFoundError(`Stock adjustment not found with ID ${id}`);

    if (adjustment.status === 'POSTED') {
      throw new ValidationError('Adjustment is already posted');
    }

    if (adjustment.status !== 'APPROVED' && adjustment.status !== 'SUBMITTED') {
      throw new ValidationError(`Adjustment must be approved before posting. Current: ${adjustment.status}`);
    }

    // Apply stock modifications and write stock ledger
    for (const item of adjustment.items) {
      const batch = await ProductBatchModel.findById(item.batchId);
      if (!batch) throw new NotFoundError(`Batch ${item.batchId} not found`);

      batch.currentQty = item.adjustedQty;

      if (adjustment.adjustmentType === 'DAMAGED' && item.differenceQty < 0) {
        batch.damagedQty = (batch.damagedQty || 0) + Math.abs(item.differenceQty);
      } else if (adjustment.adjustmentType === 'EXPIRED' && item.differenceQty < 0) {
        batch.expiredQty = (batch.expiredQty || 0) + Math.abs(item.differenceQty);
      }

      await batch.save();

      let movementType: StockMovementType = 'ADJUST';
      if (item.differenceQty > 0) {
        movementType = 'ADJUST_UP';
      } else if (adjustment.adjustmentType === 'SCRAP') {
        movementType = 'SCRAP_WRITE_OFF';
      } else if (adjustment.adjustmentType === 'EXPIRED') {
        movementType = 'EXPIRED_WRITE_OFF';
      } else if (item.differenceQty < 0) {
        movementType = 'ADJUST_DOWN';
      }

      const ledger = new StockLedgerModel({
        organizationId: adjustment.organizationId,
        sku: item.sku,
        batchId: item.batchId,
        warehouseId: adjustment.warehouseId,
        movementType,
        qtyChange: item.differenceQty,
        unitCost: item.unitCost,
        referenceNo: adjustment.adjustmentNumber,
        referenceType: 'ADJUSTMENT',
        createdBy: new Types.ObjectId(userId),
      });
      await ledger.save();
    }

    // Double-entry accounting GL Journal Entry integration
    const absValChange = Math.abs(Number(adjustment.totalValuationChange.toFixed(2)));
    if (absValChange > 0) {
      try {
        const { inventoryAssetId, shrinkageExpenseId, damageExpenseId } =
          await this.ensureAdjustmentAccounts();

        const expenseAccountCode =
          adjustment.adjustmentType === 'DAMAGED' || adjustment.adjustmentType === 'EXPIRED'
            ? 5400
            : 5300;
        const expenseAccountId =
          adjustment.adjustmentType === 'DAMAGED' || adjustment.adjustmentType === 'EXPIRED'
            ? damageExpenseId
            : shrinkageExpenseId;

        const lines =
          adjustment.totalValuationChange < 0
            ? [
                {
                  accountId: expenseAccountId,
                  accountCode: expenseAccountCode,
                  accountName:
                    expenseAccountCode === 5400
                      ? 'Damaged & Expired Inventory Expense'
                      : 'Inventory Shrinkage & Loss',
                  debit: absValChange,
                  credit: 0,
                  description: `Inventory write-down: ${adjustment.adjustmentNumber} (${adjustment.adjustmentType})`,
                },
                {
                  accountId: inventoryAssetId,
                  accountCode: 1300,
                  accountName: 'Merchandise Inventory Asset',
                  debit: 0,
                  credit: absValChange,
                  description: `Inventory reduction: ${adjustment.adjustmentNumber}`,
                },
              ]
            : [
                {
                  accountId: inventoryAssetId,
                  accountCode: 1300,
                  accountName: 'Merchandise Inventory Asset',
                  debit: absValChange,
                  credit: 0,
                  description: `Inventory gain: ${adjustment.adjustmentNumber}`,
                },
                {
                  accountId: expenseAccountId,
                  accountCode: expenseAccountCode,
                  accountName: 'Inventory Shrinkage & Loss',
                  debit: 0,
                  credit: absValChange,
                  description: `Inventory adjustment gain: ${adjustment.adjustmentNumber}`,
                },
              ];

        const jvResult = await AccountingService.createJournalVoucher(
          {
            voucherType: 'JOURNAL',
            sourceDocumentRef: adjustment.adjustmentNumber,
            lines,
            status: 'POSTED',
            notes: `Auto GL Journal for stock adjustment ${adjustment.adjustmentNumber}`,
          },
          userId
        );

        adjustment.journalEntryId = jvResult.journalEntry._id;
      } catch (err: any) {
        logger.error(`Failed to post GL journal for adjustment ${adjustment.adjustmentNumber}: ${err.message}`);
      }
    }

    adjustment.status = 'POSTED';
    adjustment.postedBy = new Types.ObjectId(userId);
    adjustment.postedAt = new Date();
    await adjustment.save();

    logger.info(`Stock adjustment ${adjustment.adjustmentNumber} successfully POSTED`);
    return adjustment;
  }

  public static async rejectAdjustment(
    id: string | Types.ObjectId,
    reason: string,
    userId: string | Types.ObjectId
  ): Promise<IStockAdjustment> {
    const adjustment = await StockAdjustmentModel.findById(id);
    if (!adjustment) throw new NotFoundError(`Stock adjustment not found with ID ${id}`);

    if (adjustment.status === 'POSTED') {
      throw new ValidationError('Cannot reject already posted adjustment');
    }

    adjustment.status = 'REJECTED';
    adjustment.remarks = `${adjustment.remarks || ''}\nRejected: ${reason}`.trim();
    await adjustment.save();
    return adjustment;
  }

  public static async getAdjustments(filters: {
    warehouseId?: string | Types.ObjectId;
    adjustmentType?: StockAdjustmentType;
    status?: StockAdjustmentStatus;
    search?: string;
    organizationId?: string | Types.ObjectId;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, Number(filters.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(filters.limit) || 20));
    const skip = (page - 1) * limit;

    const query: any = {};
    if (filters.organizationId) query.organizationId = filters.organizationId;
    if (filters.warehouseId) query.warehouseId = filters.warehouseId;
    if (filters.adjustmentType) query.adjustmentType = filters.adjustmentType;
    if (filters.status) query.status = filters.status;
    if (filters.search) {
      const regex = new RegExp(filters.search.trim(), 'i');
      query.$or = [{ adjustmentNumber: regex }, { remarks: regex }];
    }

    const [items, total] = await Promise.all([
      StockAdjustmentModel.find(query)
        .populate('warehouseId', 'name warehouseCode')
        .populate('requestedBy', 'name email')
        .populate('approvedBy', 'name email')
        .populate('journalEntryId', 'voucherNumber status')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      StockAdjustmentModel.countDocuments(query),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  public static async getAdjustmentById(id: string | Types.ObjectId): Promise<IStockAdjustment> {
    const adjustment = await StockAdjustmentModel.findById(id)
      .populate('warehouseId', 'name warehouseCode address')
      .populate('items.productId', 'name sku uom')
      .populate('items.batchId', 'batchNumber expiryDate unitCost')
      .populate('items.binId', 'binCode zone aisle')
      .populate('requestedBy', 'name email')
      .populate('approvedBy', 'name email')
      .populate('journalEntryId');

    if (!adjustment) throw new NotFoundError(`Stock adjustment not found with ID ${id}`);
    return adjustment;
  }
}
