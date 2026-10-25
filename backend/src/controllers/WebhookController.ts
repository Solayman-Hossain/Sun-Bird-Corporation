import { Request, Response, NextFunction } from 'express';
import { PaymentWebhookService } from '../services/PaymentWebhookService';
import { CourierWebhookService } from '../services/CourierWebhookService';

export class WebhookController {
  /**
   * @route   POST /api/v1/webhooks/sslcommerz/ipn
   * @desc    SSLCOMMERZ Instant Payment Notification (IPN) webhook
   * @access  Public / SSLCOMMERZ Server Callback
   */
  public static async handleSslcommerzIpn(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await PaymentWebhookService.processSslcommerzIpn(req.body);

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: result.message || 'IPN processed and order payment confirmed',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   POST /api/v1/webhooks/pathao/status
   * @desc    Pathao Courier consignment status update callback
   * @access  Public / Pathao Webhook Signature
   */
  public static async handlePathaoWebhook(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const signature = (req.headers['x-pathao-signature'] as string) || undefined;
      const result = await CourierWebhookService.processPathaoStatus(
        req.body,
        signature
      );

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: result.message,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   POST /api/v1/webhooks/steadfast/status
   * @desc    Steadfast Courier consignment status update callback
   * @access  Public / Steadfast Bearer Key
   */
  public static async handleSteadfastWebhook(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const bearerToken = req.headers.authorization;
      const result = await CourierWebhookService.processSteadfastStatus(
        req.body,
        bearerToken
      );

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: result.message,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default WebhookController;
