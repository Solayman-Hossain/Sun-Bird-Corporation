import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { ProductBatchModel } from '../models/ProductBatch';
import { WarehouseModel } from '../models/Warehouse';
import { WarehouseBinService } from '../services/WarehouseBinService';
import { StockTransferService } from '../services/StockTransferService';
import { StockAdjustmentService } from '../services/StockAdjustmentService';
import { PhysicalCountService } from '../services/PhysicalCountService';
import { InventoryEngineService } from '../services/InventoryEngineService';
import { NotFoundError } from '../errors/AppError';

function getActorId(req: Request): string {
  const user = (req as any).user;
  return user?.id || user?._id?.toString() || '000000000000000000000001';
}

function getParam(param: string | string[]): string {
  return Array.isArray(param) ? param[0] : param;
}

function getOrgIdOptional(req: Request): string | undefined {
  const user = (req as any).user;
  return (
    (req.headers['x-organization-id'] as string) ||
    (req.query.organizationId as string) ||
    user?.organizationId?.toString() ||
    user?.branchId?.toString()
  );
}

export class InventoryManagementController {
  // ─── 01. DASHBOARD ────────────────────────────────────────────────────────
  public static async getDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = getOrgIdOptional(req);
      const { warehouseId, categoryId, brandId, startDate, endDate } = req.query;

      const data = await InventoryEngineService.getInventoryDashboard({
        organizationId: orgId,
        warehouseId: warehouseId ? String(warehouseId) : undefined,
        categoryId: categoryId ? String(categoryId) : undefined,
        brandId: brandId ? String(brandId) : undefined,
        startDate: startDate ? new Date(String(startDate)) : undefined,
        endDate: endDate ? new Date(String(endDate)) : undefined,
      });

      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  // ─── 02. STOCK OVERVIEW ───────────────────────────────────────────────────
  public static async getStockOverview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = getOrgIdOptional(req);
      const {
        warehouseId,
        categoryId,
        brandId,
        stockStatus,
        search,
        page,
        limit,
        sortBy,
        sortOrder,
      } = req.query;

      const data = await InventoryEngineService.getStockOverview({
        organizationId: orgId,
        warehouseId: warehouseId ? String(warehouseId) : undefined,
        categoryId: categoryId ? String(categoryId) : undefined,
        brandId: brandId ? String(brandId) : undefined,
        stockStatus: stockStatus as any,
        search: search ? String(search) : undefined,
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 20,
        sortBy: sortBy ? String(sortBy) : undefined,
        sortOrder: sortOrder as any,
      });

      res.status(200).json({ success: true, ...data });
    } catch (err) {
      next(err);
    }
  }

  // ─── 03. WAREHOUSES ───────────────────────────────────────────────────────
  public static async listWarehouses(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = getOrgIdOptional(req);
      const query: any = { isActive: true };
      if (orgId) query.organizationId = new Types.ObjectId(orgId);

      const warehouses = await WarehouseModel.find(query).sort({ isCentralHub: -1, name: 1 });
      res.status(200).json({ success: true, data: warehouses });
    } catch (err) {
      next(err);
    }
  }

  // ─── 04. WAREHOUSE LOCATIONS / BINS ───────────────────────────────────────
  public static async listBins(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = getOrgIdOptional(req);
      const { warehouseId, zone, aisle, binType, isActive, search, page, limit } = req.query;

      const data = await WarehouseBinService.getBins({
        organizationId: orgId,
        warehouseId: warehouseId ? String(warehouseId) : undefined,
        zone: zone ? String(zone) : undefined,
        aisle: aisle ? String(aisle) : undefined,
        binType: binType as any,
        isActive: isActive !== undefined ? isActive === 'true' : undefined,
        search: search ? String(search) : undefined,
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 20,
      });

      res.status(200).json({ success: true, ...data });
    } catch (err) {
      next(err);
    }
  }

  public static async createBin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = getOrgIdOptional(req);
      const bin = await WarehouseBinService.createBin({
        ...req.body,
        organizationId: orgId,
      });
      res.status(201).json({ success: true, data: bin });
    } catch (err) {
      next(err);
    }
  }

  public static async getBin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const bin = await WarehouseBinService.getBinById(getParam(req.params.id));
      res.status(200).json({ success: true, data: bin });
    } catch (err) {
      next(err);
    }
  }

  public static async updateBin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const bin = await WarehouseBinService.updateBin(getParam(req.params.id), req.body);
      res.status(200).json({ success: true, data: bin });
    } catch (err) {
      next(err);
    }
  }

  public static async deleteBin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await WarehouseBinService.deleteBin(getParam(req.params.id));
      res.status(200).json({ success: true, message: 'Bin deleted successfully' });
    } catch (err) {
      next(err);
    }
  }

  public static async getBinOccupancy(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await WarehouseBinService.getBinOccupancy(getParam(req.params.warehouseId));
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  // ─── 05. BATCH / LOT MANAGEMENT ───────────────────────────────────────────
  public static async listBatches(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = getOrgIdOptional(req);
      const { sku, warehouseId, search, page, limit } = req.query;

      const pageNum = Math.max(1, Number(page) || 1);
      const limitNum = Math.max(1, Math.min(100, Number(limit) || 20));
      const skip = (pageNum - 1) * limitNum;

      const query: any = {};
      if (orgId) query.organizationId = new Types.ObjectId(orgId);
      if (sku) query.sku = String(sku).toUpperCase().trim();
      if (warehouseId) query.warehouseId = new Types.ObjectId(String(warehouseId));
      if (search) {
        const regex = new RegExp(String(search).trim(), 'i');
        query.$or = [{ batchNumber: regex }, { sku: regex }];
      }

      const [items, total] = await Promise.all([
        ProductBatchModel.find(query)
          .populate('productId', 'nameEn sku category brand minStockQty primaryImage')
          .populate('warehouseId', 'name warehouseCode')
          .populate('binId', 'binCode zone aisle')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limitNum)
          .lean(),
        ProductBatchModel.countDocuments(query),
      ]);

      res.status(200).json({
        success: true,
        items,
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async getBatch(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const batch = await ProductBatchModel.findById(getParam(req.params.id))
        .populate('productId')
        .populate('warehouseId')
        .populate('binId');
      if (!batch) throw new NotFoundError('Batch not found');
      res.status(200).json({ success: true, data: batch });
    } catch (err) {
      next(err);
    }
  }

  // ─── 06. EXPIRY MANAGEMENT ────────────────────────────────────────────────
  public static async getExpiryManagement(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { warehouseId, daysThreshold } = req.query;
      const data = await InventoryEngineService.getExpiryManagement({
        warehouseId: warehouseId ? String(warehouseId) : undefined,
        daysThreshold: daysThreshold ? Number(daysThreshold) : 90,
      });
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  // ─── 07. FEFO ALLOCATION ──────────────────────────────────────────────────
  public static async allocateStock(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { sku, warehouseId, quantity, method } = req.body;
      const allocations = await InventoryEngineService.allocateStock({
        sku,
        warehouseId,
        quantity: Number(quantity),
        method: method || 'FEFO',
      });
      res.status(200).json({ success: true, data: allocations });
    } catch (err) {
      next(err);
    }
  }

  // ─── 08. STOCK RESERVATION ────────────────────────────────────────────────
  public static async reserveStock(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actorId = getActorId(req);
      const { sku, warehouseId, quantity, referenceNo } = req.body;
      const result = await InventoryEngineService.reserveStock(
        sku,
        warehouseId,
        Number(quantity),
        referenceNo || 'MANUAL-RESERVE',
        actorId
      );
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  public static async releaseReservation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actorId = getActorId(req);
      const { sku, warehouseId, quantity, referenceNo } = req.body;
      const result = await InventoryEngineService.releaseStockReservation(
        sku,
        warehouseId,
        Number(quantity),
        referenceNo || 'MANUAL-RELEASE',
        actorId
      );
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  // ─── 09. STOCK TRANSFERS ──────────────────────────────────────────────────
  public static async listTransfers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = getOrgIdOptional(req);
      const { sourceWarehouseId, destinationWarehouseId, status, search, page, limit } = req.query;

      const data = await StockTransferService.getTransfers({
        organizationId: orgId,
        sourceWarehouseId: sourceWarehouseId ? String(sourceWarehouseId) : undefined,
        destinationWarehouseId: destinationWarehouseId ? String(destinationWarehouseId) : undefined,
        status: status as any,
        search: search ? String(search) : undefined,
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 20,
      });

      res.status(200).json({ success: true, ...data });
    } catch (err) {
      next(err);
    }
  }

  public static async createTransfer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actorId = getActorId(req);
      const orgId = getOrgIdOptional(req);
      const transfer = await StockTransferService.createTransfer(
        { ...req.body, organizationId: orgId },
        actorId
      );
      res.status(201).json({ success: true, data: transfer });
    } catch (err) {
      next(err);
    }
  }

  public static async getTransfer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const transfer = await StockTransferService.getTransferById(getParam(req.params.id));
      res.status(200).json({ success: true, data: transfer });
    } catch (err) {
      next(err);
    }
  }

  public static async submitTransfer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actorId = getActorId(req);
      const transfer = await StockTransferService.submitTransfer(getParam(req.params.id), actorId);
      res.status(200).json({ success: true, data: transfer });
    } catch (err) {
      next(err);
    }
  }

  public static async approveTransfer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actorId = getActorId(req);
      const transfer = await StockTransferService.approveTransfer(getParam(req.params.id), actorId);
      res.status(200).json({ success: true, data: transfer });
    } catch (err) {
      next(err);
    }
  }

  public static async dispatchTransfer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actorId = getActorId(req);
      const transfer = await StockTransferService.dispatchTransfer(getParam(req.params.id), req.body, actorId);
      res.status(200).json({ success: true, data: transfer });
    } catch (err) {
      next(err);
    }
  }

  public static async receiveTransfer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actorId = getActorId(req);
      const transfer = await StockTransferService.receiveTransfer(getParam(req.params.id), req.body, actorId);
      res.status(200).json({ success: true, data: transfer });
    } catch (err) {
      next(err);
    }
  }

  public static async cancelTransfer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actorId = getActorId(req);
      const transfer = await StockTransferService.cancelTransfer(
        getParam(req.params.id),
        req.body.reason || 'Cancelled by user',
        actorId
      );
      res.status(200).json({ success: true, data: transfer });
    } catch (err) {
      next(err);
    }
  }

  // ─── 10. STOCK ADJUSTMENTS ────────────────────────────────────────────────
  public static async listAdjustments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = getOrgIdOptional(req);
      const { warehouseId, adjustmentType, status, search, page, limit } = req.query;

      const data = await StockAdjustmentService.getAdjustments({
        organizationId: orgId,
        warehouseId: warehouseId ? String(warehouseId) : undefined,
        adjustmentType: adjustmentType as any,
        status: status as any,
        search: search ? String(search) : undefined,
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 20,
      });

      res.status(200).json({ success: true, ...data });
    } catch (err) {
      next(err);
    }
  }

  public static async createAdjustment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actorId = getActorId(req);
      const orgId = getOrgIdOptional(req);
      const adjustment = await StockAdjustmentService.createAdjustment(
        { ...req.body, organizationId: orgId },
        actorId
      );
      res.status(201).json({ success: true, data: adjustment });
    } catch (err) {
      next(err);
    }
  }

  public static async getAdjustment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adjustment = await StockAdjustmentService.getAdjustmentById(getParam(req.params.id));
      res.status(200).json({ success: true, data: adjustment });
    } catch (err) {
      next(err);
    }
  }

  public static async submitAdjustment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actorId = getActorId(req);
      const adjustment = await StockAdjustmentService.submitAdjustment(getParam(req.params.id), actorId);
      res.status(200).json({ success: true, data: adjustment });
    } catch (err) {
      next(err);
    }
  }

  public static async approveAdjustment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actorId = getActorId(req);
      const adjustment = await StockAdjustmentService.approveAdjustment(getParam(req.params.id), actorId);
      res.status(200).json({ success: true, data: adjustment });
    } catch (err) {
      next(err);
    }
  }

  public static async postAdjustment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actorId = getActorId(req);
      const adjustment = await StockAdjustmentService.postAdjustment(getParam(req.params.id), actorId);
      res.status(200).json({ success: true, data: adjustment });
    } catch (err) {
      next(err);
    }
  }

  public static async rejectAdjustment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actorId = getActorId(req);
      const adjustment = await StockAdjustmentService.rejectAdjustment(
        getParam(req.params.id),
        req.body.reason || 'Rejected by user',
        actorId
      );
      res.status(200).json({ success: true, data: adjustment });
    } catch (err) {
      next(err);
    }
  }

  // ─── 11 & 12. PHYSICAL STOCK COUNT & RECONCILIATION ───────────────────────
  public static async listCounts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = getOrgIdOptional(req);
      const { warehouseId, countType, status, search, page, limit } = req.query;

      const data = await PhysicalCountService.getCounts({
        organizationId: orgId,
        warehouseId: warehouseId ? String(warehouseId) : undefined,
        countType: countType as any,
        status: status as any,
        search: search ? String(search) : undefined,
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 20,
      });

      res.status(200).json({ success: true, ...data });
    } catch (err) {
      next(err);
    }
  }

  public static async createCount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actorId = getActorId(req);
      const orgId = getOrgIdOptional(req);
      const count = await PhysicalCountService.createCount(
        { ...req.body, organizationId: orgId },
        actorId
      );
      res.status(201).json({ success: true, data: count });
    } catch (err) {
      next(err);
    }
  }

  public static async getCount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const count = await PhysicalCountService.getCountById(getParam(req.params.id));
      res.status(200).json({ success: true, data: count });
    } catch (err) {
      next(err);
    }
  }

  public static async recordCounts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actorId = getActorId(req);
      const count = await PhysicalCountService.recordCountItems(
        getParam(req.params.id),
        req.body.items,
        actorId
      );
      res.status(200).json({ success: true, data: count });
    } catch (err) {
      next(err);
    }
  }

  public static async reconcileCount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actorId = getActorId(req);
      const count = await PhysicalCountService.reconcileCount(getParam(req.params.id), actorId);
      res.status(200).json({ success: true, data: count });
    } catch (err) {
      next(err);
    }
  }

  // ─── 13. DAMAGED / EXPIRED STOCK ──────────────────────────────────────────
  public static async getDamagedAndExpired(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { warehouseId } = req.query;
      const data = await InventoryEngineService.getDamagedAndExpiredStock(
        warehouseId ? String(warehouseId) : undefined
      );
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  // ─── 14. STOCK MOVEMENT HISTORY ───────────────────────────────────────────
  public static async getMovementHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { sku, warehouseId, movementType, referenceNo, page, limit } = req.query;
      const data = await InventoryEngineService.getStockMovementHistory({
        sku: sku ? String(sku) : undefined,
        warehouseId: warehouseId ? String(warehouseId) : undefined,
        movementType: movementType as any,
        referenceNo: referenceNo ? String(referenceNo) : undefined,
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 20,
      });
      res.status(200).json({ success: true, ...data });
    } catch (err) {
      next(err);
    }
  }

  // ─── 15. REORDER & LOW STOCK ALERTS ───────────────────────────────────────
  public static async getReorderAlerts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { warehouseId } = req.query;
      const data = await InventoryEngineService.getReorderAlerts(
        warehouseId ? String(warehouseId) : undefined
      );
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  // ─── 16. INVENTORY REPORTS ────────────────────────────────────────────────
  public static async getReports(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { reportType, warehouseId } = req.query;
      const data = await InventoryEngineService.getInventoryReports(
        String(reportType || 'VALUATION'),
        warehouseId ? String(warehouseId) : undefined
      );
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  // ─── 17. INVENTORY SETTINGS ───────────────────────────────────────────────
  public static async getSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const settings = {
        defaultAllocationMethod: 'FEFO',
        expiryWarningDays: 30,
        expiryCriticalDays: 15,
        defaultUom: 'PIECE',
        negativeStockAllowed: false,
        autoReorderTrigger: true,
        costingMethod: 'MOVING_AVERAGE',
      };
      res.status(200).json({ success: true, data: settings });
    } catch (err) {
      next(err);
    }
  }

  public static async updateSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.status(200).json({ success: true, message: 'Settings saved', data: req.body });
    } catch (err) {
      next(err);
    }
  }

  // ─── 18. ACTIVITY LOGS ────────────────────────────────────────────────────
  public static async getActivityLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { limit } = req.query;
      const data = await InventoryEngineService.getStockMovementHistory({
        limit: limit ? Number(limit) : 50,
      });
      res.status(200).json({ success: true, data: data.items });
    } catch (err) {
      next(err);
    }
  }
}
export default InventoryManagementController;
