import { Types } from 'mongoose';
import { ChatRoom, IChatRoom } from '../models/ChatRoom';
import { ChatMessage, IChatMessage } from '../models/ChatMessage';
import { ValidationError, NotFoundError } from '../errors/AppError';

export interface SanitizeResult {
  sanitizedText: string;
  warnings: string[];
  isBlocked: boolean;
}

export interface SendMessageInput {
  roomId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  senderType: 'CUSTOMER' | 'AGENT' | 'BOT';
  senderId?: string;
  senderName: string;
  text: string;
  orderId?: string;
}

export class ChatService {
  /**
   * Slide 26 & 31: Regex Pattern Matching & Structured Return
   * Detects phone numbers, external URLs, credit card numbers, and abusive patterns
   */
  public static sanitizeChatMessage(text: string): SanitizeResult {
    let sanitizedText = text;
    const warnings: string[] = [];
    let isBlocked = false;

    // Pattern 1: Credit Card / Banking Numbers (16-digit card patterns)
    const creditCardPattern = /\b(?:\d{4}[ -]?){3}\d{4}\b/g;
    if (creditCardPattern.test(sanitizedText)) {
      sanitizedText = sanitizedText.replace(creditCardPattern, '[card hidden]');
      warnings.push('FINANCIAL_DATA_DETECTED');
    }

    // Pattern 2: External Links / Phishing URLs
    const urlPattern = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;
    if (urlPattern.test(sanitizedText)) {
      sanitizedText = sanitizedText.replace(urlPattern, '[link hidden]');
      warnings.push('EXTERNAL_LINK_DETECTED');
    }

    // Pattern 3: Phone numbers (Bangladesh 11-digit or international format)
    const phonePattern = /(?:\+?88)?01[3-9]\d{8}\b/g;
    if (phonePattern.test(sanitizedText)) {
      // In customer support chat, customer may share phone number, but we flag it and optionally mask in public view
      warnings.push('PHONE_NUMBER_DETECTED');
    }

    // Pattern 4: Severe malicious SQL injection or script tags
    const scriptPattern = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
    if (scriptPattern.test(sanitizedText)) {
      sanitizedText = sanitizedText.replace(scriptPattern, '[malicious content removed]');
      warnings.push('SCRIPT_INJECTION_DETECTED');
      isBlocked = true;
    }

    // Pattern 5: Banned harassment phrases (sample blacklist)
    const bannedPhrases = ['spam_bot_test', 'fraud_link', 'phishing_target'];
    for (const phrase of bannedPhrases) {
      if (sanitizedText.toLowerCase().includes(phrase)) {
        warnings.push('BANNED_PHRASE_DETECTED');
        isBlocked = true;
        break;
      }
    }

    return {
      sanitizedText,
      warnings,
      isBlocked,
    };
  }

  /**
   * Find an existing open chat room for customer or create a new one
   */
  public static async getOrCreateRoom(
    customerPhone: string,
    customerName: string,
    orderId?: string,
    email?: string
  ): Promise<IChatRoom> {
    const cleanPhone = customerPhone.trim();
    let room = await ChatRoom.findOne({
      customerPhone: cleanPhone,
      status: { $in: ['OPEN', 'IN_PROGRESS'] },
    });

    if (!room) {
      room = await ChatRoom.create({
        customerName: customerName.trim(),
        customerPhone: cleanPhone,
        customerEmail: email?.trim(),
        orderId: orderId?.trim(),
        status: 'OPEN',
        lastMessagePreview: 'Conversation started',
        lastMessageAt: new Date(),
        unreadCountAdmin: 0,
        unreadCountCustomer: 0,
      });
    }

    return room;
  }

  /**
   * Slide 32: Service Layer Separation (Thin controller, smart service)
   * Send message, sanitize text, persist message, and update room preview & counters
   */
  public static async sendMessage(input: SendMessageInput): Promise<{ message: IChatMessage; room: IChatRoom }> {
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
    } = input;

    if (!text || text.trim().length === 0) {
      throw new ValidationError('Message text cannot be empty');
    }

    // Slide 26 & 31: Run regex sanitization
    const { sanitizedText, warnings, isBlocked } = this.sanitizeChatMessage(text);

    let room: IChatRoom | null = null;
    if (roomId && Types.ObjectId.isValid(roomId)) {
      room = await ChatRoom.findById(roomId);
    }

    if (!room) {
      room = await this.getOrCreateRoom(customerPhone, customerName, orderId, customerEmail);
    }

    // Slide 15: Create decoupled ChatMessage document
    const message = await ChatMessage.create({
      roomId: room._id,
      senderType,
      senderId,
      senderName: senderName || (senderType === 'CUSTOMER' ? customerName : 'Support Agent'),
      rawText: text,
      sanitizedText,
      warnings,
      isBlocked,
    });

    // Slide 37: Update room with preview and unread counters
    const preview = sanitizedText.length > 60 ? `${sanitizedText.substring(0, 57)}...` : sanitizedText;
    const updateData: Record<string, any> = {
      lastMessagePreview: preview,
      lastMessageSender: senderName || senderType,
      lastMessageAt: new Date(),
    };

    if (senderType === 'CUSTOMER') {
      updateData.$inc = { unreadCountAdmin: 1 };
    } else {
      updateData.$inc = { unreadCountCustomer: 1 };
    }

    const updatedRoom = await ChatRoom.findByIdAndUpdate(room._id, updateData, { new: true });

    return {
      message,
      room: updatedRoom || room,
    };
  }

  /**
   * Slide 37: Last Message Preview + Unread Count Inbox Summary List
   */
  public static async getInboxSummary(
    status?: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ rooms: IChatRoom[]; total: number; totalUnread: number }> {
    const query = status ? { status } : {};
    const skip = (page - 1) * limit;

    const [rooms, total, unreadAgg] = await Promise.all([
      ChatRoom.find(query).sort({ lastMessageAt: -1 }).skip(skip).limit(limit),
      ChatRoom.countDocuments(query),
      ChatRoom.aggregate([
        { $match: { status: { $ne: 'RESOLVED' } } },
        { $group: { _id: null, totalUnread: { $sum: '$unreadCountAdmin' } } },
      ]),
    ]);

    const totalUnread = unreadAgg.length > 0 ? unreadAgg[0].totalUnread : 0;

    return { rooms, total, totalUnread };
  }

  /**
   * Slide 20: Chronological sorted messages for room
   */
  public static async getRoomMessages(roomId: string): Promise<IChatMessage[]> {
    if (!Types.ObjectId.isValid(roomId)) {
      throw new ValidationError('Invalid room ID');
    }

    return ChatMessage.find({ roomId: new Types.ObjectId(roomId) }).sort({ createdAt: 1 });
  }

  /**
   * Mark room as read for admin or customer
   */
  public static async markRoomRead(roomId: string, viewer: 'ADMIN' | 'CUSTOMER'): Promise<IChatRoom> {
    if (!Types.ObjectId.isValid(roomId)) {
      throw new ValidationError('Invalid room ID');
    }

    const updateField = viewer === 'ADMIN' ? { unreadCountAdmin: 0 } : { unreadCountCustomer: 0 };
    const room = await ChatRoom.findByIdAndUpdate(roomId, { $set: updateField }, { new: true });

    if (!room) {
      throw new NotFoundError('Chat room not found');
    }

    return room;
  }
}
