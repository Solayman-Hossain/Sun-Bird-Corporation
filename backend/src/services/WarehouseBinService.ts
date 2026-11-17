import { Types } from 'mongoose';
import { WarehouseBinModel, IWarehouseBin, BinType } from '../models/WarehouseBin';
import { WarehouseModel } from '../models/Warehouse';
import { ProductBatchModel } from '../models/ProductBatch';
import { NotFoundError, ValidationError } from '../errors/AppError';
import logger from '../config/logger';

export interface CreateBinDTO {
  organizationId?: string | Types.ObjectId;
  warehouseId: string | Types.ObjectId;
  binCode: string;
  zone: string;
  aisle: string;
  rack: string;
  shelf: string;
  binType?: BinType;
  capacityCbf?: number;
  maxWeightKg?: number;
  notes?: string;
}

export interface BinFilterDTO {
  warehouseId?: string | Types.ObjectId;
  organizationId?: string | Types.ObjectId;
  zone?: string;
  aisle?: string;
  binType?: BinType;
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface IBinOccupancyResult {
  _id: Types.ObjectId;
  warehouseId: Types.ObjectId;
  binCode: string;
  zone: string;
  aisle: string;
  rack: string;
  shelf: string;
  binType: BinType;
  capacityCbf?: number;
  currentUtilizedCbf?: number;
  maxWeightKg?: number;
  isActive: boolean;
  notes?: string;
  totalBatches: number;
  totalStockQty: number;
  isOccupied: boolean;
}

export class WarehouseBinService {
  public static async createBin(data: CreateBinDTO): Promise<IWarehouseBin> {
    const warehouse = await WarehouseModel.findById(data.warehouseId);
    if (!warehouse) {
      throw new NotFoundError(`Warehouse not found with ID ${data.warehouseId}`);
    }

    const normalizedCode = data.binCode.toUpperCase().trim();
    const existing = await WarehouseBinModel.findOne({
      warehouseId: data.warehouseId,
      binCode: normalizedCode,
    });

    if (existing) {
      throw new ValidationError(`Bin code ${normalizedCode} already exists in this warehouse`);
    }

    const bin = new WarehouseBinModel({
      ...data,
      binCode: normalizedCode,
      binType: data.binType || 'STANDARD',
      isActive: true,
    });

    await bin.save();
    logger.info(`Warehouse bin ${bin.binCode} created for warehouse ${data.warehouseId}`);
    return bin;
  }

  public static async updateBin(
    id: string | Types.ObjectId,
    data: Partial<CreateBinDTO> & { isActive?: boolean }
  ): Promise<IWarehouseBin> {
    const bin = await WarehouseBinModel.findById(id);
    if (!bin) {
      throw new NotFoundError(`Bin not found with ID ${id}`);
    }

    if (data.binCode && data.binCode.toUpperCase().trim() !== bin.binCode) {
      const normalizedCode = data.binCode.toUpperCase().trim();
      const existing = await WarehouseBinModel.findOne({
        warehouseId: bin.warehouseId,
        binCode: normalizedCode,
        _id: { $ne: bin._id },
      });
      if (existing) {
        throw new ValidationError(`Bin code ${normalizedCode} already exists in this warehouse`);
      }
      bin.binCode = normalizedCode;
    }

    if (data.zone !== undefined) bin.zone = data.zone;
    if (data.aisle !== undefined) bin.aisle = data.aisle;
    if (data.rack !== undefined) bin.rack = data.rack;
    if (data.shelf !== undefined) bin.shelf = data.shelf;
    if (data.binType !== undefined) bin.binType = data.binType;
    if (data.capacityCbf !== undefined) bin.capacityCbf = data.capacityCbf;
    if (data.maxWeightKg !== undefined) bin.maxWeightKg = data.maxWeightKg;
    if (data.notes !== undefined) bin.notes = data.notes;
    if (data.isActive !== undefined) bin.isActive = data.isActive;

    await bin.save();
    return bin;
  }

  public static async getBins(filters: BinFilterDTO) {
    const page = Math.max(1, Number(filters.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(filters.limit) || 20));
    const skip = (page - 1) * limit;

    const query: any = {};
    if (filters.warehouseId) query.warehouseId = filters.warehouseId;
    if (filters.organizationId) query.organizationId = filters.organizationId;
    if (filters.zone) query.zone = filters.zone;
    if (filters.aisle) query.aisle = filters.aisle;
    if (filters.binType) query.binType = filters.binType;
    if (filters.isActive !== undefined) query.isActive = filters.isActive;
    if (filters.search) {
      const regex = new RegExp(filters.search.trim(), 'i');
      query.$or = [{ binCode: regex }, { zone: regex }, { aisle: regex }, { notes: regex }];
    }

    const [items, total] = await Promise.all([
      WarehouseBinModel.find(query)
        .populate('warehouseId', 'name warehouseCode')
        .sort({ zone: 1, aisle: 1, rack: 1, shelf: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      WarehouseBinModel.countDocuments(query),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  public static async getBinById(id: string | Types.ObjectId): Promise<IWarehouseBin> {
    const bin = await WarehouseBinModel.findById(id).populate('warehouseId', 'name warehouseCode');
    if (!bin) {
      throw new NotFoundError(`Bin not found with ID ${id}`);
    }
    return bin;
  }

  public static async deleteBin(id: string | Types.ObjectId): Promise<void> {
    const batchCount = await ProductBatchModel.countDocuments({ binId: id, currentQty: { $gt: 0 } });
    if (batchCount > 0) {
      throw new ValidationError(`Cannot delete bin that currently holds active stock (${batchCount} batches)`);
    }

    const bin = await WarehouseBinModel.findByIdAndDelete(id);
    if (!bin) {
      throw new NotFoundError(`Bin not found with ID ${id}`);
    }
  }

  public static async getBinOccupancy(warehouseId: string | Types.ObjectId): Promise<IBinOccupancyResult[]> {
    const bins = await WarehouseBinModel.find({ warehouseId, isActive: true }).lean();
    const batchOccupancies = await ProductBatchModel.aggregate([
      { $match: { warehouseId: new Types.ObjectId(warehouseId), binId: { $exists: true, $ne: null } } },
      {
        $group: {
          _id: '$binId',
          totalBatches: { $sum: 1 },
          totalStockQty: { $sum: '$currentQty' },
        },
      },
    ]);

    const occupancyMap = new Map<string, { totalBatches: number; totalStockQty: number }>();
    for (const bo of batchOccupancies) {
      occupancyMap.set(bo._id.toString(), {
        totalBatches: bo.totalBatches,
        totalStockQty: bo.totalStockQty,
      });
    }

    return bins.map((bin) => {
      const occ = occupancyMap.get(bin._id.toString()) || { totalBatches: 0, totalStockQty: 0 };
      return {
        ...bin,
        totalBatches: occ.totalBatches,
        totalStockQty: occ.totalStockQty,
        isOccupied: occ.totalStockQty > 0,
      };
    });
  }
}
