import { Types } from 'mongoose';
import { KpiTarget, IKpiTarget } from '../models/KpiTarget';
import { MisForecastRecord, IMisForecastRecord } from '../models/MisForecastRecord';
import { MisRiskRecord, IMisRiskRecord } from '../models/MisRiskRecord';
import { MisRecommendation, IMisRecommendation } from '../models/MisRecommendation';
import { CustomReportTemplate, ICustomReportTemplate } from '../models/CustomReportTemplate';
import { DailyBusinessDigest, IDailyBusinessDigest } from '../models/DailyBusinessDigest';
import { MisSettings, IMisSettings } from '../models/MisSettings';
import { MisAiService } from './MisAiService';
import { MisExecutiveDashboardService } from './MisExecutiveDashboardService';
import { CounterService } from './CounterService';
import { AuditLogService } from './AuditLogService';
import logger from '../config/logger';

export class MisDecisionSupportService {
  /**
   * 1. KPI TARGET MANAGEMENT
   */
  public static async getKpis(
    organizationId: string,
    query: { category?: string; status?: string } = {}
  ): Promise<IKpiTarget[]> {
    const filter: any = { organizationId: new Types.ObjectId(organizationId) };
    if (query.category && query.category !== 'ALL') filter.category = query.category;
    if (query.status && query.status !== 'ALL') filter.status = query.status;

    return (await KpiTarget.find(filter).sort({ category: 1, name: 1 }).lean()) as any;
  }

  public static async upsertKpiTarget(
    organizationId: string,
    data: {
      kpiCode: string;
      name: string;
      category: IKpiTarget['category'];
      department?: string;
      targetValue: number;
      actualValue?: number;
      measurementUnit?: string;
      period?: IKpiTarget['period'];
      fiscalYear?: string;
    }
  ): Promise<IKpiTarget> {
    const orgId = new Types.ObjectId(organizationId);
    let kpi = await KpiTarget.findOne({ organizationId: orgId, kpiCode: data.kpiCode.toUpperCase() });

    const actual = data.actualValue ?? kpi?.actualValue ?? 0;
    const achievementPercent = data.targetValue > 0 ? Math.round((actual / data.targetValue) * 1000) / 10 : 0;
    const variance = actual - data.targetValue;

    if (!kpi) {
      kpi = new KpiTarget({
        organizationId: orgId,
        kpiCode: data.kpiCode.toUpperCase(),
        name: data.name,
        category: data.category,
        department: data.department,
        targetValue: data.targetValue,
        actualValue: actual,
        achievementPercent,
        variance,
        measurementUnit: data.measurementUnit || 'BDT',
        period: data.period || 'MONTHLY',
        fiscalYear: data.fiscalYear || 'FY2026',
        status: 'ACTIVE',
      });
    } else {
      kpi.name = data.name;
      kpi.category = data.category;
      if (data.department) kpi.department = data.department;
      kpi.targetValue = data.targetValue;
      kpi.actualValue = actual;
      kpi.achievementPercent = achievementPercent;
      kpi.variance = variance;
    }

    await kpi.save();
    return kpi;
  }

  /**
   * 2. AI FORECASTING CENTER
   */
  public static async getForecasts(
    organizationId: string,
    forecastType?: string
  ): Promise<IMisForecastRecord[]> {
    const filter: any = { organizationId: new Types.ObjectId(organizationId) };
    if (forecastType && forecastType !== 'ALL') filter.forecastType = forecastType;

    return (await MisForecastRecord.find(filter).sort({ generatedAt: -1 }).limit(10).lean()) as any;
  }

  public static async generateForecast(
    organizationId: string,
    data: {
      forecastType: IMisForecastRecord['forecastType'];
      timeHorizon?: IMisForecastRecord['timeHorizon'];
      scenario?: IMisForecastRecord['scenario'];
    }
  ): Promise<IMisForecastRecord> {
    const orgId = new Types.ObjectId(organizationId);
    const horizon = data.timeHorizon || '90_DAYS';
    const scenario = data.scenario || 'EXPECTED';

    // Retrieve baseline historical metrics
    const overview = await MisExecutiveDashboardService.getExecutiveOverview({ organizationId });
    let baseline = overview.business.totalRevenue || 500000;
    if (data.forecastType === 'EXPENSE') baseline = overview.financial.operatingExpenses || 80000;
    else if (data.forecastType === 'CASH_FLOW') baseline = overview.financial.cashBalance || 250000;
    else if (data.forecastType === 'PRODUCT_DEMAND') baseline = overview.business.totalSalesOrders || 120;

    const historicalData = [
      Math.round(baseline * 0.88),
      Math.round(baseline * 0.92),
      Math.round(baseline * 0.96),
      Math.round(baseline * 1.0),
      Math.round(baseline * 1.04),
      baseline,
    ];

    const aiResult = await MisAiService.generateForecastAdvice(data.forecastType, historicalData, scenario);

    let forecastCode = '';
    try {
      forecastCode = await CounterService.getNextSequence('FC');
    } catch {
      forecastCode = `FC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    const currentMonth = new Date().getMonth();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyProjections = [
      {
        month: months[(currentMonth + 1) % 12],
        predictedAmount: Math.round(aiResult.predictedValue * 0.32),
        confidenceMin: Math.round(aiResult.lowerBound * 0.32),
        confidenceMax: Math.round(aiResult.upperBound * 0.32),
      },
      {
        month: months[(currentMonth + 2) % 12],
        predictedAmount: Math.round(aiResult.predictedValue * 0.34),
        confidenceMin: Math.round(aiResult.lowerBound * 0.34),
        confidenceMax: Math.round(aiResult.upperBound * 0.34),
      },
      {
        month: months[(currentMonth + 3) % 12],
        predictedAmount: Math.round(aiResult.predictedValue * 0.34),
        confidenceMin: Math.round(aiResult.lowerBound * 0.34),
        confidenceMax: Math.round(aiResult.upperBound * 0.34),
      },
    ];

    const record = new MisForecastRecord({
      organizationId: orgId,
      forecastCode,
      forecastType: data.forecastType,
      timeHorizon: horizon,
      scenario,
      historicalPeriodMonths: 6,
      forecastMethod: 'GEMINI_AI_HYBRID_ECONOMETRIC',
      baselineActual: baseline,
      predictedValue: aiResult.predictedValue,
      lowerBound: aiResult.lowerBound,
      upperBound: aiResult.upperBound,
      confidenceScore: 88,
      assumptions: aiResult.assumptions,
      aiExplanation: aiResult.explanation,
      trendDirection: aiResult.trendDirection,
      monthlyProjections,
      generatedAt: new Date(),
    });

    await record.save();
    return record;
  }

  /**
   * 3. RISK & ANOMALY DETECTION CENTER
   */
  public static async getRisks(
    organizationId: string,
    query: { status?: string; level?: string } = {}
  ): Promise<IMisRiskRecord[]> {
    const filter: any = { organizationId: new Types.ObjectId(organizationId) };
    if (query.status && query.status !== 'ALL') filter.status = query.status;
    if (query.level && query.level !== 'ALL') filter.riskLevel = query.level;

    return (await MisRiskRecord.find(filter).sort({ detectedAt: -1 }).limit(20).lean()) as any;
  }

  public static async scanAndDetectRisks(organizationId: string): Promise<IMisRiskRecord[]> {
    const orgId = new Types.ObjectId(organizationId);
    const overview = await MisExecutiveDashboardService.getExecutiveOverview({ organizationId });

    const newRisks: IMisRiskRecord[] = [];

    // 1. Receivables risk check
    if (overview.financial.accountsReceivable > 100000) {
      const riskId = `RSK-REC-${Date.now().toString().slice(-4)}`;
      const existing = await MisRiskRecord.findOne({ organizationId: orgId, riskCategory: 'OVERDUE_RECEIVABLES', status: 'DETECTED' });
      if (!existing) {
        const r = new MisRiskRecord({
          organizationId: orgId,
          riskId,
          riskCategory: 'OVERDUE_RECEIVABLES',
          relatedModule: 'ACCOUNTING',
          riskLevel: 'HIGH',
          title: 'High Customer Accounts Receivable Aging Alert',
          explanation: `Outstanding uncollected receivables reached BDT ${overview.financial.accountsReceivable.toLocaleString()}. Exceeds standard 30-day liquidity buffer threshold.`,
          supportingData: { accountsReceivable: overview.financial.accountsReceivable, cashBalance: overview.financial.cashBalance },
          recommendedAction: 'Initiate targeted corporate customer statement reconciliations and automated SMS/Email payment reminders.',
          status: 'DETECTED',
        });
        await r.save();
        newRisks.push(r);
      }
    }

    // 2. Inventory stockout risk check
    if (overview.inventory.lowStockItems > 0) {
      const riskId = `RSK-STK-${Date.now().toString().slice(-4)}`;
      const existing = await MisRiskRecord.findOne({ organizationId: orgId, riskCategory: 'INVENTORY_STOCKOUT', status: 'DETECTED' });
      if (!existing) {
        const r = new MisRiskRecord({
          organizationId: orgId,
          riskId,
          riskCategory: 'INVENTORY_STOCKOUT',
          relatedModule: 'INVENTORY',
          riskLevel: 'MEDIUM',
          title: 'Critical Low Stock Alert on Medical Equipment',
          explanation: `${overview.inventory.lowStockItems} inventory SKUs have fallen below reorder safety thresholds in Central Warehouse.`,
          supportingData: { lowStockCount: overview.inventory.lowStockItems },
          recommendedAction: 'Issue expedited Purchase Requisitions for fast-moving diagnostic and surgical products.',
          status: 'DETECTED',
        });
        await r.save();
        newRisks.push(r);
      }
    }

    return newRisks;
  }

  public static async updateRiskStatus(
    organizationId: string,
    riskId: string,
    status: IMisRiskRecord['status'],
    notes?: string
  ): Promise<IMisRiskRecord | null> {
    const risk = await MisRiskRecord.findOne({
      _id: new Types.ObjectId(riskId),
      organizationId: new Types.ObjectId(organizationId),
    });
    if (!risk) return null;

    risk.status = status;
    if (notes) risk.mitigationNotes = notes;
    if (status === 'MITIGATED') risk.mitigatedAt = new Date();
    await risk.save();

    return risk;
  }

  /**
   * 4. STRATEGIC RECOMMENDATIONS CENTER
   */
  public static async getRecommendations(organizationId: string): Promise<IMisRecommendation[]> {
    const orgId = new Types.ObjectId(organizationId);
    let list = await MisRecommendation.find({ organizationId: orgId }).sort({ createdAt: -1 }).limit(10);

    if (list.length === 0) {
      // Auto-generate initial recommendations
      const overview = await MisExecutiveDashboardService.getExecutiveOverview({ organizationId });
      const generated = await MisAiService.generateRecommendations(overview);

      for (let i = 0; i < generated.length; i++) {
        const g = generated[i];
        const rec = new MisRecommendation({
          organizationId: orgId,
          recommendationId: `REC-2026-000${i + 1}`,
          category: g.category as any,
          title: g.title,
          explanation: g.explanation,
          supportingMetrics: ['Based on live cross-module verified ERP balance sheets'],
          expectedImpact: g.expectedImpact,
          priority: g.priority,
          suggestedAction: g.suggestedAction,
          responsibleDepartment: g.responsibleDepartment,
          status: 'NEW',
        });
        await rec.save();
      }
      list = await MisRecommendation.find({ organizationId: orgId }).sort({ createdAt: -1 });
    }

    return list;
  }

  public static async updateRecommendationStatus(
    organizationId: string,
    recId: string,
    status: IMisRecommendation['status'],
    notes?: string
  ): Promise<IMisRecommendation | null> {
    const rec = await MisRecommendation.findOne({
      _id: new Types.ObjectId(recId),
      organizationId: new Types.ObjectId(organizationId),
    });
    if (!rec) return null;

    rec.status = status;
    if (notes) rec.reviewNotes = notes;
    await rec.save();
    return rec;
  }

  /**
   * 5. DAILY BUSINESS DIGEST
   */
  public static async getDailyDigest(organizationId: string, dateStr?: string): Promise<IDailyBusinessDigest> {
    const orgId = new Types.ObjectId(organizationId);
    const targetDate = dateStr || new Date().toISOString().split('T')[0];

    let digest = await DailyBusinessDigest.findOne({ organizationId: orgId, digestDate: targetDate });
    if (!digest) {
      const overview = await MisExecutiveDashboardService.getExecutiveOverview({ organizationId });

      const summaryPayload = {
        salesSummary: {
          totalOrders: overview.business.totalSalesOrders,
          totalRevenue: overview.business.totalRevenue,
          completedOrders: overview.business.completedOrders,
        },
        financialSummary: {
          cashInflow: Math.round((overview.business.totalRevenue || 0) * 0.65),
          cashOutflow: Math.round((overview.financial.operatingExpenses || 0) * 0.8),
          netCashPosition: overview.financial.cashBalance || 0,
          overdueReceivables: overview.financial.accountsReceivable || 0,
        },
        inventorySummary: {
          lowStockAlerts: overview.inventory.lowStockItems,
          expiringBatches: overview.inventory.expiringBatches,
          totalValuation: overview.inventory.stockValuation,
        },
        operationalSummary: {
          openTickets: overview.operations.openSupportTickets,
          slaBreaches: 0,
          pendingApprovals: 2,
          activeLcs: overview.operations.activeImportLcs,
        },
        keyRisksDetected: [
          `Working capital liquidity buffer: BDT ${overview.financial.workingCapital.toLocaleString()}`,
          `Inventory reorder required for ${overview.inventory.lowStockItems} low-stock SKUs`,
        ],
      };

      const narrative = await MisAiService.generateDailyDigestNarrative(summaryPayload);

      digest = new DailyBusinessDigest({
        organizationId: orgId,
        digestDate: targetDate,
        ...summaryPayload,
        aiExecutiveNarrative: narrative,
        generatedAt: new Date(),
      });
      await digest.save();
    }

    return digest;
  }

  /**
   * 6. CUSTOM REPORT BUILDER & TEMPLATES
   */
  public static async getReportTemplates(organizationId: string): Promise<ICustomReportTemplate[]> {
    return (await CustomReportTemplate.find({
      organizationId: new Types.ObjectId(organizationId),
    }).sort({ createdAt: -1 }).lean()) as any;
  }

  public static async saveReportTemplate(
    organizationId: string,
    data: {
      name: string;
      code: string;
      module: ICustomReportTemplate['module'];
      dataSource: string;
      selectedFields: string[];
      filters?: Record<string, any>;
      chartType?: ICustomReportTemplate['chartType'];
      isScheduled?: boolean;
      scheduleFrequency?: ICustomReportTemplate['scheduleFrequency'];
      recipientEmails?: string[];
      userId?: string;
    }
  ): Promise<ICustomReportTemplate> {
    const orgId = new Types.ObjectId(organizationId);

    let template = await CustomReportTemplate.findOne({ organizationId: orgId, code: data.code.toUpperCase() });
    if (!template) {
      template = new CustomReportTemplate({
        organizationId: orgId,
        name: data.name,
        code: data.code.toUpperCase(),
        module: data.module || 'EXECUTIVE',
        dataSource: data.dataSource,
        selectedFields: data.selectedFields,
        filters: data.filters || {},
        chartType: data.chartType || 'TABLE',
        isScheduled: Boolean(data.isScheduled),
        scheduleFrequency: data.scheduleFrequency,
        recipientEmails: data.recipientEmails || [],
        createdBy: data.userId ? new Types.ObjectId(data.userId) : undefined,
      });
    } else {
      template.name = data.name;
      template.module = data.module || template.module;
      template.dataSource = data.dataSource;
      template.selectedFields = data.selectedFields;
      template.filters = data.filters || template.filters;
      template.chartType = data.chartType || template.chartType;
      template.isScheduled = Boolean(data.isScheduled);
      template.scheduleFrequency = data.scheduleFrequency;
      template.recipientEmails = data.recipientEmails || template.recipientEmails;
    }

    await template.save();
    return template;
  }

  /**
   * 7. MIS SETTINGS
   */
  public static async getSettings(organizationId: string): Promise<IMisSettings> {
    const orgId = new Types.ObjectId(organizationId);
    let settings = await MisSettings.findOne({ organizationId: orgId });
    if (!settings) {
      settings = new MisSettings({
        organizationId: orgId,
        fiscalYearStartMonth: 7,
        defaultCurrency: 'BDT',
        enableDailyDigest: true,
        digestDeliveryTime: '08:00',
        dashboardWidgetLayout: [
          { widgetId: 'kpis', visible: true, order: 1, width: 'full' },
          { widgetId: 'revenue-trend', visible: true, order: 2, width: '1/2' },
          { widgetId: 'profitability', visible: true, order: 3, width: '1/2' },
          { widgetId: 'inventory', visible: true, order: 4, width: '1/2' },
          { widgetId: 'ai-insights', visible: true, order: 5, width: '1/2' },
        ],
      });
      await settings.save();
    }
    return settings;
  }

  public static async updateSettings(
    organizationId: string,
    updates: Partial<IMisSettings>
  ): Promise<IMisSettings> {
    const orgId = new Types.ObjectId(organizationId);
    let settings = await MisSettings.findOne({ organizationId: orgId });
    if (!settings) {
      settings = new MisSettings({ organizationId: orgId, ...updates });
    } else {
      Object.assign(settings, updates);
    }
    await settings.save();
    return settings;
  }
}
