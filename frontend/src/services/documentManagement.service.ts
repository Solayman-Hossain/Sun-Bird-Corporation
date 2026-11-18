import { apiClient } from '../lib/api';
import {
  DocumentTemplateItem,
  SalesQuotationItem,
  ProformaInvoiceItem,
  MoneyReceiptDocItem,
  CreditNoteDocItem,
} from '../types';

function buildQuery(params: Record<string, string | number | boolean | undefined>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') {
      q.append(k, String(v));
    }
  }
  const str = q.toString();
  return str ? `?${str}` : '';
}

export const documentManagementService = {
  // ─── 01. DASHBOARD ─────────────────────────────────────────────────────────
  async getDashboard(): Promise<{
    success: boolean;
    data: {
      metrics: {
        totalQuotations: number;
        totalProformas: number;
        totalInvoices: number;
        totalChallans: number;
        totalReceipts: number;
        totalCreditNotes: number;
        totalPurchaseOrders: number;
        totalPurchaseInvoices: number;
        totalTemplates: number;
      };
      recentQuotations: SalesQuotationItem[];
    };
  }> {
    return apiClient('/erp/documents/dashboard');
  },

  // ─── 02. TEMPLATES ─────────────────────────────────────────────────────────
  async listTemplates(params: {
    documentType?: string;
    search?: string;
    page?: number;
    limit?: number;
    isActive?: boolean;
  } = {}): Promise<{ success: boolean; items: DocumentTemplateItem[]; total: number; page: number; totalPages: number }> {
    return apiClient(`/erp/documents/templates${buildQuery(params)}`);
  },

  async createTemplate(data: Partial<DocumentTemplateItem>): Promise<{ success: boolean; data: DocumentTemplateItem }> {
    return apiClient('/erp/documents/templates', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getTemplate(id: string): Promise<{ success: boolean; data: DocumentTemplateItem }> {
    return apiClient(`/erp/documents/templates/${id}`);
  },

  async updateTemplate(id: string, data: Partial<DocumentTemplateItem>): Promise<{ success: boolean; data: DocumentTemplateItem }> {
    return apiClient(`/erp/documents/templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async duplicateTemplate(id: string): Promise<{ success: boolean; data: DocumentTemplateItem }> {
    return apiClient(`/erp/documents/templates/${id}/duplicate`, {
      method: 'POST',
      body: '{}',
    });
  },

  async setDefaultTemplate(id: string, documentType: string): Promise<{ success: boolean; data: DocumentTemplateItem }> {
    return apiClient(`/erp/documents/templates/${id}/set-default`, {
      method: 'POST',
      body: JSON.stringify({ documentType }),
    });
  },

  async deleteTemplate(id: string): Promise<{ success: boolean; message: string }> {
    return apiClient(`/erp/documents/templates/${id}`, { method: 'DELETE' });
  },

  async seedDefaultTemplates(organizationId?: string): Promise<{ success: boolean; data: any }> {
    return apiClient('/erp/documents/templates/seed-defaults', {
      method: 'POST',
      body: JSON.stringify({ organizationId }),
    });
  },

  // ─── 03. SALES QUOTATIONS ──────────────────────────────────────────────────
  async listQuotations(params: {
    customerId?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{ success: boolean; items: SalesQuotationItem[]; total: number; page: number; totalPages: number }> {
    return apiClient(`/erp/documents/quotations${buildQuery(params)}`);
  },

  async createQuotation(data: any): Promise<{ success: boolean; data: SalesQuotationItem }> {
    return apiClient('/erp/documents/quotations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getQuotation(id: string): Promise<{ success: boolean; data: SalesQuotationItem }> {
    return apiClient(`/erp/documents/quotations/${id}`);
  },

  async approveQuotation(id: string): Promise<{ success: boolean; data: SalesQuotationItem }> {
    return apiClient(`/erp/documents/quotations/${id}/approve`, {
      method: 'POST',
      body: '{}',
    });
  },

  // ─── 04. PROFORMA INVOICES ─────────────────────────────────────────────────
  async listProformas(params: {
    customerId?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{ success: boolean; items: ProformaInvoiceItem[]; total: number; page: number; totalPages: number }> {
    return apiClient(`/erp/documents/proforma-invoices${buildQuery(params)}`);
  },

  async createProforma(data: any): Promise<{ success: boolean; data: ProformaInvoiceItem }> {
    return apiClient('/erp/documents/proforma-invoices', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getProforma(id: string): Promise<{ success: boolean; data: ProformaInvoiceItem }> {
    return apiClient(`/erp/documents/proforma-invoices/${id}`);
  },

  // ─── 05. MONEY RECEIPTS ────────────────────────────────────────────────────
  async listReceipts(params: {
    customerId?: string;
    status?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{ success: boolean; items: MoneyReceiptDocItem[]; total: number; page: number; totalPages: number }> {
    return apiClient(`/erp/documents/money-receipts${buildQuery(params)}`);
  },

  async createReceipt(data: any): Promise<{ success: boolean; data: MoneyReceiptDocItem }> {
    return apiClient('/erp/documents/money-receipts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getReceipt(id: string): Promise<{ success: boolean; data: MoneyReceiptDocItem }> {
    return apiClient(`/erp/documents/money-receipts/${id}`);
  },

  async postReceipt(id: string): Promise<{ success: boolean; data: MoneyReceiptDocItem }> {
    return apiClient(`/erp/documents/money-receipts/${id}/post`, {
      method: 'POST',
      body: '{}',
    });
  },

  // ─── 06. CREDIT NOTES ──────────────────────────────────────────────────────
  async listCreditNotes(params: {
    customerId?: string;
    status?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{ success: boolean; items: CreditNoteDocItem[]; total: number; page: number; totalPages: number }> {
    return apiClient(`/erp/documents/credit-notes${buildQuery(params)}`);
  },

  async createCreditNote(data: any): Promise<{ success: boolean; data: CreditNoteDocItem }> {
    return apiClient('/erp/documents/credit-notes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getCreditNote(id: string): Promise<{ success: boolean; data: CreditNoteDocItem }> {
    return apiClient(`/erp/documents/credit-notes/${id}`);
  },

  async postCreditNote(id: string): Promise<{ success: boolean; data: CreditNoteDocItem }> {
    return apiClient(`/erp/documents/credit-notes/${id}/post`, {
      method: 'POST',
      body: '{}',
    });
  },

  // ─── 07. UNIVERSAL PREVIEW & PDF ───────────────────────────────────────────
  async previewDocument(docType: string, id: string, templateId?: string): Promise<{ success: boolean; data: any }> {
    return apiClient(`/erp/documents/preview/${docType}/${id}${buildQuery({ templateId })}`);
  },

  getPdfUrl(docType: string, id: string, templateId?: string): string {
    const q = templateId ? `?templateId=${templateId}` : '';
    return `/api/v1/erp/documents/pdf/${docType}/${id}${q}`;
  },

  // ─── 08. BRANDING ──────────────────────────────────────────────────────────
  async getBranding(orgId: string): Promise<{ success: boolean; data: any }> {
    return apiClient(`/erp/documents/branding/${orgId}`);
  },

  async updateBranding(orgId: string, data: any): Promise<{ success: boolean; data: any }> {
    return apiClient(`/erp/documents/branding/${orgId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

export default documentManagementService;
