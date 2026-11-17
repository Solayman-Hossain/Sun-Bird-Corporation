import { Types, ClientSession } from 'mongoose';
import {
  StockTransferModel,
  IStockTransfer,
  IStockTransferItem,
  StockTransferStatus,
} from '../models/StockTransfer';
import { ProductBatchModel } from '../models/ProductBatch';
import { WarehouseModel } from '../models/Warehouse';
import { StockLedgerModel } from '../models/StockLedger';
import { CounterService } from './CounterService';
import { NotFoundError, ValidationError, InsufficientStockError } from '../errors/AppError';
import logger from '../config/logger';

export interface CreateStockTransferItemDTO {
  productId: string | Types.ObjectId;
  batchId: string | Types.ObjectId;
  sourceBinId?: string | Types.ObjectId;
  destBinId?: string | Types.ObjectId;
  sku: string;
  batchNumber: string;
  requestedQty: number;
  uom?: string;
  unitCost: number;
  notes?: string;
}

export interface CreateStockTransferDTO {
  organizationId?: string | Types.ObjectId;
  sourceWarehouseId: string | Types.ObjectId;
  destinationWarehouseId: string | Types.ObjectId;
  items: CreateStockTransferItemDTO[];
  vehicleNumber?: string;
  driverName?: string;
  driverPhone?: string;
  remarks?: string;
}

export interface DispatchStockTransferDTO {
  dispatchedItems?: Array<{
    batchId: string | Types.ObjectId;
    dispatchedQty: number;
  }>;
  vehicleNumber?: string;
  driverName?: string;
  driverPhone?: string;
  challanNumber?: string;
  remarks?: string;
}

export interface ReceiveStockTransferDTO {
  receivedItems?: Array<{
    batchId: string | Types.ObjectId;
    receivedQty: number;
    damagedQty?: number;
    destBinId?: string | Types.ObjectId;
  }>;
  remarks?: string;
}

export class StockTransferService {
  public static async createTransfer(
    data: CreateStockTransferDTO,
    userId: string | Types.ObjectId,
    session?: ClientSession
  ): Promise<IStockTransfer> {
    if (data.sourceWarehouseId.toString() === data.destinationWarehouseId.toString()) {
      throw new ValidationError('Source and destination warehouse cannot be the same');
    }

    if (!data.items || data.items.length === 0) {
      throw new ValidationError('Transfer must have at least one item');
    }

    const [srcWh, destWh] = await Promise.all([
      WarehouseModel.findById(data.sourceWarehouseId),
      WarehouseModel.findById(data.destinationWarehouseId),
    ]);

    if (!srcWh) throw new NotFoundError(`Source warehouse not found: ${data.sourceWarehouseId}`);
    if (!destWh) throw new NotFoundError(`Destination warehouse not found: ${data.destinationWarehouseId}`);

    // Verify stock availability in source warehouse
    for (const item of data.items) {
      const batch = await ProductBatchModel.findOne({
        _id: item.batchId,
        warehouseId: data.sourceWarehouseId,
      });

      if (!batch) {
        throw new NotFoundError(
          `Batch ${item.batchNumber} (${item.sku}) not found in source warehouse`
        );
      }

      if (batch.currentQty < item.requestedQty) {
        throw new InsufficientStockError(item.sku, item.requestedQty, batch.currentQty);
      }
    }

    const transferNumber = await CounterService.getNextSequence('TRF', session);

    let totalQuantity = 0;
    let totalValue = 0;

    const items: IStockTransferItem[] = data.items.map((it) => {
      totalQuantity += it.requestedQty;
      const val = it.requestedQty * it.unitCost;
      totalValue += val;

      return {
        productId: new Types.ObjectId(it.productId),
        batchId: new Types.ObjectId(it.batchId),
        sourceBinId: it.sourceBinId ? new Types.ObjectId(it.sourceBinId) : undefined,
        destBinId: it.destBinId ? new Types.ObjectId(it.destBinId) : undefined,
        sku: it.sku.toUpperCase().trim(),
        batchNumber: it.batchNumber.trim(),
        requestedQty: it.requestedQty,
        dispatchedQty: 0,
        receivedQty: 0,
        damagedQty: 0,
        uom: it.uom || 'PIECE',
        unitCost: it.unitCost,
        notes: it.notes,
      };
    });

    const transfer = new StockTransferModel({
      transferNumber,
      organizationId: data.organizationId ? new Types.ObjectId(data.organizationId) : undefined,
      sourceWarehouseId: new Types.ObjectId(data.sourceWarehouseId),
      destinationWarehouseId: new Types.ObjectId(data.destinationWarehouseId),
      status: 'DRAFT',
      items,
      totalQuantity,
      totalValue,
      requestedBy: new Types.ObjectId(userId),
      vehicleNumber: data.vehicleNumber,
      driverName: data.driverName,
      driverPhone: data.driverPhone,
      remarks: data.remarks,
    });

    await transfer.save({ session });
    logger.info(`Stock transfer ${transferNumber} created in DRAFT state`);
    return transfer;
  }

  public static async submitTransfer(
    id: string | Types.ObjectId,
    userId: string | Types.ObjectId
  ): Promise<IStockTransfer> {
    const transfer = await StockTransferModel.findById(id);
    if (!transfer) throw new NotFoundError(`Stock transfer not found with ID ${id}`);

    if (transfer.status !== 'DRAFT') {
      throw new ValidationError(`Transfer cannot be submitted from status ${transfer.status}`);
    }

    transfer.status = 'SUBMITTED';
    await transfer.save();
    return transfer;
  }

  public static async approveTransfer(
    id: string | Types.ObjectId,
    userId: string | Types.ObjectId
  ): Promise<IStockTransfer> {
    const transfer = await StockTransferModel.findById(id);
    if (!transfer) throw new NotFoundError(`Stock transfer not found with ID ${id}`);

    if (transfer.status !== 'SUBMITTED' && transfer.status !== 'DRAFT') {
      throw new ValidationError(`Transfer cannot be approved from status ${transfer.status}`);
    }

    transfer.status = 'APPROVED';
    transfer.approvedBy = new Types.ObjectId(userId);
    transfer.approvedAt = new Date();
    await transfer.save();
    return transfer;
  }

  public static async dispatchTransfer(
    id: string | Types.ObjectId,
    dto: DispatchStockTransferDTO,
    userId: string | Types.ObjectId
  ): Promise<IStockTransfer> {
    const transfer = await StockTransferModel.findById(id);
    if (!transfer) throw new NotFoundError(`Stock transfer not found with ID ${id}`);

    if (transfer.status !== 'APPROVED') {
      throw new ValidationError(`Transfer cannot be dispatched from status ${transfer.status}`);
    }

    for (const item of transfer.items) {
      const override = dto.dispatchedItems?.find(
        (di) => di.batchId.toString() === item.batchId.toString()
      );
      const dispatchQty = override ? override.dispatchedQty : item.requestedQty;

      const sourceBatch = await ProductBatchModel.findById(item.batchId);
      if (!sourceBatch) {
        throw new NotFoundError(`Source batch ${item.batchId} not found`);
      }

      if (sourceBatch.currentQty < dispatchQty) {
        throw new InsufficientStockError(item.sku, dispatchQty, sourceBatch.currentQty);
      }

      sourceBatch.currentQty -= dispatchQty;
      await sourceBatch.save();

      item.dispatchedQty = dispatchQty;

      // Write immutable ledger
      const ledgerEntry = new StockLedgerModel({
        organizationId: transfer.organizationId,
        sku: item.sku,
        batchId: item.batchId,
        warehouseId: transfer.sourceWarehouseId,
        movementType: 'TRANSFER_OUT',
        qtyChange: -dispatchQty,
        unitCost: item.unitCost,
        referenceNo: transfer.transferNumber,
        referenceType: 'TRANSFER',
        createdBy: new Types.ObjectId(userId),
      });
      await ledgerEntry.save();
    }

    transfer.status = 'IN_TRANSIT';
    transfer.dispatchedBy = new Types.ObjectId(userId);
    transfer.dispatchedAt = new Date();
    if (dto.vehicleNumber) transfer.vehicleNumber = dto.vehicleNumber;
    if (dto.driverName) transfer.driverName = dto.driverName;
    if (dto.driverPhone) transfer.driverPhone = dto.driverPhone;
    if (dto.challanNumber) transfer.challanNumber = dto.challanNumber;
    if (dto.remarks) transfer.remarks = dto.remarks;

    await transfer.save();
    logger.info(`Stock transfer ${transfer.transferNumber} marked IN_TRANSIT`);
    return transfer;
  }

  public static async receiveTransfer(
    id: string | Types.ObjectId,
    dto: ReceiveStockTransferDTO,
    userId: string | Types.ObjectId
  ): Promise<IStockTransfer> {
    const transfer = await StockTransferModel.findById(id);
    if (!transfer) throw new NotFoundError(`Stock transfer not found with ID ${id}`);

    if (transfer.status !== 'IN_TRANSIT') {
      throw new ValidationError(`Transfer cannot be received from status ${transfer.status}`);
    }

    for (const item of transfer.items) {
      const override = dto.receivedItems?.find(
        (ri) => ri.batchId.toString() === item.batchId.toString()
      );
      const receiveQty = override !== undefined ? override.receivedQty : (item.dispatchedQty || item.requestedQty);
      const damagedQty = override?.damagedQty || 0;
      const destBinId = override?.destBinId || item.destBinId;

      const sourceBatch = await ProductBatchModel.findById(item.batchId);
      if (!sourceBatch) {
        throw new NotFoundError(`Source batch ${item.batchId} not found`);
      }

      // Find or create batch at destination warehouse
      let destBatch = await ProductBatchModel.findOne({
        sku: item.sku,
        batchNumber: item.batchNumber,
        warehouseId: transfer.destinationWarehouseId,
      });

      if (!destBatch) {
        destBatch = new ProductBatchModel({
          organizationId: transfer.organizationId,
          productId: item.productId,
          sku: item.sku,
          batchNumber: item.batchNumber,
          category: sourceBatch.category,
          manufacturingDate: sourceBatch.manufacturingDate,
          expiryDate: sourceBatch.expiryDate,
          baseUom: item.uom,
          currentQty: receiveQty,
          reservedQty: 0,
          damagedQty: damagedQty,
          unitCost: item.unitCost,
          hasIndividualSerials: sourceBatch.hasIndividualSerials,
          warrantyMonths: sourceBatch.warrantyMonths,
          warehouseId: transfer.destinationWarehouseId,
          binId: destBinId ? new Types.ObjectId(destBinId) : undefined,
          locationStatus: 'ON_HAND',
        });
      } else {
        destBatch.currentQty += receiveQty;
        if (damagedQty > 0) {
          destBatch.damagedQty = (destBatch.damagedQty || 0) + damagedQty;
        }
        if (destBinId) {
          destBatch.binId = new Types.ObjectId(destBinId);
        }
      }

      await destBatch.save();

      item.receivedQty = receiveQty;
      item.damagedQty = damagedQty;

      // Write immutable ledger for destination
      const ledgerEntry = new StockLedgerModel({
        organizationId: transfer.organizationId,
        sku: item.sku,
        batchId: destBatch._id,
        warehouseId: transfer.destinationWarehouseId,
        movementType: 'TRANSFER_IN',
        qtyChange: receiveQty,
        unitCost: item.unitCost,
        referenceNo: transfer.transferNumber,
        referenceType: 'TRANSFER',
        createdBy: new Types.ObjectId(userId),
      });
      await ledgerEntry.save();
    }

    transfer.status = 'RECEIVED';
    transfer.receivedBy = new Types.ObjectId(userId);
    transfer.receivedAt = new Date();
    if (dto.remarks) transfer.remarks = dto.remarks;

    await transfer.save();
    logger.info(`Stock transfer ${transfer.transferNumber} received at destination warehouse`);
    return transfer;
  }

  public static async cancelTransfer(
    id: string | Types.ObjectId,
    reason: string,
    userId: string | Types.ObjectId
  ): Promise<IStockTransfer> {
    const transfer = await StockTransferModel.findById(id);
    if (!transfer) throw new NotFoundError(`Stock transfer not found with ID ${id}`);

    if (transfer.status === 'IN_TRANSIT' || transfer.status === 'RECEIVED') {
      throw new ValidationError(`Cannot cancel transfer in ${transfer.status} state`);
    }

    transfer.status = 'CANCELLED';
    transfer.remarks = `${transfer.remarks || ''}\nCancelled: ${reason}`.trim();
    await transfer.save();
    return transfer;
  }

  public static async getTransfers(filters: {
    sourceWarehouseId?: string | Types.ObjectId;
    destinationWarehouseId?: string | Types.ObjectId;
    status?: StockTransferStatus;
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
    if (filters.sourceWarehouseId) query.sourceWarehouseId = filters.sourceWarehouseId;
    if (filters.destinationWarehouseId) query.destinationWarehouseId = filters.destinationWarehouseId;
    if (filters.status) query.status = filters.status;
    if (filters.search) {
      const regex = new RegExp(filters.search.trim(), 'i');
      query.$or = [{ transferNumber: regex }, { vehicleNumber: regex }, { remarks: regex }];
    }

    const [items, total] = await Promise.all([
      StockTransferModel.find(query)
        .populate('sourceWarehouseId', 'name warehouseCode')
        .populate('destinationWarehouseId', 'name warehouseCode')
        .populate('requestedBy', 'name email')
        .populate('approvedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      StockTransferModel.countDocuments(query),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  public static async getTransferById(id: string | Types.ObjectId): Promise<IStockTransfer> {
    const transfer = await StockTransferModel.findById(id)
      .populate('sourceWarehouseId', 'name warehouseCode address')
      .populate('destinationWarehouseId', 'name warehouseCode address')
      .populate('items.productId', 'name sku uom')
      .populate('items.sourceBinId', 'binCode zone aisle rack shelf')
      .populate('items.destBinId', 'binCode zone aisle rack shelf')
      .populate('requestedBy', 'name email')
      .populate('approvedBy', 'name email');

    if (!transfer) throw new NotFoundError(`Stock transfer not found with ID ${id}`);
    return transfer;
  }
}
