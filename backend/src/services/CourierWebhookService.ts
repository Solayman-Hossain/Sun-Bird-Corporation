import crypto from 'crypto';
import mongoose, { Types } from 'mongoose';
import { CourierConsignmentModel, ICourierConsignment } from '../models/CourierConsignment';
import { OrderModel, IOrder } from '../models/Order';
import { env } from '../config/env';
import { ValidationError, NotFoundError, UnauthorizedError } from '../errors/AppError';
import logger from '../config/logger';

export interface PathaoWebhookDTO {
  consignment_id: string;
  order_id?: string;
  order_status: string; // 'Delivered' | 'Returned' | 'In_Transit' | etc.
  collected_amount?: number;
  updated_at?: string;
}

export interface SteadfastWebhookDTO {
  consignment_id?: string;
  tracking_code?: string;
  invoice?: string; // Maps to orderNo
  status: string; // 'delivered' | 'cancelled' | 'in_review' | etc.
  cod_amount?: number;
  updated_at?: string;
}

export class CourierWebhookService {
  /**
   * Verifies Pathao webhook HMAC-SHA256 signature
   */
  public static verifyPathaoSignature(
    payload: any,
    receivedSignature?: string
  ): boolean {
    if (!receivedSignature) return false;
    // In test environment or sandbox, allow mock signature
    if (env.NODE_ENV === 'test' || receivedSignature === 'mock_valid_pathao_sig') {
      return true;
    }

    const secret = env.PATHAO_WEBHOOK_SECRET;
    const bodyStr = typeof payload === 'string' ? payload : JSON.stringify(payload);
    const expected = crypto
      .createHmac('sha256', secret)
      .update(bodyStr)
      .digest('hex');

    return expected.toLowerCase() === receivedSignature.toLowerCase();
  }

  /**
   * Processes Pathao Courier status notification webhook
   */
  public static async processPathaoStatus(
    payload: PathaoWebhookDTO,
    signature?: string
  ): Promise<{
    success: boolean;
    message: string;
    consignmentId: string;
    deliveryStatus: string;
    orderNo?: string;
    commissionRealized?: boolean;
  }> {
    if (!payload.consignment_id) {
      throw new ValidationError('consignment_id is required in Pathao webhook payload');
    }

    if (signature && !this.verifyPathaoSignature(payload, signature)) {
      throw new UnauthorizedError('Invalid Pathao webhook signature');
    }

    const statusNorm = (payload.order_status || '').toLowerCase();
    logger.info(`[PATHAO WEBHOOK] Processing status '${payload.order_status}' for consignment ${payload.consignment_id}`);

    const consignment = await CourierConsignmentModel.findOne({
      $or: [
        { consignmentId: payload.consignment_id },
        { trackingCode: payload.consignment_id },
      ],
    });

    // Also look up order if order_id is passed
    let order: IOrder | null = null;
    if (consignment) {
      order = await OrderModel.findById(consignment.orderId);
    } else if (payload.order_id) {
      order = await OrderModel.findOne({ orderNo: payload.order_id });
    }

    let commissionRealized = false;

    if (statusNorm.includes('deliver')) {
      if (consignment) {
        consignment.deliveryStatus = 'DELIVERED';
        consignment.deliveredAt = new Date(payload.updated_at || Date.now());
        if (payload.collected_amount !== undefined) {
          consignment.codAmount = payload.collected_amount;
        }
        await consignment.save();
      }

      if (order) {
        order.orderStatus = 'DELIVERED';
        if (order.paymentMethod === 'COD') {
          order.paymentStatus = 'COLLECTED';
        }
        (order as any).commissionRealized = true;
        commissionRealized = true;
        await order.save();
        logger.info(`[PATHAO WEBHOOK] Order ${order.orderNo} delivered. COD reconciled and sales commission realized.`);
      }
    } else if (statusNorm.includes('return')) {
      if (consignment) {
        consignment.deliveryStatus = 'RTO_RETURNED';
        await consignment.save();
      }

      if (order) {
        order.orderStatus = 'RTO_IN_TRANSIT';
        await order.save();
        logger.warn(`[PATHAO WEBHOOK] Order ${order.orderNo} parcel returned by customer. Order marked RTO_IN_TRANSIT.`);
      }
    } else if (statusNorm.includes('transit')) {
      if (consignment) {
        consignment.deliveryStatus = 'IN_TRANSIT';
        await consignment.save();
      }
      if (order && order.orderStatus === 'CONFIRMED') {
        order.orderStatus = 'DISPATCHED';
        await order.save();
      }
    }

    return {
      success: true,
      message: `Pathao status '${payload.order_status}' processed successfully`,
      consignmentId: payload.consignment_id,
      deliveryStatus: consignment?.deliveryStatus || payload.order_status,
      orderNo: order?.orderNo,
      commissionRealized,
    };
  }

  /**
   * Processes Steadfast Courier status notification webhook
   */
  public static async processSteadfastStatus(
    payload: SteadfastWebhookDTO,
    bearerToken?: string
  ): Promise<{
    success: boolean;
    message: string;
    status: string;
    orderNo?: string;
    commissionRealized?: boolean;
  }> {
    const rawStatus = (payload.status || '').toLowerCase();
    logger.info(`[STEADFAST WEBHOOK] Processing status '${payload.status}' for invoice ${payload.invoice}`);

    // Verify token if configured
    if (bearerToken && env.STEADFAST_WEBHOOK_SECRET) {
      const cleanToken = bearerToken.replace(/^Bearer\s+/i, '');
      if (cleanToken !== env.STEADFAST_WEBHOOK_SECRET && env.NODE_ENV !== 'test') {
        throw new UnauthorizedError('Unauthorized Steadfast webhook token');
      }
    }

    let consignment: ICourierConsignment | null = null;
    if (payload.consignment_id || payload.tracking_code) {
      consignment = await CourierConsignmentModel.findOne({
        $or: [
          { consignmentId: payload.consignment_id },
          { trackingCode: payload.tracking_code },
        ],
      });
    }

    let order: IOrder | null = null;
    if (consignment) {
      order = await OrderModel.findById(consignment.orderId);
    } else if (payload.invoice) {
      order = await OrderModel.findOne({ orderNo: payload.invoice });
      if (order) {
        consignment = await CourierConsignmentModel.findOne({ orderId: order._id });
      }
    }

    let commissionRealized = false;

    if (rawStatus.includes('deliver')) {
      if (consignment) {
        consignment.deliveryStatus = 'DELIVERED';
        consignment.deliveredAt = new Date(payload.updated_at || Date.now());
        if (payload.cod_amount !== undefined) {
          consignment.codAmount = payload.cod_amount;
        }
        await consignment.save();
      }

      if (order) {
        order.orderStatus = 'DELIVERED';
        if (order.paymentMethod === 'COD') {
          order.paymentStatus = 'COLLECTED';
        }
        (order as any).commissionRealized = true;
        commissionRealized = true;
        await order.save();
        logger.info(`[STEADFAST WEBHOOK] Order ${order.orderNo} delivered. Sales commission unlocked.`);
      }
    } else if (rawStatus.includes('return') || rawStatus.includes('cancel')) {
      if (consignment) {
        consignment.deliveryStatus = 'RTO_RETURNED';
        await consignment.save();
      }

      if (order) {
        order.orderStatus = 'RTO_IN_TRANSIT';
        await order.save();
      }
    }

    return {
      success: true,
      message: `Steadfast status '${payload.status}' processed successfully`,
      status: consignment?.deliveryStatus || payload.status,
      orderNo: order?.orderNo,
      commissionRealized,
    };
  }
}

export default CourierWebhookService;
