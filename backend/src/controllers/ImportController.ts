import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { ImportLCModel } from '../models/ImportLC';
import { ProformaInvoiceModel } from '../models/ProformaInvoice';
import { LCAmendmentModel } from '../models/LCAmendment';
import { ImportShipmentModel } from '../models/ImportShipment';
import { CustomsClearanceModel } from '../models/CustomsClearance';
import { ImportPaymentModel } from '../models/ImportPayment';
import { ImportDocumentModel } from '../models/ImportDocument';
import { ImportSettingsModel } from '../models/ImportSettings';
import { ImportLcService } from '../services/ImportLcService';
import { ImportShipmentService } from '../services/ImportShipmentService';
import { ImportFinanceService } from '../services/ImportFinanceService';
import { ImportDocumentService } from '../services/ImportDocumentService';
import { ImportAnalyticsService } from '../services/ImportAnalyticsService';
import { ImportAiService } from '../services/ImportAiService';
import { NotFoundError, ValidationError } from '../errors/AppError';
import logger from '../config/logger';

export class ImportController {
  // ════════════════════════════════════════════════════════════════════════
  // 1. DASHBOARD & MIS REPORTS
  // ════════════════════════════════════════════════════════════════════════

  public static async getDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.query.organizationId as string | undefined;
      const kpis = await ImportAnalyticsService.getDashboardMetrics(orgId);
      res.status(200).json({ success: true, data: kpis });
    } catch (err) {
      next(err);
    }
  }

  public static async getReport(req: Request, res: Response, next: NextFunction) {
    try {
      const reportType = (req.query.reportType as string) || 'LC_REGISTER';
      const orgId = req.query.organizationId as string | undefined;
      const result = await ImportAnalyticsService.generateImportReport(reportType, orgId);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  // ════════════════════════════════════════════════════════════════════════
  // 2. LETTER OF CREDIT (LC) & AMENDMENTS
  // ════════════════════════════════════════════════════════════════════════

  public static async listLcs(req: Request, res: Response, next: NextFunction) {
    try {
      const { organizationId, status, search, page = '1', limit = '50' } = req.query;
      const filter: any = {};
      if (organizationId) filter.organizationId = new Types.ObjectId(organizationId as string);
      if (status) filter.status = status;
      if (search) {
        filter.$or = [
          { lcNumber: { $regex: search as string, $options: 'i' } },
          { issuingBank: { $regex: search as string, $options: 'i' } },
        ];
      }

      const p = parseInt(page as string, 10);
      const l = parseInt(limit as string, 10);
      const skip = (p - 1) * l;

      const [items, total] = await Promise.all([
        ImportLCModel.find(filter)
          .populate('supplierId', 'name contactPerson email phone')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(l),
        ImportLCModel.countDocuments(filter),
      ]);

      res.status(200).json({
        success: true,
        data: items,
        pagination: { page: p, limit: l, total, pages: Math.ceil(total / l) },
      });
    } catch (err) {
      next(err);
    }
  }

  public static async getLcById(req: Request, res: Response, next: NextFunction) {
    try {
      const lc = await ImportLCModel.findById(req.params.id as string)
        .populate('supplierId')
        .populate('purchaseOrderId')
        .populate('proformaInvoiceId');
      if (!lc) throw new NotFoundError('ImportLC', req.params.id as string);

      const amendments = await LCAmendmentModel.find({ lcId: lc._id }).sort({ amendmentNumber: 1 });
      const shipments = await ImportShipmentModel.find({ lcId: lc._id }).sort({ createdAt: -1 });
      const payments = await ImportPaymentModel.find({ lcId: lc._id }).sort({ paymentDate: -1 });

      res.status(200).json({
        success: true,
        data: {
          lc,
          amendments,
          shipments,
          payments,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  public static async createLc(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.userId || '000000000000000000000001';
      const lc = await ImportLcService.createImportLc({
        ...req.body,
      });

      // Update extended fields if provided
      if (req.body.organizationId) lc.organizationId = new Types.ObjectId(req.body.organizationId);
      if (req.body.applicantOrganization) lc.applicantOrganization = req.body.applicantOrganization;
      if (req.body.advisingBank) lc.advisingBank = req.body.advisingBank;
      if (req.body.lcMarginPercentage) lc.lcMarginPercentage = req.body.lcMarginPercentage;
      if (req.body.lcMarginAmountBDT) lc.lcMarginAmountBDT = req.body.lcMarginAmountBDT;
      if (req.body.lcExpiryDate) lc.lcExpiryDate = new Date(req.body.lcExpiryDate);
      if (req.body.latestShipmentDate) lc.latestShipmentDate = new Date(req.body.latestShipmentDate);
      if (req.body.portOfLoading) lc.portOfLoading = req.body.portOfLoading;
      if (req.body.portOfDischarge) lc.portOfDischarge = req.body.portOfDischarge;
      if (req.body.incoterms) lc.incoterms = req.body.incoterms;
      if (req.body.paymentTerms) lc.paymentTerms = req.body.paymentTerms;
      if (req.body.tolerancePercentage) lc.tolerancePercentage = req.body.tolerancePercentage;
      if (req.body.proformaInvoiceId) lc.proformaInvoiceId = new Types.ObjectId(req.body.proformaInvoiceId);
      if (req.body.proformaInvoiceNumber) lc.proformaInvoiceNumber = req.body.proformaInvoiceNumber;
      if (req.body.remarks) lc.remarks = req.body.remarks;
      await lc.save();

      res.status(201).json({ success: true, data: lc });
    } catch (err) {
      next(err);
    }
  }

  public static async createAmendment(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.userId || '000000000000000000000001';
      const amendment = await ImportFinanceService.createLCAmendment(
        {
          ...req.body,
          lcId: req.params.id as string,
        },
        userId
      );
      res.status(201).json({ success: true, data: amendment });
    } catch (err) {
      next(err);
    }
  }

  public static async listAmendments(req: Request, res: Response, next: NextFunction) {
    try {
      const amendments = await LCAmendmentModel.find({ lcId: req.params.id as string }).sort({
        amendmentNumber: 1,
      });
      res.status(200).json({ success: true, data: amendments });
    } catch (err) {
      next(err);
    }
  }

  // ════════════════════════════════════════════════════════════════════════
  // 3. PROFORMA INVOICES (PI)
  // ════════════════════════════════════════════════════════════════════════

  public static async listProformaInvoices(req: Request, res: Response, next: NextFunction) {
    try {
      const { organizationId, status } = req.query;
      const filter: any = {};
      if (organizationId) filter.organizationId = new Types.ObjectId(organizationId as string);
      if (status) filter.status = status;

      const items = await ProformaInvoiceModel.find(filter)
        .populate('supplierId', 'name contactPerson email phone')
        .sort({ createdAt: -1 });
      res.status(200).json({ success: true, data: items });
    } catch (err) {
      next(err);
    }
  }

  public static async createProformaInvoice(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.userId || '000000000000000000000001';
      const pi = await ImportFinanceService.createProformaInvoice(req.body, userId);
      res.status(201).json({ success: true, data: pi });
    } catch (err) {
      next(err);
    }
  }

  // ════════════════════════════════════════════════════════════════════════
  // 4. SHIPMENTS & TRACKING
  // ════════════════════════════════════════════════════════════════════════

  public static async listShipments(req: Request, res: Response, next: NextFunction) {
    try {
      const { organizationId, status, lcId } = req.query;
      const filter: any = {};
      if (organizationId) filter.organizationId = new Types.ObjectId(organizationId as string);
      if (status) filter.shipmentStatus = status;
      if (lcId) filter.lcId = new Types.ObjectId(lcId as string);

      const items = await ImportShipmentModel.find(filter)
        .populate('supplierId', 'name')
        .sort({ eta: 1 });
      res.status(200).json({ success: true, data: items });
    } catch (err) {
      next(err);
    }
  }

  public static async createShipment(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.userId || '000000000000000000000001';
      const shipment = await ImportShipmentService.createShipment(req.body, userId);
      res.status(201).json({ success: true, data: shipment });
    } catch (err) {
      next(err);
    }
  }

  public static async addTrackingEvent(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.userId || '000000000000000000000001';
      const shipment = await ImportShipmentService.addTrackingEvent(
        {
          ...req.body,
          shipmentId: req.params.id as string,
        },
        userId
      );
      res.status(200).json({ success: true, data: shipment });
    } catch (err) {
      next(err);
    }
  }

  // ════════════════════════════════════════════════════════════════════════
  // 5. CUSTOMS CLEARANCE & BILL OF ENTRY
  // ════════════════════════════════════════════════════════════════════════

  public static async listCustomsClearances(req: Request, res: Response, next: NextFunction) {
    try {
      const { organizationId, lcId } = req.query;
      const filter: any = {};
      if (organizationId) filter.organizationId = new Types.ObjectId(organizationId as string);
      if (lcId) filter.lcId = new Types.ObjectId(lcId as string);

      const items = await CustomsClearanceModel.find(filter).sort({ billOfEntryDate: -1 });
      res.status(200).json({ success: true, data: items });
    } catch (err) {
      next(err);
    }
  }

  public static async recordCustomsClearance(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.userId || '000000000000000000000001';
      const clearance = await ImportShipmentService.recordCustomsClearance(req.body, userId);
      res.status(201).json({ success: true, data: clearance });
    } catch (err) {
      next(err);
    }
  }

  // ════════════════════════════════════════════════════════════════════════
  // 6. IMPORT PAYMENTS & BANK MARGINS
  // ════════════════════════════════════════════════════════════════════════

  public static async listPayments(req: Request, res: Response, next: NextFunction) {
    try {
      const { organizationId, lcId, paymentType } = req.query;
      const filter: any = {};
      if (organizationId) filter.organizationId = new Types.ObjectId(organizationId as string);
      if (lcId) filter.lcId = new Types.ObjectId(lcId as string);
      if (paymentType) filter.paymentType = paymentType;

      const items = await ImportPaymentModel.find(filter).sort({ paymentDate: -1 });
      res.status(200).json({ success: true, data: items });
    } catch (err) {
      next(err);
    }
  }

  public static async recordPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.userId || '000000000000000000000001';
      const payment = await ImportFinanceService.recordImportPayment(req.body, userId);
      res.status(201).json({ success: true, data: payment });
    } catch (err) {
      next(err);
    }
  }

  // ════════════════════════════════════════════════════════════════════════
  // 7. IMPORT DOCUMENT REPOSITORY
  // ════════════════════════════════════════════════════════════════════════

  public static async listDocuments(req: Request, res: Response, next: NextFunction) {
    try {
      const { organizationId, lcId, documentType } = req.query;
      const filter: any = {};
      if (organizationId) filter.organizationId = new Types.ObjectId(organizationId as string);
      if (lcId) filter.lcId = new Types.ObjectId(lcId as string);
      if (documentType) filter.documentType = documentType;

      const items = await ImportDocumentModel.find(filter).sort({ createdAt: -1 });
      res.status(200).json({ success: true, data: items });
    } catch (err) {
      next(err);
    }
  }

  public static async uploadDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.userId || '000000000000000000000001';
      const doc = await ImportDocumentService.registerDocument(req.body, userId, true);
      res.status(201).json({ success: true, data: doc });
    } catch (err) {
      next(err);
    }
  }

  public static async verifyDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.userId || '000000000000000000000001';
      const { status, notes } = req.body;
      const doc = await ImportDocumentService.verifyDocument(
        req.params.id as string,
        status,
        notes || 'Verified by Import Officer',
        userId
      );
      res.status(200).json({ success: true, data: doc });
    } catch (err) {
      next(err);
    }
  }

  // ════════════════════════════════════════════════════════════════════════
  // 8. AI ASSISTANT, RISK ALERTS & ANALYSIS
  // ════════════════════════════════════════════════════════════════════════

  public static async getRiskAlerts(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.query.organizationId as string | undefined;
      const alerts = await ImportAnalyticsService.getRiskAlerts(orgId);
      res.status(200).json({ success: true, data: alerts });
    } catch (err) {
      next(err);
    }
  }

  public static async resolveRiskAlert(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.userId || '000000000000000000000001';
      const { status = 'RESOLVED', reason } = req.body;
      const alert = await ImportAnalyticsService.resolveRiskAlert(
        req.params.id as string,
        userId,
        status,
        reason
      );
      res.status(200).json({ success: true, data: alert });
    } catch (err) {
      next(err);
    }
  }

  public static async aiExtract(req: Request, res: Response, next: NextFunction) {
    try {
      const { textOrFilename, documentType = 'PROFORMA_INVOICE' } = req.body;
      const result = await ImportAiService.extractDocumentData(textOrFilename, documentType);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  public static async aiCompare(req: Request, res: Response, next: NextFunction) {
    try {
      const { docA, docB } = req.body;
      const result = await ImportAiService.compareDocuments(docA, docB);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  public static async aiShipmentRisk(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await ImportAiService.predictShipmentDelay(req.body);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  public static async aiLandedCostAdvice(req: Request, res: Response, next: NextFunction) {
    try {
      const { costs, itemCount, fobValueBDT } = req.body;
      const result = await ImportAiService.analyzeLandedCost(costs, itemCount, fobValueBDT);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  public static async aiAssistant(req: Request, res: Response, next: NextFunction) {
    try {
      const { query, organizationId } = req.body;
      const kpis = await ImportAnalyticsService.getDashboardMetrics(organizationId);

      // Find LCs expiring soon
      const now = new Date();
      const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      const expiringLcs = await ImportLCModel.find({
        status: { $nin: ['FINAL_SETTLEMENT', 'SETTLED'] },
        lcExpiryDate: { $lte: in30Days, $gte: now },
      }).select('lcNumber');

      const response = await ImportAiService.answerImportQuery(query, {
        activeLcsCount: kpis.totalActiveLcs,
        totalLcValueFC: kpis.totalLcValueFC,
        currency: 'USD',
        inTransitShipmentsCount: kpis.shipmentsInTransit,
        delayedShipmentsCount: kpis.delayedShipments,
        pendingCustomsCount: kpis.customsClearancePending,
        upcomingExpiringLcs: expiringLcs.map((lc) => lc.lcNumber),
        outstandingPaymentsBDT: kpis.outstandingPaymentsBDT,
      });

      res.status(200).json({ success: true, data: response });
    } catch (err) {
      next(err);
    }
  }

  // ════════════════════════════════════════════════════════════════════════
  // 9. IMPORT SETTINGS
  // ════════════════════════════════════════════════════════════════════════

  public static async getSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.query.organizationId as string | undefined;
      let settings = await ImportSettingsModel.findOne(
        orgId ? { organizationId: new Types.ObjectId(orgId) } : {}
      );
      if (!settings && orgId) {
        settings = await ImportSettingsModel.create({
          organizationId: new Types.ObjectId(orgId),
        });
      }
      res.status(200).json({ success: true, data: settings });
    } catch (err) {
      next(err);
    }
  }

  public static async updateSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.body.organizationId || req.query.organizationId;
      const settings = await ImportSettingsModel.findOneAndUpdate(
        { organizationId: new Types.ObjectId(orgId as string) },
        { $set: req.body },
        { new: true, upsert: true }
      );
      res.status(200).json({ success: true, data: settings });
    } catch (err) {
      next(err);
    }
  }
}
