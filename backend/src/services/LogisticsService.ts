import { ClientSession, Types } from 'mongoose';
import logger from '../config/logger';
import env from '../config/env';
import { OrderModel, IOrder } from '../models/Order';
import { CustomerModel, ICustomer } from '../models/Customer';
import { DeliveryChallanModel, IDeliveryChallan } from '../models/DeliveryChallan';
import {
  CourierConsignmentModel,
  ICourierConsignment,
  CourierPartner,
  CourierDeliveryStatus,
} from '../models/CourierConsignment';
import { PathaoClient, pathaoClient as defaultPathaoClient } from '../integrations/pathaoClient';
import { SteadfastClient, steadfastClient as defaultSteadfastClient } from '../integrations/steadfastClient';
import { NotFoundError, ValidationError, GatewayError } from '../errors/AppError';

export interface DispatchOrderOverrides {
  recipientName?: string;
  recipientPhone?: string;
  recipientAddress?: string;
  recipientCity?: number | string;
  recipientZone?: number | string;
  weightKg?: number;
  codAmount?: number;
  challanId?: string | Types.ObjectId;
  instructions?: string;
}

export interface DispatchOrderResult {
  success: boolean;
  orderId: string;
  orderNo: string;
  provider: CourierPartner;
  consignmentId: string;
  trackingCode: string;
  deliveryStatus: CourierDeliveryStatus;
  consignment: ICourierConsignment;
}

export interface PublicTimelineEvent {
  status: string;
  label: string;
  description: string;
  completed: boolean;
  timestamp?: Date;
}

export interface PublicTrackingResult {
  success: boolean;
  trackingCode: string;
  consignmentId: string;
  courierPartner: CourierPartner;
  deliveryStatus: CourierDeliveryStatus;
  orderNo?: string;
  orderStatus?: string;
  recipientName: string;
  recipientAddress: string;
  weightKg: number;
  bookedAt: Date;
  deliveredAt?: Date;
  updatedAt: Date;
  timeline: PublicTimelineEvent[];
}

export class LogisticsService {
  constructor(
    private readonly pathaoClient: PathaoClient = defaultPathaoClient,
    private readonly steadfastClient: SteadfastClient = defaultSteadfastClient
  ) {}

  /**
   * Helper to mask customer names for public tracking (e.g. "Kamal Hossain" -> "K***l H***n").
   */
  private maskName(fullName: string): string {
    if (!fullName || typeof fullName !== 'string') return 'Customer';
    return fullName
      .split(' ')
      .map((part) => {
        if (part.length <= 2) return part;
        return `${part[0]}${'*'.repeat(Math.max(1, part.length - 2))}${part[part.length - 1]}`;
      })
      .join(' ');
  }

  /**
   * Helper to mask detailed street address for public privacy.
   */
  private maskAddress(address: string): string {
    if (!address || typeof address !== 'string') return 'Dhaka, Bangladesh';
    const parts = address.split(',').map((p) => p.trim());
    if (parts.length > 1) {
      // Return zone/city portion only
      return parts.slice(-2).join(', ');
    }
    return address;
  }

  /**
   * Dispatches an order to third-party courier (Pathao or Steadfast).
   * Generates consignment payload, books via carrier API, records consignment,
   * and transitions Order status to DISPATCHED.
   */
  public async dispatchOrderToCourier(
    orderId: string | Types.ObjectId,
    provider: 'PATHAO' | 'STEADFAST',
    session?: ClientSession,
    overrides?: DispatchOrderOverrides
  ): Promise<DispatchOrderResult> {
    const oId = typeof orderId === 'string' ? new Types.ObjectId(orderId) : orderId;

    // 1. Fetch Order
    const order = await OrderModel.findById(oId).session(session || null);
    if (!order) {
      throw new NotFoundError('Order', oId.toString());
    }

    if (order.orderStatus === 'CANCELLED') {
      throw new ValidationError(`Cannot dispatch order ${order.orderNo} because it is CANCELLED`);
    }

    // 2. Check if already dispatched and consignment exists
    const existingConsignment = await CourierConsignmentModel.findOne({ orderId: order._id }).session(
      session || null
    );

    if (existingConsignment && order.orderStatus === 'DISPATCHED') {
      logger.info(
        `[LogisticsService] Order ${order.orderNo} is already dispatched. Consignment=${existingConsignment.consignmentId}, Tracking=${existingConsignment.trackingCode}`
      );
      return {
        success: true,
        orderId: order._id.toString(),
        orderNo: order.orderNo,
        provider: existingConsignment.courierPartner,
        consignmentId: existingConsignment.consignmentId,
        trackingCode: existingConsignment.trackingCode,
        deliveryStatus: existingConsignment.deliveryStatus,
        consignment: existingConsignment,
      };
    }

    // 3. Retrieve Customer details
    const customer = await CustomerModel.findById(order.customerId).session(session || null);

    // 4. Build Consignment Payload
    const recipientName =
      overrides?.recipientName?.trim() || customer?.fullName?.trim() || 'Valued Customer';
    const recipientPhone =
      overrides?.recipientPhone?.trim() || customer?.mobile?.trim() || '01700000000';
    const recipientAddress =
      overrides?.recipientAddress?.trim() ||
      order.shippingAddress?.trim() ||
      customer?.shippingAddress?.trim() ||
      customer?.billingAddress?.trim() ||
      'Dhaka, Bangladesh';

    // Compute Weight
    let weightKg = overrides?.weightKg;
    if (weightKg === undefined || weightKg <= 0) {
      const totalUnits = order.items.reduce((sum, item) => sum + (item.qty || 1), 0);
      weightKg = Math.max(0.5, totalUnits * 0.5);
    }

    // Compute COD Amount (Only collect if payment method is COD and payment is not PAID)
    let codAmount = overrides?.codAmount;
    if (codAmount === undefined) {
      if (order.paymentMethod === 'COD' && order.paymentStatus !== 'PAID') {
        codAmount = order.grandTotal;
      } else {
        codAmount = 0;
      }
    }

    // 5. Look up matching Delivery Challan
    let challan: IDeliveryChallan | null = null;
    if (overrides?.challanId) {
      challan = await DeliveryChallanModel.findById(overrides.challanId).session(session || null);
    }
    if (!challan) {
      challan = await DeliveryChallanModel.findOne({ orderId: order._id }).session(session || null);
    }

    // 6. Invoke Carrier API
    let consignmentId: string;
    let trackingCode: string;
    let courierFee: number = 0;

    if (provider === 'PATHAO') {
      const pathaoRes = await this.pathaoClient.createOrder({
        store_id: Number(env.PATHAO_STORE_ID || 1),
        merchant_order_id: order.orderNo,
        recipient_name: recipientName,
        recipient_phone: recipientPhone,
        recipient_address: recipientAddress,
        recipient_city: overrides?.recipientCity || 1,
        recipient_zone: overrides?.recipientZone || 1,
        delivery_type: 48,
        item_type: 2,
        item_quantity: order.items.reduce((sum, it) => sum + it.qty, 0) || 1,
        item_weight: weightKg,
        amount_to_collect: codAmount,
        item_description: overrides?.instructions || `Order ${order.orderNo}`,
      });

      consignmentId = pathaoRes.consignmentId;
      trackingCode = pathaoRes.trackingCode;
      courierFee = pathaoRes.deliveryFee;
    } else if (provider === 'STEADFAST') {
      const steadfastRes = await this.steadfastClient.createOrder({
        invoice: order.orderNo,
        recipient_name: recipientName,
        recipient_phone: recipientPhone,
        recipient_address: recipientAddress,
        cod_amount: codAmount,
        note: overrides?.instructions || `Order ${order.orderNo}`,
      });

      consignmentId = steadfastRes.consignmentId;
      trackingCode = steadfastRes.trackingCode;
      courierFee = steadfastRes.deliveryFee;
    } else {
      throw new ValidationError(`Unsupported courier provider: ${provider}`);
    }

    // 7. Save to courier_consignments Collection
    let createdConsignment: ICourierConsignment;
    if (existingConsignment) {
      existingConsignment.courierPartner = provider;
      existingConsignment.consignmentId = consignmentId;
      existingConsignment.trackingCode = trackingCode;
      existingConsignment.recipientName = recipientName;
      existingConsignment.recipientPhone = recipientPhone;
      existingConsignment.recipientAddress = recipientAddress;
      existingConsignment.weightKg = weightKg;
      existingConsignment.codAmount = codAmount;
      existingConsignment.courierFee = courierFee;
      existingConsignment.deliveryStatus = 'BOOKED';
      if (challan) existingConsignment.challanId = challan._id as Types.ObjectId;
      await existingConsignment.save(session ? { session } : undefined);
      createdConsignment = existingConsignment;
    } else {
      const [newConsignment] = await CourierConsignmentModel.create(
        [
          {
            orderId: order._id,
            challanId: challan?._id,
            courierPartner: provider,
            consignmentId,
            trackingCode,
            recipientName,
            recipientPhone,
            recipientAddress,
            weightKg,
            codAmount,
            courierFee,
            deliveryStatus: 'BOOKED',
            remittanceAmount: 0,
          },
        ],
        session ? { session } : undefined
      );
      createdConsignment = newConsignment;
    }

    // 8. Transition Order status to DISPATCHED
    order.orderStatus = 'DISPATCHED';
    await order.save(session ? { session } : undefined);

    // 9. Synchronize Delivery Challan if linked
    if (challan) {
      challan.status = 'DISPATCHED';
      challan.consignmentTrackingId = trackingCode;
      challan.transporterType = provider;
      await challan.save(session ? { session } : undefined);
    }

    logger.info(
      `[LogisticsService] Order ${order.orderNo} dispatched via ${provider}. ConsignmentId=${consignmentId}, Tracking=${trackingCode}`
    );

    return {
      success: true,
      orderId: order._id.toString(),
      orderNo: order.orderNo,
      provider,
      consignmentId,
      trackingCode,
      deliveryStatus: createdConsignment.deliveryStatus,
      consignment: createdConsignment,
    };
  }

  /**
   * Public tracking lookup for customers and recipients.
   * Strictly filters out internal pricing details, profit margins, and COD remittance data.
   */
  public async trackShipmentPublic(trackingCode: string): Promise<PublicTrackingResult> {
    if (!trackingCode || typeof trackingCode !== 'string' || !trackingCode.trim()) {
      throw new ValidationError('A valid shipment tracking code or consignment ID is required');
    }

    const cleanCode = trackingCode.trim();

    // Lookup consignment by tracking code or consignment ID
    const consignment = await CourierConsignmentModel.findOne({
      $or: [{ trackingCode: cleanCode }, { consignmentId: cleanCode }],
    }).lean();

    if (!consignment) {
      throw new NotFoundError('Courier Shipment', cleanCode);
    }

    // Lookup corresponding Order for public reference
    const order = await OrderModel.findById(consignment.orderId).lean();

    // Construct public timeline
    const timeline: PublicTimelineEvent[] = [
      {
        status: 'BOOKED',
        label: 'Consignment Booked',
        description: `Shipment booked with ${consignment.courierPartner} Courier`,
        completed: true,
        timestamp: consignment.createdAt,
      },
      {
        status: 'IN_TRANSIT',
        label: 'In Transit',
        description: 'Parcel picked up by courier and in transit to destination hub',
        completed: ['IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(consignment.deliveryStatus),
        timestamp:
          consignment.deliveryStatus !== 'BOOKED' ? consignment.updatedAt : undefined,
      },
      {
        status: 'OUT_FOR_DELIVERY',
        label: 'Out for Delivery',
        description: 'Courier delivery agent is en route to recipient address',
        completed: ['OUT_FOR_DELIVERY', 'DELIVERED'].includes(consignment.deliveryStatus),
        timestamp:
          ['OUT_FOR_DELIVERY', 'DELIVERED'].includes(consignment.deliveryStatus)
            ? consignment.updatedAt
            : undefined,
      },
      {
        status: 'DELIVERED',
        label: 'Delivered',
        description: 'Parcel successfully delivered to recipient',
        completed: consignment.deliveryStatus === 'DELIVERED',
        timestamp: consignment.deliveredAt || (consignment.deliveryStatus === 'DELIVERED' ? consignment.updatedAt : undefined),
      },
    ];

    if (consignment.deliveryStatus === 'RTO_RETURNED') {
      timeline.push({
        status: 'RTO_RETURNED',
        label: 'Returned to Origin',
        description: 'Parcel could not be delivered and has been returned to warehouse',
        completed: true,
        timestamp: consignment.updatedAt,
      });
    } else if (consignment.deliveryStatus === 'CANCELLED') {
      timeline.push({
        status: 'CANCELLED',
        label: 'Consignment Cancelled',
        description: 'Parcel booking was cancelled prior to dispatch',
        completed: true,
        timestamp: consignment.updatedAt,
      });
    }

    return {
      success: true,
      trackingCode: consignment.trackingCode,
      consignmentId: consignment.consignmentId,
      courierPartner: consignment.courierPartner,
      deliveryStatus: consignment.deliveryStatus,
      orderNo: order?.orderNo,
      orderStatus: order?.orderStatus,
      recipientName: this.maskName(consignment.recipientName),
      recipientAddress: this.maskAddress(consignment.recipientAddress),
      weightKg: consignment.weightKg,
      bookedAt: consignment.createdAt,
      deliveredAt: consignment.deliveredAt,
      updatedAt: consignment.updatedAt,
      timeline,
    };
  }
}

export const logisticsService = new LogisticsService();
export default logisticsService;
