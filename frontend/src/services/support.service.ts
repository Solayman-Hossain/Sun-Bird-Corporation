import { apiClient } from '../lib/api';

export interface SupportDashboardData {
  totalTickets: number;
  openTickets: number;
  escalatedTickets: number;
  slaBreachedTickets: number;
  slaComplianceRate: number;
  avgResolutionHours: number;
  customerComplaintsCount: number;
  rmaTotalCount: number;
  rmaPendingApproval: number;
  rmaInspectionQueue: number;
  totalReturnValueBdt: number;
  activeWarrantiesCount: number;
  warrantyClaimsActive: number;
  activeRepairJobsCount: number;
  csatAverageScore: number;
  csatSatisfactionPercent: number;
}

export interface SupportTicketRecord {
  _id: string;
  organizationId: string;
  ticketNumber: string;
  type: 'COMPLAINT' | 'INQUIRY' | 'SUPPORT_TICKET' | 'RETURN_REQUEST' | 'WARRANTY_CLAIM' | 'TECHNICAL_ASSISTANCE' | 'FEEDBACK';
  subject: string;
  description: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  orderNumber?: string;
  productName?: string;
  productSku?: string;
  serialNumber?: string;
  category: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'URGENT';
  severity: string;
  status: 'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'WAITING_FOR_CUSTOMER' | 'ESCALATED' | 'RESOLVED' | 'CLOSED' | 'CANCELLED';
  channel: string;
  assignedToName?: string;
  assignedAt?: string;
  slaHours: number;
  slaDueAt: string;
  isSlaBreached: boolean;
  escalationLevel: number;
  escalationReason?: string;
  aiSentiment: string;
  aiSentimentScore: number;
  aiSuggestedPriority?: string;
  aiDiagnosticSummary?: string;
  resolutionNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SupportMessageRecord {
  _id: string;
  ticketId: string;
  senderType: 'CUSTOMER' | 'AGENT' | 'SYSTEM' | 'AI_ASSISTANT';
  senderName: string;
  messageType: 'MESSAGE' | 'INTERNAL_NOTE' | 'CALL_LOG' | 'EMAIL' | 'STATUS_CHANGE';
  body: string;
  callDurationSeconds?: number;
  callOutcome?: string;
  isInternalOnly: boolean;
  aiDrafted: boolean;
  createdAt: string;
}

export interface RmaRequestRecord {
  _id: string;
  rmaNumber: string;
  ticketId?: string;
  orderNumber?: string;
  invoiceNumber?: string;
  customerName: string;
  customerPhone: string;
  returnType: 'RETURN_FOR_REFUND' | 'RETURN_FOR_REPLACEMENT' | 'RETURN_FOR_EXCHANGE' | 'RETURN_FOR_REPAIR';
  status: 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'SHIPPING_REQUESTED' | 'RECEIVED' | 'INSPECTED' | 'COMPLETED' | 'CANCELLED';
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
  shippingMethod: string;
  courierName?: string;
  courierTrackingNumber?: string;
  totalReturnAmount: number;
  refundStatus: string;
  refundVoucherNumber?: string;
  replacementOrderNumber?: string;
  aiEligibilityAssessment?: {
    isEligible: boolean;
    confidenceScore: number;
    policyViolations: string[];
    recommendedAction: string;
    riskLevel: string;
  };
  items: Array<{
    productId: string;
    productName: string;
    productSku: string;
    serialNumber?: string;
    quantity: number;
    unitPrice: number;
    reason: string;
    requestedAction: string;
  }>;
  createdAt: string;
}

export interface WarrantyRecordItem {
  _id: string;
  warrantyNumber: string;
  productName: string;
  productSku: string;
  serialNumber: string;
  customerName: string;
  customerPhone: string;
  purchaseDate: string;
  warrantyPeriodMonths: number;
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'EXPIRED' | 'VOIDED' | 'EXTENDED';
  policyType: string;
  claimCount: number;
  createdAt: string;
}

export interface RepairJobCardRecord {
  _id: string;
  jobNumber: string;
  serviceCenterName: string;
  productName: string;
  serialNumber?: string;
  customerName: string;
  customerPhone: string;
  technicianName?: string;
  faultDescription: string;
  diagnosisNotes?: string;
  sparePartsUsed: Array<{
    partName: string;
    partCode: string;
    quantity: number;
    unitCost: number;
    totalCost: number;
  }>;
  laborHours: number;
  laborRatePerHour: number;
  totalLaborCost: number;
  totalPartsCost: number;
  grandTotalCost: number;
  warrantyCoveredCost: number;
  customerPayableAmount: number;
  status: string;
  qcPassed: boolean;
  qcNotes?: string;
  createdAt: string;
}

export class SupportService {
  // 1. DASHBOARD & MIS
  public static async getDashboard(): Promise<SupportDashboardData> {
    const res = await apiClient<{ success: boolean; data: SupportDashboardData }>('/erp/support/dashboard');
    return res.data;
  }

  public static async getMisAnalytics(): Promise<any> {
    const res = await apiClient<{ success: boolean; data: any }>('/erp/support/analytics/mis');
    return res.data;
  }

  // 2. TICKETS
  public static async getTickets(params?: Record<string, any>): Promise<{ tickets: SupportTicketRecord[]; total: number; page: number; totalPages: number }> {
    const query = new URLSearchParams(params as any).toString();
    const res = await apiClient<{ success: boolean; data: { tickets: SupportTicketRecord[]; total: number; page: number; totalPages: number } }>(
      `/erp/support/tickets${query ? `?${query}` : ''}`
    );
    return res.data;
  }

  public static async getTicketById(id: string): Promise<{ ticket: SupportTicketRecord; messages: SupportMessageRecord[] }> {
    const res = await apiClient<{ success: boolean; data: { ticket: SupportTicketRecord; messages: SupportMessageRecord[] } }>(
      `/erp/support/tickets/${id}`
    );
    return res.data;
  }

  public static async createTicket(data: any): Promise<SupportTicketRecord> {
    const res = await apiClient<{ success: boolean; data: SupportTicketRecord }>('/erp/support/tickets', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data;
  }

  public static async assignTicket(id: string, data: { userId: string; userName: string }): Promise<SupportTicketRecord> {
    const res = await apiClient<{ success: boolean; data: SupportTicketRecord }>(`/erp/support/tickets/${id}/assign`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data;
  }

  public static async escalateTicket(id: string, data: { escalatedToUserId?: string; reason: string }): Promise<SupportTicketRecord> {
    const res = await apiClient<{ success: boolean; data: SupportTicketRecord }>(`/erp/support/tickets/${id}/escalate`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data;
  }

  public static async addTicketMessage(id: string, data: any): Promise<SupportMessageRecord> {
    const res = await apiClient<{ success: boolean; data: SupportMessageRecord }>(`/erp/support/tickets/${id}/messages`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data;
  }

  public static async resolveTicket(id: string, data: { resolutionNotes: string; isClose?: boolean }): Promise<SupportTicketRecord> {
    const res = await apiClient<{ success: boolean; data: SupportTicketRecord }>(`/erp/support/tickets/${id}/resolve`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data;
  }

  // 3. RMA & RETURNS
  public static async getRmas(params?: Record<string, any>): Promise<{ rmas: RmaRequestRecord[]; total: number; page: number; totalPages: number }> {
    const query = new URLSearchParams(params as any).toString();
    const res = await apiClient<{ success: boolean; data: { rmas: RmaRequestRecord[]; total: number; page: number; totalPages: number } }>(
      `/erp/support/rmas${query ? `?${query}` : ''}`
    );
    return res.data;
  }

  public static async getRmaById(id: string): Promise<{ rma: RmaRequestRecord; inspections: any[] }> {
    const res = await apiClient<{ success: boolean; data: { rma: RmaRequestRecord; inspections: any[] } }>(
      `/erp/support/rmas/${id}`
    );
    return res.data;
  }

  public static async createRma(data: any): Promise<RmaRequestRecord> {
    const res = await apiClient<{ success: boolean; data: RmaRequestRecord }>('/erp/support/rmas', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data;
  }

  public static async approveOrRejectRma(id: string, decision: 'APPROVED' | 'REJECTED', rejectionReason?: string): Promise<RmaRequestRecord> {
    const res = await apiClient<{ success: boolean; data: RmaRequestRecord }>(`/erp/support/rmas/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ decision, rejectionReason }),
    });
    return res.data;
  }

  public static async updateRmaShipping(id: string, data: any): Promise<RmaRequestRecord> {
    const res = await apiClient<{ success: boolean; data: RmaRequestRecord }>(`/erp/support/rmas/${id}/shipping`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return res.data;
  }

  public static async createRmaInspection(id: string, data: any): Promise<any> {
    const res = await apiClient<{ success: boolean; data: any }>(`/erp/support/rmas/${id}/inspections`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data;
  }

  public static async processRmaRefund(id: string, refundVoucherNumber?: string): Promise<RmaRequestRecord> {
    const res = await apiClient<{ success: boolean; data: RmaRequestRecord }>(`/erp/support/rmas/${id}/refund`, {
      method: 'POST',
      body: JSON.stringify({ refundVoucherNumber }),
    });
    return res.data;
  }

  public static async completeRmaReplacement(id: string, replacementOrderNumber: string): Promise<RmaRequestRecord> {
    const res = await apiClient<{ success: boolean; data: RmaRequestRecord }>(`/erp/support/rmas/${id}/replacement`, {
      method: 'POST',
      body: JSON.stringify({ replacementOrderNumber }),
    });
    return res.data;
  }

  // 4. WARRANTY & REPAIR
  public static async getWarranties(params?: Record<string, any>): Promise<{ warranties: WarrantyRecordItem[]; total: number; page: number; totalPages: number }> {
    const query = new URLSearchParams(params as any).toString();
    const res = await apiClient<{ success: boolean; data: { warranties: WarrantyRecordItem[]; total: number; page: number; totalPages: number } }>(
      `/erp/support/warranties${query ? `?${query}` : ''}`
    );
    return res.data;
  }

  public static async getExpiringWarranties(days: number = 30): Promise<WarrantyRecordItem[]> {
    const res = await apiClient<{ success: boolean; data: WarrantyRecordItem[] }>(
      `/erp/support/warranties/expiring?days=${days}`
    );
    return res.data;
  }

  public static async verifyWarranty(serialNumber: string, defectDescription?: string): Promise<any> {
    const query = defectDescription ? `?defectDescription=${encodeURIComponent(defectDescription)}` : '';
    const res = await apiClient<{ success: boolean; data: any }>(
      `/erp/support/warranties/verify/${encodeURIComponent(serialNumber)}${query}`
    );
    return res.data;
  }

  public static async registerWarranty(data: any): Promise<WarrantyRecordItem> {
    const res = await apiClient<{ success: boolean; data: WarrantyRecordItem }>('/erp/support/warranties', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data;
  }

  public static async getWarrantyClaims(params?: Record<string, any>): Promise<{ claims: any[]; total: number; page: number; totalPages: number }> {
    const query = new URLSearchParams(params as any).toString();
    const res = await apiClient<{ success: boolean; data: { claims: any[]; total: number; page: number; totalPages: number } }>(
      `/erp/support/claims${query ? `?${query}` : ''}`
    );
    return res.data;
  }

  public static async createWarrantyClaim(data: any): Promise<any> {
    const res = await apiClient<{ success: boolean; data: any }>('/erp/support/claims', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data;
  }

  public static async getRepairJobCards(params?: Record<string, any>): Promise<{ jobs: RepairJobCardRecord[]; total: number; page: number; totalPages: number }> {
    const query = new URLSearchParams(params as any).toString();
    const res = await apiClient<{ success: boolean; data: { jobs: RepairJobCardRecord[]; total: number; page: number; totalPages: number } }>(
      `/erp/support/repairs${query ? `?${query}` : ''}`
    );
    return res.data;
  }

  public static async createRepairJobCard(data: any): Promise<RepairJobCardRecord> {
    const res = await apiClient<{ success: boolean; data: RepairJobCardRecord }>('/erp/support/repairs', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data;
  }

  public static async updateRepairJobCard(id: string, data: any): Promise<RepairJobCardRecord> {
    const res = await apiClient<{ success: boolean; data: RepairJobCardRecord }>(`/erp/support/repairs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return res.data;
  }

  // 5. AI CO-PILOT
  public static async classifyComplaintAi(subject: string, description: string): Promise<any> {
    const res = await apiClient<{ success: boolean; data: any }>('/erp/support/ai/classify-complaint', {
      method: 'POST',
      body: JSON.stringify({ subject, description }),
    });
    return res.data;
  }

  public static async draftAiReply(ticket: any, agentNotes?: string): Promise<{ draftedMessage: string; tone: string; suggestedNextStep: string }> {
    const res = await apiClient<{ success: boolean; data: { draftedMessage: string; tone: string; suggestedNextStep: string } }>('/erp/support/ai/draft-reply', {
      method: 'POST',
      body: JSON.stringify({ ticket, agentNotes }),
    });
    return res.data;
  }

  public static async getTroubleshootingAi(productName: string, faultDescription: string): Promise<any> {
    const res = await apiClient<{ success: boolean; data: any }>('/erp/support/ai/troubleshooting', {
      method: 'POST',
      body: JSON.stringify({ productName, faultDescription }),
    });
    return res.data;
  }

  public static async askAiAssistant(query: string, context?: any): Promise<any> {
    const res = await apiClient<{ success: boolean; data: any }>('/erp/support/ai/assistant', {
      method: 'POST',
      body: JSON.stringify({ query, context }),
    });
    return res.data;
  }

  // 6. FEEDBACK, KB, SETTINGS & AUDIT
  public static async getFeedbacks(params?: Record<string, any>): Promise<any> {
    const query = new URLSearchParams(params as any).toString();
    const res = await apiClient<{ success: boolean; data: any }>(`/erp/support/feedback${query ? `?${query}` : ''}`);
    return res.data;
  }

  public static async submitCustomerFeedback(data: any): Promise<any> {
    const res = await apiClient<{ success: boolean; data: any }>('/erp/support/feedback', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data;
  }

  public static async getKnowledgeBase(params?: Record<string, any>): Promise<any[]> {
    const query = new URLSearchParams(params as any).toString();
    const res = await apiClient<{ success: boolean; data: any[] }>(`/erp/support/knowledge-base${query ? `?${query}` : ''}`);
    return res.data;
  }

  public static async createKnowledgeBaseArticle(data: any): Promise<any> {
    const res = await apiClient<{ success: boolean; data: any }>('/erp/support/knowledge-base', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data;
  }

  public static async getSettings(): Promise<any> {
    const res = await apiClient<{ success: boolean; data: any }>('/erp/support/settings');
    return res.data;
  }

  public static async updateSettings(data: any): Promise<any> {
    const res = await apiClient<{ success: boolean; data: any }>('/erp/support/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return res.data;
  }

  public static async getAuditLogs(params?: Record<string, any>): Promise<any> {
    const query = new URLSearchParams(params as any).toString();
    const res = await apiClient<{ success: boolean; data: any }>(`/erp/support/audit-logs${query ? `?${query}` : ''}`);
    return res.data;
  }
}
