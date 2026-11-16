import { apiClient } from '../lib/api';
import {
  Organization,
  OrgDashboardStats,
  OrganizationBankAccount,
  OrganizationSignatory,
  OrganizationStamp,
  OrganizationBranding,
  OrganizationDocumentConfig,
  OrganizationFinancialSettings,
  OrgActivityLog,
} from '../types';

export const organizationService = {
  /**
   * Fetch organization dashboard statistics
   */
  async getDashboardStats(): Promise<OrgDashboardStats> {
    const res = await apiClient<{ success: boolean; data: OrgDashboardStats }>(
      '/erp/organizations/stats'
    );
    return res.data;
  },

  /**
   * List organizations with optional status or search query
   */
  async getOrganizations(params?: { search?: string; status?: string }): Promise<Organization[]> {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.append('search', params.search);
    if (params?.status) searchParams.append('status', params.status);
    const queryStr = searchParams.toString();
    const endpoint = `/erp/organizations${queryStr ? `?${queryStr}` : ''}`;

    const res = await apiClient<{ success: boolean; data: Organization[] }>(endpoint);
    return res.data || [];
  },

  /**
   * Get default organization
   */
  async getDefaultOrganization(): Promise<Organization> {
    const res = await apiClient<{ success: boolean; data: Organization }>(
      '/erp/organizations/default'
    );
    return res.data;
  },

  /**
   * Get organization by ID or Code
   */
  async getOrganizationById(idOrCode: string): Promise<Organization> {
    const res = await apiClient<{ success: boolean; data: Organization }>(
      `/erp/organizations/${encodeURIComponent(idOrCode)}`
    );
    return res.data;
  },

  /**
   * Create a new organization
   */
  async createOrganization(payload: Partial<Organization>): Promise<Organization> {
    const res = await apiClient<{ success: boolean; data: Organization }>('/erp/organizations', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  /**
   * Update organization profile
   */
  async updateOrganization(id: string, payload: Partial<Organization>): Promise<Organization> {
    const res = await apiClient<{ success: boolean; data: Organization }>(
      `/erp/organizations/${encodeURIComponent(id)}`,
      {
        method: 'PUT',
        body: JSON.stringify(payload),
      }
    );
    return res.data;
  },

  /**
   * Change status (ACTIVE / INACTIVE)
   */
  async setStatus(id: string, status: 'ACTIVE' | 'INACTIVE'): Promise<Organization> {
    const res = await apiClient<{ success: boolean; data: Organization }>(
      `/erp/organizations/${encodeURIComponent(id)}/status`,
      {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }
    );
    return res.data;
  },

  /**
   * Mark as default organization
   */
  async setDefault(id: string): Promise<Organization> {
    const res = await apiClient<{ success: boolean; data: Organization }>(
      `/erp/organizations/${encodeURIComponent(id)}/default`,
      {
        method: 'PATCH',
      }
    );
    return res.data;
  },

  /**
   * Update branding
   */
  async updateBranding(id: string, branding: OrganizationBranding): Promise<OrganizationBranding> {
    const res = await apiClient<{ success: boolean; data: OrganizationBranding }>(
      `/erp/organizations/${encodeURIComponent(id)}/branding`,
      {
        method: 'PUT',
        body: JSON.stringify(branding),
      }
    );
    return res.data;
  },

  /**
   * Add a bank account
   */
  async addBankAccount(
    id: string,
    bankData: Omit<OrganizationBankAccount, 'bankId'>
  ): Promise<OrganizationBankAccount[]> {
    const res = await apiClient<{ success: boolean; data: OrganizationBankAccount[] }>(
      `/erp/organizations/${encodeURIComponent(id)}/banks`,
      {
        method: 'POST',
        body: JSON.stringify(bankData),
      }
    );
    return res.data;
  },

  /**
   * Update a bank account
   */
  async updateBankAccount(
    id: string,
    bankId: string,
    bankData: Partial<OrganizationBankAccount>
  ): Promise<OrganizationBankAccount[]> {
    const res = await apiClient<{ success: boolean; data: OrganizationBankAccount[] }>(
      `/erp/organizations/${encodeURIComponent(id)}/banks/${encodeURIComponent(bankId)}`,
      {
        method: 'PUT',
        body: JSON.stringify(bankData),
      }
    );
    return res.data;
  },

  /**
   * Delete a bank account
   */
  async deleteBankAccount(id: string, bankId: string): Promise<OrganizationBankAccount[]> {
    const res = await apiClient<{ success: boolean; data: OrganizationBankAccount[] }>(
      `/erp/organizations/${encodeURIComponent(id)}/banks/${encodeURIComponent(bankId)}`,
      {
        method: 'DELETE',
      }
    );
    return res.data;
  },

  /**
   * Add a signatory
   */
  async addSignatory(
    id: string,
    sigData: Omit<OrganizationSignatory, 'signatoryId'>
  ): Promise<OrganizationSignatory[]> {
    const res = await apiClient<{ success: boolean; data: OrganizationSignatory[] }>(
      `/erp/organizations/${encodeURIComponent(id)}/signatures`,
      {
        method: 'POST',
        body: JSON.stringify(sigData),
      }
    );
    return res.data;
  },

  /**
   * Update a signatory
   */
  async updateSignatory(
    id: string,
    sigId: string,
    sigData: Partial<OrganizationSignatory>
  ): Promise<OrganizationSignatory[]> {
    const res = await apiClient<{ success: boolean; data: OrganizationSignatory[] }>(
      `/erp/organizations/${encodeURIComponent(id)}/signatures/${encodeURIComponent(sigId)}`,
      {
        method: 'PUT',
        body: JSON.stringify(sigData),
      }
    );
    return res.data;
  },

  /**
   * Delete a signatory
   */
  async deleteSignatory(id: string, sigId: string): Promise<OrganizationSignatory[]> {
    const res = await apiClient<{ success: boolean; data: OrganizationSignatory[] }>(
      `/erp/organizations/${encodeURIComponent(id)}/signatures/${encodeURIComponent(sigId)}`,
      {
        method: 'DELETE',
      }
    );
    return res.data;
  },

  /**
   * Add a stamp
   */
  async addStamp(
    id: string,
    stampData: Omit<OrganizationStamp, 'stampId'>
  ): Promise<OrganizationStamp[]> {
    const res = await apiClient<{ success: boolean; data: OrganizationStamp[] }>(
      `/erp/organizations/${encodeURIComponent(id)}/stamps`,
      {
        method: 'POST',
        body: JSON.stringify(stampData),
      }
    );
    return res.data;
  },

  /**
   * Update a stamp
   */
  async updateStamp(
    id: string,
    stampId: string,
    stampData: Partial<OrganizationStamp>
  ): Promise<OrganizationStamp[]> {
    const res = await apiClient<{ success: boolean; data: OrganizationStamp[] }>(
      `/erp/organizations/${encodeURIComponent(id)}/stamps/${encodeURIComponent(stampId)}`,
      {
        method: 'PUT',
        body: JSON.stringify(stampData),
      }
    );
    return res.data;
  },

  /**
   * Delete a stamp
   */
  async deleteStamp(id: string, stampId: string): Promise<OrganizationStamp[]> {
    const res = await apiClient<{ success: boolean; data: OrganizationStamp[] }>(
      `/erp/organizations/${encodeURIComponent(id)}/stamps/${encodeURIComponent(stampId)}`,
      {
        method: 'DELETE',
      }
    );
    return res.data;
  },

  /**
   * Update document configuration
   */
  async updateDocumentConfig(
    id: string,
    config: Partial<OrganizationDocumentConfig>
  ): Promise<OrganizationDocumentConfig> {
    const res = await apiClient<{ success: boolean; data: OrganizationDocumentConfig }>(
      `/erp/organizations/${encodeURIComponent(id)}/documents`,
      {
        method: 'PUT',
        body: JSON.stringify(config),
      }
    );
    return res.data;
  },

  /**
   * Update financial settings
   */
  async updateFinancialSettings(
    id: string,
    settings: Partial<OrganizationFinancialSettings>
  ): Promise<OrganizationFinancialSettings> {
    const res = await apiClient<{ success: boolean; data: OrganizationFinancialSettings }>(
      `/erp/organizations/${encodeURIComponent(id)}/financials`,
      {
        method: 'PUT',
        body: JSON.stringify(settings),
      }
    );
    return res.data;
  },

  /**
   * Get organization activity audit logs
   */
  async getActivityLogs(id: string): Promise<OrgActivityLog[]> {
    const res = await apiClient<{ success: boolean; data: OrgActivityLog[] }>(
      `/erp/organizations/${encodeURIComponent(id)}/logs`
    );
    return res.data || [];
  },
};

export default organizationService;

