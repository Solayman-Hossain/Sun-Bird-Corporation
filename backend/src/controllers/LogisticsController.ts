import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { LogisticsService, logisticsService as defaultLogisticsService } from '../services/LogisticsService';
import { CourierConsignmentModel } from '../models/CourierConsignment';
import { NotFoundError, ValidationError } from '../errors/AppError';
import logger from '../config/logger';

export class LogisticsController {
  private static service: LogisticsService = defaultLogisticsService;

  public static setLogisticsService(service: LogisticsService): void {
    LogisticsController.service = service;
  }

  /**
   * @route   POST /api/v1/erp/logistics/consignments
   * @desc    Dispatches order to third-party courier (Pathao or Steadfast), records AWB & updates Order status
   * @access  Bearer JWT (sales:DISPATCH or sales:CREATE)
   */
  public static async bookConsignment(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const {
        orderId,
        courierProvider,
        recipientName,
        recipientPhone,
        recipientAddress,
        recipientCity,
        recipientZone,
        codAmount,
        itemWeightKg,
        challanId,
        instructions,
      } = req.body;

      if (!Types.ObjectId.isValid(orderId)) {
        throw new ValidationError('Invalid Order ObjectId format');
      }

      const overrides = {
        recipientName,
        recipientPhone,
        recipientAddress,
        recipientCity,
        recipientZone,
        weightKg: itemWeightKg,
        codAmount,
        challanId,
        instructions,
      };

      const result = await LogisticsController.service.dispatchOrderToCourier(
        orderId,
        courierProvider,
        undefined,
        overrides
      );

      res.status(201).json({
        success: true,
        statusCode: 201,
        message: `Order successfully booked with ${courierProvider} courier`,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   GET /api/v1/public/track-order/:trackingCode
   * @desc    Public shipment AWB tracking without sensitive pricing or supplier margins
   * @access  Public
   */
  public static async trackOrderPublic(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const rawCode = req.params.trackingCode || req.params.code;
      const trackingCode = String(rawCode || '').trim();
      if (!trackingCode) {
        throw new ValidationError('Shipment tracking code or consignment ID is required');
      }

      const result = await LogisticsController.service.trackShipmentPublic(trackingCode);

      res.status(200).json({
        success: true,
        statusCode: 200,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   GET /api/v1/erp/logistics/consignments
   * @desc    Lists all courier consignments with filters and pagination
   * @access  Bearer JWT (sales:READ or logistics:READ)
   */
  public static async listConsignments(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { courierPartner, deliveryStatus, orderId, trackingCode } = req.query;
      const filter: Record<string, any> = {};

      if (courierPartner) filter.courierPartner = String(courierPartner).toUpperCase();
      if (deliveryStatus) filter.deliveryStatus = String(deliveryStatus).toUpperCase();
      if (trackingCode) filter.trackingCode = String(trackingCode).trim();
      if (orderId && Types.ObjectId.isValid(String(orderId))) {
        filter.orderId = new Types.ObjectId(String(orderId));
      }

      const page = Math.max(1, parseInt(String(req.query.page), 10) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit), 10) || 20));
      const skip = (page - 1) * limit;

      const [consignments, total] = await Promise.all([
        CourierConsignmentModel.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate('orderId', 'orderNo orderStatus paymentMethod paymentStatus')
          .populate('challanId', 'challanNo transporterType')
          .lean(),
        CourierConsignmentModel.countDocuments(filter),
      ]);

      res.status(200).json({
        success: true,
        statusCode: 200,
        data: consignments,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   GET /api/v1/erp/logistics/consignments/:id
   * @desc    Retrieves single consignment details
   * @access  Bearer JWT (sales:READ or logistics:READ)
   */
  public static async getConsignmentById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = String(req.params.id);
      const consignment = await CourierConsignmentModel.findById(id)
        .populate('orderId', 'orderNo orderStatus paymentMethod grandTotal')
        .populate('challanId', 'challanNo transporterType vehicleNumber')
        .lean();

      if (!consignment) {
        throw new NotFoundError('CourierConsignment', id);
      }

      res.status(200).json({
        success: true,
        statusCode: 200,
        data: consignment,
      });
    } catch (error) {
      next(error);
    }
  }
}
export default LogisticsController;
