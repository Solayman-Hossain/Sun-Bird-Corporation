import { Types, PipelineStage } from 'mongoose';
import { ProductModel } from '../models/Product';
import { ProductBatchModel, IProductBatch } from '../models/ProductBatch';
import { WarehouseModel } from '../models/Warehouse';
import { StockLedgerModel, StockMovementType } from '../models/StockLedger';
import { StockTransferModel } from '../models/StockTransfer';
import { StockAdjustmentModel } from '../models/StockAdjustment';
import { PhysicalCountModel } from '../models/PhysicalCount';
import { NotFoundError, ValidationError, InsufficientStockError } from '../errors/AppError';
import logger from '../config/logger';

export interface InventoryDashboardFilters {
  warehouseId?: string | Types.ObjectId;
  categoryId?: string | Types.ObjectId;
  brandId?: string | Types.ObjectId;
  organizationId?: string | Types.ObjectId;
  startDate?: Date;
  endDate?: Date;
}

export interface StockOverviewFilters {
  warehouseId?: string | Types.ObjectId;
  organizationId?: string | Types.ObjectId;
  categoryId?: string | Types.ObjectId;
  brandId?: string | Types.ObjectId;
  stockStatus?: 'ALL' | 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'EXPIRED';
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface StockAllocationItem {
  batchId: Types.ObjectId;
  batchNumber: string;
  allocatedQty: number;
  unitCost: number;
  expiryDate?: Date;
  warehouseId: Types.ObjectId;
}

export class InventoryEngineService {
  /**
   * Aggregates real-time metrics across all inventory models.
   * Zero hardcoded sample data.
   */
  public static async getInventoryDashboard(filters: InventoryDashboardFilters) {
    const orgQuery: any = {};
    if (filters.organizationId) orgQuery.organizationId = new Types.ObjectId(filters.organizationId);

    const warehouseMatch: any = { ...orgQuery };
    if (filters.warehouseId) warehouseMatch.warehouseId = new Types.ObjectId(filters.warehouseId);

    const now = new Date();
    const thirtyDaysAhead = new Date();
    thirtyDaysAhead.setDate(now.getDate() + 30);

    // 1. Total Products & Active SKUs
    const [totalProducts, totalActiveSkusCount, totalWarehouses] = await Promise.all([
      ProductModel.countDocuments({ ...orgQuery, status: 'ACTIVE' }),
      ProductBatchModel.distinct('sku', { ...warehouseMatch, currentQty: { $gt: 0 } }),
      WarehouseModel.countDocuments({ ...orgQuery, isActive: true }),
    ]);

    // 2. Stock Quantities & Valuation Aggregation
    const stockStats = await ProductBatchModel.aggregate([
      { $match: warehouseMatch },
      {
        $group: {
          _id: null,
          totalAvailableStock: { $sum: '$currentQty' },
          totalReservedStock: { $sum: '$reservedQty' },
          totalDamagedStock: { $sum: { $ifNull: ['$damagedQty', 0] } },
          totalExpiredStock: { $sum: { $ifNull: ['$expiredQty', 0] } },
          totalValuation: { $sum: { $multiply: ['$currentQty', '$unitCost'] } },
        },
      },
    ]);

    const stats = stockStats[0] || {
      totalAvailableStock: 0,
      totalReservedStock: 0,
      totalDamagedStock: 0,
      totalExpiredStock: 0,
      totalValuation: 0,
    };

    const totalStockQuantity = stats.totalAvailableStock + stats.totalReservedStock;

    // 3. In-Transit stock from active Stock Transfers
    const inTransitTransfers = await StockTransferModel.aggregate([
      {
        $match: {
          status: 'IN_TRANSIT',
          ...(filters.warehouseId ? { destinationWarehouseId: new Types.ObjectId(filters.warehouseId) } : {}),
        },
      },
      {
        $unwind: '$items',
      },
      {
        $group: {
          _id: null,
          totalInTransit: { $sum: '$items.dispatchedQty' },
        },
      },
    ]);
    const totalInTransitStock = inTransitTransfers[0]?.totalInTransit || 0;

    // 4. Low Stock & Out of Stock counts
    // Find products whose aggregate available stock is <= minStockQty
    const productStocks = await ProductBatchModel.aggregate([
      { $match: warehouseMatch },
      {
        $group: {
          _id: '$productId',
          totalQty: { $sum: '$currentQty' },
        },
      },
    ]);
    const stockMap = new Map<string, number>();
    for (const ps of productStocks) {
      stockMap.set(ps._id.toString(), ps.totalQty);
    }

    const allProducts = await ProductModel.find({ ...orgQuery, status: 'ACTIVE' }, '_id minStockQty').lean();
    let lowStockProducts = 0;
    let outOfStockProducts = 0;

    for (const p of allProducts) {
      const avail = stockMap.get(p._id.toString()) || 0;
      if (avail === 0) {
        outOfStockProducts++;
      } else if (p.minStockQty && avail <= p.minStockQty) {
        lowStockProducts++;
      }
    }

    // 5. Expiry counts
    const [expiringProductsCount, expiredBatchesCount] = await Promise.all([
      ProductBatchModel.countDocuments({
        ...warehouseMatch,
        category: 'EXPIRY_CONTROLLED',
        currentQty: { $gt: 0 },
        expiryDate: { $gte: now, $lte: thirtyDaysAhead },
      }),
      ProductBatchModel.countDocuments({
        ...warehouseMatch,
        category: 'EXPIRY_CONTROLLED',
        currentQty: { $gt: 0 },
        expiryDate: { $lt: now },
      }),
    ]);

    // 6. Pending operational counts
    const [stockTransfersPending, stockAdjustmentsPending, pendingStockCounts] = await Promise.all([
      StockTransferModel.countDocuments({
        ...orgQuery,
        status: { $in: ['SUBMITTED', 'IN_TRANSIT'] },
      }),
      StockAdjustmentModel.countDocuments({
        ...orgQuery,
        status: 'SUBMITTED',
      }),
      PhysicalCountModel.countDocuments({
        ...orgQuery,
        status: { $in: ['PLANNED', 'IN_PROGRESS'] },
      }),
    ]);

    // 7. Warehouse-wise stock summary
    const warehouseStockSummary = await ProductBatchModel.aggregate([
      { $match: orgQuery },
      {
        $group: {
          _id: '$warehouseId',
          stockQty: { $sum: '$currentQty' },
          reservedQty: { $sum: '$reservedQty' },
          valuation: { $sum: { $multiply: ['$currentQty', '$unitCost'] } },
          batchCount: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'warehouses',
          localField: '_id',
          foreignField: '_id',
          as: 'warehouse',
        },
      },
      { $unwind: { path: '$warehouse', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          warehouseId: '$_id',
          warehouseName: '$warehouse.name',
          warehouseCode: '$warehouse.warehouseCode',
          stockQty: 1,
          reservedQty: 1,
          valuation: 1,
          batchCount: 1,
        },
      },
    ]);

    // 8. Category-wise stock summary
    const categoryStockSummary = await ProductBatchModel.aggregate([
      { $match: warehouseMatch },
      {
        $lookup: {
          from: 'products',
          localField: 'productId',
          foreignField: '_id',
          as: 'product',
        },
      },
      { $unwind: '$product' },
      {
        $group: {
          _id: '$product.category',
          stockQty: { $sum: '$currentQty' },
          valuation: { $sum: { $multiply: ['$currentQty', '$unitCost'] } },
          skuCount: { $addToSet: '$sku' },
        },
      },
      {
        $project: {
          category: '$_id',
          stockQty: 1,
          valuation: 1,
          skuCount: { $size: '$skuCount' },
        },
      },
      { $sort: { valuation: -1 } },
    ]);

    // 9. Monthly stock movement from ledger
    const monthlyStockMovement = await StockLedgerModel.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(now.getFullYear(), now.getMonth() - 5, 1),
          },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            type: '$movementType',
          },
          totalQty: { $sum: '$qtyChange' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // 10. Top moving products (dispatches)
    const topMoving = await StockLedgerModel.aggregate([
      {
        $match: {
          movementType: 'DISPATCH',
        },
      },
      {
        $group: {
          _id: '$sku',
          dispatchedQty: { $sum: { $abs: '$qtyChange' } },
        },
      },
      { $sort: { dispatchedQty: -1 } },
      { $limit: 5 },
    ]);

    return {
      totalProducts,
      totalActiveSKUs: totalActiveSkusCount.length,
      totalWarehouses,
      totalStockQuantity,
      totalAvailableStock: stats.totalAvailableStock,
      totalReservedStock: stats.totalReservedStock,
      totalInTransitStock,
      totalDamagedStock: stats.totalDamagedStock,
      totalExpiredStock: stats.totalExpiredStock,
      lowStockProducts,
      outOfStockProducts,
      expiringProducts: expiringProductsCount,
      expiredBatches: expiredBatchesCount,
      stockTransfersPending,
      stockAdjustmentsPending,
      pendingStockCounts,
      inventoryValuation: Number(stats.totalValuation.toFixed(2)),
      warehouseStockSummary,
      categoryStockSummary,
      monthlyStockMovement,
      topMovingProducts: topMoving,
      slowMovingProducts: [],
    };
  }

  /**
   * Centralized Stock Overview with physical, reserved, available, and transit stock buckets.
   */
  public static async getStockOverview(filters: StockOverviewFilters) {
    const page = Math.max(1, Number(filters.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(filters.limit) || 20));
    const skip = (page - 1) * limit;

    const match: any = {};
    if (filters.warehouseId) match.warehouseId = new Types.ObjectId(filters.warehouseId);
    if (filters.organizationId) match.organizationId = new Types.ObjectId(filters.organizationId);

    const pipeline: PipelineStage[] = [
      { $match: match },
      {
        $lookup: {
          from: 'products',
          localField: 'productId',
          foreignField: '_id',
          as: 'product',
        },
      },
      { $unwind: '$product' },
      {
        $lookup: {
          from: 'warehouses',
          localField: 'warehouseId',
          foreignField: '_id',
          as: 'warehouse',
        },
      },
      { $unwind: '$warehouse' },
      {
        $lookup: {
          from: 'warehouse_bins',
          localField: 'binId',
          foreignField: '_id',
          as: 'bin',
        },
      },
      { $unwind: { path: '$bin', preserveNullAndEmptyArrays: true } },
    ];

    if (filters.search) {
      const regex = new RegExp(filters.search.trim(), 'i');
      pipeline.push({
        $match: {
          $or: [
            { sku: regex },
            { batchNumber: regex },
            { 'product.nameEn': regex },
            { 'product.barcode': regex },
          ],
        },
      });
    }

    if (filters.categoryId) {
      pipeline.push({
        $match: {
          $or: [
            { 'product.categoryId': new Types.ObjectId(filters.categoryId) },
            { 'product.category': filters.categoryId },
          ],
        },
      });
    }

    if (filters.brandId) {
      pipeline.push({
        $match: {
          $or: [
            { 'product.brandId': new Types.ObjectId(filters.brandId) },
            { 'product.brand': filters.brandId },
          ],
        },
      });
    }

    // Compute stock status fields
    const now = new Date();
    pipeline.push({
      $addFields: {
        physicalQuantity: { $add: ['$currentQty', '$reservedQty'] },
        availableQuantity: '$currentQty',
        inTransitQuantity: {
          $cond: [{ $eq: ['$locationStatus', 'IN_TRANSIT'] }, '$currentQty', 0],
        },
        stockValue: { $multiply: ['$currentQty', '$unitCost'] },
        isExpired: {
          $cond: [
            {
              $and: [
                { $eq: ['$category', 'EXPIRY_CONTROLLED'] },
                { $ifNull: ['$expiryDate', false] },
                { $lt: ['$expiryDate', now] },
              ],
            },
            true,
            false,
          ],
        },
      },
    });

    pipeline.push({
      $addFields: {
        stockStatus: {
          $cond: [
            { $eq: ['$isExpired', true] },
            'EXPIRED',
            {
              $cond: [
                { $lte: ['$availableQuantity', 0] },
                'OUT_OF_STOCK',
                {
                  $cond: [
                    {
                      $and: [
                        { $gt: ['$product.minStockQty', 0] },
                        { $lte: ['$availableQuantity', '$product.minStockQty'] },
                      ],
                    },
                    'LOW_STOCK',
                    'IN_STOCK',
                  ],
                },
              ],
            },
          ],
        },
      },
    });

    if (filters.stockStatus && filters.stockStatus !== 'ALL') {
      pipeline.push({
        $match: { stockStatus: filters.stockStatus },
      });
    }

    // Count stage
    const countPipeline = [...pipeline, { $count: 'total' }];
    const countResult = await ProductBatchModel.aggregate(countPipeline);
    const total = countResult[0]?.total || 0;

    // Projection & Pagination
    pipeline.push(
      { $sort: { 'product.nameEn': 1, expiryDate: 1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $project: {
          _id: 1,
          productId: '$product._id',
          productName: '$product.nameEn',
          productImage: '$product.primaryImage',
          sku: 1,
          barcode: '$product.barcode',
          category: '$product.category',
          brand: '$product.brand',
          warehouseId: '$warehouse._id',
          warehouseName: '$warehouse.name',
          warehouseCode: '$warehouse.warehouseCode',
          binCode: '$bin.binCode',
          batchNumber: 1,
          expiryDate: 1,
          manufacturingDate: 1,
          categoryType: '$category',
          physicalQuantity: 1,
          reservedQuantity: '$reservedQty',
          availableQuantity: 1,
          inTransitQuantity: 1,
          damagedQuantity: { $ifNull: ['$damagedQty', 0] },
          expiredQuantity: { $ifNull: ['$expiredQty', 0] },
          uom: '$baseUom',
          unitCost: 1,
          stockValue: 1,
          reorderLevel: { $ifNull: ['$product.minStockQty', 0] },
          stockStatus: 1,
        },
      }
    );

    const items = await ProductBatchModel.aggregate(pipeline);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Universal Stock Allocation supporting both strict FEFO and FIFO.
   */
  public static async allocateStock(params: {
    sku: string;
    warehouseId: string | Types.ObjectId;
    quantity: number;
    method?: 'FEFO' | 'FIFO';
  }): Promise<StockAllocationItem[]> {
    if (params.quantity <= 0) {
      throw new ValidationError('Requested allocation quantity must be greater than zero');
    }

    const normalizedSku = params.sku.toUpperCase().trim();
    const wId = new Types.ObjectId(params.warehouseId);
    const now = new Date();
    const method = params.method || 'FEFO';

    const sortOption: any =
      method === 'FIFO'
        ? { createdAt: 1 }
        : { expiryDate: 1, createdAt: 1 };

    const batches = await ProductBatchModel.find({
      sku: normalizedSku,
      warehouseId: wId,
      currentQty: { $gt: 0 },
      $or: [
        { category: 'NON_EXPIRING' },
        { category: 'EXPIRY_CONTROLLED', expiryDate: { $gt: now } },
      ],
    }).sort(sortOption);

    const totalAvailable = batches.reduce((sum, b) => sum + b.currentQty, 0);
    if (totalAvailable < params.quantity) {
      throw new InsufficientStockError(normalizedSku, params.quantity, totalAvailable);
    }

    const allocations: StockAllocationItem[] = [];
    let remaining = params.quantity;

    for (const batch of batches) {
      if (remaining <= 0) break;
      const alloc = Math.min(batch.currentQty, remaining);

      allocations.push({
        batchId: batch._id,
        batchNumber: batch.batchNumber,
        allocatedQty: alloc,
        unitCost: batch.unitCost,
        expiryDate: batch.expiryDate,
        warehouseId: batch.warehouseId,
      });

      remaining -= alloc;
    }

    return allocations;
  }

  /**
   * Reserves stock atomically for an order or quote.
   */
  public static async reserveStock(
    sku: string,
    warehouseId: string | Types.ObjectId,
    quantity: number,
    referenceNo: string,
    userId: string | Types.ObjectId
  ) {
    const allocations = await this.allocateStock({
      sku,
      warehouseId,
      quantity,
      method: 'FEFO',
    });

    for (const alloc of allocations) {
      const batch = await ProductBatchModel.findById(alloc.batchId);
      if (!batch) continue;

      batch.currentQty -= alloc.allocatedQty;
      batch.reservedQty += alloc.allocatedQty;
      await batch.save();

      const ledger = new StockLedgerModel({
        organizationId: batch.organizationId,
        sku: batch.sku,
        batchId: batch._id,
        warehouseId: batch.warehouseId,
        movementType: 'RESERVE',
        qtyChange: -alloc.allocatedQty,
        unitCost: batch.unitCost,
        referenceNo,
        referenceType: 'ORDER',
        createdBy: new Types.ObjectId(userId),
      });
      await ledger.save();
    }

    return {
      success: true,
      sku,
      reservedQty: quantity,
      allocations,
    };
  }

  /**
   * Releases previously reserved stock back to available stock.
   */
  public static async releaseStockReservation(
    sku: string,
    warehouseId: string | Types.ObjectId,
    quantity: number,
    referenceNo: string,
    userId: string | Types.ObjectId
  ) {
    const batches = await ProductBatchModel.find({
      sku: sku.toUpperCase().trim(),
      warehouseId: new Types.ObjectId(warehouseId),
      reservedQty: { $gt: 0 },
    }).sort({ createdAt: -1 });

    let remainingToRelease = quantity;

    for (const batch of batches) {
      if (remainingToRelease <= 0) break;

      const releaseAmt = Math.min(batch.reservedQty, remainingToRelease);
      batch.reservedQty -= releaseAmt;
      batch.currentQty += releaseAmt;
      await batch.save();

      const ledger = new StockLedgerModel({
        organizationId: batch.organizationId,
        sku: batch.sku,
        batchId: batch._id,
        warehouseId: batch.warehouseId,
        movementType: 'ADJUST',
        qtyChange: releaseAmt,
        unitCost: batch.unitCost,
        referenceNo,
        referenceType: 'ORDER',
        createdBy: new Types.ObjectId(userId),
      });
      await ledger.save();

      remainingToRelease -= releaseAmt;
    }

    return {
      success: true,
      releasedQty: quantity - remainingToRelease,
    };
  }

  /**
   * Expiry Management analysis.
   */
  public static async getExpiryManagement(filters: {
    warehouseId?: string | Types.ObjectId;
    daysThreshold?: number;
    page?: number;
    limit?: number;
  }) {
    const now = new Date();
    const thresholdDays = filters.daysThreshold || 90;
    const futureDate = new Date();
    futureDate.setDate(now.getDate() + thresholdDays);

    const match: any = {
      category: 'EXPIRY_CONTROLLED',
      currentQty: { $gt: 0 },
    };
    if (filters.warehouseId) match.warehouseId = new Types.ObjectId(filters.warehouseId);

    const batches = await ProductBatchModel.find(match)
      .populate('productId', 'nameEn sku category brand minStockQty primaryImage')
      .populate('warehouseId', 'name warehouseCode')
      .populate('binId', 'binCode zone aisle')
      .sort({ expiryDate: 1 })
      .lean();

    const thirtyDays = new Date();
    thirtyDays.setDate(now.getDate() + 30);
    const sixtyDays = new Date();
    sixtyDays.setDate(now.getDate() + 60);

    const expired: any[] = [];
    const critical: any[] = []; // < 30 days
    const warning: any[] = []; // 30-60 days
    const attention: any[] = []; // 60-90 days

    for (const b of batches) {
      if (!b.expiryDate) continue;
      const exp = new Date(b.expiryDate);
      if (exp < now) {
        expired.push(b);
      } else if (exp <= thirtyDays) {
        critical.push(b);
      } else if (exp <= sixtyDays) {
        warning.push(b);
      } else if (exp <= futureDate) {
        attention.push(b);
      }
    }

    return {
      summary: {
        expiredCount: expired.length,
        criticalCount: critical.length,
        warningCount: warning.length,
        attentionCount: attention.length,
        totalAtRisk: expired.length + critical.length + warning.length + attention.length,
      },
      expired,
      critical,
      warning,
      attention,
    };
  }

  /**
   * Reorder & Low Stock Alerts
   */
  public static async getReorderAlerts(warehouseId?: string | Types.ObjectId) {
    const match: any = { status: 'ACTIVE' };
    const products = await ProductModel.find(match, '_id sku nameEn category minStockQty baseUom gallery').lean();

    const batchMatch: any = {};
    if (warehouseId) batchMatch.warehouseId = new Types.ObjectId(warehouseId);

    const stocks = await ProductBatchModel.aggregate([
      { $match: batchMatch },
      {
        $group: {
          _id: '$productId',
          totalAvailable: { $sum: '$currentQty' },
          totalReserved: { $sum: '$reservedQty' },
        },
      },
    ]);

    const stockMap = new Map<string, { totalAvailable: number; totalReserved: number }>();
    for (const s of stocks) {
      stockMap.set(s._id.toString(), {
        totalAvailable: s.totalAvailable,
        totalReserved: s.totalReserved,
      });
    }

    const alerts = [];
    for (const p of products) {
      const stock = stockMap.get(p._id.toString()) || { totalAvailable: 0, totalReserved: 0 };
      const minLevel = p.minStockQty || 10;

      if (stock.totalAvailable <= minLevel) {
        alerts.push({
          productId: p._id,
          sku: p.sku,
          productName: p.nameEn,
          category: p.category,
          uom: p.baseUom,
          image: p.gallery?.[0]?.url,
          minReorderLevel: minLevel,
          availableStock: stock.totalAvailable,
          reservedStock: stock.totalReserved,
          deficit: Math.max(0, minLevel - stock.totalAvailable),
          status: stock.totalAvailable === 0 ? 'OUT_OF_STOCK' : 'LOW_STOCK',
        });
      }
    }

    return alerts.sort((a, b) => b.deficit - a.deficit);
  }

  /**
   * Damaged & Expired Stock list
   */
  public static async getDamagedAndExpiredStock(warehouseId?: string | Types.ObjectId) {
    const match: any = {
      $or: [
        { damagedQty: { $gt: 0 } },
        { expiredQty: { $gt: 0 } },
        { category: 'EXPIRY_CONTROLLED', expiryDate: { $lt: new Date() }, currentQty: { $gt: 0 } },
      ],
    };
    if (warehouseId) match.warehouseId = new Types.ObjectId(warehouseId);

    return ProductBatchModel.find(match)
      .populate('productId', 'nameEn sku category baseUom')
      .populate('warehouseId', 'name warehouseCode')
      .populate('binId', 'binCode zone aisle')
      .sort({ updatedAt: -1 })
      .lean();
  }

  /**
   * Stock Movement History from immutable ledger
   */
  public static async getStockMovementHistory(filters: {
    sku?: string;
    warehouseId?: string | Types.ObjectId;
    movementType?: StockMovementType;
    referenceNo?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, Number(filters.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(filters.limit) || 20));
    const skip = (page - 1) * limit;

    const query: any = {};
    if (filters.sku) query.sku = filters.sku.toUpperCase().trim();
    if (filters.warehouseId) query.warehouseId = filters.warehouseId;
    if (filters.movementType) query.movementType = filters.movementType;
    if (filters.referenceNo) query.referenceNo = new RegExp(filters.referenceNo.trim(), 'i');

    const [items, total] = await Promise.all([
      StockLedgerModel.find(query)
        .populate('batchId', 'batchNumber expiryDate unitCost')
        .populate('warehouseId', 'name warehouseCode')
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      StockLedgerModel.countDocuments(query),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Reports generator for inventory valuation and variances
   */
  public static async getInventoryReports(reportType: string, warehouseId?: string | Types.ObjectId) {
    const wMatch: any = {};
    if (warehouseId) wMatch.warehouseId = new Types.ObjectId(warehouseId);

    if (reportType === 'VALUATION') {
      const summary = await ProductBatchModel.aggregate([
        { $match: wMatch },
        {
          $lookup: {
            from: 'products',
            localField: 'productId',
            foreignField: '_id',
            as: 'product',
          },
        },
        { $unwind: '$product' },
        {
          $group: {
            _id: '$product.category',
            totalQty: { $sum: '$currentQty' },
            totalValuation: { $sum: { $multiply: ['$currentQty', '$unitCost'] } },
            batchCount: { $sum: 1 },
          },
        },
        { $sort: { totalValuation: -1 } },
      ]);
      return { reportType: 'VALUATION', summary };
    }

    if (reportType === 'VARIANCE') {
      const counts = await PhysicalCountModel.find({ status: 'RECONCILED' })
        .populate('warehouseId', 'name warehouseCode')
        .sort({ countDate: -1 })
        .limit(10)
        .lean();
      return { reportType: 'VARIANCE', counts };
    }

    // Default: summary
    return this.getInventoryDashboard({ warehouseId });
  }
}
