import { Router } from 'express';
import { MisController } from '../../controllers/MisController';
import { authGuard } from '../../middlewares/authGuard';
import { hasPermission } from '../../middlewares/rbacGuard';
import { validateRequest } from '../../middlewares/validateRequest';
import {
  aiAnalystQuerySchema,
  upsertKpiTargetSchema,
  generateForecastSchema,
  updateRiskStatusSchema,
  updateRecommendationStatusSchema,
  saveReportTemplateSchema,
  updateMisSettingsSchema,
} from '../../validators/mis.validator';

const router = Router();

// ─────────────────────────────────────────────────────────────
// 1. EXECUTIVE & OPERATIONAL DASHBOARDS
// ─────────────────────────────────────────────────────────────
router.get('/overview', authGuard, hasPermission('mis', 'VIEW'), MisController.getExecutiveOverview);
router.get('/sales', authGuard, hasPermission('mis', 'VIEW'), MisController.getSalesIntelligence);
router.get('/financial', authGuard, hasPermission('mis', 'FINANCIAL_VIEW'), MisController.getFinancialIntelligence);
router.get('/inventory', authGuard, hasPermission('mis', 'VIEW'), MisController.getInventoryIntelligence);
router.get('/data-quality', authGuard, hasPermission('mis', 'VIEW'), MisController.getDataQuality);

// ─────────────────────────────────────────────────────────────
// 2. AI BUSINESS ANALYST
// ─────────────────────────────────────────────────────────────
router.post(
  '/ai/analyst',
  authGuard,
  hasPermission('mis', 'AI_USE'),
  validateRequest({ body: aiAnalystQuerySchema }),
  MisController.queryAiAnalyst
);

// ─────────────────────────────────────────────────────────────
// 3. KPI MANAGEMENT & TARGETS
// ─────────────────────────────────────────────────────────────
router.get('/kpis', authGuard, hasPermission('mis', 'VIEW'), MisController.getKpis);
router.post(
  '/kpis',
  authGuard,
  hasPermission('mis', 'KPI_MANAGE'),
  validateRequest({ body: upsertKpiTargetSchema }),
  MisController.upsertKpi
);

// ─────────────────────────────────────────────────────────────
// 4. CROSS-MODULE FORECASTING
// ─────────────────────────────────────────────────────────────
router.get('/forecasts', authGuard, hasPermission('mis', 'FORECAST_VIEW'), MisController.getForecasts);
router.post(
  '/forecasts/generate',
  authGuard,
  hasPermission('mis', 'FORECAST_VIEW'),
  validateRequest({ body: generateForecastSchema }),
  MisController.generateForecast
);

// ─────────────────────────────────────────────────────────────
// 5. RISKS & ANOMALY DETECTION
// ─────────────────────────────────────────────────────────────
router.get('/risks', authGuard, hasPermission('mis', 'VIEW'), MisController.getRisks);
router.post('/risks/scan', authGuard, hasPermission('mis', 'RISK_MANAGE'), MisController.scanRisks);
router.put(
  '/risks/:id/status',
  authGuard,
  hasPermission('mis', 'RISK_MANAGE'),
  validateRequest({ body: updateRiskStatusSchema }),
  MisController.updateRiskStatus
);

// ─────────────────────────────────────────────────────────────
// 6. MANAGEMENT RECOMMENDATIONS
// ─────────────────────────────────────────────────────────────
router.get('/recommendations', authGuard, hasPermission('mis', 'VIEW'), MisController.getRecommendations);
router.put(
  '/recommendations/:id/status',
  authGuard,
  hasPermission('mis', 'RECOMMENDATION_MANAGE'),
  validateRequest({ body: updateRecommendationStatusSchema }),
  MisController.updateRecommendationStatus
);

// ─────────────────────────────────────────────────────────────
// 7. DAILY BUSINESS DIGEST
// ─────────────────────────────────────────────────────────────
router.get('/daily-digest', authGuard, hasPermission('mis', 'VIEW'), MisController.getDailyDigest);

// ─────────────────────────────────────────────────────────────
// 8. CUSTOM REPORT TEMPLATES
// ─────────────────────────────────────────────────────────────
router.get('/reports/templates', authGuard, hasPermission('mis', 'VIEW'), MisController.getReportTemplates);
router.post(
  '/reports/templates',
  authGuard,
  hasPermission('mis', 'REPORT_BUILDER'),
  validateRequest({ body: saveReportTemplateSchema }),
  MisController.saveReportTemplate
);

// ─────────────────────────────────────────────────────────────
// 9. MIS SETTINGS & DASHBOARD CONFIG
// ─────────────────────────────────────────────────────────────
router.get('/settings', authGuard, hasPermission('mis', 'VIEW'), MisController.getSettings);
router.put(
  '/settings',
  authGuard,
  hasPermission('mis', 'MANAGE_SETTINGS'),
  validateRequest({ body: updateMisSettingsSchema }),
  MisController.updateSettings
);

export default router;
