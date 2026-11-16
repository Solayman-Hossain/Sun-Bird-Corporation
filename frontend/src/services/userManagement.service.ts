import { apiClient } from '../lib/api';
import {
  ErpUser,
  ErpRole,
  UserDashboardMetrics,
  UserActiveSession,
  UserLoginHistoryItem,
  PermissionMatrixModuleDef,
} from '../types';

export interface UserListResponse {
  success: boolean;
  data: ErpUser[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface RoleListResponse {
  success: boolean;
  data: ErpRole[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const userManagementService = {
  /**
   * Fetch live user management dashboard statistics
   */
  async getDashboardStats(): Promise<UserDashboardMetrics> {
    const res = await apiClient<{ success: boolean; data: UserDashboardMetrics }>(
      '/erp/users/dashboard-stats'
    );
    return res.data;
  },

  /**
   * List users with optional filter criteria
   */
  async getUsers(params?: {
    search?: string;
    status?: string;
    userType?: string;
    roleId?: string;
    department?: string;
    organizationId?: string;
    page?: number;
    limit?: number;
  }): Promise<UserListResponse> {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.append('search', params.search);
    if (params?.status) searchParams.append('status', params.status);
    if (params?.userType) searchParams.append('userType', params.userType);
    if (params?.roleId) searchParams.append('roleId', params.roleId);
    if (params?.department) searchParams.append('department', params.department);
    if (params?.organizationId) searchParams.append('organizationId', params.organizationId);
    if (params?.page) searchParams.append('page', String(params.page));
    if (params?.limit) searchParams.append('limit', String(params.limit));

    const qs = searchParams.toString();
    const endpoint = `/erp/users${qs ? `?${qs}` : ''}`;
    return apiClient<UserListResponse>(endpoint);
  },

  /**
   * Get single user by ID
   */
  async getUserById(id: string): Promise<ErpUser> {
    const res = await apiClient<{ success: boolean; data: ErpUser }>(`/erp/users/${id}`);
    return res.data;
  },

  /**
   * Create a new user
   */
  async createUser(data: Partial<ErpUser> & { password?: string }): Promise<ErpUser> {
    const res = await apiClient<{ success: boolean; data: ErpUser }>('/erp/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data;
  },

  /**
   * Update user details
   */
  async updateUser(id: string, data: Partial<ErpUser>): Promise<ErpUser> {
    const res = await apiClient<{ success: boolean; data: ErpUser }>(`/erp/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return res.data;
  },

  /**
   * Change user status (ACTIVE, INACTIVE, SUSPENDED, LOCKED)
   */
  async setUserStatus(id: string, status: string): Promise<ErpUser> {
    const res = await apiClient<{ success: boolean; data: ErpUser }>(`/erp/users/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    return res.data;
  },

  /**
   * Unlock locked account
   */
  async unlockUser(id: string): Promise<ErpUser> {
    const res = await apiClient<{ success: boolean; data: ErpUser }>(`/erp/users/${id}/unlock`, {
      method: 'POST',
    });
    return res.data;
  },

  /**
   * Reset user password
   */
  async resetPassword(
    id: string,
    newPassword: string,
    forcePasswordChange: boolean = true
  ): Promise<{ message: string }> {
    const res = await apiClient<{ success: boolean; message: string }>(
      `/erp/users/${id}/reset-password`,
      {
        method: 'POST',
        body: JSON.stringify({ newPassword, forcePasswordChange }),
      }
    );
    return res;
  },

  /**
   * Assign multiple organizations to a user and set default organization
   */
  async assignOrganizations(
    id: string,
    organizationIds: string[],
    defaultOrganizationId?: string
  ): Promise<ErpUser> {
    const res = await apiClient<{ success: boolean; data: ErpUser }>(
      `/erp/users/${id}/organizations`,
      {
        method: 'PUT',
        body: JSON.stringify({ organizationIds, defaultOrganizationId }),
      }
    );
    return res.data;
  },

  /**
   * Get active JWT sessions for a user
   */
  async getUserSessions(id: string): Promise<UserActiveSession[]> {
    const res = await apiClient<{ success: boolean; data: UserActiveSession[] }>(
      `/erp/users/${id}/sessions`
    );
    return res.data || [];
  },

  /**
   * Terminate/revoke all active sessions for a user
   */
  async revokeUserSessions(id: string): Promise<{ revokedCount: number }> {
    const res = await apiClient<{ success: boolean; data: { revokedCount: number } }>(
      `/erp/users/${id}/sessions`,
      { method: 'DELETE' }
    );
    return res.data;
  },

  /**
   * Fetch login history audit logs for user
   */
  async getUserLoginHistory(id: string, limit: number = 50): Promise<UserLoginHistoryItem[]> {
    const res = await apiClient<{ success: boolean; data: UserLoginHistoryItem[] }>(
      `/erp/users/${id}/login-history?limit=${limit}`
    );
    return res.data || [];
  },

  /**
   * Fetch all roles
   */
  async getRoles(params?: { search?: string; isActive?: boolean }): Promise<ErpRole[]> {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.append('search', params.search);
    if (params?.isActive !== undefined) searchParams.append('isActive', String(params.isActive));
    const qs = searchParams.toString();
    const endpoint = `/erp/roles${qs ? `?${qs}` : ''}`;
    const res = await apiClient<RoleListResponse>(endpoint);
    return res.data || [];
  },

  /**
   * Get single role by ID
   */
  async getRoleById(id: string): Promise<ErpRole> {
    const res = await apiClient<{ success: boolean; data: ErpRole }>(`/erp/roles/${id}`);
    return res.data;
  },

  /**
   * Create new role
   */
  async createRole(data: Partial<ErpRole>): Promise<ErpRole> {
    const res = await apiClient<{ success: boolean; data: ErpRole }>('/erp/roles', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data;
  },

  /**
   * Update existing role
   */
  async updateRole(id: string, data: Partial<ErpRole>): Promise<ErpRole> {
    const res = await apiClient<{ success: boolean; data: ErpRole }>(`/erp/roles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return res.data;
  },

  /**
   * Duplicate role
   */
  async duplicateRole(id: string, newRoleName: string, newSlug?: string): Promise<ErpRole> {
    const res = await apiClient<{ success: boolean; data: ErpRole }>(
      `/erp/roles/${id}/duplicate`,
      {
        method: 'POST',
        body: JSON.stringify({ newRoleName, newSlug }),
      }
    );
    return res.data;
  },

  /**
   * Update granular permission matrix for a role
   */
  async updateRolePermissions(
    id: string,
    permissions: Array<{ module: string; actions: string[] }>
  ): Promise<ErpRole> {
    const res = await apiClient<{ success: boolean; data: ErpRole }>(
      `/erp/roles/${id}/permissions`,
      {
        method: 'PUT',
        body: JSON.stringify({ permissions }),
      }
    );
    return res.data;
  },

  /**
   * Delete role (with protection)
   */
  async deleteRole(id: string): Promise<{ success: boolean; message: string }> {
    const res = await apiClient<{ success: boolean; message: string }>(`/erp/roles/${id}`, {
      method: 'DELETE',
    });
    return res;
  },

  /**
   * Seed standard roles
   */
  async seedStandardRoles(): Promise<any> {
    const res = await apiClient<{ success: boolean; data: any }>('/erp/roles/seed', {
      method: 'POST',
    });
    return res.data;
  },

  /**
   * Get the standard Permission Registry definition and presets
   */
  async getPermissionRegistry(): Promise<{
    registry: PermissionMatrixModuleDef[];
    presets: any[];
  }> {
    const res = await apiClient<{
      success: boolean;
      data: { registry: PermissionMatrixModuleDef[]; presets: any[] };
    }>('/erp/roles/permission-registry');
    return res.data;
  },
};

export default userManagementService;

