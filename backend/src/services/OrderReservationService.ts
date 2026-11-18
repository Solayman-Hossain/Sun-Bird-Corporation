import { Types } from 'mongoose';
import { OrderModel, IOrder } from '../models/Order';
import { OrderReservationModel, IOrderReservation, IReservationItem } from '../models/OrderReservation';
import { ProductBatchModel, IProductBatch } from '../models/ProductBatch';
import { WarehouseModel } from '../models/Warehouse';
import { AuditLogService } from './AuditLogService';
import { ValidationError, NotFoundError } from '../errors/AppError';
import logger from '../config/logger';

export interface StockAvailabilityItem {
  productId: string;
  sku: string;
  productName?: string;
  physicalStock: number;
  reservedStock: number;
  availableStock: number;
  damagedStock: number;
  expiredStock: number;
  earliestExpiryDate?: Date;
  warehouseId?: string;
  warehouseName?: string;
}

export class OrderReservationService {
  /**
   * 1. Check Stock Availability Across Warehouses with FEFO batches
   */
  public static async checkStockAvailability(
    items: Array<{ productId?: string; sku: string; warehouseId?: string }>,
    targetWarehouseId?: string,
    orgId?: string
  ): Promise<StockAvailabilityItem[]> {
    const results: StockAvailabilityItem[] = [];

    for (const item of items) {
      const matchQuery: Record<string, any> = { sku: item.sku.toUpperCase() };
      const whId = item.warehouseId || targetWarehouseId;
      if (whId) {
        matchQuery.warehouseId = new Types.ObjectId(whId);
      }
      if (orgId) {
        matchQuery.organizationId = new Types.ObjectId(orgId);
      }

      // Query batches sorted by expiryDate ascending (FEFO)
      const batches = await ProductBatchModel.find(matchQuery)
        .populate('warehouseId', 'name code')
        .sort({ expiryDate: 1 })
        .lean();

      let physical = 0;
      let reserved = 0;
      let damaged = 0;
      let expired = 0;
      let earliestExpiry: Date | undefined;
      let primaryWarehouseId: string | undefined;
      let primaryWarehouseName: string | undefined;

      for (const b of batches) {
        physical += b.currentQty || 0;
        reserved += b.reservedQty || 0;
        damaged += b.damagedQty || 0;
        expired += b.expiredQty || 0;
        if (b.expiryDate && (!earliestExpiry || b.expiryDate < earliestExpiry)) {
          earliestExpiry = b.expiryDate;
        }
        if (!primaryWarehouseId && b.warehouseId) {
          primaryWarehouseId = (b.warehouseId as any)._id?.toString() || b.warehouseId.toString();
          primaryWarehouseName = (b.warehouseId as any).name || 'Depot';
        }
      }

      results.push({
        productId: item.productId || (batches[0]?.productId ? batches[0].productId.toString() : ''),
        sku: item.sku,
        physicalStock: physical,
        reservedStock: reserved,
        availableStock: Math.max(0, physical - reserved),
        damagedStock: damaged,
        expiredStock: expired,
        earliestExpiryDate: earliestExpiry,
        warehouseId: primaryWarehouseId || whId,
        warehouseName: primaryWarehouseName,
      });
    }

    return results;
  }

  /**
   * 2. Reserve Stock for an Order using FEFO Allocation
   */
  public static async reserveOrderStock(
    orderId: string,
    targetWarehouseId?: string,
    userId?: Types.ObjectId,
    orgId?: string
  ): Promise<{ order: IOrder; reservation: IOrderReservation }> {
    const order = await OrderModel.findById(orderId);
    if (!order) throw new NotFoundError('Order', orderId);

    if (order.orderStatus === 'CANCELLED' || order.orderStatus === 'DELIVERED') {
      throw new ValidationError(`Cannot reserve stock when order status is ${order.orderStatus}`);
    }

    const whId = targetWarehouseId
      ? new Types.ObjectId(targetWarehouseId)
      : order.warehouseId || (await WarehouseModel.findOne({ isActive: true }).select('_id').lean())?._id;

    if (!whId) {
      throw new ValidationError('A target warehouse is required for stock reservation');
    }

    order.warehouseId = whId;

    // Check existing reservations for this order
    const existingRes = await OrderReservationModel.findOne({
      orderId: order._id,
      status: { $in: ['RESERVED', 'PARTIALLY_RESERVED'] },
    });

    if (existingRes && existingRes.status === 'RESERVED') {
      return { order, reservation: existingRes }; // Already reserved
    }

    const reservationItems: IReservationItem[] = [];
    let isFullyReserved = true;

    for (const line of order.items) {
      const requiredQty = line.qty;
      let remainingToReserve = requiredQty;

      // Find batches in warehouse sorted by FEFO
      const batches = await ProductBatchModel.find({
        sku: line.sku.toUpperCase(),
        warehouseId: whId,
      }).sort({ expiryDate: 1 });

      for (const batch of batches) {
        if (remainingToReserve <= 0) break;
        const availableInBatch = Math.max(0, batch.currentQty - (batch.reservedQty || 0));
        if (availableInBatch <= 0) continue;

        const alloc = Math.min(availableInBatch, remainingToReserve);

        // Atomically increment batch reservation
        await ProductBatchModel.findByIdAndUpdate(batch._id, {
          $inc: { reservedQty: alloc },
        });

        reservationItems.push({
          productId: line.productId,
          sku: line.sku,
          batchId: batch._id,
          batchNumber: batch.batchNumber,
          warehouseId: whId,
          binId: batch.binId,
          requestedQty: alloc,
          reservedQty: alloc,
          status: 'RESERVED',
        });

        remainingToReserve -= alloc;
      }

      line.reservedQty = requiredQty - remainingToReserve;

      if (remainingToReserve > 0) {
        isFullyReserved = false;
        logger.warn(
          `[OrderReservation] Shortage for SKU ${line.sku} in order ${order.orderNo}: requested ${requiredQty}, reserved ${line.reservedQty}`
        );
      }
    }

    const status = isFullyReserved ? 'RESERVED' : 'PARTIALLY_RESERVED';

    // Create Reservation Document
    const reservation = await OrderReservationModel.create({
      orderId: order._id,
      orderNo: order.orderNo,
      organizationId: order.organizationId,
      warehouseId: whId,
      status,
      items: reservationItems,
      expiresAt: new Date(Date.now() + 7 * 86400000), // 7 days reservation
      allocatedBy: userId,
      notes: `FEFO Stock reservation for order ${order.orderNo}`,
    });

    order.orderStatus = status;

    if (!order.timeline) order.timeline = [];
    order.timeline.push({
      status,
      event: isFullyReserved ? 'Stock Reserved' : 'Stock Partially Reserved',
      timestamp: new Date(),
      userId,
      description: `${status}: ${reservationItems.length} batch allocations in warehouse ${whId}`,
    });

    await order.save();

    AuditLogService.record({
      actorId: userId ? new Types.ObjectId(userId) : new Types.ObjectId(),
      action: 'STOCK_RESERVED',
      targetCollection: 'orders',
      targetId: order._id,
      module: 'ORDER_PROCESSING',
      diff: { reservationId: reservation._id, status },
    }).catch(() => {});

    logger.info(`[OrderReservation] Order ${order.orderNo} status updated to ${status}`);
    return { order, reservation };
  }

  /**
   * 3. Release Stock Reservation for an Order
   */
  public static async releaseOrderReservation(
    orderId: string,
    userId?: Types.ObjectId,
    orgId?: string
  ): Promise<IOrder> {
    const order = await OrderModel.findById(orderId);
    if (!order) throw new NotFoundError('Order', orderId);

    const reservations = await OrderReservationModel.find({
      orderId: order._id,
      status: { $in: ['RESERVED', 'PARTIALLY_RESERVED'] },
    });

    for (const res of reservations) {
      for (const item of res.items) {
        if (item.batchId && item.reservedQty > 0) {
          await ProductBatchModel.findByIdAndUpdate(item.batchId, {
            $inc: { reservedQty: -item.reservedQty },
          });
        }
      }
      res.status = 'RELEASED';
      res.releasedAt = new Date();
      res.releasedBy = userId;
      res.releaseReason = 'Manual reservation release';
      await res.save();
    }

    // Reset items reservedQty
    for (const item of order.items) {
      item.reservedQty = 0;
    }

    if (order.orderStatus === 'RESERVED' || order.orderStatus === 'PARTIALLY_RESERVED') {
      order.orderStatus = 'CONFIRMED';
    }

    if (!order.timeline) order.timeline = [];
    order.timeline.push({
      status: order.orderStatus,
      event: 'Stock Reservation Released',
      timestamp: new Date(),
      userId,
      description: 'Reserved inventory released back to sellable available stock.',
    });

    await order.save();

    AuditLogService.record({
      actorId: userId ? new Types.ObjectId(userId) : new Types.ObjectId(),
      action: 'RESERVATION_RELEASED',
      targetCollection: 'orders',
      targetId: order._id,
      module: 'ORDER_PROCESSING',
      diff: { status: order.orderStatus },
    }).catch(() => {});

    logger.info(`[OrderReservation] Released stock reservations for order ${order.orderNo}`);
    return order;
  }
}
export default OrderReservationService;
