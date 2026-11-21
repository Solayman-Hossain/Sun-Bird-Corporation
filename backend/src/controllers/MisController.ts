import { Request, Response, NextFunction } from 'express';
import { MisExecutiveDashboardService } from '../services/MisExecutiveDashboardService';
import { MisDecisionSupportService } from '../services/MisDecisionSupportService';
import { MisAiService } from '../services/MisAiService';
import { NotFoundError, ValidationError } from '../errors/AppError';
import logger from '../config/logger';

export class MisController {
  private static getOrgId(req: Request): string {
    const orgId =
      (req.user as any)?.organizationId ||
      req.query.organizationId ||
      req.headers['x-organization-id'] ||
      '600000000000000000000001';
    return String(orgId);
  }

  // 1. EXECUTIVE & OPERATIONAL DASHBOARDS
  public static async getExecutiveOverview(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = MisController.getOrgId(req);
      const overview = await MisExecutiveDashboardService.getExecutiveOverview({
        organizationId: orgId,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        department: req.query.department as string,
        warehouseId: req.query.warehouseId as string,
        channel: req.query.channel as string,
      });
      res.status(200).json({ success: true, data: overview });
    } catch (err) {
      next(err);
    }
  }

  public static async getSalesIntelligence(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = MisController.getOrgId(req);
      const data = await MisExecutiveDashboardService.getSalesIntelligence({
        organizationId: orgId,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
      });
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  public static async getFinancialIntelligence(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = MisController.getOrgId(req);
      const data = await MisExecutiveDashboardService.getFinancialIntelligence({
        organizationId: orgId,
      });
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  public static async getInventoryIntelligence(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = MisController.getOrgId(req);
      const data = await MisExecutiveDashboardService.getInventoryIntelligence({
        organizationId: orgId,
      });
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  public static async getDataQuality(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = MisController.getOrgId(req);
      const data = await MisExecutiveDashboardService.getDataQualityAudit(orgId);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  // 2. AI BUSINESS ANALYST
  public static async queryAiAnalyst(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = MisController.getOrgId(req);
      const { query } = req.body;
      const overview = await MisExecutiveDashboardService.getExecutiveOverview({ organizationId: orgId });

      const answer = await MisAiService.queryBusinessAnalyst(query, {
        organizationName: 'Sun Bird Corporation Ltd.',
        totalRevenue: overview.business.totalRevenue,
        grossProfit: overview.financial.grossProfit,
        netProfit: overview.financial.netProfit,
        openOrdersCount: overview.business.pendingOrders,
        stockValuation: overview.inventory.stockValuation,
        cashBalance: overview.financial.cashBalance,
        overdueReceivables: overview.financial.accountsReceivable,
        openTickets: overview.operations.openSupportTickets,
        activeLcs: overview.operations.activeImportLcs,
      });

      res.status(200).json({ success: true, data: answer });
    } catch (err) {
      next(err);
    }
  }

  // 3. KPI TARGETS
  public static async getKpis(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = MisController.getOrgId(req);
      const kpis = await MisDecisionSupportService.getKpis(orgId, {
        category: req.query.category as string,
        status: req.query.status as string,
      });
      res.status(200).json({ success: true, data: kpis });
    } catch (err) {
      next(err);
    }
  }

  public static async upsertKpi(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = MisController.getOrgId(req);
      const kpi = await MisDecisionSupportService.upsertKpiTarget(orgId, req.body);
      res.status(200).json({ success: true, data: kpi });
    } catch (err) {
      next(err);
    }
  }

  // 4. FORECASTING
  public static async getForecasts(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = MisController.getOrgId(req);
      const forecasts = await MisDecisionSupportService.getForecasts(orgId, req.query.type as string);
      res.status(200).json({ success: true, data: forecasts });
    } catch (err) {
      next(err);
    }
  }

  public static async generateForecast(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = MisController.getOrgId(req);
      const result = await MisDecisionSupportService.generateForecast(orgId, req.body);
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  // 5. RISKS & ANOMALIES
  public static async getRisks(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = MisController.getOrgId(req);
      const risks = await MisDecisionSupportService.getRisks(orgId, {
        status: req.query.status as string,
        level: req.query.level as string,
      });
      res.status(200).json({ success: true, data: risks });
    } catch (err) {
      next(err);
    }
  }

  public static async scanRisks(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = MisController.getOrgId(req);
      const detected = await MisDecisionSupportService.scanAndDetectRisks(orgId);
      res.status(200).json({ success: true, data: detected });
    } catch (err) {
      next(err);
    }
  }

  public static async updateRiskStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = MisController.getOrgId(req);
      const id = String(req.params.id);
      const updated = await MisDecisionSupportService.updateRiskStatus(orgId, id, req.body.status, req.body.notes);
      if (!updated) throw new NotFoundError('Risk record not found');
      res.status(200).json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }

  // 6. RECOMMENDATIONS
  public static async getRecommendations(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = MisController.getOrgId(req);
      const list = await MisDecisionSupportService.getRecommendations(orgId);
      res.status(200).json({ success: true, data: list });
    } catch (err) {
      next(err);
    }
  }

  public static async updateRecommendationStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = MisController.getOrgId(req);
      const id = String(req.params.id);
      const updated = await MisDecisionSupportService.updateRecommendationStatus(orgId, id, req.body.status, req.body.notes);
      if (!updated) throw new NotFoundError('Recommendation not found');
      res.status(200).json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }

  // 7. DAILY DIGEST
  public static async getDailyDigest(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = MisController.getOrgId(req);
      const date = req.query.date as string | undefined;
      const digest = await MisDecisionSupportService.getDailyDigest(orgId, date);
      res.status(200).json({ success: true, data: digest });
    } catch (err) {
      next(err);
    }
  }

  // 8. REPORT TEMPLATES
  public static async getReportTemplates(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = MisController.getOrgId(req);
      const templates = await MisDecisionSupportService.getReportTemplates(orgId);
      res.status(200).json({ success: true, data: templates });
    } catch (err) {
      next(err);
    }
  }

  public static async saveReportTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = MisController.getOrgId(req);
      const user = (req.user as any) || {};
      const template = await MisDecisionSupportService.saveReportTemplate(orgId, {
        ...req.body,
        userId: user._id || user.id,
      });
      res.status(201).json({ success: true, data: template });
    } catch (err) {
      next(err);
    }
  }

  // 9. SETTINGS
  public static async getSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = MisController.getOrgId(req);
      const settings = await MisDecisionSupportService.getSettings(orgId);
      res.status(200).json({ success: true, data: settings });
    } catch (err) {
      next(err);
    }
  }

  public static async updateSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = MisController.getOrgId(req);
      const settings = await MisDecisionSupportService.updateSettings(orgId, req.body);
      res.status(200).json({ success: true, data: settings });
    } catch (err) {
      next(err);
    }
  }
}
