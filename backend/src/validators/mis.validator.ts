import { z } from 'zod';

export const aiAnalystQuerySchema = z.object({
  query: z.string().trim().min(2, 'Query must be at least 2 characters'),
  context: z.any().optional(),
});

export const upsertKpiTargetSchema = z.object({
  kpiCode: z.string().trim().min(2, 'KPI Code is required'),
  name: z.string().trim().min(2, 'KPI Name is required'),
  category: z.enum(['FINANCIAL', 'SALES', 'PROCUREMENT', 'INVENTORY', 'ECOMMERCE', 'MARKETING', 'HR', 'SUPPORT', 'IMPORT', 'OPERATIONAL']),
  department: z.string().trim().optional(),
  targetValue: z.number().min(0, 'Target value must be positive'),
  actualValue: z.number().optional(),
  measurementUnit: z.string().trim().optional(),
  period: z.enum(['MONTHLY', 'QUARTERLY', 'ANNUAL']).optional(),
  fiscalYear: z.string().trim().optional(),
});

export const generateForecastSchema = z.object({
  forecastType: z.enum([
    'SALES',
    'REVENUE',
    'CASH_FLOW',
    'PRODUCT_DEMAND',
    'INVENTORY',
    'PURCHASE_REQUIREMENT',
    'EXPENSE',
    'RECEIVABLE_COLLECTION',
    'PAYABLE',
    'IMPORT_COST',
    'SHIPMENT_DELAY',
    'CUSTOMER_RETURN',
  ]),
  timeHorizon: z.enum(['30_DAYS', '90_DAYS', '6_MONTHS', '1_YEAR']).optional(),
  scenario: z.enum(['CONSERVATIVE', 'EXPECTED', 'OPTIMISTIC', 'CUSTOM']).optional(),
});

export const updateRiskStatusSchema = z.object({
  status: z.enum(['DETECTED', 'UNDER_REVIEW', 'MITIGATED', 'DISMISSED']),
  notes: z.string().trim().optional(),
});

export const updateRecommendationStatusSchema = z.object({
  status: z.enum(['NEW', 'UNDER_REVIEW', 'ACCEPTED', 'REJECTED', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED']),
  notes: z.string().trim().optional(),
});

export const saveReportTemplateSchema = z.object({
  name: z.string().trim().min(2, 'Report name is required'),
  code: z.string().trim().min(2, 'Report code is required'),
  module: z.enum(['EXECUTIVE', 'SALES', 'FINANCE', 'INVENTORY', 'PROCUREMENT', 'IMPORT', 'HR', 'SUPPORT']).optional(),
  dataSource: z.string().trim().min(1, 'Data source is required'),
  selectedFields: z.array(z.string()).min(1, 'Select at least one field'),
  filters: z.record(z.string(), z.any()).optional(),
  chartType: z.enum(['TABLE', 'BAR', 'LINE', 'PIE', 'METRIC']).optional(),
  isScheduled: z.boolean().optional(),
  scheduleFrequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY']).optional(),
  recipientEmails: z.array(z.string().email()).optional(),
});

export const updateMisSettingsSchema = z.object({
  fiscalYearStartMonth: z.number().min(1).max(12).optional(),
  defaultCurrency: z.string().trim().optional(),
  enableDailyDigest: z.boolean().optional(),
  digestDeliveryTime: z.string().trim().optional(),
  digestRecipientEmails: z.array(z.string().email()).optional(),
  riskNotificationThreshold: z.enum(['MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  dashboardWidgetLayout: z.array(z.object({
    widgetId: z.string(),
    visible: z.boolean(),
    order: z.number(),
    width: z.string(),
  })).optional(),
});
