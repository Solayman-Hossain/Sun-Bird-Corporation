import { Request, Response, NextFunction } from 'express';
import { ChatService } from '../services/ChatService';

export class ChatController {
  /**
   * Send a chat message (Public / Storefront)
   */
  public static async sendMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        roomId,
        customerName,
        customerPhone,
        customerEmail,
        senderType,
        senderId,
        senderName,
        text,
        orderId,
      } = req.body;

      const result = await ChatService.sendMessage({
        roomId,
        customerName,
        customerPhone,
        customerEmail,
        senderType: senderType || 'CUSTOMER',
        senderId,
        senderName,
        text,
        orderId,
      });

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get messages for a chat room (Public & ERP)
   */
  public static async getRoomMessages(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const roomId = String(req.params.roomId);
      const messages = await ChatService.getRoomMessages(roomId);

      res.status(200).json({
        success: true,
        data: messages,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get inbox summary list with preview and unread counts (ERP Admin - Slide 37)
   */
  public static async getInboxSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const status = req.query.status as string | undefined;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

      const result = await ChatService.getInboxSummary(status, page, limit);

      res.status(200).json({
        success: true,
        data: result.rooms,
        total: result.total,
        totalUnread: result.totalUnread,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mark room messages as read (ERP Admin or Customer)
   */
  public static async markAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const roomId = String(req.params.roomId);
      const viewer = (req.body.viewer as 'ADMIN' | 'CUSTOMER') || 'ADMIN';

      const room = await ChatService.markRoomRead(roomId, viewer);

      res.status(200).json({
        success: true,
        data: room,
      });
    } catch (error) {
      next(error);
    }
  }
}
