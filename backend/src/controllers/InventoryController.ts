import { Request, Response, NextFunction } from 'express';
import mongoose, { Types } from 'mongoose';
import { ProductModel } from '../models/Product';
import { ProductBatchModel } from '../models/ProductBatch';
import { StockLedgerModel } from '../models/StockLedger';
import { UnitSerialModel } from '../models/UnitSerial';
import { StockLedgerService, StockMovementDTO } from '../services/StockLedgerService';
import { SerialTrackingService } from '../services/SerialTrackingService';
import {
  NotFoundError,
  DuplicateKeyError,
  ValidationError,
} from '../errors/AppError';
import logger from '../config/logger';

export class InventoryController {
  /**
   * @route   GET /api/v1/erp/inventory/batches
   * @desc    Lists product batches with FEFO sorting and near-expiry alerts
   * @access  Bearer JWT (inventory:READ)
   */
  public static async listBatches(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { sku, warehouseId, nearExpiryDays, sortByExpiry } = req.query;

      const filter: Record<string, any> = {};

      if (sku) {
        filter.sku = String(sku).trim().toUpperCase();
      }
      if (warehouseId) {
        filter.warehouseId = new Types.ObjectId(String(warehouseId));
      }

      const now = new Date();

      if (nearExpiryDays) {
        const days = parseInt(String(nearExpiryDays), 10);
        if (!isNaN(days) && days > 0) {
          const thresholdDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
          filter.category = 'EXPIRY_CONTROLLED';
          filter.expiryDate = { $gte: now, $lte: thresholdDate };
        }
      }

      // Handle pagination
      const page = Math.max(1, parseInt(String(req.query.page), 10) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit), 10) || 20));
      const skip = (page - 1) * limit;

      // Handle sorting: FEFO sorts by expiryDate ASC
      let sortOption: Record<string, 1 | -1> = { createdAt: -1 };
      if (sortByExpiry === 'true' || sortByExpiry === 'fefo') {
        sortOption = { expiryDate: 1, createdAt: 1 };
      }

      const batchQuery = ProductBatchModel.find(filter);
      if (mongoose.models.Warehouse) {
        batchQuery.populate('warehouseId', 'name warehouseName code branchId');
      }

      const [batches, total] = await Promise.all([
        batchQuery
          .sort(sortOption)
          .skip(skip)
          .limit(limit)
          .lean(),
        ProductBatchModel.countDocuments(filter),
      ]);

      // Enrich with near-expiry flag (e.g. within 30 days)
      const alertThreshold = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      const enriched = batches.map((batch) => {
        const isNearExpiry =
          batch.category === 'EXPIRY_CONTROLLED' &&
          batch.expiryDate &&
          batch.expiryDate <= alertThreshold &&
          batch.expiryDate >= now;

        const isExpired =
          batch.category === 'EXPIRY_CONTROLLED' &&
          batch.expiryDate &&
          batch.expiryDate < now;

        return {
          ...batch,
          isNearExpiry,
          isExpired,
        };
      });

      res.status(200).json({
        success: true,
        statusCode: 200,
        data: enriched,
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   POST /api/v1/erp/inventory/batches
   * @desc    Registers a new manufacturing or import batch
   * @access  Bearer JWT (inventory:MANAGE or inventory:CREATE)
   */
  public static async createBatch(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const {
        productId,
        sku,
        batchNumber,
        category,
        manufacturingDate,
        expiryDate,
        currentQty = 0,
        unitCost,
        warehouseId,
      } = req.body;

      const normalizedSku = sku.trim().toUpperCase();

      const product = await ProductModel.findById(productId);
      if (!product) {
        throw new NotFoundError(`Product with ID '${productId}' not found`);
      }

      // Check unique index: { sku, batchNumber, warehouseId }
      const existing = await ProductBatchModel.findOne({
        sku: normalizedSku,
        batchNumber: batchNumber.trim(),
        warehouseId: new Types.ObjectId(warehouseId),
      });

      if (existing) {
        throw new DuplicateKeyError(
          `Batch '${batchNumber}' for SKU '${normalizedSku}' already exists in warehouse '${warehouseId}'`
        );
      }

      if (category === 'EXPIRY_CONTROLLED' && !expiryDate) {
        throw new ValidationError('Expiry date is required for EXPIRY_CONTROLLED batches');
      }

      const batch = await ProductBatchModel.create({
        productId: new Types.ObjectId(productId),
        sku: normalizedSku,
        batchNumber: batchNumber.trim(),
        category,
        manufacturingDate: manufacturingDate ? new Date(manufacturingDate) : undefined,
        expiryDate: expiryDate ? new Date(expiryDate) : undefined,
        baseUom: product.baseUom,
        currentQty,
        reservedQty: 0,
        unitCost,
        warehouseId: new Types.ObjectId(warehouseId),
        hasIndividualSerials: product.isMedical,
        warrantyMonths: 12,
        locationStatus: 'ON_HAND',
      });

      res.status(201).json({
        success: true,
        statusCode: 201,
        message: 'Product batch created successfully',
        data: batch,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   POST /api/v1/erp/inventory/movements
   * @desc    Executes an atomic stock movement and creates immutable ledger entry
   * @access  Bearer JWT (inventory:MUTATE or inventory:CREATE)
   */
  public static async adjustStockMovement(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const {
        sku,
        batchId,
        warehouseId,
        movementType,
        qtyChange,
        unitCost,
        referenceNo,
        referenceType,
        notes,
      } = req.body;

      const createdBy = req.user?.userId || new Types.ObjectId().toString();

      const movementDTO: StockMovementDTO = {
        sku: sku.trim().toUpperCase(),
        batchId,
        warehouseId,
        movementType,
        qtyChange,
        unitCost,
        referenceNo,
        referenceType,
        createdBy,
        notes,
      };

      const ledgerEntry = await StockLedgerService.recordMovement(movementDTO, session);

      await session.commitTransaction();

      // Retrieve updated batch status
      const updatedBatch = await ProductBatchModel.findById(batchId).select(
        'sku batchNumber currentQty reservedQty unitCost warehouseId'
      );

      res.status(201).json({
        success: true,
        statusCode: 201,
        message: 'Stock movement recorded successfully in immutable ledger',
        data: {
          ledger: ledgerEntry,
          batch: updatedBatch,
        },
      });
    } catch (error) {
      await session.abortTransaction();
      next(error);
    } finally {
      session.endSession();
    }
  }

  /**
   * @route   GET /api/v1/erp/inventory/ledger
   * @desc    Retrieves immutable stock ledger audit history
   * @access  Bearer JWT (inventory:READ)
   */
  public static async listLedgerHistory(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { sku, batchId, warehouseId, movementType, referenceNo } = req.query;

      const filter: Record<string, any> = {};

      if (sku) {
        filter.sku = String(sku).trim().toUpperCase();
      }
      if (batchId) {
        filter.batchId = new Types.ObjectId(String(batchId));
      }
      if (warehouseId) {
        filter.warehouseId = new Types.ObjectId(String(warehouseId));
      }
      if (movementType) {
        filter.movementType = StockLedgerService.mapMovementType(String(movementType));
      }
      if (referenceNo) {
        filter.referenceNo = String(referenceNo).trim();
      }

      const page = Math.max(1, parseInt(String(req.query.page), 10) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit), 10) || 20));
      const skip = (page - 1) * limit;

      const [ledger, total] = await Promise.all([
        StockLedgerModel.find(filter)
          .populate('createdBy', 'fullName email')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        StockLedgerModel.countDocuments(filter),
      ]);

      res.status(200).json({
        success: true,
        statusCode: 200,
        data: ledger,
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   GET /api/v1/erp/inventory/serials
   * @desc    Lists individual tracked equipment serials
   * @access  Bearer JWT (inventory:READ)
   */
  public static async listSerials(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { productId, batchId, status, serialNumber } = req.query;

      const filter: Record<string, any> = {};

      if (productId) {
        filter.productId = new Types.ObjectId(String(productId));
      }
      if (batchId) {
        filter.batchId = new Types.ObjectId(String(batchId));
      }
      if (status) {
        filter.status = String(status).trim();
      }
      if (serialNumber) {
        filter.serialNumber = new RegExp(String(serialNumber).trim(), 'i');
      }

      const page = Math.max(1, parseInt(String(req.query.page), 10) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit), 10) || 20));
      const skip = (page - 1) * limit;

      const [serials, total] = await Promise.all([
        UnitSerialModel.find(filter)
          .populate('productId', 'nameEn sku isMedical')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        UnitSerialModel.countDocuments(filter),
      ]);

      res.status(200).json({
        success: true,
        statusCode: 200,
        data: serials,
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   POST /api/v1/erp/inventory/serials
   * @desc    Generates tracked serial numbers for a medical equipment batch
   * @access  Bearer JWT (inventory:MANAGE)
   */
  public static async createSerials(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { batchId, serialList, warrantyMonths = 12 } = req.body;

      const serials = await SerialTrackingService.generateSerialsForBatch(
        batchId,
        serialList,
        warrantyMonths
      );

      res.status(201).json({
        success: true,
        statusCode: 201,
        message: `Successfully registered ${serials.length} serial numbers for batch`,
        data: serials,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   POST /api/v1/erp/inventory/serials/bind
   * @desc    Binds a serial number to a customer sale challan and activates warranty
   * @access  Bearer JWT (inventory:MANAGE or sales:CREATE)
   */
  public static async bindSerial(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { serialNumber, customerId, challanId } = req.body;

      const boundSerial = await SerialTrackingService.bindSerialToCustomer(
        serialNumber,
        customerId,
        challanId
      );

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: `Serial '${serialNumber}' successfully bound to customer`,
        data: boundSerial,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   POST /api/v1/public/warranty/verify
   * @route   GET  /api/v1/public/warranty/verify/:serialNumber
   * @desc    Public QR warranty lookup and authenticity verification endpoint
   * @access  Public
   */
  public static async verifyWarrantyQr(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const rawParam = req.params.serialNumber;
      const paramSerial = Array.isArray(rawParam) ? rawParam[0] : rawParam;
      const serialNumber =
        paramSerial ||
        req.body?.serialNumber ||
        (req.query?.serialNumber as string);

      if (!serialNumber || typeof serialNumber !== 'string') {
        throw new ValidationError('Serial number is required for warranty verification');
      }

      const verification = await SerialTrackingService.verifySerial(serialNumber.trim());

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Serial verification completed successfully',
        data: verification,
      });
    } catch (error) {
      next(error);
    }
  }
}
