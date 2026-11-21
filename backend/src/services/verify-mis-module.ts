import mongoose from 'mongoose';
import env from '../config/env';
import { OrganizationModel } from '../models/Organization';
import { UserModel } from '../models/User';
import { ProductModel } from '../models/Product';
import { OrderModel } from '../models/Order';
import { KpiTarget } from '../models/KpiTarget';
import { MisForecastRecord } from '../models/MisForecastRecord';
import { MisRiskRecord } from '../models/MisRiskRecord';
import { MisRecommendation } from '../models/MisRecommendation';
import { CustomReportTemplate } from '../models/CustomReportTemplate';
import { MisSettings } from '../models/MisSettings';
import { DailyBusinessDigest } from '../models/DailyBusinessDigest';
import { MisExecutiveDashboardService } from './MisExecutiveDashboardService';
import { MisDecisionSupportService } from './MisDecisionSupportService';
import { MisAiService } from './MisAiService';

let totalTests = 0;
let passedTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`✅ [PASS] ${testName}${detail ? ` - ${detail}` : ''}`);
  } else {
    console.error(`❌ [FAIL] ${testName}${detail ? ` - ${detail}` : ''}`);
    throw new Error(`Assertion failed: ${testName}`);
  }
}

async function runMisModuleVerification() {
  console.log('═══════════════════════════════════════════════════════════════════════');
  console.log('  MODULE 14: OVERVIEW & ADVANCED MIS TEST SUITE');
  console.log('  AI-Powered Executive Dashboard & Decision Support System');
  console.log('═══════════════════════════════════════════════════════════════════════\n');

  await mongoose.connect(env.MONGODB_URI);

  try {
    // 0. Test Fixtures
    let org = await OrganizationModel.findOne();
    if (!org) {
      org = await OrganizationModel.create({
        legalName: 'Sun Bird Corporation Ltd.',
        displayName: 'Sun Bird Corporation Ltd.',
        organizationCode: 'SBC-MAIN',
        organizationType: 'PARENT',
        isActive: true,
      });
    }
    const orgId = org._id.toString();

    let user = await UserModel.findOne({ email: 'executive@sunbird.com' }) || (await UserModel.findOne({ organizationId: org._id })) || (await UserModel.findOne());
    if (!user) {
      user = await UserModel.create({
        organizationId: org._id,
        email: `executive_${Date.now()}@sunbird.com`,
        mobile: '01711000000',
        userType: 'STAFF',
        passwordHash: 'dummyhash123',
        fullName: 'Chief Executive Officer',
        role: 'admin',
        isActive: true,
      });
    }

    console.log(`ℹ️ [INIT] Test Organization: ${org.displayName} (${orgId})`);

    // ─────────────────────────────────────────────────────────────
    // 1. EXECUTIVE DASHBOARD OVERVIEW & 38 REAL KPIS
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- 1. Testing Executive Dashboard 38 KPIs ---');
    const overview = await MisExecutiveDashboardService.getExecutiveOverview({
      organizationId: orgId,
    });

    assert(Boolean(overview), 'Executive overview retrieved successfully');
    assert(overview.organizationId === orgId, 'Overview matches organizationId');
    assert(typeof overview.business.totalRevenue === 'number', 'Total Revenue KPI is computed');
    assert(typeof overview.financial.grossProfit === 'number', 'Gross Profit KPI is computed');
    assert(typeof overview.financial.netProfit === 'number', 'Net Profit KPI is computed');
    assert(typeof overview.financial.operatingMarginPct === 'number', 'Operating Margin % KPI is computed');
    assert(typeof overview.inventory.stockValuation === 'number', 'Stock Valuation KPI is computed');
    assert(typeof overview.operations.systemDataIntegrityPct === 'number', 'System Data Integrity % is computed');

    // ─────────────────────────────────────────────────────────────
    // 2. SALES & REVENUE INTELLIGENCE
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- 2. Testing Sales & Revenue Intelligence ---');
    const salesData = await MisExecutiveDashboardService.getSalesIntelligence({
      organizationId: orgId,
    });
    assert(Boolean(salesData), 'Sales intelligence returned');
    assert(Array.isArray(salesData.channelBreakdown), 'Channel breakdown is an array');
    assert(Array.isArray(salesData.salesTrends), 'Sales trends array is populated');
    assert(Array.isArray(salesData.topCategories), 'Top selling categories array is populated');

    // ─────────────────────────────────────────────────────────────
    // 3. FINANCIAL INTELLIGENCE & REAL RATIOS
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- 3. Testing Financial Intelligence & Ratios ---');
    const financialData = await MisExecutiveDashboardService.getFinancialIntelligence({
      organizationId: orgId,
    });
    assert(Boolean(financialData), 'Financial intelligence returned');
    assert(Boolean(financialData.ratios), 'Financial ratios object is present');
    assert(typeof financialData.ratios.currentRatio === 'number', 'Current ratio is calculated');
    assert(typeof financialData.ratios.quickRatio === 'number', 'Quick ratio is calculated');
    assert(typeof financialData.ratios.debtToEquityRatio === 'number', 'Debt-to-Equity ratio is calculated');
    assert(Boolean(financialData.incomeStatement), 'Income statement (P&L) is generated');
    assert(Boolean(financialData.balanceSheet), 'Balance sheet is generated');

    // ─────────────────────────────────────────────────────────────
    // 4. INVENTORY INTELLIGENCE & EXPIRING BATCHES
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- 4. Testing Inventory Intelligence ---');
    const inventoryData = await MisExecutiveDashboardService.getInventoryIntelligence({
      organizationId: orgId,
    });
    assert(Boolean(inventoryData), 'Inventory intelligence returned');
    assert(typeof inventoryData.totalStockValuation === 'number', 'Inventory valuation calculated');
    assert(Array.isArray(inventoryData.lowStockAlerts), 'Low stock alerts array exists');
    assert(Array.isArray(inventoryData.expiringBatches), 'Expiring batches array exists');

    // ─────────────────────────────────────────────────────────────
    // 5. DATA QUALITY AUDIT
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- 5. Testing Data Quality Audit ---');
    const dataQuality = await MisExecutiveDashboardService.getDataQualityAudit(orgId);
    assert(Boolean(dataQuality), 'Data quality audit returned');
    assert(typeof dataQuality.overallScore === 'number' && dataQuality.overallScore <= 100, 'Audit score between 0 and 100');
    assert(Array.isArray(dataQuality.checks), 'Data quality checks array populated');

    // ─────────────────────────────────────────────────────────────
    // 6. AI BUSINESS ANALYST (BENGALI & ENGLISH)
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- 6. Testing AI Business Analyst ---');
    const englishQuery = await MisAiService.queryBusinessAnalyst('What is our current profitability and cash position?', {
      organizationName: org.displayName,
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
    assert(Boolean(englishQuery && englishQuery.answer), 'AI Business Analyst answers in English');
    assert(Array.isArray(englishQuery.sourceCitations), 'AI answers include source citations');

    const bengaliQuery = await MisAiService.queryBusinessAnalyst('আমাদের কোম্পানির মোট মুনাফা এবং নগদ টাকার অবস্থা কেমন?', {
      organizationName: org.displayName,
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
    assert(Boolean(bengaliQuery && bengaliQuery.answer), 'AI Business Analyst answers in Bengali');

    // ─────────────────────────────────────────────────────────────
    // 7. KPI TARGETS & VARIANCE
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- 7. Testing KPI Targets & Variance Tracking ---');
    const testKpi = await MisDecisionSupportService.upsertKpiTarget(orgId, {
      kpiCode: 'REV-MONTHLY-TARGET',
      name: 'Monthly Revenue Target',
      category: 'SALES',
      targetValue: 5000000,
      actualValue: 4200000,
      measurementUnit: 'BDT',
      period: 'MONTHLY',
    });
    assert(Boolean(testKpi && testKpi._id), 'KPI target upserted');
    assert(testKpi.variance !== undefined, 'KPI variance computed');

    const kpiList = await MisDecisionSupportService.getKpis(orgId);
    assert(Array.isArray(kpiList) && kpiList.length > 0, 'KPI list returned');

    // ─────────────────────────────────────────────────────────────
    // 8. AI FORECASTING ENGINE
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- 8. Testing AI Cross-Module Forecasting ---');
    const forecast = await MisDecisionSupportService.generateForecast(orgId, {
      forecastType: 'REVENUE',
      timeHorizon: '90_DAYS',
      scenario: 'EXPECTED',
    });
    assert(Boolean(forecast && forecast._id), 'Forecast record generated');
    assert(typeof forecast.predictedValue === 'number', 'Forecast predictedValue is a number');
    assert(Boolean(forecast.lowerBound <= forecast.upperBound), 'Forecast bounds valid');

    const forecasts = await MisDecisionSupportService.getForecasts(orgId);
    assert(Array.isArray(forecasts) && forecasts.length > 0, 'Forecasts list returned');

    // ─────────────────────────────────────────────────────────────
    // 9. RISKS & ANOMALY DETECTION
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- 9. Testing Automated Risk Scan & Management ---');
    const detectedRisks = await MisDecisionSupportService.scanAndDetectRisks(orgId);
    assert(Array.isArray(detectedRisks), 'Risk scan completed returning array');

    const allRisks = await MisDecisionSupportService.getRisks(orgId);
    assert(Array.isArray(allRisks), 'Risks retrieved');

    if (allRisks.length > 0) {
      const riskId = allRisks[0]._id.toString();
      const updatedRisk = await MisDecisionSupportService.updateRiskStatus(orgId, riskId, 'UNDER_REVIEW', 'Reviewing in weekly executive meeting');
      assert(updatedRisk?.status === 'UNDER_REVIEW', 'Risk status updated to UNDER_REVIEW');
    }

    // ─────────────────────────────────────────────────────────────
    // 10. STRATEGIC RECOMMENDATIONS
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- 10. Testing Strategic Recommendations ---');
    const recs = await MisDecisionSupportService.getRecommendations(orgId);
    assert(Array.isArray(recs) && recs.length > 0, 'Strategic recommendations generated');

    const recId = recs[0]._id.toString();
    const updatedRec = await MisDecisionSupportService.updateRecommendationStatus(orgId, recId, 'ACCEPTED', 'Approved by Managing Director');
    assert(updatedRec?.status === 'ACCEPTED', 'Recommendation status updated to ACCEPTED');

    // ─────────────────────────────────────────────────────────────
    // 11. DAILY BUSINESS DIGEST
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- 11. Testing Daily Business Digest ---');
    const digest = await MisDecisionSupportService.getDailyDigest(orgId);
    assert(Boolean(digest && digest.digestDate), 'Daily digest generated');
    assert(Boolean(digest.aiExecutiveNarrative), 'Daily digest contains executive summary narrative');
    assert(typeof digest.salesSummary?.totalRevenue === 'number', 'Daily digest revenue snapshot computed');

    // ─────────────────────────────────────────────────────────────
    // 12. CUSTOM REPORT TEMPLATES
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- 12. Testing Custom Report Templates ---');
    const template = await MisDecisionSupportService.saveReportTemplate(orgId, {
      name: 'Executive Financial Summary Report',
      code: 'EXEC-FIN-01',
      module: 'FINANCE',
      dataSource: 'posted_journal_vouchers',
      selectedFields: ['voucherNumber', 'date', 'accountCode', 'debit', 'credit'],
      chartType: 'BAR',
      userId: user._id.toString(),
    });
    assert(Boolean(template && template._id), 'Custom report template saved');

    const templates = await MisDecisionSupportService.getReportTemplates(orgId);
    assert(Array.isArray(templates) && templates.length > 0, 'Report templates retrieved');

    // ─────────────────────────────────────────────────────────────
    // 13. MIS SETTINGS & CONFIGURATION
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- 13. Testing MIS Settings ---');
    const settings = await MisDecisionSupportService.getSettings(orgId);
    assert(Boolean(settings && settings.organizationId), 'MIS settings retrieved');

    const updatedSettings = await MisDecisionSupportService.updateSettings(orgId, {
      fiscalYearStartMonth: 7, // July fiscal year start (Bangladesh standard)
      defaultCurrency: 'BDT',
      enableDailyDigest: true,
      riskNotificationThreshold: 'HIGH',
    });
    assert(updatedSettings.fiscalYearStartMonth === 7, 'Settings updated with July fiscal year start');

    console.log('\n═══════════════════════════════════════════════════════════════════════');
    console.log(`  MODULE 14: ALL ${passedTests}/${totalTests} TESTS PASSED SUCCESSFULLY!`);
    console.log('═══════════════════════════════════════════════════════════════════════\n');
  } catch (error) {
    console.error('❌ Verification failed with error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

runMisModuleVerification();
