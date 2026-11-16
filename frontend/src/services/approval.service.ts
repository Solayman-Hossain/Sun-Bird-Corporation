import { apiClient } from '../lib/api';
import {
  ApprovalRequestItem,
  ApprovalDashboardMetrics,
  ApprovalWorkflowItem,
  ApprovalDelegationItem,
  AuditLogItem,
  AuditReportMetrics,
} from '../types';

export interface ApprovalListResponse {
  success: boolean;
  data: ApprovalRequestItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface WorkflowListResponse {
  success: boolean;
  data: ApprovalWorkflowItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AuditLogListResponse {
  success: boolean;
  data: AuditLogItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const approvalService = {
  /**
   * Fetch live statistics for Central Approval Dashboard
   */
  async getDashboard(params?: {
    organizationId?: string;
    module?: string;
  }): Promise<ApprovalDashboardMetrics> {
    const sp = new URLSearchParams();
    if (params?.organizationId) sp.append('organizationId', params.organizationId);
    if (params?.module) sp.append('module', params.module);
    const qs = sp.toString();
    const res = await apiClient<{ success: boolean; data: ApprovalDashboardMetrics }>(
      `/erp/approvals/dashboard${qs ? `?${qs}` : ''}`
    );
    return res.data;
  },

  /**
   * Get requests pending action by current user (Checker queue)
   */
  async getMyPendingApprovals(params?: {
    organizationId?: string;
    page?: number;
    limit?: number;
  }): Promise<ApprovalListResponse> {
    const sp = new URLSearchParams();
    if (params?.organizationId) sp.append('organizationId', params.organizationId);
    if (params?.page) sp.append('page', String(params.page));
    if (params?.limit) sp.append('limit', String(params.limit));
    const qs = sp.toString();
    return apiClient<ApprovalListResponse>(`/erp/approvals/pending${qs ? `?${qs}` : ''}`);
  },

  /**
   * Get requests submitted by current user (Maker queue)
   */
  async getMySubmittedRequests(params?: {
    page?: number;
    limit?: number;
  }): Promise<ApprovalListResponse> {
    const sp = new URLSearchParams();
    if (params?.page) sp.append('page', String(params.page));
    if (params?.limit) sp.append('limit', String(params.limit));
    const qs = sp.toString();
    return apiClient<ApprovalListResponse>(`/erp/approvals/submitted${qs ? `?${qs}` : ''}`);
  },

  /**
   * Get all approval requests with filters
   */
  async getAllRequests(params?: {
    organizationId?: string;
    module?: string;
    transactionType?: string;
    currentStatus?: string;
    priority?: string;
    search?: string;
    isOverdue?: boolean;
    page?: number;
    limit?: number;
  }): Promise<ApprovalListResponse> {
    const sp = new URLSearchParams();
    if (params?.organizationId) sp.append('organizationId', params.organizationId);
    if (params?.module) sp.append('module', params.module);
    if (params?.transactionType) sp.append('transactionType', params.transactionType);
    if (params?.currentStatus) sp.append('currentStatus', params.currentStatus);
    if (params?.priority) sp.append('priority', params.priority);
    if (params?.search) sp.append('search', params.search);
    if (params?.isOverdue !== undefined) sp.append('isOverdue', String(params.isOverdue));
    if (params?.page) sp.append('page', String(params.page));
    if (params?.limit) sp.append('limit', String(params.limit));
    const qs = sp.toString();
    return apiClient<ApprovalListResponse>(`/erp/approvals${qs ? `?${qs}` : ''}`);
  },

  /**
   * Get single approval request by ID
   */
  async getRequestById(id: string): Promise<ApprovalRequestItem> {
    const res = await apiClient<{ success: boolean; data: ApprovalRequestItem }>(
      `/erp/approvals/${id}`
    );
    return res.data;
  },

  /**
   * Submit new approval request
   */
  async createRequest(data: any): Promise<ApprovalRequestItem> {
    const res = await apiClient<{ success: boolean; data: ApprovalRequestItem }>(
      '/erp/approvals',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
    return res.data;
  },

  /**
   * Approve a request
   */
  async approveRequest(id: string, comment?: string, signatureHash?: string): Promise<ApprovalRequestItem> {
    const res = await apiClient<{ success: boolean; data: ApprovalRequestItem }>(
      `/erp/approvals/${id}/approve`,
      {
        method: 'POST',
        body: JSON.stringify({ comment, signatureHash }),
      }
    );
    return res.data;
  },

  /**
   * Reject a request
   */
  async rejectRequest(id: string, comment: string, signatureHash?: string): Promise<ApprovalRequestItem> {
    const res = await apiClient<{ success: boolean; data: ApprovalRequestItem }>(
      `/erp/approvals/${id}/reject`,
      {
        method: 'POST',
        body: JSON.stringify({ comment, signatureHash }),
      }
    );
    return res.data;
  },

  /**
   * Return request for correction
   */
  async returnRequest(id: string, comment: string): Promise<ApprovalRequestItem> {
    const res = await apiClient<{ success: boolean; data: ApprovalRequestItem }>(
      `/erp/approvals/${id}/return`,
      {
        method: 'POST',
        body: JSON.stringify({ comment }),
      }
    );
    return res.data;
  },

  /**
   * Request more information
   */
  async requestInformation(id: string, comment?: string): Promise<ApprovalRequestItem> {
    const res = await apiClient<{ success: boolean; data: ApprovalRequestItem }>(
      `/erp/approvals/${id}/request-information`,
      {
        method: 'POST',
        body: JSON.stringify({ comment }),
      }
    );
    return res.data;
  },

  /**
   * Cancel request
   */
  async cancelRequest(id: string, reason: string): Promise<ApprovalRequestItem> {
    const res = await apiClient<{ success: boolean; data: ApprovalRequestItem }>(
      `/erp/approvals/${id}/cancel`,
      {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }
    );
    return res.data;
  },

  /**
   * Trigger overdue scan and escalation
   */
  async checkOverdue(): Promise<{ overdueCount: number; escalatedCount: number }> {
    const res = await apiClient<{ success: boolean; data: { overdueCount: number; escalatedCount: number } }>(
      '/erp/approvals/check-overdue',
      { method: 'POST' }
    );
    return res.data;
  },

  /**
   * Workflow CRUD
   */
  async getWorkflows(params?: {
    organizationId?: string;
    module?: string;
    isActive?: boolean;
    search?: string;
  }): Promise<ApprovalWorkflowItem[]> {
    const sp = new URLSearchParams();
    if (params?.organizationId) sp.append('organizationId', params.organizationId);
    if (params?.module) sp.append('module', params.module);
    if (params?.isActive !== undefined) sp.append('isActive', String(params.isActive));
    if (params?.search) sp.append('search', params.search);
    const qs = sp.toString();
    const res = await apiClient<WorkflowListResponse>(`/erp/approval-workflows${qs ? `?${qs}` : ''}`);
    return res.data || [];
  },

  async createWorkflow(data: Partial<ApprovalWorkflowItem>): Promise<ApprovalWorkflowItem> {
    const res = await apiClient<{ success: boolean; data: ApprovalWorkflowItem }>(
      '/erp/approval-workflows',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
    return res.data;
  },

  async updateWorkflow(id: string, data: Partial<ApprovalWorkflowItem>): Promise<ApprovalWorkflowItem> {
    const res = await apiClient<{ success: boolean; data: ApprovalWorkflowItem }>(
      `/erp/approval-workflows/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      }
    );
    return res.data;
  },

  async deleteWorkflow(id: string): Promise<{ success: boolean; message: string }> {
    return apiClient<{ success: boolean; message: string }>(`/erp/approval-workflows/${id}`, {
      method: 'DELETE',
    });
  },

  async seedWorkflows(): Promise<any> {
    const res = await apiClient<{ success: boolean; data: any }>('/erp/approval-workflows/seed', {
      method: 'POST',
    });
    return res.data;
  },

  /**
   * Delegation Management
   */
  async getDelegations(params?: {
    originalApproverId?: string;
    organizationId?: string;
    isActive?: boolean;
  }): Promise<ApprovalDelegationItem[]> {
    const sp = new URLSearchParams();
    if (params?.originalApproverId) sp.append('originalApproverId', params.originalApproverId);
    if (params?.organizationId) sp.append('organizationId', params.organizationId);
    if (params?.isActive !== undefined) sp.append('isActive', String(params.isActive));
    const qs = sp.toString();
    const res = await apiClient<{ success: boolean; data: ApprovalDelegationItem[] }>(
      `/erp/approval-workflows/delegations${qs ? `?${qs}` : ''}`
    );
    return res.data || [];
  },

  async createDelegation(data: Partial<ApprovalDelegationItem>): Promise<ApprovalDelegationItem> {
    const res = await apiClient<{ success: boolean; data: ApprovalDelegationItem }>(
      '/erp/approval-workflows/delegations',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
    return res.data;
  },

  async revokeDelegation(id: string): Promise<{ success: boolean; message: string }> {
    return apiClient<{ success: boolean; message: string }>(
      `/erp/approval-workflows/delegations/${id}`,
      {
        method: 'DELETE',
      }
    );
  },

  /**
   * Central Audit Logs & Reports
   */
  async getAuditLogs(params?: {
    organizationId?: string;
    module?: string;
    action?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<AuditLogListResponse> {
    const sp = new URLSearchParams();
    if (params?.organizationId) sp.append('organizationId', params.organizationId);
    if (params?.module) sp.append('module', params.module);
    if (params?.action) sp.append('action', params.action);
    if (params?.search) sp.append('search', params.search);
    if (params?.page) sp.append('page', String(params.page));
    if (params?.limit) sp.append('limit', String(params.limit));
    const qs = sp.toString();
    return apiClient<AuditLogListResponse>(`/erp/audit-logs${qs ? `?${qs}` : ''}`);
  },

  async getAuditReports(organizationId?: string): Promise<AuditReportMetrics> {
    const sp = new URLSearchParams();
    if (organizationId) sp.append('organizationId', organizationId);
    const qs = sp.toString();
    const res = await apiClient<{ success: boolean; data: AuditReportMetrics }>(
      `/erp/audit-logs/reports${qs ? `?${qs}` : ''}`
    );
    return res.data;
  },

  async computeDiff(before: any, after: any): Promise<Array<{ field: string; before: any; after: any }>> {
    const res = await apiClient<{ success: boolean; data: Array<{ field: string; before: any; after: any }> }>(
      '/erp/audit-logs/diff',
      {
        method: 'POST',
        body: JSON.stringify({ before, after }),
      }
    );
    return res.data || [];
  },
};

export default approvalService;

