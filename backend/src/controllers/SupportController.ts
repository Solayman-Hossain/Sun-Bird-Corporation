import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { SupportTicketService } from '../services/SupportTicketService';
import { RmaReturnService } from '../services/RmaReturnService';
import { WarrantyServiceCenterService } from '../services/WarrantyServiceCenterService';
import { SupportAnalyticsService } from '../services/SupportAnalyticsService';
import { SupportAiService } from '../services/SupportAiService';
import { AuditLogService } from '../services/AuditLogService';
import { AuditLogModel } from '../models/AuditLog';
import { NotFoundError, ValidationError } from '../errors/AppError';
import logger from '../config/logger';

export class SupportController {
  private static getOrgId(req: Request): string {
    const orgId =
      (req.user as any)?.organizationId ||
      req.query.organizationId ||
      req.headers['x-organization-id'] ||
      '600000000000000000000001';
    return String(orgId);
  }

  private static getActor(req: Request): { id: string; name: string } {
    const user = (req.user as any) || {};
    return {
      id: user._id ? String(user._id) : (user.id ? String(user.id) : 'SYSTEM'),
      name: user.fullName || user.name || user.email || 'Support Agent',
    };
  }

  // ─────────────────────────────────────────────────────────────
  // 1. DASHBOARD & MIS ANALYTICS
  // ─────────────────────────────────────────────────────────────

  public static async getDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = SupportController.getOrgId(req);
      const kpis = await SupportAnalyticsService.getDashboardKpis(orgId);
      res.status(200).json({ success: true, data: kpis });
    } catch (err) {
      next(err);
    }
  }

  public static async getMisAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = SupportController.getOrgId(req);
      const data = await SupportAnalyticsService.getMisAnalytics(orgId);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 2. TICKETS & COMPLAINTS
  // ─────────────────────────────────────────────────────────────

  public static async getTickets(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = SupportController.getOrgId(req);
      const result = await SupportTicketService.getTickets(orgId, {
        status: req.query.status as string,
        priority: req.query.priority as string,
        category: req.query.category as string,
        type: req.query.type as string,
        assignedTo: req.query.assignedTo as string,
        search: req.query.search as string,
        isSlaBreached: req.query.isSlaBreached === 'true' ? true : req.query.isSlaBreached === 'false' ? false : undefined,
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 20,
      });
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  public static async getTicketById(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = SupportController.getOrgId(req);
      const idOrNumber = String(req.params.id);
      const result = await SupportTicketService.getTicketById(orgId, idOrNumber);
      if (!result) throw new NotFoundError(`Ticket '${idOrNumber}' not found`);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  public static async createTicket(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = SupportController.getOrgId(req);
      const actor = SupportController.getActor(req);
      const ticket = await SupportTicketService.createTicket({
        organizationId: orgId,
        ...req.body,
        createdByUserId: actor.id,
        createdByName: actor.name,
      });
      res.status(201).json({ success: true, data: ticket });
    } catch (err) {
      next(err);
    }
  }

  public static async assignTicket(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = SupportController.getOrgId(req);
      const actor = SupportController.getActor(req);
      const id = String(req.params.id);
      const { userId, userName } = req.body;
      const updated = await SupportTicketService.assignTicket(orgId, id, userId, userName, actor.id);
      if (!updated) throw new NotFoundError('Ticket not found');
      res.status(200).json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }

  public static async escalateTicket(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = SupportController.getOrgId(req);
      const actor = SupportController.getActor(req);
      const id = String(req.params.id);
      const { escalatedToUserId, reason } = req.body;
      const updated = await SupportTicketService.escalateTicket(orgId, id, {
        escalatedToUserId,
        reason,
        actorId: actor.id,
        actorName: actor.name,
      });
      if (!updated) throw new NotFoundError('Ticket not found');
      res.status(200).json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }

  public static async addTicketMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = SupportController.getOrgId(req);
      const actor = SupportController.getActor(req);
      const id = String(req.params.id);
      const msg = await SupportTicketService.addMessage(orgId, id, {
        ...req.body,
        senderId: req.body.senderId || actor.id,
        senderName: req.body.senderName || actor.name,
      });
      res.status(201).json({ success: true, data: msg });
    } catch (err) {
      next(err);
    }
  }

  public static async resolveTicket(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = SupportController.getOrgId(req);
      const actor = SupportController.getActor(req);
      const id = String(req.params.id);
      const { resolutionNotes, isClose } = req.body;
      const updated = await SupportTicketService.resolveTicket(orgId, id, {
        resolutionNotes,
        actorId: actor.id,
        actorName: actor.name,
        isClose,
      });
      if (!updated) throw new NotFoundError('Ticket not found');
      res.status(200).json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 3. RMA & RETURN MANAGEMENT
  // ─────────────────────────────────────────────────────────────

  public static async getRmas(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = SupportController.getOrgId(req);
      const result = await RmaReturnService.getRmaRequests(orgId, {
        status: req.query.status as string,
        approvalStatus: req.query.approvalStatus as string,
        returnType: req.query.returnType as string,
        search: req.query.search as string,
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 20,
      });
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  public static async getRmaById(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = SupportController.getOrgId(req);
      const id = String(req.params.id);
      const result = await RmaReturnService.getRmaById(orgId, id);
      if (!result) throw new NotFoundError(`RMA '${id}' not found`);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  public static async createRma(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = SupportController.getOrgId(req);
      const actor = SupportController.getActor(req);
      const rma = await RmaReturnService.createRmaRequest({
        organizationId: orgId,
        ...req.body,
        actorId: actor.id,
      });
      res.status(201).json({ success: true, data: rma });
    } catch (err) {
      next(err);
    }
  }

  public static async approveOrRejectRma(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = SupportController.getOrgId(req);
      const actor = SupportController.getActor(req);
      const id = String(req.params.id);
      const { decision, rejectionReason } = req.body;
      const updated = await RmaReturnService.approveOrRejectRma(orgId, id, decision, rejectionReason, actor.id);
      if (!updated) throw new NotFoundError('RMA request not found');
      res.status(200).json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }

  public static async updateRmaShipping(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = SupportController.getOrgId(req);
      const actor = SupportController.getActor(req);
      const id = String(req.params.id);
      const updated = await RmaReturnService.updateShipping(orgId, id, {
        ...req.body,
        actorId: actor.id,
      });
      if (!updated) throw new NotFoundError('RMA request not found');
      res.status(200).json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }

  public static async createRmaInspection(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = SupportController.getOrgId(req);
      const actor = SupportController.getActor(req);
      const id = String(req.params.id);
      const inspection = await RmaReturnService.createInspection(orgId, id, {
        ...req.body,
        inspectorId: req.body.inspectorId || actor.id,
        inspectorName: req.body.inspectorName || actor.name,
      });
      res.status(201).json({ success: true, data: inspection });
    } catch (err) {
      next(err);
    }
  }

  public static async processRmaRefund(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = SupportController.getOrgId(req);
      const actor = SupportController.getActor(req);
      const id = String(req.params.id);
      const updated = await RmaReturnService.processRefund(orgId, id, {
        refundVoucherNumber: req.body.refundVoucherNumber,
        actorId: actor.id,
      });
      if (!updated) throw new NotFoundError('RMA request not found');
      res.status(200).json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }

  public static async completeRmaReplacement(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = SupportController.getOrgId(req);
      const actor = SupportController.getActor(req);
      const id = String(req.params.id);
      const updated = await RmaReturnService.completeReplacement(orgId, id, {
        replacementOrderNumber: req.body.replacementOrderNumber,
        replacementOrderId: req.body.replacementOrderId,
        actorId: actor.id,
      });
      if (!updated) throw new NotFoundError('RMA request not found');
      res.status(200).json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 4. WARRANTY & SERVICE CENTER
  // ─────────────────────────────────────────────────────────────

  public static async registerWarranty(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = SupportController.getOrgId(req);
      const actor = SupportController.getActor(req);
      const warranty = await WarrantyServiceCenterService.registerWarranty({
        organizationId: orgId,
        ...req.body,
        actorId: actor.id,
      });
      res.status(201).json({ success: true, data: warranty });
    } catch (err) {
      next(err);
    }
  }

  public static async verifyWarranty(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = SupportController.getOrgId(req);
      const serialNumber = String(req.params.serialNumber);
      const defectDescription = req.query.defectDescription as string | undefined;
      const result = await WarrantyServiceCenterService.verifyWarrantyBySerial(orgId, serialNumber, defectDescription);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  public static async getWarranties(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = SupportController.getOrgId(req);
      const result = await WarrantyServiceCenterService.getWarranties(orgId, {
        status: req.query.status as string,
        search: req.query.search as string,
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 20,
      });
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  public static async getExpiringWarranties(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = SupportController.getOrgId(req);
      const daysAhead = req.query.days ? Number(req.query.days) : 30;
      const list = await WarrantyServiceCenterService.getExpiringWarranties(orgId, daysAhead);
      res.status(200).json({ success: true, data: list });
    } catch (err) {
      next(err);
    }
  }

  public static async getWarrantyClaims(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = SupportController.getOrgId(req);
      const result = await WarrantyServiceCenterService.getWarrantyClaims(orgId, {
        status: req.query.status as string,
        search: req.query.search as string,
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 20,
      });
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  public static async createWarrantyClaim(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = SupportController.getOrgId(req);
      const actor = SupportController.getActor(req);
      const claim = await WarrantyServiceCenterService.createWarrantyClaim({
        organizationId: orgId,
        ...req.body,
        actorId: actor.id,
      });
      res.status(201).json({ success: true, data: claim });
    } catch (err) {
      next(err);
    }
  }

  public static async getRepairJobCards(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = SupportController.getOrgId(req);
      const result = await WarrantyServiceCenterService.getRepairJobCards(orgId, {
        status: req.query.status as string,
        technicianId: req.query.technicianId as string,
        search: req.query.search as string,
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 20,
      });
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  public static async createRepairJobCard(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = SupportController.getOrgId(req);
      const actor = SupportController.getActor(req);
      const job = await WarrantyServiceCenterService.createRepairJobCard({
        organizationId: orgId,
        ...req.body,
        actorId: actor.id,
      });
      res.status(201).json({ success: true, data: job });
    } catch (err) {
      next(err);
    }
  }

  public static async updateRepairJobCard(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = SupportController.getOrgId(req);
      const actor = SupportController.getActor(req);
      const id = String(req.params.id);
      const updated = await WarrantyServiceCenterService.updateRepairJobCard(orgId, id, {
        ...req.body,
        actorId: actor.id,
      });
      if (!updated) throw new NotFoundError('Repair Job Card not found');
      res.status(200).json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 5. AI CO-PILOT ENDPOINTS
  // ─────────────────────────────────────────────────────────────

  public static async classifyComplaintAi(req: Request, res: Response, next: NextFunction) {
    try {
      const { subject, description } = req.body;
      const analysis = await SupportAiService.analyzeComplaint(subject || '', description || '');
      res.status(200).json({ success: true, data: analysis });
    } catch (err) {
      next(err);
    }
  }

  public static async draftAiReply(req: Request, res: Response, next: NextFunction) {
    try {
      const { ticket, agentNotes } = req.body;
      const draft = await SupportAiService.draftCustomerReply(ticket, agentNotes);
      res.status(200).json({ success: true, data: draft });
    } catch (err) {
      next(err);
    }
  }

  public static async getTroubleshootingAi(req: Request, res: Response, next: NextFunction) {
    try {
      const { productName, faultDescription } = req.body;
      const advice = await SupportAiService.generateTroubleshooting(productName || 'Medical Equipment', faultDescription || '');
      res.status(200).json({ success: true, data: advice });
    } catch (err) {
      next(err);
    }
  }

  public static async askAiAssistant(req: Request, res: Response, next: NextFunction) {
    try {
      const { query, context } = req.body;
      const response = await SupportAiService.askAiSupportAssistant(query, context);
      res.status(200).json({ success: true, data: response });
    } catch (err) {
      next(err);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 6. FEEDBACK, KB, SETTINGS & AUDIT LOGS
  // ─────────────────────────────────────────────────────────────

  public static async submitCustomerFeedback(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = SupportController.getOrgId(req);
      const fb = await SupportAnalyticsService.submitCustomerFeedback({
        organizationId: orgId,
        ...req.body,
      });
      res.status(201).json({ success: true, data: fb });
    } catch (err) {
      next(err);
    }
  }

  public static async getFeedbacks(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = SupportController.getOrgId(req);
      const result = await SupportAnalyticsService.getFeedbacks(orgId, {
        rating: req.query.rating ? Number(req.query.rating) : undefined,
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 20,
      });
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  public static async getKnowledgeBase(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = SupportController.getOrgId(req);
      const list = await SupportAnalyticsService.getKnowledgeBase(orgId, {
        category: req.query.category as string,
        search: req.query.search as string,
      });
      res.status(200).json({ success: true, data: list });
    } catch (err) {
      next(err);
    }
  }

  public static async createKnowledgeBaseArticle(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = SupportController.getOrgId(req);
      const article = await SupportAnalyticsService.createKnowledgeBaseArticle({
        organizationId: orgId,
        ...req.body,
      });
      res.status(201).json({ success: true, data: article });
    } catch (err) {
      next(err);
    }
  }

  public static async getSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = SupportController.getOrgId(req);
      const settings = await SupportAnalyticsService.getSettings(orgId);
      res.status(200).json({ success: true, data: settings });
    } catch (err) {
      next(err);
    }
  }

  public static async updateSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = SupportController.getOrgId(req);
      const actor = SupportController.getActor(req);
      const settings = await SupportAnalyticsService.updateSettings(orgId, req.body, actor.id);
      res.status(200).json({ success: true, data: settings });
    } catch (err) {
      next(err);
    }
  }

  public static async getAuditLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = SupportController.getOrgId(req);
      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.max(1, Math.min(100, Number(req.query.limit) || 20));
      const skip = (page - 1) * limit;

      const filter: any = {
        organizationId: new Types.ObjectId(orgId),
        resource: { $in: ['SupportTicket', 'RmaRequest', 'ReturnInspection', 'WarrantyRecord', 'WarrantyClaim', 'RepairJobCard', 'SupportSettings'] },
      };

      const [logs, total] = await Promise.all([
        AuditLogModel.find(filter).sort({ timestamp: -1, createdAt: -1 }).skip(skip).limit(limit).lean(),
        AuditLogModel.countDocuments(filter),
      ]);

      res.status(200).json({
        success: true,
        data: {
          logs,
          total,
          page,
          totalPages: Math.ceil(total / limit) || 1,
        },
      });
    } catch (err) {
      next(err);
    }
  }
}
