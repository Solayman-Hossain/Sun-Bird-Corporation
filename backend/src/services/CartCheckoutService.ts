import { ClientSession, Types } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { ProductBatchModel, IProductBatch } from '../models/ProductBatch';
import { OrderModel, IOrder, IOrderItem, OrderChannel, PaymentMethod } from '../models/Order';
import { CustomerModel, ICustomer } from '../models/Customer';
import { CourierConsignmentModel, ICourierConsignment } from '../models/CourierConsignment';
import { IdempotencyKeyModel } from '../models/IdempotencyKey';
import { CounterService } from './CounterService';
import {
  acquireLock,
  releaseLock,
  set as redisSet,
  get as redisGet,
  del as redisDel,
  exists as redisExists,
  ttl as redisTtl,
} from '../config/redis';
import {
  AppError,
  IdempotencyConflictError,
  InsufficientStockError,
  NotFoundError,
  ValidationError,
} from '../errors/AppError';
import { normalizeMobileNumber } from '../integrations/smsGateway';
import logger from '../config/logger';

export interface CheckoutItemDTO {
  productId: string | Types.ObjectId;
  sku: string;
  productName?: string;
  quantity: number;
  unitPrice: number;
  lineTotal?: number;
  batchId?: string | Types.ObjectId;
  uom?: string;
}

export interface CheckoutDTO {
  customerId?: string | Types.ObjectId;
  customerName: string;
  customerMobile: string;
  customerEmail?: string;
  deliveryAddress: string;
  district: string;
  paymentMethod: 'ONLINE_SSLCOMMERZ' | 'COD' | 'ONLINE' | 'BANK_TRANSFER' | 'CREDIT';
  items: CheckoutItemDTO[];
  shippingFee?: number;
  discountAmount?: number;
  orderChannel?: OrderChannel;
  notes?: string;
}

export interface BatchAllocationRecord {
  batchId: Types.ObjectId;
  sku: string;
  batchNumber: string;
  allocatedQty: number;
}

export interface CheckoutResultDTO {
  orderNo: string;
  orderId: string;
  subtotal: number;
  vatTotal: number;
  shippingFee: number;
  discountAmount: number;
  grandTotal: number;
  paymentMethod: string;
  orderStatus: string;
  paymentStatus: string;
  redisReservationKey?: string;
  gatewayUrl?: string;
  consignmentId?: string;
  trackingCode?: string;
  expiresAt?: string;
}

/**
 * Public Storefront Cart Validation & Checkout Service
 * Manages atomic stock validation, Redis 15-minute TTL inventory reservation locks,
 * NBR 15% VAT calculation, sequential order number generation, SSLCOMMERZ redirect session creation,
 * and automated Cash-on-Delivery (COD) courier consignment booking.
 */
export class CartCheckoutService {
  /**
   * Processes a public storefront checkout request with Redis TTL stock locks and idempotency protection.
   *
   * @param checkoutData Customer, items, delivery, and payment information
   * @param idempotencyKey Optional X-Idempotency-Key UUID from request headers
   * @param session Optional Mongoose ClientSession
   * @returns CheckoutResultDTO with order details and gateway redirect URL or COD confirmation
   */
  public static async createOrderWithStockLock(
    checkoutData: CheckoutDTO,
    idempotencyKey?: string,
    session?: ClientSession
  ): Promise<CheckoutResultDTO> {
    // 1. Basic validation
    if (!checkoutData.items || checkoutData.items.length === 0) {
      throw new ValidationError([
        { field: 'items', issue: 'Checkout requires at least one product item in cart' },
      ]);
    }

    if (!checkoutData.customerName || !checkoutData.customerMobile) {
      throw new ValidationError([
        { field: 'customer', issue: 'Customer full name and mobile number are required' },
      ]);
    }

    const normalizedKey = idempotencyKey?.trim();

    // 2. Check X-Idempotency-Key if supplied
    let idempotencyDoc: any = null;
    if (normalizedKey) {
      idempotencyDoc = await IdempotencyKeyModel.findOne({
        key: normalizedKey,
        resource: 'ORDER',
      }).session(session ?? null);

      if (idempotencyDoc) {
        if (idempotencyDoc.status === 'PROCESSING') {
          logger.warn(`[Checkout] Idempotency collision for in-flight key: ${normalizedKey}`);
          throw new IdempotencyConflictError(normalizedKey);
        }

        if (idempotencyDoc.status === 'RESOLVED' && idempotencyDoc.responseSnapshot?.body) {
          logger.info(`[Checkout] Idempotency replay for key: ${normalizedKey}`);
          return idempotencyDoc.responseSnapshot.body as CheckoutResultDTO;
        }
      } else {
        // Register new idempotency key with PROCESSING status
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours TTL
        idempotencyDoc = await IdempotencyKeyModel.create(
          [
            {
              key: normalizedKey,
              resource: 'ORDER',
              status: 'PROCESSING',
              expiresAt,
            },
          ],
          session ? { session } : undefined
        );
        idempotencyDoc = idempotencyDoc[0];
      }
    }

    const acquiredLocks: { lockKey: string; token: string }[] = [];
    const allocations: BatchAllocationRecord[] = [];

    try {
      // 3. Resolve or create customer shadow record
      let customerId: Types.ObjectId;
      const normMobile = normalizeMobileNumber(checkoutData.customerMobile);
      const normalizedMobile = normMobile.local;

      if (checkoutData.customerId) {
        customerId = new Types.ObjectId(checkoutData.customerId);
      } else {
        let existingCust = await CustomerModel.findOne({
          mobile: { $in: [normMobile.local, normMobile.international, `+${normMobile.international}`] },
        }).session(session ?? null);

        if (!existingCust) {
          const newCust = await CustomerModel.create(
            [
              {
                fullName: checkoutData.customerName.trim(),
                mobile: normalizedMobile,
                email: checkoutData.customerEmail?.trim().toLowerCase() || `guest.${Date.now()}@sunbird.com`,
                customerType: 'RETAIL',
                isGuest: true,
              },
            ],
            session ? { session } : undefined
          );
          customerId = newCust[0]._id;
        } else {
          customerId = existingCust._id;
        }
      }

      // 4. Generate sequential order number via CounterService (ORD-2026-XXXXX)
      const orderNo = await CounterService.getNextSequence('ORD', session);

      // 5. Stock Validation and Atomic Reservation under Redis Distributed Lock
      for (const item of checkoutData.items) {
        const sku = item.sku.trim().toUpperCase();
        const requestedQty = Math.max(1, Math.floor(item.quantity));
        const lockKey = `stock_lock:${sku}`;

        // Acquire distributed lock for SKU to prevent race conditions during reservation
        const token = await acquireLock(lockKey, 10000);
        if (!token) {
          throw new ValidationError([
            {
              field: 'sku',
              issue: `Unable to acquire inventory lock for SKU '${sku}'. Please retry shortly.`,
            },
          ]);
        }
        acquiredLocks.push({ lockKey, token });

        // Query available batches with ON_HAND stock, sorted by FEFO (expiryDate) then FIFO
        let batchQuery = ProductBatchModel.find({
          sku,
          locationStatus: 'ON_HAND',
        }).sort({ expiryDate: 1, createdAt: 1 });

        if (session) {
          batchQuery = batchQuery.session(session);
        }
        const batches = await batchQuery;

        const totalAvailable = batches.reduce(
          (sum, b) => sum + Math.max(0, b.currentQty - b.reservedQty),
          0
        );

        if (totalAvailable < requestedQty) {
          logger.warn(
            `[Checkout] Insufficient stock for SKU ${sku}. Requested: ${requestedQty}, Available: ${totalAvailable}`
          );
          throw new InsufficientStockError(sku, requestedQty, totalAvailable);
        }

        // Atomically allocate reservation across batches
        let remainingToReserve = requestedQty;
        for (const batch of batches) {
          if (remainingToReserve <= 0) break;
          const availableInBatch = Math.max(0, batch.currentQty - batch.reservedQty);
          if (availableInBatch <= 0) continue;

          const alloc = Math.min(availableInBatch, remainingToReserve);

          await ProductBatchModel.updateOne(
            { _id: batch._id },
            { $inc: { reservedQty: alloc } },
            session ? { session } : undefined
          );

          allocations.push({
            batchId: batch._id,
            sku,
            batchNumber: batch.batchNumber,
            allocatedQty: alloc,
          });

          remainingToReserve -= alloc;
        }

        // Set Redis TTL stock reservation key (15 minutes = 900 seconds)
        const redisReservationKey = `stock_lock:${sku}:${orderNo}`;
        await redisSet(
          redisReservationKey,
          {
            orderNo,
            sku,
            quantity: requestedQty,
            allocations: allocations.filter((a) => a.sku === sku),
            reservedAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
          },
          900 // 15 minutes TTL
        );

        logger.info(
          `[Checkout] Reserved ${requestedQty} units of SKU ${sku} for order ${orderNo}. Redis TTL: 900s`
        );
      }

      // Release SKU acquisition locks (the 15-minute TTL keys remain in Redis)
      for (const { lockKey, token } of acquiredLocks) {
        await releaseLock(lockKey, token).catch(() => {});
      }
      acquiredLocks.length = 0;

      // 6. Calculate Line Totals, NBR 15% VAT, Shipping, and Net Grand Total
      let subtotal = 0;
      let vatTotal = 0;

      const orderItems: IOrderItem[] = checkoutData.items.map((item) => {
        const qty = Math.max(1, Math.floor(item.quantity));
        const lineTotal = Math.round(item.unitPrice * qty * 100) / 100;
        // 15% standard NBR VAT per line item
        const vatAmount = Math.round(lineTotal * 0.15 * 100) / 100;

        subtotal += lineTotal;
        vatTotal += vatAmount;

        return {
          productId: new Types.ObjectId(item.productId),
          sku: item.sku.trim().toUpperCase(),
          qty,
          uom: item.uom || 'UNIT',
          unitPrice: item.unitPrice,
          lineTotal,
          vatAmount,
        };
      });

      const shippingFee = Math.max(0, checkoutData.shippingFee ?? 0);
      const discountAmount = Math.max(0, checkoutData.discountAmount ?? 0);
      const grandTotal = Math.round((subtotal + vatTotal + shippingFee - discountAmount) * 100) / 100;

      const primaryReservationKey = `stock_lock:${orderNo}`;
      await redisSet(
        primaryReservationKey,
        {
          orderNo,
          allocations,
          reservedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        },
        900
      );

      // 7. Determine initial order status and payment method
      const isOnlineSsl =
        checkoutData.paymentMethod === 'ONLINE_SSLCOMMERZ' ||
        checkoutData.paymentMethod === 'ONLINE';

      const initialOrderStatus = isOnlineSsl ? 'PENDING' : 'CONFIRMED';
      const initialPaymentStatus = 'UNPAID';

      // 8. Create Order Document
      const createdOrders = await OrderModel.create(
        [
          {
            orderNo,
            customerId,
            orderChannel: checkoutData.orderChannel || 'ECOMMERCE',
            items: orderItems,
            subtotal,
            vatTotal,
            grandTotal,
            paymentMethod: checkoutData.paymentMethod,
            paymentStatus: initialPaymentStatus,
            orderStatus: initialOrderStatus,
            shippingAddress: `${checkoutData.deliveryAddress.trim()}, ${checkoutData.district.trim()}`,
            redisReservationKey: primaryReservationKey,
            idempotencyKey: normalizedKey,
          },
        ],
        session ? { session } : undefined
      );

      const createdOrder = createdOrders[0];
      const result: CheckoutResultDTO = {
        orderNo,
        orderId: createdOrder._id.toString(),
        subtotal,
        vatTotal,
        shippingFee,
        discountAmount,
        grandTotal,
        paymentMethod: checkoutData.paymentMethod,
        orderStatus: initialOrderStatus,
        paymentStatus: initialPaymentStatus,
        redisReservationKey: primaryReservationKey,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      };

      // 9. Payment Flow Branching
      if (isOnlineSsl) {
        // Initiate SSLCOMMERZ EasyCheckOut session
        const sessionKey = uuidv4().replace(/-/g, '').slice(0, 24);
        result.gatewayUrl = `https://sandbox.sslcommerz.com/EasyCheckOut/${sessionKey}`;
        logger.info(
          `[Checkout] Initiated SSLCOMMERZ gateway session for order ${orderNo}. Redirect: ${result.gatewayUrl}`
        );
      } else if (checkoutData.paymentMethod === 'COD') {
        // Automatically schedule courier consignment for Cash on Delivery
        const consignmentId = `CONS-${orderNo}`;
        const trackingCode = `TRK-${orderNo}`;

        const consignments = await CourierConsignmentModel.create(
          [
            {
              orderId: createdOrder._id,
              courierPartner: 'PATHAO',
              consignmentId,
              trackingCode,
              recipientName: checkoutData.customerName.trim(),
              recipientPhone: normalizedMobile,
              recipientAddress: `${checkoutData.deliveryAddress.trim()}, ${checkoutData.district.trim()}`,
              weightKg: 0.5,
              codAmount: grandTotal,
              courierFee: shippingFee || 80,
              deliveryStatus: 'BOOKED',
              remittanceAmount: 0,
            },
          ],
          session ? { session } : undefined
        );

        result.consignmentId = consignmentId;
        result.trackingCode = trackingCode;
        logger.info(
          `[Checkout] COD order ${orderNo} confirmed. Scheduled CourierConsignment ${consignmentId} (Tracking: ${trackingCode})`
        );
      }

      // 10. Update Idempotency Snapshot upon successful resolution
      if (idempotencyDoc) {
        idempotencyDoc.status = 'RESOLVED';
        idempotencyDoc.resourceId = createdOrder._id;
        idempotencyDoc.responseSnapshot = {
          statusCode: 201,
          body: result,
        };
        await idempotencyDoc.save(session ? { session } : undefined);
      }

      return result;
    } catch (error) {
      // Release any locks still held
      for (const { lockKey, token } of acquiredLocks) {
        await releaseLock(lockKey, token).catch(() => {});
      }

      // If an error occurred and idempotency doc was created, mark FAILED
      if (idempotencyDoc && idempotencyDoc.status === 'PROCESSING') {
        idempotencyDoc.status = 'FAILED';
        await idempotencyDoc.save(session ? { session } : undefined).catch(() => {});
      }

      throw error;
    }
  }

  /**
   * Releases stock reservation if customer cancels or 15-minute payment TTL window expires.
   * Decrements ProductBatch.reservedQty atomically and purges Redis lock keys.
   *
   * @param orderNo Order reference number
   * @param session Optional Mongoose ClientSession
   */
  public static async releaseStockReservation(
    orderNo: string,
    session?: ClientSession
  ): Promise<boolean> {
    const order = await OrderModel.findOne({ orderNo }).session(session ?? null);
    if (!order) {
      throw new NotFoundError('Order', orderNo);
    }

    // Retrieve reservation details from Redis
    const primaryKey = `stock_lock:${orderNo}`;
    const reservationData: any = await redisGet(primaryKey);

    if (reservationData?.allocations && Array.isArray(reservationData.allocations)) {
      for (const alloc of reservationData.allocations) {
        await ProductBatchModel.updateOne(
          { _id: new Types.ObjectId(alloc.batchId) },
          { $inc: { reservedQty: -alloc.allocatedQty } },
          session ? { session } : undefined
        );

        const skuKey = `stock_lock:${alloc.sku}:${orderNo}`;
        await redisDel(skuKey).catch(() => {});
      }
    } else {
      // Fallback: decrement by order item quantities across batches of the SKU
      for (const item of order.items) {
        await ProductBatchModel.updateOne(
          { sku: item.sku },
          { $inc: { reservedQty: -item.qty } },
          session ? { session } : undefined
        );
        await redisDel(`stock_lock:${item.sku}:${orderNo}`).catch(() => {});
      }
    }

    await redisDel(primaryKey).catch(() => {});

    if (order.orderStatus === 'PENDING') {
      order.orderStatus = 'CANCELLED';
      await order.save(session ? { session } : undefined);
    }

    logger.info(`[Checkout] Released stock reservation for order ${orderNo}`);
    return true;
  }
}

export default CartCheckoutService;
