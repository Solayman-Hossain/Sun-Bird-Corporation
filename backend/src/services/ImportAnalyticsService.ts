import { Types } from 'mongoose';
import { ImportLCModel } from '../models/ImportLC';
import { ImportShipmentModel } from '../models/ImportShipment';
import { CustomsClearanceModel } from '../models/CustomsClearance';
import { ImportPaymentModel } from '../models/ImportPayment';
import { LandedCostModel } from '../models/LandedCost';
import { ProformaInvoiceModel } from '../models/ProformaInvoice';
import { ImportRiskAlertModel } from '../models/ImportRiskAlert';
import { ImportSettingsModel } from '../models/ImportSettings';
import { ImportAiService } from './ImportAiService';
import { AuditLogService } from './AuditLogService';

export interface ImportDashboardKPIs {
  totalActiveLcs: number;
  totalLcValueFC: number;
  totalImportPurchaseValueBDT: number;
  openLcAmountFC: number;
  lcMarginPaidBDT: number;
  outstandingPaymentsBDT: number;
  totalShipmentsCount: number;
  shipmentsInTransit: number;
  delayedShipments: number;
  upcomingLcExpiryCount: number;
  customsClearancePending: number;
  goodsReceivePending: number;
  landedCostPending: number;
  totalImportExpensesBDT: number;
  totalDutyAndVatBDT: number;
  currencyBreakdown: Record<string, number>;
}

export class ImportAnalyticsService {
  /**
   * Aggregates real-data KPI cards for the Import Dashboard.
   */
  public static async getDashboardMetrics(organizationId?: string | Types.ObjectId): Promise<ImportDashboardKPIs> {
    const orgFilter = organizationId ? { organizationId: new Types.ObjectId(organizationId) } : {};

    // 1. LC metrics
    const lcs = await ImportLCModel.find(orgFilter);
    const activeLcs = lcs.filter((lc) => lc.status !== 'FINAL_SETTLEMENT' && lc.status !== 'SETTLED');
    const totalActiveLcs = activeLcs.length;
    const totalLcValueFC = Number(activeLcs.reduce((acc, curr) => acc + (curr.lcValueFC || 0), 0).toFixed(2));
    const lcMarginPaidBDT = Number(lcs.reduce((acc, curr) => acc + (curr.lcMarginAmountBDT || 0), 0).toFixed(2));

    const currencyBreakdown: Record<string, number> = {};
    activeLcs.forEach((lc) => {
      currencyBreakdown[lc.foreignCurrency] = (currencyBreakdown[lc.foreignCurrency] || 0) + lc.lcValueFC;
    });

    const now = new Date();
    const thirtyDaysAhead = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const upcomingLcExpiryCount = activeLcs.filter((lc) => lc.lcExpiryDate && lc.lcExpiryDate <= thirtyDaysAhead && lc.lcExpiryDate >= now).length;

    // 2. Shipment metrics
    const shipments = await ImportShipmentModel.find(orgFilter);
    const totalShipmentsCount = shipments.length;
    const shipmentsInTransit = shipments.filter(
      (s) => s.shipmentStatus === 'SHIPPED' || s.shipmentStatus === 'IN_TRANSIT' || s.shipmentStatus === 'TRANSSHIPMENT'
    ).length;
    const delayedShipments = shipments.filter(
      (s) => s.shipmentStatus === 'DELAYED' || (s.eta && new Date(s.eta) < now && s.shipmentStatus === 'IN_TRANSIT')
    ).length;

    // 3. Customs metrics
    const customs = await CustomsClearanceModel.find(orgFilter);
    const customsClearancePending = customs.filter(
      (c) => c.clearanceStatus !== 'OUT_OF_CHARGE' && c.clearanceStatus !== 'DELIVERED_TO_DEPOT'
    ).length;
    const totalDutyAndVatBDT = Number(
      customs.reduce((acc, curr) => acc + (curr.totalDutyAndTaxesBDT || 0), 0).toFixed(2)
    );
    const totalImportExpensesBDT = Number(
      customs.reduce((acc, curr) => acc + (curr.totalClearanceCostBDT || 0), 0).toFixed(2)
    );

    // 4. Landed cost & GRN pending
    const landedCosts = await LandedCostModel.find();
    const landedCostPending = landedCosts.filter((lc) => !lc.isFinalized).length;
    const goodsReceivePending = shipments.filter(
      (s) => s.shipmentStatus === 'CUSTOMS_CLEARED' || s.shipmentStatus === 'ARRIVED_AT_PORT'
    ).length;

    // 5. Payments
    const payments = await ImportPaymentModel.find(orgFilter);
    const paidBDT = payments.reduce((acc, curr) => acc + (curr.localAmountBDT || 0), 0);
    const totalImportPurchaseValueBDT = Number((totalLcValueFC * 120).toFixed(2)); // estimated nominal
    const outstandingPaymentsBDT = Math.max(0, totalImportPurchaseValueBDT - paidBDT);

    return {
      totalActiveLcs,
      totalLcValueFC,
      totalImportPurchaseValueBDT,
      openLcAmountFC: totalLcValueFC,
      lcMarginPaidBDT,
      outstandingPaymentsBDT,
      totalShipmentsCount,
      shipmentsInTransit,
      delayedShipments,
      upcomingLcExpiryCount,
      customsClearancePending,
      goodsReceivePending,
      landedCostPending,
      totalImportExpensesBDT,
      totalDutyAndVatBDT,
      currencyBreakdown,
    };
  }

  /**
   * Generates aggregated MIS Reports across LCs, shipments, landed costs and payments.
   */
  public static async generateImportReport(
    reportType: string,
    organizationId?: string | Types.ObjectId
  ): Promise<{ data: any[]; summary: string }> {
    const orgFilter = organizationId ? { organizationId: new Types.ObjectId(organizationId) } : {};

    let data: any[] = [];
    if (reportType === 'LC_REGISTER') {
      data = await ImportLCModel.find(orgFilter).sort({ createdAt: -1 }).lean();
    } else if (reportType === 'SHIPMENT_TRACKING') {
      data = await ImportShipmentModel.find(orgFilter).sort({ eta: 1 }).lean();
    } else if (reportType === 'CUSTOMS_DUTY') {
      data = await CustomsClearanceModel.find(orgFilter).sort({ billOfEntryDate: -1 }).lean();
    } else if (reportType === 'IMPORT_PAYMENTS') {
      data = await ImportPaymentModel.find(orgFilter).sort({ paymentDate: -1 }).lean();
    } else {
      data = await ImportLCModel.find(orgFilter).lean();
    }

    const { summary } = await ImportAiService.generateReportSummary(reportType, {
      totalRecords: data.length,
      reportType,
    });

    return { data, summary };
  }

  /**
   * Retrieves active AI Risk Alerts.
   */
  public static async getRiskAlerts(organizationId?: string | Types.ObjectId) {
    const filter: any = { status: 'ACTIVE' };
    if (organizationId) filter.organizationId = new Types.ObjectId(organizationId);
    return ImportRiskAlertModel.find(filter).sort({ createdAt: -1 }).limit(20);
  }

  /**
   * Dismisses or resolves an AI Risk Alert.
   */
  public static async resolveRiskAlert(
    alertId: string | Types.ObjectId,
    actorId: string | Types.ObjectId,
    status: 'RESOLVED' | 'DISMISSED',
    reason?: string
  ) {
    const alert = await ImportRiskAlertModel.findById(alertId);
    if (alert) {
      alert.status = status;
      alert.dismissedBy = new Types.ObjectId(actorId);
      alert.dismissedReason = reason;
      await alert.save();
    }
    return alert;
  }
}
