import { Types } from 'mongoose';
import { SupportTicket, ISupportTicket, TicketPriority } from '../models/SupportTicket';
import { SupportMessage, ISupportMessage } from '../models/SupportMessage';
import { SupportSettings } from '../models/SupportSettings';
import { CounterService } from './CounterService';
import { SupportAiService } from './SupportAiService';
import { AuditLogService } from './AuditLogService';
import logger from '../config/logger';

export interface CreateTicketDTO {
  organizationId: string;
  type?: ISupportTicket['type'];
  subject: string;
  description: string;
  customerId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  orderId?: string;
  orderNumber?: string;
  productId?: string;
  productName?: string;
  productSku?: string;
  serialNumber?: string;
  category?: ISupportTicket['category'];
  priority?: TicketPriority;
  severity?: ISupportTicket['severity'];
  channel?: ISupportTicket['channel'];
  assignedTo?: string;
  assignedToName?: string;
  attachments?: Array<{ name: string; url: string; size?: number; type?: string }>;
  createdByUserId?: string;
  createdByName?: string;
}

export class SupportTicketService {
  /**
   * Helper to compute SLA deadline based on priority and organization settings
   */
  private static async calculateSlaDueAt(
    organizationId: string,
    priority: TicketPriority
  ): Promise<{ hours: number; dueAt: Date }> {
    const settings = await SupportSettings.findOne({ organizationId: new Types.ObjectId(organizationId) });
    let hours = 24;

    if (settings?.slaTargets) {
      switch (priority) {
        case 'CRITICAL':
        case 'URGENT':
          hours = settings.slaTargets.criticalHours || 4;
          break;
        case 'HIGH':
          hours = settings.slaTargets.highHours || 12;
          break;
        case 'LOW':
          hours = settings.slaTargets.lowHours || 48;
          break;
        case 'MEDIUM':
        default:
          hours = settings.slaTargets.mediumHours || 24;
          break;
      }
    } else {
      if (priority === 'CRITICAL' || priority === 'URGENT') hours = 4;
      else if (priority === 'HIGH') hours = 12;
      else if (priority === 'LOW') hours = 48;
      else hours = 24;
    }

    const dueAt = new Date(Date.now() + hours * 60 * 60 * 1000);
    return { hours, dueAt };
  }

  /**
   * Create a new support ticket or complaint with automated AI triage
   */
  public static async createTicket(dto: CreateTicketDTO): Promise<ISupportTicket> {
    let ticketNumber = '';
    try {
      ticketNumber = await CounterService.getNextSequence('TKT');
    } catch {
      ticketNumber = `TKT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    // AI automated classification & sentiment
    const aiAnalysis = await SupportAiService.analyzeComplaint(dto.subject, dto.description);

    const effectivePriority = dto.priority || aiAnalysis.priority || 'MEDIUM';
    const effectiveCategory = dto.category || aiAnalysis.category || 'GENERAL_INQUIRY';
    const { hours, dueAt } = await this.calculateSlaDueAt(dto.organizationId, effectivePriority);

    const ticket = new SupportTicket({
      organizationId: new Types.ObjectId(dto.organizationId),
      ticketNumber,
      type: dto.type || (effectiveCategory === 'DEFECTIVE_PRODUCT' ? 'COMPLAINT' : 'SUPPORT_TICKET'),
      subject: dto.subject,
      description: dto.description,
      customerId: dto.customerId ? new Types.ObjectId(dto.customerId) : undefined,
      customerName: dto.customerName,
      customerPhone: dto.customerPhone,
      customerEmail: dto.customerEmail,
      orderId: dto.orderId ? new Types.ObjectId(dto.orderId) : undefined,
      orderNumber: dto.orderNumber,
      productId: dto.productId ? new Types.ObjectId(dto.productId) : undefined,
      productName: dto.productName,
      productSku: dto.productSku,
      serialNumber: dto.serialNumber,
      category: effectiveCategory,
      priority: effectivePriority,
      severity: dto.severity || (effectivePriority === 'CRITICAL' ? 'BLOCKER' : 'MODERATE'),
      status: dto.assignedTo ? 'ASSIGNED' : 'OPEN',
      channel: dto.channel || 'PORTAL',
      assignedTo: dto.assignedTo ? new Types.ObjectId(dto.assignedTo) : undefined,
      assignedToName: dto.assignedToName,
      assignedAt: dto.assignedTo ? new Date() : undefined,
      slaHours: hours,
      slaDueAt: dueAt,
      isSlaBreached: false,
      aiSentiment: aiAnalysis.sentiment,
      aiSentimentScore: aiAnalysis.sentimentScore,
      aiSuggestedPriority: aiAnalysis.priority,
      aiSuggestedCategory: aiAnalysis.category,
      aiDiagnosticSummary: aiAnalysis.rootCauseDiagnosis,
      attachments: dto.attachments || [],
    });

    await ticket.save();

    // Initial message logged in thread
    const initialMsg = new SupportMessage({
      organizationId: ticket.organizationId,
      ticketId: ticket._id,
      senderType: 'CUSTOMER',
      senderName: dto.customerName,
      messageType: 'MESSAGE',
      body: dto.description,
      attachments: dto.attachments || [],
    });
    await initialMsg.save();

    // Audit logging
    const safeActorId = Types.ObjectId.isValid(dto.createdByUserId || '')
      ? new Types.ObjectId(dto.createdByUserId)
      : new Types.ObjectId('000000000000000000000001');

    await AuditLogService.logAction({
      action: 'TICKET_CREATED',
      actorId: safeActorId,
      actorRole: 'SUPPORT_AGENT',
      organizationId: dto.organizationId,
      targetCollection: 'support_tickets',
      targetId: ticket._id,
      afterSnapshot: { ticketNumber: ticket.ticketNumber, priority: ticket.priority, category: ticket.category },
    });

    return ticket;
  }

  /**
   * List tickets with filters, pagination and search
   */
  public static async getTickets(
    organizationId: string,
    query: {
      status?: string;
      priority?: string;
      category?: string;
      type?: string;
      assignedTo?: string;
      search?: string;
      isSlaBreached?: boolean;
      page?: number;
      limit?: number;
    }
  ): Promise<{ tickets: ISupportTicket[]; total: number; page: number; totalPages: number }> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const filter: any = { organizationId: new Types.ObjectId(organizationId) };

    if (query.status && query.status !== 'ALL') filter.status = query.status;
    if (query.priority && query.priority !== 'ALL') filter.priority = query.priority;
    if (query.category && query.category !== 'ALL') filter.category = query.category;
    if (query.type && query.type !== 'ALL') filter.type = query.type;
    if (query.assignedTo) filter.assignedTo = new Types.ObjectId(query.assignedTo);
    if (typeof query.isSlaBreached === 'boolean') filter.isSlaBreached = query.isSlaBreached;

    if (query.search && query.search.trim()) {
      const searchRegex = new RegExp(query.search.trim(), 'i');
      filter.$or = [
        { ticketNumber: searchRegex },
        { subject: searchRegex },
        { customerName: searchRegex },
        { customerPhone: searchRegex },
        { orderNumber: searchRegex },
        { serialNumber: searchRegex },
      ];
    }

    const [tickets, total] = await Promise.all([
      SupportTicket.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      SupportTicket.countDocuments(filter),
    ]);

    return {
      tickets: tickets as any,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Retrieve ticket by ID or ticketNumber
   */
  public static async getTicketById(
    organizationId: string,
    ticketIdOrNumber: string
  ): Promise<{ ticket: ISupportTicket; messages: ISupportMessage[] } | null> {
    const isObjectId = Types.ObjectId.isValid(ticketIdOrNumber);
    const filter: any = { organizationId: new Types.ObjectId(organizationId) };
    if (isObjectId) {
      filter.$or = [{ _id: new Types.ObjectId(ticketIdOrNumber) }, { ticketNumber: ticketIdOrNumber.toUpperCase() }];
    } else {
      filter.ticketNumber = ticketIdOrNumber.toUpperCase();
    }

    const ticket = await SupportTicket.findOne(filter);
    if (!ticket) return null;

    // Check SLA breach dynamically
    if (ticket.status !== 'RESOLVED' && ticket.status !== 'CLOSED' && ticket.slaDueAt < new Date()) {
      if (!ticket.isSlaBreached) {
        ticket.isSlaBreached = true;
        await ticket.save();
      }
    }

    const messages = await SupportMessage.find({
      organizationId: ticket.organizationId,
      ticketId: ticket._id,
    }).sort({ createdAt: 1 }).lean();

    return { ticket, messages: messages as any };
  }

  /**
   * Assign ticket to an executive
   */
  public static async assignTicket(
    organizationId: string,
    ticketId: string,
    userId: string,
    userName: string,
    actorId: string
  ): Promise<ISupportTicket | null> {
    const ticket = await SupportTicket.findOne({
      _id: new Types.ObjectId(ticketId),
      organizationId: new Types.ObjectId(organizationId),
    });
    if (!ticket) return null;

    ticket.assignedTo = new Types.ObjectId(userId);
    ticket.assignedToName = userName;
    ticket.assignedAt = new Date();
    if (ticket.status === 'OPEN') ticket.status = 'ASSIGNED';
    await ticket.save();

    // Log assignment message
    const msg = new SupportMessage({
      organizationId: ticket.organizationId,
      ticketId: ticket._id,
      senderType: 'SYSTEM',
      senderName: 'System Bot',
      messageType: 'STATUS_CHANGE',
      body: `Ticket assigned to ${userName}.`,
      isInternalOnly: true,
    });
    await msg.save();

    const safeActorId = Types.ObjectId.isValid(actorId) ? new Types.ObjectId(actorId) : new Types.ObjectId('000000000000000000000001');
    await AuditLogService.logAction({
      action: 'TICKET_ASSIGNED',
      actorId: safeActorId,
      actorRole: 'SUPPORT_AGENT',
      organizationId,
      targetCollection: 'support_tickets',
      targetId: ticket._id,
      afterSnapshot: { assignedTo: userName, ticketNumber: ticket.ticketNumber },
    });

    return ticket;
  }

  /**
   * Escalate ticket
   */
  public static async escalateTicket(
    organizationId: string,
    ticketId: string,
    data: { escalatedToUserId?: string; reason: string; actorId: string; actorName: string }
  ): Promise<ISupportTicket | null> {
    const ticket = await SupportTicket.findOne({
      _id: new Types.ObjectId(ticketId),
      organizationId: new Types.ObjectId(organizationId),
    });
    if (!ticket) return null;

    ticket.status = 'ESCALATED';
    ticket.escalationLevel = (ticket.escalationLevel || 0) + 1;
    ticket.escalationReason = data.reason;
    if (data.escalatedToUserId) {
      ticket.escalatedTo = new Types.ObjectId(data.escalatedToUserId);
    }
    // Boost priority if not already critical
    if (ticket.priority === 'LOW') ticket.priority = 'MEDIUM';
    else if (ticket.priority === 'MEDIUM') ticket.priority = 'HIGH';
    else if (ticket.priority === 'HIGH') ticket.priority = 'CRITICAL';

    await ticket.save();

    const note = new SupportMessage({
      organizationId: ticket.organizationId,
      ticketId: ticket._id,
      senderType: 'SYSTEM',
      senderName: data.actorName || 'Supervisor',
      messageType: 'INTERNAL_NOTE',
      body: `[ESCALATION LEVEL ${ticket.escalationLevel}] Reason: ${data.reason}`,
      isInternalOnly: true,
    });
    await note.save();

    const safeActorId = Types.ObjectId.isValid(data.actorId) ? new Types.ObjectId(data.actorId) : new Types.ObjectId('000000000000000000000001');
    await AuditLogService.logAction({
      action: 'TICKET_ESCALATED',
      actorId: safeActorId,
      actorRole: 'SUPERVISOR',
      organizationId,
      targetCollection: 'support_tickets',
      targetId: ticket._id,
      afterSnapshot: { level: ticket.escalationLevel, reason: data.reason },
    });

    return ticket;
  }

  /**
   * Add message, agent reply, internal note, or call log
   */
  public static async addMessage(
    organizationId: string,
    ticketId: string,
    data: {
      senderType: ISupportMessage['senderType'];
      senderId?: string;
      senderName: string;
      messageType: ISupportMessage['messageType'];
      body: string;
      callDurationSeconds?: number;
      callOutcome?: ISupportMessage['callOutcome'];
      attachments?: Array<{ name: string; url: string; size?: number }>;
      isInternalOnly?: boolean;
      aiDrafted?: boolean;
      updateStatusTo?: ISupportTicket['status'];
    }
  ): Promise<ISupportMessage> {
    const ticket = await SupportTicket.findOne({
      _id: new Types.ObjectId(ticketId),
      organizationId: new Types.ObjectId(organizationId),
    });
    if (!ticket) throw new Error('Ticket not found');

    const msg = new SupportMessage({
      organizationId: ticket.organizationId,
      ticketId: ticket._id,
      senderType: data.senderType,
      senderId: data.senderId ? new Types.ObjectId(data.senderId) : undefined,
      senderName: data.senderName,
      messageType: data.messageType || 'MESSAGE',
      body: data.body,
      callDurationSeconds: data.callDurationSeconds,
      callOutcome: data.callOutcome,
      attachments: data.attachments || [],
      isInternalOnly: Boolean(data.isInternalOnly),
      aiDrafted: Boolean(data.aiDrafted),
    });
    await msg.save();

    // Auto transition status
    if (data.updateStatusTo) {
      ticket.status = data.updateStatusTo;
    } else if (data.senderType === 'AGENT' && ticket.status === 'ASSIGNED') {
      ticket.status = 'IN_PROGRESS';
    } else if (data.senderType === 'AGENT' && !data.isInternalOnly) {
      ticket.status = 'WAITING_FOR_CUSTOMER';
    } else if (data.senderType === 'CUSTOMER' && ticket.status === 'WAITING_FOR_CUSTOMER') {
      ticket.status = 'IN_PROGRESS';
    }
    await ticket.save();

    return msg;
  }

  /**
   * Resolve or Close ticket
   */
  public static async resolveTicket(
    organizationId: string,
    ticketId: string,
    data: { resolutionNotes: string; actorId: string; actorName: string; isClose?: boolean }
  ): Promise<ISupportTicket | null> {
    const ticket = await SupportTicket.findOne({
      _id: new Types.ObjectId(ticketId),
      organizationId: new Types.ObjectId(organizationId),
    });
    if (!ticket) return null;

    ticket.status = data.isClose ? 'CLOSED' : 'RESOLVED';
    ticket.resolutionNotes = data.resolutionNotes;
    if (data.isClose) {
      ticket.closedAt = new Date();
    } else {
      ticket.resolvedAt = new Date();
    }
    await ticket.save();

    const note = new SupportMessage({
      organizationId: ticket.organizationId,
      ticketId: ticket._id,
      senderType: 'AGENT',
      senderId: new Types.ObjectId(data.actorId),
      senderName: data.actorName,
      messageType: 'STATUS_CHANGE',
      body: `Ticket marked as ${ticket.status}. Resolution: ${data.resolutionNotes}`,
      isInternalOnly: false,
    });
    await note.save();

    const safeActorId = Types.ObjectId.isValid(data.actorId) ? new Types.ObjectId(data.actorId) : new Types.ObjectId('000000000000000000000001');
    await AuditLogService.logAction({
      action: data.isClose ? 'TICKET_CLOSED' : 'TICKET_RESOLVED',
      actorId: safeActorId,
      actorRole: 'SUPPORT_AGENT',
      organizationId,
      targetCollection: 'support_tickets',
      targetId: ticket._id,
      afterSnapshot: { ticketNumber: ticket.ticketNumber, resolution: data.resolutionNotes },
    });

    return ticket;
  }
}
