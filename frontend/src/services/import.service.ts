import { apiClient } from '../lib/api';

export interface ImportDashboardData {
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

export interface ImportLcRecord {
  _id: string;
  lcNumber: string;
  version: string;
  organizationId?: string;
  applicantOrganization?: string;
  supplierId?: any;
  purchaseOrderId?: any;
  proformaInvoiceId?: any;
  proformaInvoiceNumber?: string;
  issuingBank: string;
  advisingBank?: string;
  foreignCurrency: 'USD' | 'EUR' | 'CNY' | 'JPY' | 'GBP';
  lcValueFC: number;
  openingExchangeRate: number;
  customsAssessmentRate?: number;
  finalSettlementRate?: number;
  realizedFxGainLoss: number;
  lcMarginPercentage?: number;
  lcMarginAmountBDT?: number;
  lcOpeningDate?: string;
  lcExpiryDate?: string;
  latestShipmentDate?: string;
  portOfLoading?: string;
  portOfDischarge?: string;
  incoterms?: string;
  paymentTerms?: string;
  status: string;
  portFreeDays: number;
  demurrageDailyRateBDT?: number;
  demurrageBillableDays?: number;
  calculatedDemurragePenaltyBDT?: number;
  amendmentsCount?: number;
  remarks?: string;
  createdAt: string;
}

export interface ProformaInvoiceRecord {
  _id: string;
  piNumber: string;
  proformaNumber?: string;
  piDate?: string;
  supplierName?: string;
  countryOfOrigin?: string;
  currency: string;
  items: Array<{
    productName: string;
    sku?: string;
    hsCode?: string;
    quantity: number;
    unit: string;
    unitPriceFC: number;
    totalAmountFC: number;
  }>;
  totalAmountFC: number;
  freightFC?: number;
  insuranceFC?: number;
  discountFC?: number;
  grandTotalFC: number;
  incoterms: string;
  paymentTerms: string;
  portOfLoading: string;
  portOfDischarge: string;
  status: string;
  notes?: string;
  createdAt: string;
}

export interface ImportShipmentRecord {
  _id: string;
  shipmentReference: string;
  shipmentNumber: number;
  lcId: string;
  lcNumber: string;
  supplierId?: any;
  shipmentMode: 'SEA' | 'AIR' | 'ROAD';
  vesselName?: string;
  voyageNumber?: string;
  containerNumbers: string[];
  blOrAwbNumber: string;
  portOfLoading: string;
  portOfDischarge: string;
  etd: string;
  eta: string;
  actualArrivalDate?: string;
  shipmentQuantity: number;
  shipmentValueFC: number;
  currency: string;
  shipmentStatus: string;
  commercialInvoice?: {
    invoiceNumber: string;
    totalAmountFC: number;
    currency: string;
  };
  packingList?: {
    packingListNumber: string;
    totalPackages: number;
    grossWeightKg: number;
    netWeightKg: number;
  };
  trackingEvents: Array<{
    timestamp: string;
    location: string;
    status: string;
    description: string;
  }>;
  aiDelayRiskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  aiDelayPredictionDays?: number;
  aiAnalysisNotes?: string;
  createdAt: string;
}

export interface CustomsClearanceRecord {
  _id: string;
  billOfEntryNumber: string;
  billOfEntryDate: string;
  lcNumber: string;
  customsHouse: string;
  cfAgentName?: string;
  hsCodes: string[];
  assessableValueBDT: number;
  customsDutyBDT: number;
  regulatoryDutyBDT: number;
  vatBDT: number;
  totalDutyAndTaxesBDT: number;
  portChargesBDT: number;
  cfAgentChargesBDT: number;
  demurrageChargesBDT: number;
  totalClearanceCostBDT: number;
  clearanceStatus: string;
  createdAt: string;
}

export interface ImportPaymentRecord {
  _id: string;
  paymentReference: string;
  lcNumber: string;
  bankName: string;
  paymentType: string;
  currency: string;
  foreignAmount: number;
  exchangeRate: number;
  localAmountBDT: number;
  paymentDate: string;
  transactionReference: string;
  approvalStatus: string;
  aiPaymentSummary?: string;
  createdAt: string;
}

export interface ImportDocumentRecord {
  _id: string;
  documentNumber?: string;
  documentType: string;
  title: string;
  lcNumber?: string;
  shipmentReference?: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  verificationStatus: string;
  verificationNotes?: string;
  aiExtraction?: {
    extractedAt?: string;
    confidenceScore?: number;
    structuredData?: any;
    complianceChecklist?: Array<{ item: string; satisfied: boolean }>;
  };
  createdAt: string;
}

export interface ImportRiskAlertRecord {
  _id: string;
  riskCategory: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  explanation: string;
  lcNumber?: string;
  shipmentReference?: string;
  recommendedAction: string;
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED' | 'DISMISSED';
  createdAt: string;
}

export class ImportApiClient {
  // 1. Dashboard & Reports
  async getDashboard(organizationId?: string): Promise<ImportDashboardData> {
    const query = organizationId ? `?organizationId=${organizationId}` : '';
    const res = await apiClient<{ success: boolean; data: ImportDashboardData }>(`/erp/import/dashboard${query}`, {
      method: 'GET',
    });
    return res.data;
  }

  async getReport(reportType: string, organizationId?: string): Promise<{ data: any[]; summary: string }> {
    const params = new URLSearchParams({ reportType });
    if (organizationId) params.append('organizationId', organizationId);
    const res = await apiClient<{ success: boolean; data: { data: any[]; summary: string } }>(
      `/erp/import/reports?${params.toString()}`,
      { method: 'GET' }
    );
    return res.data;
  }

  // 2. Letters of Credit (LC)
  async listLcs(params?: { organizationId?: string; status?: string; search?: string }): Promise<ImportLcRecord[]> {
    const searchParams = new URLSearchParams();
    if (params?.organizationId) searchParams.append('organizationId', params.organizationId);
    if (params?.status) searchParams.append('status', params.status);
    if (params?.search) searchParams.append('search', params.search);
    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    const res = await apiClient<{ success: boolean; data: ImportLcRecord[] }>(`/erp/import/lcs${query}`, {
      method: 'GET',
    });
    return res.data;
  }

  async getLcById(id: string): Promise<{ lc: ImportLcRecord; amendments: any[]; shipments: any[]; payments: any[] }> {
    const res = await apiClient<{ success: boolean; data: { lc: ImportLcRecord; amendments: any[]; shipments: any[]; payments: any[] } }>(
      `/erp/import/lcs/${id}`,
      { method: 'GET' }
    );
    return res.data;
  }

  async createLc(data: any): Promise<ImportLcRecord> {
    const res = await apiClient<{ success: boolean; data: ImportLcRecord }>('/erp/import/lcs', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data;
  }

  async createAmendment(lcId: string, data: any): Promise<any> {
    const res = await apiClient<{ success: boolean; data: any }>(`/erp/import/lcs/${lcId}/amendments`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data;
  }

  // 3. Proforma Invoices (PI)
  async listProformaInvoices(params?: { organizationId?: string; status?: string }): Promise<ProformaInvoiceRecord[]> {
    const searchParams = new URLSearchParams();
    if (params?.organizationId) searchParams.append('organizationId', params.organizationId);
    if (params?.status) searchParams.append('status', params.status);
    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    const res = await apiClient<{ success: boolean; data: ProformaInvoiceRecord[] }>(
      `/erp/import/proforma-invoices${query}`,
      { method: 'GET' }
    );
    return res.data;
  }

  async createProformaInvoice(data: any): Promise<ProformaInvoiceRecord> {
    const res = await apiClient<{ success: boolean; data: ProformaInvoiceRecord }>('/erp/import/proforma-invoices', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data;
  }

  // 4. Shipments & Tracking
  async listShipments(params?: { organizationId?: string; status?: string; lcId?: string }): Promise<ImportShipmentRecord[]> {
    const searchParams = new URLSearchParams();
    if (params?.organizationId) searchParams.append('organizationId', params.organizationId);
    if (params?.status) searchParams.append('status', params.status);
    if (params?.lcId) searchParams.append('lcId', params.lcId);
    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    const res = await apiClient<{ success: boolean; data: ImportShipmentRecord[] }>(`/erp/import/shipments${query}`, {
      method: 'GET',
    });
    return res.data;
  }

  async createShipment(data: any): Promise<ImportShipmentRecord> {
    const res = await apiClient<{ success: boolean; data: ImportShipmentRecord }>('/erp/import/shipments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data;
  }

  async addTrackingEvent(shipmentId: string, data: any): Promise<ImportShipmentRecord> {
    const res = await apiClient<{ success: boolean; data: ImportShipmentRecord }>(
      `/erp/import/shipments/${shipmentId}/events`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
    return res.data;
  }

  // 5. Customs Clearance
  async listCustoms(params?: { organizationId?: string; lcId?: string }): Promise<CustomsClearanceRecord[]> {
    const searchParams = new URLSearchParams();
    if (params?.organizationId) searchParams.append('organizationId', params.organizationId);
    if (params?.lcId) searchParams.append('lcId', params.lcId);
    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    const res = await apiClient<{ success: boolean; data: CustomsClearanceRecord[] }>(`/erp/import/customs${query}`, {
      method: 'GET',
    });
    return res.data;
  }

  async recordCustoms(data: any): Promise<CustomsClearanceRecord> {
    const res = await apiClient<{ success: boolean; data: CustomsClearanceRecord }>('/erp/import/customs', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data;
  }

  // 6. Payments
  async listPayments(params?: { organizationId?: string; lcId?: string }): Promise<ImportPaymentRecord[]> {
    const searchParams = new URLSearchParams();
    if (params?.organizationId) searchParams.append('organizationId', params.organizationId);
    if (params?.lcId) searchParams.append('lcId', params.lcId);
    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    const res = await apiClient<{ success: boolean; data: ImportPaymentRecord[] }>(`/erp/import/payments${query}`, {
      method: 'GET',
    });
    return res.data;
  }

  async recordPayment(data: any): Promise<ImportPaymentRecord> {
    const res = await apiClient<{ success: boolean; data: ImportPaymentRecord }>('/erp/import/payments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data;
  }

  // 7. Documents
  async listDocuments(params?: { organizationId?: string; lcId?: string; documentType?: string }): Promise<ImportDocumentRecord[]> {
    const searchParams = new URLSearchParams();
    if (params?.organizationId) searchParams.append('organizationId', params.organizationId);
    if (params?.lcId) searchParams.append('lcId', params.lcId);
    if (params?.documentType) searchParams.append('documentType', params.documentType);
    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    const res = await apiClient<{ success: boolean; data: ImportDocumentRecord[] }>(`/erp/import/documents${query}`, {
      method: 'GET',
    });
    return res.data;
  }

  async uploadDocument(data: any): Promise<ImportDocumentRecord> {
    const res = await apiClient<{ success: boolean; data: ImportDocumentRecord }>('/erp/import/documents', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data;
  }

  async verifyDocument(id: string, status: string, notes?: string): Promise<ImportDocumentRecord> {
    const res = await apiClient<{ success: boolean; data: ImportDocumentRecord }>(
      `/erp/import/documents/${id}/verify`,
      {
        method: 'PUT',
        body: JSON.stringify({ status, notes }),
      }
    );
    return res.data;
  }

  // 8. AI Co-Pilot & Risk Center
  async getRiskAlerts(organizationId?: string): Promise<ImportRiskAlertRecord[]> {
    const query = organizationId ? `?organizationId=${organizationId}` : '';
    const res = await apiClient<{ success: boolean; data: ImportRiskAlertRecord[] }>(
      `/erp/import/risk-alerts${query}`,
      { method: 'GET' }
    );
    return res.data;
  }

  async resolveRiskAlert(id: string, status: string, reason?: string): Promise<ImportRiskAlertRecord> {
    const res = await apiClient<{ success: boolean; data: ImportRiskAlertRecord }>(
      `/erp/import/risk-alerts/${id}/resolve`,
      {
        method: 'PUT',
        body: JSON.stringify({ status, reason }),
      }
    );
    return res.data;
  }

  async aiExtract(textOrFilename: string, documentType: string = 'PROFORMA_INVOICE'): Promise<any> {
    const res = await apiClient<{ success: boolean; data: any }>('/erp/import/ai/extract', {
      method: 'POST',
      body: JSON.stringify({ textOrFilename, documentType }),
    });
    return res.data;
  }

  async aiCompare(docA: any, docB: any): Promise<any> {
    const res = await apiClient<{ success: boolean; data: any }>('/erp/import/ai/compare', {
      method: 'POST',
      body: JSON.stringify({ docA, docB }),
    });
    return res.data;
  }

  async aiShipmentRisk(data: any): Promise<any> {
    const res = await apiClient<{ success: boolean; data: any }>('/erp/import/ai/shipment-risk', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data;
  }

  async aiLandedCostAdvice(costs: any, itemCount: number, fobValueBDT: number): Promise<any> {
    const res = await apiClient<{ success: boolean; data: any }>('/erp/import/ai/landed-cost-advice', {
      method: 'POST',
      body: JSON.stringify({ costs, itemCount, fobValueBDT }),
    });
    return res.data;
  }

  async aiAssistantQuery(query: string, organizationId?: string): Promise<{ answer: string; suggestedActions?: string[]; confidenceScore: number }> {
    const res = await apiClient<{ success: boolean; data: { answer: string; suggestedActions?: string[]; confidenceScore: number } }>(
      '/erp/import/ai/assistant',
      {
        method: 'POST',
        body: JSON.stringify({ query, organizationId }),
      }
    );
    return res.data;
  }
}

export const importApiClient = new ImportApiClient();
