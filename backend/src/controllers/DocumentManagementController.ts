import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { DocumentTemplateModel } from '../models/DocumentTemplate';
import { SalesQuotationModel } from '../models/SalesQuotation';
import { ProformaInvoiceModel } from '../models/ProformaInvoice';
import { SalesInvoiceModel } from '../models/SalesInvoice';
import { DeliveryChallanModel } from '../models/DeliveryChallan';
import { MoneyReceiptModel } from '../models/MoneyReceipt';
import { CreditNoteModel } from '../models/CreditNote';
import { PurchaseOrderModel } from '../models/PurchaseOrder';
import { PurchaseInvoiceModel } from '../models/PurchaseInvoice';
import { OrganizationModel } from '../models/Organization';
import { DocumentTemplateService } from '../services/DocumentTemplateService';
import { SalesDocumentService } from '../services/SalesDocumentService';
import { DocumentDataResolver } from '../services/DocumentDataResolver';
import { DocumentPdfService } from '../services/DocumentPdfService';
import { NotFoundError, ValidationError } from '../errors/AppError';

function getActorId(req: Request): string {
  const user = (req as any).user;
  return user?.id || user?._id?.toString() || '000000000000000000000001';
}

function getOrgId(req: Request): string | undefined {
  const user = (req as any).user;
  return (
    (req.headers['x-organization-id'] as string) ||
    (req.query.organizationId as string) ||
    user?.organizationId?.toString() ||
    user?.branchId?.toString()
  );
}

function getParam(param: string | string[]): string {
  return Array.isArray(param) ? param[0] : param;
}

export class DocumentManagementController {
  // ─── 01. DASHBOARD ────────────────────────────────────────────────────────
  public static async getDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = getOrgId(req);
      const query: any = {};
      if (orgId) query.organizationId = new Types.ObjectId(orgId);

      const [
        totalQuotations,
        totalProformas,
        totalInvoices,
        totalChallans,
        totalReceipts,
        totalCreditNotes,
        totalPurchaseOrders,
        totalPurchaseInvoices,
        totalTemplates,
      ] = await Promise.all([
        SalesQuotationModel.countDocuments(query),
        ProformaInvoiceModel.countDocuments(query),
        SalesInvoiceModel.countDocuments({}),
        DeliveryChallanModel.countDocuments({}),
        MoneyReceiptModel.countDocuments(query),
        CreditNoteModel.countDocuments(query),
        PurchaseOrderModel.countDocuments(query),
        PurchaseInvoiceModel.countDocuments(query),
        DocumentTemplateModel.countDocuments(query),
      ]);

      const recentQuotations = await SalesQuotationModel.find(query)
        .populate('customerId', 'name companyName')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean();

      res.status(200).json({
        success: true,
        data: {
          metrics: {
            totalQuotations,
            totalProformas,
            totalInvoices,
            totalChallans,
            totalReceipts,
            totalCreditNotes,
            totalPurchaseOrders,
            totalPurchaseInvoices,
            totalTemplates,
          },
          recentQuotations,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  // ─── 02. TEMPLATES ────────────────────────────────────────────────────────
  public static async listTemplates(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = getOrgId(req);
      const { documentType, search, page, limit, isActive } = req.query;

      const data = await DocumentTemplateService.getTemplates({
        organizationId: orgId,
        documentType: documentType as any,
        isActive: isActive !== undefined ? isActive === 'true' : undefined,
        search: search ? String(search) : undefined,
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 20,
      });

      res.status(200).json({ success: true, ...data });
    } catch (err) {
      next(err);
    }
  }

  public static async createTemplate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actorId = getActorId(req);
      const orgId = getOrgId(req) || req.body.organizationId;
      if (!orgId) throw new ValidationError('organizationId is required');

      const template = await DocumentTemplateService.createTemplate(
        { ...req.body, organizationId: new Types.ObjectId(orgId) },
        actorId
      );
      res.status(201).json({ success: true, data: template });
    } catch (err) {
      next(err);
    }
  }

  public static async getTemplate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const template = await DocumentTemplateService.getTemplateById(getParam(req.params.id));
      res.status(200).json({ success: true, data: template });
    } catch (err) {
      next(err);
    }
  }

  public static async updateTemplate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actorId = getActorId(req);
      const template = await DocumentTemplateService.updateTemplate(
        getParam(req.params.id),
        req.body,
        actorId
      );
      res.status(200).json({ success: true, data: template });
    } catch (err) {
      next(err);
    }
  }

  public static async duplicateTemplate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actorId = getActorId(req);
      const template = await DocumentTemplateService.duplicateTemplate(getParam(req.params.id), actorId);
      res.status(201).json({ success: true, data: template });
    } catch (err) {
      next(err);
    }
  }

  public static async setDefaultTemplate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = getOrgId(req) || req.body.organizationId;
      if (!orgId) throw new ValidationError('organizationId is required');

      const template = await DocumentTemplateService.setDefaultTemplate(
        getParam(req.params.id),
        orgId,
        req.body.documentType
      );
      res.status(200).json({ success: true, data: template });
    } catch (err) {
      next(err);
    }
  }

  public static async deleteTemplate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await DocumentTemplateService.deleteTemplate(getParam(req.params.id));
      res.status(200).json({ success: true, message: 'Template deleted' });
    } catch (err) {
      next(err);
    }
  }

  public static async seedDefaultTemplates(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actorId = getActorId(req);
      const orgId = getOrgId(req) || req.body.organizationId;
      if (!orgId) throw new ValidationError('organizationId is required');

      const result = await DocumentTemplateService.seedDefaultTemplates(orgId, actorId);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  // ─── 03. SALES QUOTATIONS ─────────────────────────────────────────────────
  public static async listQuotations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = getOrgId(req);
      const { customerId, status, search, page, limit } = req.query;

      const data = await SalesDocumentService.getQuotations({
        organizationId: orgId,
        customerId: customerId ? String(customerId) : undefined,
        status: status as any,
        search: search ? String(search) : undefined,
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 20,
      });

      res.status(200).json({ success: true, ...data });
    } catch (err) {
      next(err);
    }
  }

  public static async createQuotation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actorId = getActorId(req);
      const orgId = getOrgId(req) || req.body.organizationId;
      if (!orgId) throw new ValidationError('organizationId is required');

      const quotation = await SalesDocumentService.createQuotation(
        { ...req.body, organizationId: orgId },
        actorId
      );
      res.status(201).json({ success: true, data: quotation });
    } catch (err) {
      next(err);
    }
  }

  public static async getQuotation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const quotation = await SalesDocumentService.getQuotationById(getParam(req.params.id));
      res.status(200).json({ success: true, data: quotation });
    } catch (err) {
      next(err);
    }
  }

  public static async approveQuotation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actorId = getActorId(req);
      const quotation = await SalesDocumentService.approveQuotation(getParam(req.params.id), actorId);
      res.status(200).json({ success: true, data: quotation });
    } catch (err) {
      next(err);
    }
  }

  // ─── 04. PROFORMA INVOICES ────────────────────────────────────────────────
  public static async listProformas(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = getOrgId(req);
      const { customerId, status, search, page, limit } = req.query;

      const data = await SalesDocumentService.getProformas({
        organizationId: orgId,
        customerId: customerId ? String(customerId) : undefined,
        status: status as any,
        search: search ? String(search) : undefined,
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 20,
      });

      res.status(200).json({ success: true, ...data });
    } catch (err) {
      next(err);
    }
  }

  public static async createProforma(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actorId = getActorId(req);
      const orgId = getOrgId(req) || req.body.organizationId;
      if (!orgId) throw new ValidationError('organizationId is required');

      const proforma = await SalesDocumentService.createProforma(
        { ...req.body, organizationId: orgId },
        actorId
      );
      res.status(201).json({ success: true, data: proforma });
    } catch (err) {
      next(err);
    }
  }

  public static async getProforma(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const proforma = await SalesDocumentService.getProformaById(getParam(req.params.id));
      res.status(200).json({ success: true, data: proforma });
    } catch (err) {
      next(err);
    }
  }

  // ─── 05. MONEY RECEIPTS ───────────────────────────────────────────────────
  public static async listReceipts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = getOrgId(req);
      const { customerId, status, page, limit } = req.query;

      const data = await SalesDocumentService.getMoneyReceipts({
        organizationId: orgId,
        customerId: customerId ? String(customerId) : undefined,
        status: status as any,
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 20,
      });

      res.status(200).json({ success: true, ...data });
    } catch (err) {
      next(err);
    }
  }

  public static async createReceipt(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actorId = getActorId(req);
      const orgId = getOrgId(req) || req.body.organizationId;
      if (!orgId) throw new ValidationError('organizationId is required');

      const receipt = await SalesDocumentService.createMoneyReceipt(
        { ...req.body, organizationId: orgId },
        actorId
      );
      res.status(201).json({ success: true, data: receipt });
    } catch (err) {
      next(err);
    }
  }

  public static async getReceipt(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const receipt = await SalesDocumentService.getMoneyReceiptById(getParam(req.params.id));
      res.status(200).json({ success: true, data: receipt });
    } catch (err) {
      next(err);
    }
  }

  public static async postReceipt(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actorId = getActorId(req);
      const receipt = await SalesDocumentService.postMoneyReceipt(getParam(req.params.id), actorId);
      res.status(200).json({ success: true, data: receipt });
    } catch (err) {
      next(err);
    }
  }

  // ─── 06. CREDIT NOTES ─────────────────────────────────────────────────────
  public static async listCreditNotes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = getOrgId(req);
      const { customerId, status, page, limit } = req.query;

      const data = await SalesDocumentService.getCreditNotes({
        organizationId: orgId,
        customerId: customerId ? String(customerId) : undefined,
        status: status as any,
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 20,
      });

      res.status(200).json({ success: true, ...data });
    } catch (err) {
      next(err);
    }
  }

  public static async createCreditNote(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actorId = getActorId(req);
      const orgId = getOrgId(req) || req.body.organizationId;
      if (!orgId) throw new ValidationError('organizationId is required');

      const cn = await SalesDocumentService.createCreditNote(
        { ...req.body, organizationId: orgId },
        actorId
      );
      res.status(201).json({ success: true, data: cn });
    } catch (err) {
      next(err);
    }
  }

  public static async getCreditNote(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const cn = await SalesDocumentService.getCreditNoteById(getParam(req.params.id));
      res.status(200).json({ success: true, data: cn });
    } catch (err) {
      next(err);
    }
  }

  public static async postCreditNote(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actorId = getActorId(req);
      const cn = await SalesDocumentService.postCreditNote(getParam(req.params.id), actorId);
      res.status(200).json({ success: true, data: cn });
    } catch (err) {
      next(err);
    }
  }

  // ─── 07. UNIVERSAL DOCUMENT PREVIEW & PDF DOWNLOAD ────────────────────────
  public static async previewDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { docType, id } = req.params;
      const { templateId } = req.query;

      const payload = await DocumentDataResolver.resolveDocument(
        getParam(docType) as any,
        getParam(id),
        templateId ? String(templateId) : undefined
      );

      res.status(200).json({ success: true, data: payload });
    } catch (err) {
      next(err);
    }
  }

  public static async downloadDocumentPdf(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { docType, id } = req.params;
      const { templateId } = req.query;

      const payload = await DocumentDataResolver.resolveDocument(
        getParam(docType) as any,
        getParam(id),
        templateId ? String(templateId) : undefined
      );

      const pdfBuffer = await DocumentPdfService.generateDocumentPdf(payload);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `inline; filename="${payload.documentNumber || 'document'}.pdf"`
      );
      res.status(200).send(pdfBuffer);
    } catch (err) {
      next(err);
    }
  }

  // ─── 08. BRANDING & ASSETS ────────────────────────────────────────────────
  public static async getBranding(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = getOrgId(req) || getParam(req.params.orgId);
      if (!orgId) throw new ValidationError('Organization ID required');

      const org = await OrganizationModel.findById(orgId).lean();
      if (!org) throw new NotFoundError('Organization not found');

      res.status(200).json({
        success: true,
        data: {
          branding: org.branding || {},
          signatories: org.signatories || [],
          stamps: org.stamps || [],
          bankAccounts: org.bankAccounts || [],
          documentConfig: org.documentConfig || {},
        },
      });
    } catch (err) {
      next(err);
    }
  }

  public static async updateBranding(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = getOrgId(req) || getParam(req.params.orgId);
      if (!orgId) throw new ValidationError('Organization ID required');

      const org = await OrganizationModel.findById(orgId);
      if (!org) throw new NotFoundError('Organization not found');

      if (req.body.branding) org.branding = { ...org.branding, ...req.body.branding };
      if (req.body.signatories) org.signatories = req.body.signatories;
      if (req.body.stamps) org.stamps = req.body.stamps;
      if (req.body.bankAccounts) org.bankAccounts = req.body.bankAccounts;
      if (req.body.documentConfig) org.documentConfig = { ...org.documentConfig, ...req.body.documentConfig };

      await org.save();
      res.status(200).json({ success: true, message: 'Branding updated', data: org });
    } catch (err) {
      next(err);
    }
  }
}

export default DocumentManagementController;
