import { Request, Response, NextFunction } from 'express';
import { runInTransaction } from '../config/database';
import { PurchaseDashboardService } from '../services/PurchaseDashboardService';
import { PurchaseRequisitionService } from '../services/PurchaseRequisitionService';
import { GrnService } from '../services/GrnService';
import { PurchaseInvoiceService } from '../services/PurchaseInvoiceService';
import { SupplierPaymentService } from '../services/SupplierPaymentService';
import { PurchaseReturnService } from '../services/PurchaseReturnService';
import { SupplierService } from '../services/SupplierService';
import { ValidationError } from '../errors/AppError';

function getActorId(req: Request): string {
  const user = (req as any).user;
  return user?.id || user?._id?.toString() || '000000000000000000000001';
}

function getOrgId(req: Request): string {
  const user = (req as any).user;
  const orgId =
    (req.headers['x-organization-id'] as string) ||
    (req.query.organizationId as string) ||
    user?.organizationId?.toString() ||
    user?.branchId?.toString();
  if (!orgId) {
    throw new ValidationError('Organization ID is required. Pass X-Organization-ID header or organizationId parameter.');
  }
  return orgId;
}

export class PurchaseController {
  // ─── DASHBOARD ─────────────────────────────────────────────────────────────
  public static async getDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = getOrgId(req);
      const { startDate, endDate } = req.query;
      const data = await PurchaseDashboardService.getDashboardMetrics(orgId, {
        startDate: startDate ? String(startDate) : undefined,
        endDate: endDate ? String(endDate) : undefined,
      });
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  // ─── REQUISITIONS ──────────────────────────────────────────────────────────
  public static async listRequisitions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = getOrgId(req);
      const { status, department, requestedBy, priority, startDate, endDate, search, page, limit } = req.query;
      const result = await PurchaseRequisitionService.listRequisitions(
        {
          status: status ? String(status) : undefined,
          department: department ? String(department) : undefined,
          requestedBy: requestedBy ? String(requestedBy) : undefined,
          priority: priority ? String(priority) : undefined,
          startDate: startDate ? String(startDate) : undefined,
          endDate: endDate ? String(endDate) : undefined,
          search: search ? String(search) : undefined,
          page: page ? parseInt(String(page), 10) : 1,
          limit: limit ? parseInt(String(limit), 10) : 20,
        },
        orgId
      );
      res.status(200).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  public static async getRequisition(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = getOrgId(req);
      const id = Array.isArray(req.params.id) ? req.params.id[0] : String(req.params.id);
      const data = await PurchaseRequisitionService.getRequisitionById(id, orgId);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  public static async createRequisition(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = getOrgId(req);
      const userId = getActorId(req);
      const data = await PurchaseRequisitionService.createRequisition(req.body, userId, orgId);
      res.status(201).json({ success: true, message: 'Purchase requisition created successfully', data });
    } catch (err) {
      next(err);
    }
  }

  public static async submitRequisition(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = getActorId(req);
      const id = Array.isArray(req.params.id) ? req.params.id[0] : String(req.params.id);
      const data = await PurchaseRequisitionService.submitRequisition(id, userId);
      res.status(200).json({ success: true, message: 'Requisition submitted for approval', data });
    } catch (err) {
      next(err);
    }
  }

  public static async approveRequisition(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = getActorId(req);
      const id = Array.isArray(req.params.id) ? req.params.id[0] : String(req.params.id);
      const data = await PurchaseRequisitionService.approveRequisition(id, userId);
      res.status(200).json({ success: true, message: 'Requisition approved', data });
    } catch (err) {
      next(err);
    }
  }

  public static async rejectRequisition(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = getActorId(req);
      const id = Array.isArray(req.params.id) ? req.params.id[0] : String(req.params.id);
      const { reason } = req.body;
      const data = await PurchaseRequisitionService.rejectRequisition(id, userId, reason || 'Rejected by approver');
      res.status(200).json({ success: true, message: 'Requisition rejected', data });
    } catch (err) {
      next(err);
    }
  }

  public static async returnRequisition(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = getActorId(req);
      const id = Array.isArray(req.params.id) ? req.params.id[0] : String(req.params.id);
      const { reason } = req.body;
      const data = await PurchaseRequisitionService.returnRequisition(id, userId, reason || 'Returned for revision');
      res.status(200).json({ success: true, message: 'Requisition returned to initiator', data });
    } catch (err) {
      next(err);
    }
  }

  public static async cancelRequisition(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = getActorId(req);
      const id = Array.isArray(req.params.id) ? req.params.id[0] : String(req.params.id);
      const { reason } = req.body;
      const data = await PurchaseRequisitionService.cancelRequisition(id, userId, reason || 'Cancelled');
      res.status(200).json({ success: true, message: 'Requisition cancelled', data });
    } catch (err) {
      next(err);
    }
  }

  public static async convertToPo(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = getActorId(req);
      const id = Array.isArray(req.params.id) ? req.params.id[0] : String(req.params.id);
      const data = await PurchaseRequisitionService.convertToPurchaseOrder(id, req.body, userId);
      res.status(201).json({ success: true, message: 'Requisition converted to Purchase Order', data });
    } catch (err) {
      next(err);
    }
  }

  // ─── GOODS RECEIVE NOTE (GRN) ──────────────────────────────────────────────
  public static async listGrns(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = getOrgId(req);
      const { status, supplierId, purchaseOrderId, startDate, endDate, search, page, limit } = req.query;
      const result = await GrnService.listGrns(
        {
          status: status ? String(status) : undefined,
          supplierId: supplierId ? String(supplierId) : undefined,
          purchaseOrderId: purchaseOrderId ? String(purchaseOrderId) : undefined,
          startDate: startDate ? String(startDate) : undefined,
          endDate: endDate ? String(endDate) : undefined,
          search: search ? String(search) : undefined,
          page: page ? parseInt(String(page), 10) : 1,
          limit: limit ? parseInt(String(limit), 10) : 20,
        },
        orgId
      );
      res.status(200).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  public static async getGrn(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = getOrgId(req);
      const id = Array.isArray(req.params.id) ? req.params.id[0] : String(req.params.id);
      const data = await GrnService.getGrnById(id, orgId);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  public static async createGrn(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = getOrgId(req);
      const userId = getActorId(req);
      const data = await GrnService.createGrn(req.body, userId, orgId);
      res.status(201).json({ success: true, message: 'GRN created successfully in DRAFT status', data });
    } catch (err) {
      next(err);
    }
  }

  public static async postGrn(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = getActorId(req);
      const id = Array.isArray(req.params.id) ? req.params.id[0] : String(req.params.id);
      const data = await runInTransaction(async (session) => {
        return GrnService.postGrn(id, userId, session);
      });
      res.status(200).json({ success: true, message: 'GRN posted and inventory batches updated', data });
    } catch (err) {
      next(err);
    }
  }

  public static async reverseGrn(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = getActorId(req);
      const id = Array.isArray(req.params.id) ? req.params.id[0] : String(req.params.id);
      const { reason } = req.body;
      const data = await runInTransaction(async (session) => {
        return GrnService.reverseGrn(id, userId, reason || 'Reversal requested', session);
      });
      res.status(200).json({ success: true, message: 'GRN reversed and stock adjusted', data });
    } catch (err) {
      next(err);
    }
  }

  // ─── PURCHASE INVOICES ─────────────────────────────────────────────────────
  public static async listInvoices(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = getOrgId(req);
      const { status, supplierId, purchaseOrderId, overdue, startDate, endDate, search, page, limit } = req.query;
      const result = await PurchaseInvoiceService.listInvoices(
        {
          status: status ? String(status) : undefined,
          supplierId: supplierId ? String(supplierId) : undefined,
          purchaseOrderId: purchaseOrderId ? String(purchaseOrderId) : undefined,
          overdue: overdue === 'true',
          startDate: startDate ? String(startDate) : undefined,
          endDate: endDate ? String(endDate) : undefined,
          search: search ? String(search) : undefined,
          page: page ? parseInt(String(page), 10) : 1,
          limit: limit ? parseInt(String(limit), 10) : 20,
        },
        orgId
      );
      res.status(200).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  public static async getInvoice(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = getOrgId(req);
      const id = Array.isArray(req.params.id) ? req.params.id[0] : String(req.params.id);
      const data = await PurchaseInvoiceService.getInvoiceById(id, orgId);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  public static async createInvoice(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = getOrgId(req);
      const userId = getActorId(req);
      const data = await PurchaseInvoiceService.createInvoice(req.body, userId, orgId);
      res.status(201).json({ success: true, message: 'Purchase invoice created successfully', data });
    } catch (err) {
      next(err);
    }
  }

  public static async submitInvoice(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = getActorId(req);
      const id = Array.isArray(req.params.id) ? req.params.id[0] : String(req.params.id);
      const data = await PurchaseInvoiceService.submitInvoice(id, userId);
      res.status(200).json({ success: true, message: 'Purchase invoice submitted for approval', data });
    } catch (err) {
      next(err);
    }
  }

  public static async postInvoice(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = getActorId(req);
      const id = Array.isArray(req.params.id) ? req.params.id[0] : String(req.params.id);
      const data = await runInTransaction(async (session) => {
        return PurchaseInvoiceService.postInvoice(id, userId, session);
      });
      res.status(200).json({ success: true, message: 'Purchase invoice posted to General Ledger', data });
    } catch (err) {
      next(err);
    }
  }

  public static async getPayablesSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = getOrgId(req);
      const { supplierId, startDate, endDate } = req.query;
      const data = await PurchaseInvoiceService.getPayablesSummary(orgId, {
        supplierId: supplierId ? String(supplierId) : undefined,
        startDate: startDate ? String(startDate) : undefined,
        endDate: endDate ? String(endDate) : undefined,
      });
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  // ─── SUPPLIER PAYMENTS ─────────────────────────────────────────────────────
  public static async listPayments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = getOrgId(req);
      const { status, supplierId, startDate, endDate, search, page, limit } = req.query;
      const result = await SupplierPaymentService.listPayments(
        {
          status: status ? String(status) : undefined,
          supplierId: supplierId ? String(supplierId) : undefined,
          startDate: startDate ? String(startDate) : undefined,
          endDate: endDate ? String(endDate) : undefined,
          search: search ? String(search) : undefined,
          page: page ? parseInt(String(page), 10) : 1,
          limit: limit ? parseInt(String(limit), 10) : 20,
        },
        orgId
      );
      res.status(200).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  public static async getPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = getOrgId(req);
      const id = Array.isArray(req.params.id) ? req.params.id[0] : String(req.params.id);
      const data = await SupplierPaymentService.getPaymentById(id, orgId);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  public static async createPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = getOrgId(req);
      const userId = getActorId(req);
      const data = await SupplierPaymentService.createPayment(req.body, userId, orgId);
      res.status(201).json({ success: true, message: 'Supplier payment voucher created', data });
    } catch (err) {
      next(err);
    }
  }

  public static async postPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = getActorId(req);
      const id = Array.isArray(req.params.id) ? req.params.id[0] : String(req.params.id);
      const data = await runInTransaction(async (session) => {
        return SupplierPaymentService.postPayment(id, userId, session);
      });
      res.status(200).json({ success: true, message: 'Supplier payment posted and AP debited', data });
    } catch (err) {
      next(err);
    }
  }

  public static async reversePayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = getActorId(req);
      const id = Array.isArray(req.params.id) ? req.params.id[0] : String(req.params.id);
      const { reason } = req.body;
      const data = await runInTransaction(async (session) => {
        return SupplierPaymentService.reversePayment(id, userId, reason || 'Payment reversed', session);
      });
      res.status(200).json({ success: true, message: 'Supplier payment reversed', data });
    } catch (err) {
      next(err);
    }
  }

  // ─── PURCHASE RETURNS ──────────────────────────────────────────────────────
  public static async listReturns(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = getOrgId(req);
      const { status, supplierId, startDate, endDate, search, page, limit } = req.query;
      const result = await PurchaseReturnService.listReturns(
        {
          status: status ? String(status) : undefined,
          supplierId: supplierId ? String(supplierId) : undefined,
          startDate: startDate ? String(startDate) : undefined,
          endDate: endDate ? String(endDate) : undefined,
          search: search ? String(search) : undefined,
          page: page ? parseInt(String(page), 10) : 1,
          limit: limit ? parseInt(String(limit), 10) : 20,
        },
        orgId
      );
      res.status(200).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  public static async getReturn(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = getOrgId(req);
      const id = Array.isArray(req.params.id) ? req.params.id[0] : String(req.params.id);
      const data = await PurchaseReturnService.getReturnById(id, orgId);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  public static async createReturn(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = getOrgId(req);
      const userId = getActorId(req);
      const data = await PurchaseReturnService.createReturn(req.body, userId, orgId);
      res.status(201).json({ success: true, message: 'Purchase return created', data });
    } catch (err) {
      next(err);
    }
  }

  public static async submitReturn(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = getActorId(req);
      const id = Array.isArray(req.params.id) ? req.params.id[0] : String(req.params.id);
      const data = await PurchaseReturnService.submitReturn(id, userId);
      res.status(200).json({ success: true, message: 'Purchase return submitted for approval', data });
    } catch (err) {
      next(err);
    }
  }

  public static async postReturn(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = getActorId(req);
      const id = Array.isArray(req.params.id) ? req.params.id[0] : String(req.params.id);
      const data = await runInTransaction(async (session) => {
        return PurchaseReturnService.postReturn(id, userId, session);
      });
      res.status(200).json({ success: true, message: 'Purchase return posted and inventory adjusted', data });
    } catch (err) {
      next(err);
    }
  }

  // ─── SUPPLIER LEDGER & STATS ───────────────────────────────────────────────
  public static async getSupplierLedger(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = getOrgId(req);
      const id = Array.isArray(req.params.id) ? req.params.id[0] : String(req.params.id);
      const { startDate, endDate, page, limit } = req.query;
      const data = await SupplierService.getSupplierLedger(id, orgId, {
        startDate: startDate ? String(startDate) : undefined,
        endDate: endDate ? String(endDate) : undefined,
        page: page ? parseInt(String(page), 10) : 1,
        limit: limit ? parseInt(String(limit), 10) : 20,
      });
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  public static async getSupplierStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = getOrgId(req);
      const { startDate, endDate } = req.query;
      const data = await SupplierService.getSupplierStats(orgId, {
        startDate: startDate ? String(startDate) : undefined,
        endDate: endDate ? String(endDate) : undefined,
      });
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  public static async checkDuplicateSupplier(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = getOrgId(req);
      const data = await SupplierService.checkDuplicateSupplier(req.body, orgId);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
}
