import { apiClient } from '../api/client';

export interface MushakReportSummary {
  period: string;
  totalMushakInvoices: number;
  totalVatPayable: number;
  totalRebateClaimable: number;
  totalNetRevenue: number;
}

export interface FefoExpiryReportItem {
  sku: string;
  name: string;
  batchNumber: string;
  expiryDate: string;
  remainingDays: number;
  quantityInStock: number;
  warehouseLocation: string;
  riskLevel: 'CRITICAL' | 'WARNING' | 'HEALTHY';
}

export const reportService = {
  async getMushakTaxSummary(month: number, year: number): Promise<MushakReportSummary> {
    return apiClient.get<MushakReportSummary>(`/reports/mushak-6-3?month=${month}&year=${year}`);
  },

  async getFefoExpiryAudit(): Promise<FefoExpiryReportItem[]> {
    return apiClient.get<FefoExpiryReportItem[]>('/reports/fefo-audit');
  },

  async downloadMushakPdf(invoiceId: string): Promise<Blob> {
    const res = await fetch(`/api/reports/mushak/${invoiceId}/pdf`);
    return res.blob();
  }
};

