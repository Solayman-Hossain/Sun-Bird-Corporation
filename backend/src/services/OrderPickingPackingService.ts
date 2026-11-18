import { Types } from 'mongoose';
import { OrderModel, IOrder } from '../models/Order';
import { PickingSessionModel, IPickingSession, IPickingItem } from '../models/PickingSession';
import { PackingSessionModel, IPackingSession, IPackage } from '../models/PackingSession';
import { WarehouseBinModel } from '../models/WarehouseBin';
import { ProductBatchModel } from '../models/ProductBatch';
import { AuditLogService } from './AuditLogService';
import { ValidationError, NotFoundError } from '../errors/AppError';
import logger from '../config/logger';

export interface CreatePackageDTO {
  packageType?: string;
  weightKg?: number;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
  packagingMaterial?: string;
  items: Array<{ sku: string; productName: string; qty: number; batchNumber?: string }>;
  notes?: string;
}

export class OrderPickingPackingService {
  /**
   * 1. Create a Picking List / Session for an Order
   */
  public static async createPickingList(
    orderId: string,
    warehouseId?: string,
    pickerId?: Types.ObjectId,
    pickerName?: string,
    userId?: Types.ObjectId,
    orgId?: string
  ): Promise<IPickingSession> {
    const order = await OrderModel.findById(orderId);
    if (!order) throw new NotFoundError('Order', orderId);

    const whId = warehouseId ? new Types.ObjectId(warehouseId) : order.warehouseId;
    if (!whId) throw new ValidationError('Warehouse ID required for picking');

    // Check if picking session already exists
    let session = await PickingSessionModel.findOne({
      orderId: order._id,
      status: { $ne: 'CANCELLED' },
    });

    if (session) return session;

    const year = new Date().getFullYear();
    const pickingNumber = `PICK-${year}-${Math.floor(10000 + Math.random() * 90000)}`;

    const pickingItems: IPickingItem[] = [];

    for (const item of order.items) {
      // Find location bin if available
      const batch = item.batchId
        ? await ProductBatchModel.findById(item.batchId).populate('binId').lean()
        : null;

      const binObj = batch && batch.binId ? (batch.binId as any) : null;

      pickingItems.push({
        productId: item.productId,
        sku: item.sku,
        productName: item.productName || item.sku,
        barcode: item.barcode,
        batchNumber: item.batchNumber || batch?.batchNumber,
        rack: binObj?.rack || 'RACK-A',
        shelf: binObj?.shelf || 'SHELF-1',
        bin: binObj?.binCode || item.locationBin || 'BIN-01',
        requiredQty: item.qty,
        reservedQty: item.reservedQty || item.qty,
        pickedQty: 0,
        status: 'PENDING',
      });
    }

    session = await PickingSessionModel.create({
      pickingNumber,
      orderId: order._id,
      orderNo: order.orderNo,
      organizationId: order.organizationId,
      warehouseId: whId,
      pickerId,
      pickerName: pickerName || 'Warehouse Picker',
      status: 'ASSIGNED',
      items: pickingItems,
      startedAt: new Date(),
    });

    order.orderStatus = 'PICKING';
    order.pickingStatus = 'IN_PROGRESS';

    if (!order.timeline) order.timeline = [];
    order.timeline.push({
      status: 'PICKING',
      event: 'Picking Started',
      timestamp: new Date(),
      userId,
      description: `Picking session ${pickingNumber} created and assigned to ${pickerName || 'Picker'}.`,
    });

    await order.save();

    AuditLogService.record({
      actorId: userId ? new Types.ObjectId(userId) : new Types.ObjectId(),
      action: 'PICKING_CREATED',
      targetCollection: 'orders',
      targetId: order._id,
      module: 'ORDER_PROCESSING',
      diff: { pickingNumber, status: 'ASSIGNED' },
    }).catch(() => {});

    logger.info(`[PickingPacking] Created picking session ${pickingNumber} for order ${order.orderNo}`);
    return session;
  }

  /**
   * 2. Scan and Pick Items
   */
  public static async updatePickingItem(
    orderId: string,
    pickingId: string,
    sku: string,
    pickedQty: number,
    barcode?: string
  ): Promise<IPickingSession> {
    const session = await PickingSessionModel.findById(pickingId);
    if (!session) throw new NotFoundError('PickingSession', pickingId);

    const targetItem = session.items.find((i) => i.sku.toUpperCase() === sku.toUpperCase());
    if (!targetItem) {
      throw new NotFoundError(`SKU ${sku} in PickingSession`, pickingId);
    }

    targetItem.pickedQty = pickedQty;
    if (barcode) targetItem.barcode = barcode;

    if (pickedQty >= targetItem.requiredQty) {
      targetItem.status = 'PICKED';
    } else if (pickedQty > 0) {
      targetItem.status = 'SHORT';
    }

    // Check overall session status
    const allPicked = session.items.every((i) => i.status === 'PICKED');
    session.status = allPicked ? 'PICKED' : 'IN_PROGRESS';

    await session.save();
    return session;
  }

  /**
   * 3. Complete Picking Session
   */
  public static async completePicking(
    orderId: string,
    pickingId: string,
    userId?: Types.ObjectId,
    orgId?: string
  ): Promise<IOrder> {
    const session = await PickingSessionModel.findById(pickingId);
    if (!session) throw new NotFoundError('PickingSession', pickingId);

    session.status = 'PICKED';
    session.completedAt = new Date();
    await session.save();

    const order = await OrderModel.findById(orderId);
    if (!order) throw new NotFoundError('Order', orderId);

    // Update order items pickedQty
    for (const pItem of session.items) {
      const oItem = order.items.find((i) => i.sku.toUpperCase() === pItem.sku.toUpperCase());
      if (oItem) {
        oItem.pickedQty = pItem.pickedQty || pItem.requiredQty;
      }
    }

    order.orderStatus = 'PICKED';
    order.pickingStatus = 'PICKED';

    if (!order.timeline) order.timeline = [];
    order.timeline.push({
      status: 'PICKED',
      event: 'Picking Completed',
      timestamp: new Date(),
      userId,
      description: `Picking session ${session.pickingNumber} completed. Ready for packing.`,
    });

    await order.save();

    AuditLogService.record({
      actorId: userId ? new Types.ObjectId(userId) : new Types.ObjectId(),
      action: 'PICKING_COMPLETED',
      targetCollection: 'orders',
      targetId: order._id,
      module: 'ORDER_PROCESSING',
      diff: { pickingNumber: session.pickingNumber },
    }).catch(() => {});

    logger.info(`[PickingPacking] Completed picking for order ${order.orderNo}`);
    return order;
  }

  /**
   * 4. Create Packing Session with Multiple Packages
   */
  public static async createPackingSession(
    orderId: string,
    warehouseId?: string,
    packerId?: Types.ObjectId,
    packerName?: string,
    packagesDto: CreatePackageDTO[] = [],
    userId?: Types.ObjectId,
    orgId?: string
  ): Promise<IPackingSession> {
    const order = await OrderModel.findById(orderId);
    if (!order) throw new NotFoundError('Order', orderId);

    const whId = warehouseId ? new Types.ObjectId(warehouseId) : order.warehouseId;
    if (!whId) throw new ValidationError('Warehouse ID required for packing');

    const year = new Date().getFullYear();
    const packingNumber = `PACK-${year}-${Math.floor(10000 + Math.random() * 90000)}`;

    const packages: IPackage[] =
      packagesDto.length > 0
        ? packagesDto.map((pkg, idx) => ({
            packageNumber: `${order.orderNo}-PKG-${idx + 1}`,
            packageType: pkg.packageType || 'CARTON',
            weightKg: pkg.weightKg || 1.5,
            lengthCm: pkg.lengthCm || 30,
            widthCm: pkg.widthCm || 20,
            heightCm: pkg.heightCm || 15,
            packagingMaterial: pkg.packagingMaterial || 'Corrugated Box & Bubble Wrap',
            items: pkg.items,
            status: 'PACKED',
            notes: pkg.notes,
          }))
        : [
            {
              packageNumber: `${order.orderNo}-PKG-1`,
              packageType: 'CARTON',
              weightKg: 2.5,
              lengthCm: 35,
              widthCm: 25,
              heightCm: 20,
              packagingMaterial: 'Standard Sun Bird Heavy Carton',
              items: order.items.map((i) => ({
                sku: i.sku,
                productName: i.productName || i.sku,
                qty: i.qty,
                batchNumber: i.batchNumber,
              })),
              status: 'PACKED',
            },
          ];

    const session = await PackingSessionModel.create({
      packingNumber,
      orderId: order._id,
      orderNo: order.orderNo,
      organizationId: order.organizationId,
      warehouseId: whId,
      packerId,
      packerName: packerName || 'Warehouse Packer',
      status: 'PACKED',
      packages,
      startedAt: new Date(),
      completedAt: new Date(),
    });

    // Update order items packedQty
    for (const line of order.items) {
      line.packedQty = line.qty;
    }

    order.orderStatus = 'READY_FOR_DISPATCH';
    order.packingStatus = 'PACKED';

    if (!order.timeline) order.timeline = [];
    order.timeline.push({
      status: 'PACKED',
      event: 'Packing Completed',
      timestamp: new Date(),
      userId,
      description: `Packing session ${packingNumber} completed with ${packages.length} package(s). Status set to READY_FOR_DISPATCH.`,
    });

    await order.save();

    AuditLogService.record({
      actorId: userId ? new Types.ObjectId(userId) : new Types.ObjectId(),
      action: 'PACKING_COMPLETED',
      targetCollection: 'orders',
      targetId: order._id,
      module: 'ORDER_PROCESSING',
      diff: { packingNumber, packagesCount: packages.length },
    }).catch(() => {});

    logger.info(`[PickingPacking] Created & completed packing ${packingNumber} for order ${order.orderNo}`);
    return session;
  }
}
export default OrderPickingPackingService;
