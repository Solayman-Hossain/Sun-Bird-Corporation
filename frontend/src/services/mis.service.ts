import { apiClient } from '../lib/api';

export interface MisExecutiveOverview {
  organizationId: string;
  business: {
    totalRevenue: number;
    totalSalesOrders: number;
    completedOrders: number;
    pendingOrders: number;
    totalCustomers: number;
    activeProducts: number;
    totalOrganizations: number;
  };
  financial: {
    grossProfit: number;
    netProfit: number;
    operatingExpenses: number;
    totalAssets: number;
    totalLiabilities: number;
    totalEquity: number;
    cashBalance: number;
    accountsReceivable: number;
    accountsPayable: number;
    workingCapital: number;
    grossMarginPercent: number;
    netMarginPercent: number;
    operatingMarginPct?: number;
    currentRatio: number;
  };
  inventory: {
    totalStockQuantity: number;
    stockValuation: number;
    lowStockItems: number;
    outOfStockItems: number;
    expiringBatches: number;
  };
  procurement: {
    purchaseValue: number;
    pendingPurchaseOrders: number;
    outstandingSupplierPayables: number;
  };
  operations: {
    openSupportTickets: number;
    pendingRmas: number;
    activeWarranties: number;
    activeRepairJobs: number;
    activeImportLcs: number;
    delayedShipments: number;
    activeEmployees: number;
    systemDataIntegrityPct?: number;
  };
  dataFreshness: string;
  calculatedAt: string;
}

export interface MisSalesIntelligence {
  channelBreakdown: Array<{ channel: string; revenue: number; orderCount: number }>;
  salesTrends: Array<{ _id: string; revenue: number; orders: number }>;
  topCategories: Array<{ category: string; totalRevenue: number }>;
  topCustomers: Array<{ _id: string; totalSpent: number; orderCount: number }>;
  topProducts: Array<{ _id: string; totalRevenue: number; quantitySold: number }>;
  orderStatusDistribution: Array<{ _id: string; count: number }>;
}

export interface MisFinancialIntelligence {
  ratios: {
    currentRatio: number;
    quickRatio: number;
    debtToEquityRatio: number;
  };
  incomeStatement: {
    revenue: number;
    cogs: number;
    grossProfit: number;
    operatingExpenses: number;
    netProfit: number;
    grossMargin: number;
    netMargin: number;
  };
  balanceSheet: {
    totalAssets: number;
    currentAssets: number;
    totalLiabilities: number;
    currentLiabilities: number;
    totalEquity: number;
    workingCapital: number;
  };
  cashPosition: {
    cashAndBank: number;
    accountsReceivable: number;
    accountsPayable: number;
    netPosition: number;
  };
  financialRatios: Array<{
    ratio: string;
    value: string;
    benchmark: string;
    formula: string;
  }>;
}

export interface MisInventoryIntelligence {
  totalStockValuation: number;
  lowStockAlerts: Array<{ _id: string; nameEn: string; sku: string; currentStock: number; costPrice: number }>;
  stockByWarehouse: Array<{ name: string; code: string; capacityCbm: number }>;
  expiringBatches: Array<{ batchNumber: string; sku: string; quantity: number; expiryDate: string }>;
}

export interface MisDataQualityAudit {
  overallScore: number;
  dataQualityScore: number;
  totalIssuesCount: number;
  checks: Array<{ type: string; count: number; severity: string; resolution: string }>;
  auditTimestamp: string;
}

export interface MisAiAnalystAnswer {
  answer: string;
  sourceCitations: Array<{ module: string; metric: string; value: string | number; period: string }>;
  suggestedDrillDowns: string[];
  confidenceScore: number;
  generatedBy: 'GEMINI_AI' | 'DETERMINISTIC_FALLBACK';
}

export interface MisKpiTargetItem {
  _id: string;
  kpiCode: string;
  name: string;
  category: string;
  department?: string;
  targetValue: number;
  actualValue: number;
  measurementUnit: string;
  period: string;
  fiscalYear: string;
  achievementPercent: number;
  variance: number;
  status: 'ACTIVE' | 'ARCHIVED';
}

export interface MisForecastItem {
  _id: string;
  forecastCode: string;
  forecastType: string;
  timeHorizon: string;
  scenario: string;
  predictedValue: number;
  lowerBound: number;
  upperBound: number;
  confidenceScore: number;
  aiExplanation: string;
  trendDirection: 'UP' | 'DOWN' | 'STABLE';
  monthlyProjections: Array<{ month: string; predictedAmount: number }>;
  generatedAt: string;
}

export interface MisRiskItem {
  _id: string;
  riskCode: string;
  title: string;
  description: string;
  category: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'DETECTED' | 'UNDER_REVIEW' | 'MITIGATED' | 'DISMISSED';
  potentialImpactAmount?: number;
  suggestedMitigation: string;
  notes?: string;
  detectedAt: string;
}

export interface MisRecommendationItem {
  _id: string;
  title: string;
  description: string;
  category: string;
  expectedFinancialImpact: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'NEW' | 'UNDER_REVIEW' | 'ACCEPTED' | 'REJECTED' | 'IN_PROGRESS' | 'COMPLETED' | 'ARCHIVED';
  recommendedActions: string[];
  createdAt: string;
}

export interface MisDailyDigestItem {
  _id: string;
  digestDate: string;
  salesSummary: {
    totalOrders: number;
    totalRevenue: number;
    completedOrders: number;
  };
  financialSummary: {
    cashInflow: number;
    cashOutflow: number;
    netCashPosition: number;
    overdueReceivables: number;
  };
  inventorySummary: {
    lowStockAlerts: number;
    expiringBatches: number;
    totalValuation: number;
  };
  operationalSummary: {
    openTickets: number;
    slaBreaches: number;
    pendingApprovals: number;
    activeLcs: number;
  };
  keyRisksDetected: string[];
  aiExecutiveNarrative: string;
  generatedAt: string;
}

export class MisService {
  // 1. DASHBOARDS
  public static async getExecutiveOverview(params?: Record<string, any>): Promise<MisExecutiveOverview> {
    const query = new URLSearchParams(params as any).toString();
    const res = await apiClient<{ success: boolean; data: MisExecutiveOverview }>(
      `/erp/mis/overview${query ? `?${query}` : ''}`
    );
    return res.data;
  }

  public static async getSalesIntelligence(params?: Record<string, any>): Promise<MisSalesIntelligence> {
    const query = new URLSearchParams(params as any).toString();
    const res = await apiClient<{ success: boolean; data: MisSalesIntelligence }>(
      `/erp/mis/sales${query ? `?${query}` : ''}`
    );
    return res.data;
  }

  public static async getFinancialIntelligence(params?: Record<string, any>): Promise<MisFinancialIntelligence> {
    const query = new URLSearchParams(params as any).toString();
    const res = await apiClient<{ success: boolean; data: MisFinancialIntelligence }>(
      `/erp/mis/financial${query ? `?${query}` : ''}`
    );
    return res.data;
  }

  public static async getInventoryIntelligence(params?: Record<string, any>): Promise<MisInventoryIntelligence> {
    const query = new URLSearchParams(params as any).toString();
    const res = await apiClient<{ success: boolean; data: MisInventoryIntelligence }>(
      `/erp/mis/inventory${query ? `?${query}` : ''}`
    );
    return res.data;
  }

  public static async getDataQuality(): Promise<MisDataQualityAudit> {
    const res = await apiClient<{ success: boolean; data: MisDataQualityAudit }>('/erp/mis/data-quality');
    return res.data;
  }

  // 2. AI ANALYST
  public static async queryAiAnalyst(query: string, context?: any): Promise<MisAiAnalystAnswer> {
    const res = await apiClient<{ success: boolean; data: MisAiAnalystAnswer }>('/erp/mis/ai/analyst', {
      method: 'POST',
      body: JSON.stringify({ query, context }),
    });
    return res.data;
  }

  // 3. KPIS
  public static async getKpis(params?: Record<string, any>): Promise<MisKpiTargetItem[]> {
    const query = new URLSearchParams(params as any).toString();
    const res = await apiClient<{ success: boolean; data: MisKpiTargetItem[] }>(
      `/erp/mis/kpis${query ? `?${query}` : ''}`
    );
    return res.data;
  }

  public static async upsertKpi(data: any): Promise<MisKpiTargetItem> {
    const res = await apiClient<{ success: boolean; data: MisKpiTargetItem }>('/erp/mis/kpis', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data;
  }

  // 4. FORECASTS
  public static async getForecasts(forecastType?: string): Promise<MisForecastItem[]> {
    const res = await apiClient<{ success: boolean; data: MisForecastItem[] }>(
      `/erp/mis/forecasts${forecastType ? `?type=${forecastType}` : ''}`
    );
    return res.data;
  }

  public static async generateForecast(data: {
    forecastType: string;
    timeHorizon?: string;
    scenario?: string;
  }): Promise<MisForecastItem> {
    const res = await apiClient<{ success: boolean; data: MisForecastItem }>('/erp/mis/forecasts/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data;
  }

  // 5. RISKS
  public static async getRisks(params?: Record<string, any>): Promise<MisRiskItem[]> {
    const query = new URLSearchParams(params as any).toString();
    const res = await apiClient<{ success: boolean; data: MisRiskItem[] }>(
      `/erp/mis/risks${query ? `?${query}` : ''}`
    );
    return res.data;
  }

  public static async scanRisks(): Promise<MisRiskItem[]> {
    const res = await apiClient<{ success: boolean; data: MisRiskItem[] }>('/erp/mis/risks/scan', {
      method: 'POST',
    });
    return res.data;
  }

  public static async updateRiskStatus(id: string, status: string, notes?: string): Promise<MisRiskItem> {
    const res = await apiClient<{ success: boolean; data: MisRiskItem }>(`/erp/mis/risks/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, notes }),
    });
    return res.data;
  }

  // 6. RECOMMENDATIONS
  public static async getRecommendations(): Promise<MisRecommendationItem[]> {
    const res = await apiClient<{ success: boolean; data: MisRecommendationItem[] }>('/erp/mis/recommendations');
    return res.data;
  }

  public static async updateRecommendationStatus(id: string, status: string, notes?: string): Promise<MisRecommendationItem> {
    const res = await apiClient<{ success: boolean; data: MisRecommendationItem }>(
      `/erp/mis/recommendations/${id}/status`,
      {
        method: 'PUT',
        body: JSON.stringify({ status, notes }),
      }
    );
    return res.data;
  }

  // 7. DAILY DIGEST
  public static async getDailyDigest(date?: string): Promise<MisDailyDigestItem> {
    const res = await apiClient<{ success: boolean; data: MisDailyDigestItem }>(
      `/erp/mis/daily-digest${date ? `?date=${date}` : ''}`
    );
    return res.data;
  }

  // 8. TEMPLATES & SETTINGS
  public static async getReportTemplates(): Promise<any[]> {
    const res = await apiClient<{ success: boolean; data: any[] }>('/erp/mis/reports/templates');
    return res.data;
  }

  public static async saveReportTemplate(data: any): Promise<any> {
    const res = await apiClient<{ success: boolean; data: any }>('/erp/mis/reports/templates', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data;
  }

  public static async getSettings(): Promise<any> {
    const res = await apiClient<{ success: boolean; data: any }>('/erp/mis/settings');
    return res.data;
  }

  public static async updateSettings(data: any): Promise<any> {
    const res = await apiClient<{ success: boolean; data: any }>('/erp/mis/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return res.data;
  }
}
