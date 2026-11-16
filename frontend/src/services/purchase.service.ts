import { apiClient } from '../lib/api';
import {
  PurchaseDashboardMetrics,
  PurchaseRequisitionItem,
  GoodsReceiveNoteItem,
  PurchaseInvoiceItem,
  SupplierPaymentItem,
  PurchaseReturnItem,
  SupplierLedgerResponse,
  PayablesSummaryResponse,
} from '../types';

export const purchaseService = {
  // ─── 1. Dashboard ──────────────────────────────────────────────────────────
  async getDashboard(params?: { startDate?: string; endDate?: string }): Promise<PurchaseDashboardMetrics> {
    const query = new URLSearchParams();
    if (params?.startDate) query.append('startDate', params.startDate);
    if (params?.endDate) query.append('endDate', params.endDate);
    const res = await apiClient<{ success: boolean; data: PurchaseDashboardMetrics }>(
      `/erp/purchase/dashboard?${query.toString()}`
    );
    return res.data;
  },

  // ─── 2. Purchase Requisitions ──────────────────────────────────────────────
  async listRequisitions(params: {
    status?: string;
    department?: string;
    search?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{ items: PurchaseRequisitionItem[]; total: number; page: number; limit: number; totalPages: number }> {
    const query = new URLSearchParams();
    if (params.status && params.status !== 'ALL') query.append('status', params.status);
    if (params.department && params.department !== 'ALL') query.append('department', params.department);
    if (params.search) query.append('search', params.search);
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());
    return apiClient(`/erp/purchase/requisitions?${query.toString()}`);
  },

  async getRequisition(id: string): Promise<PurchaseRequisitionItem> {
    const res = await apiClient<{ success: boolean; data: PurchaseRequisitionItem }>(
      `/erp/purchase/requisitions/${id}`
    );
    return res.data;
  },

  async createRequisition(payload: any): Promise<PurchaseRequisitionItem> {
    const res = await apiClient<{ success: boolean; data: PurchaseRequisitionItem }>(
      '/erp/purchase/requisitions',
      { method: 'POST', body: JSON.stringify(payload) }
    );
    return res.data;
  },

  async submitRequisition(id: string): Promise<PurchaseRequisitionItem> {
    const res = await apiClient<{ success: boolean; data: PurchaseRequisitionItem }>(
      `/erp/purchase/requisitions/${id}/submit`,
      { method: 'POST' }
    );
    return res.data;
  },

  async approveRequisition(id: string): Promise<PurchaseRequisitionItem> {
    const res = await apiClient<{ success: boolean; data: PurchaseRequisitionItem }>(
      `/erp/purchase/requisitions/${id}/approve`,
      { method: 'POST' }
    );
    return res.data;
  },

  async rejectRequisition(id: string, reason: string): Promise<PurchaseRequisitionItem> {
    const res = await apiClient<{ success: boolean; data: PurchaseRequisitionItem }>(
      `/erp/purchase/requisitions/${id}/reject`,
      { method: 'POST', body: JSON.stringify({ reason }) }
    );
    return res.data;
  },

  // ─── 3. Goods Receive Notes (GRN) ──────────────────────────────────────────
  async listGrns(params: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{ items: GoodsReceiveNoteItem[]; total: number; page: number; limit: number; totalPages: number }> {
    const query = new URLSearchParams();
    if (params.status && params.status !== 'ALL') query.append('status', params.status);
    if (params.search) query.append('search', params.search);
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());
    return apiClient(`/erp/purchase/grns?${query.toString()}`);
  },

  async getGrn(id: string): Promise<GoodsReceiveNoteItem> {
    const res = await apiClient<{ success: boolean; data: GoodsReceiveNoteItem }>(
      `/erp/purchase/grns/${id}`
    );
    return res.data;
  },

  async createGrn(payload: any): Promise<GoodsReceiveNoteItem> {
    const res = await apiClient<{ success: boolean; data: GoodsReceiveNoteItem }>(
      '/erp/purchase/grns',
      { method: 'POST', body: JSON.stringify(payload) }
    );
    return res.data;
  },

  async postGrn(id: string): Promise<GoodsReceiveNoteItem> {
    const res = await apiClient<{ success: boolean; data: GoodsReceiveNoteItem }>(
      `/erp/purchase/grns/${id}/post`,
      { method: 'POST' }
    );
    return res.data;
  },

  // ─── 4. Purchase Invoices ──────────────────────────────────────────────────
  async listInvoices(params: {
    status?: string;
    search?: string;
    overdue?: boolean;
    page?: number;
    limit?: number;
  } = {}): Promise<{ items: PurchaseInvoiceItem[]; total: number; page: number; limit: number; totalPages: number }> {
    const query = new URLSearchParams();
    if (params.status && params.status !== 'ALL') query.append('status', params.status);
    if (params.search) query.append('search', params.search);
    if (params.overdue) query.append('overdue', 'true');
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());
    return apiClient(`/erp/purchase/invoices?${query.toString()}`);
  },

  async getInvoice(id: string): Promise<PurchaseInvoiceItem> {
    const res = await apiClient<{ success: boolean; data: PurchaseInvoiceItem }>(
      `/erp/purchase/invoices/${id}`
    );
    return res.data;
  },

  async createInvoice(payload: any): Promise<PurchaseInvoiceItem> {
    const res = await apiClient<{ success: boolean; data: PurchaseInvoiceItem }>(
      '/erp/purchase/invoices',
      { method: 'POST', body: JSON.stringify(payload) }
    );
    return res.data;
  },

  async postInvoice(id: string): Promise<PurchaseInvoiceItem> {
    const res = await apiClient<{ success: boolean; data: PurchaseInvoiceItem }>(
      `/erp/purchase/invoices/${id}/post`,
      { method: 'POST' }
    );
    return res.data;
  },

  async getPayablesSummary(params?: { supplierId?: string }): Promise<PayablesSummaryResponse> {
    const query = new URLSearchParams();
    if (params?.supplierId) query.append('supplierId', params.supplierId);
    const res = await apiClient<{ success: boolean; data: PayablesSummaryResponse }>(
      `/erp/purchase/payables/summary?${query.toString()}`
    );
    return res.data;
  },

  // ─── 5. Supplier Payments ──────────────────────────────────────────────────
  async listPayments(params: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{ items: SupplierPaymentItem[]; total: number; page: number; limit: number; totalPages: number }> {
    const query = new URLSearchParams();
    if (params.status && params.status !== 'ALL') query.append('status', params.status);
    if (params.search) query.append('search', params.search);
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());
    return apiClient(`/erp/purchase/payments?${query.toString()}`);
  },

  async createPayment(payload: any): Promise<SupplierPaymentItem> {
    const res = await apiClient<{ success: boolean; data: SupplierPaymentItem }>(
      '/erp/purchase/payments',
      { method: 'POST', body: JSON.stringify(payload) }
    );
    return res.data;
  },

  async postPayment(id: string): Promise<SupplierPaymentItem> {
    const res = await apiClient<{ success: boolean; data: SupplierPaymentItem }>(
      `/erp/purchase/payments/${id}/post`,
      { method: 'POST' }
    );
    return res.data;
  },

  // ─── 6. Purchase Returns ───────────────────────────────────────────────────
  async listReturns(params: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{ items: PurchaseReturnItem[]; total: number; page: number; limit: number; totalPages: number }> {
    const query = new URLSearchParams();
    if (params.status && params.status !== 'ALL') query.append('status', params.status);
    if (params.search) query.append('search', params.search);
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());
    return apiClient(`/erp/purchase/returns?${query.toString()}`);
  },

  async createReturn(payload: any): Promise<PurchaseReturnItem> {
    const res = await apiClient<{ success: boolean; data: PurchaseReturnItem }>(
      '/erp/purchase/returns',
      { method: 'POST', body: JSON.stringify(payload) }
    );
    return res.data;
  },

  // ─── 7. Supplier Extensions ────────────────────────────────────────────────
  async getSupplierLedger(supplierId: string, params?: { startDate?: string; endDate?: string }): Promise<SupplierLedgerResponse> {
    const query = new URLSearchParams();
    if (params?.startDate) query.append('startDate', params.startDate);
    if (params?.endDate) query.append('endDate', params.endDate);
    const res = await apiClient<{ success: boolean; data: SupplierLedgerResponse }>(
      `/erp/purchase/suppliers/${supplierId}/ledger?${query.toString()}`
    );
    return res.data;
  },

  async getSupplierStats(): Promise<any> {
    const res = await apiClient<{ success: boolean; data: any }>(
      '/erp/purchase/suppliers-stats'
    );
    return res.data;
  },

  async checkDuplicateSupplier(dto: { phone?: string; email?: string; bin?: string }): Promise<{ isDuplicate: boolean; matches: any[] }> {
    const res = await apiClient<{ success: boolean; data: { isDuplicate: boolean; matches: any[] } }>(
      '/erp/purchase/suppliers/check-duplicate',
      { method: 'POST', body: JSON.stringify(dto) }
    );
    return res.data;
  },
};
