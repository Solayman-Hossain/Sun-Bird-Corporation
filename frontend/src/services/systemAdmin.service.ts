import { apiClient } from '../lib/api';

export interface SystemDashboardData {
  kpi: {
    totalOrganizations: number;
    activeOrganizations: number;
    totalUsers: number;
    activeUsers: number;
    onlineSessions: number;
    failedLoginAttempts24h: number;
    applicationErrors24h: number;
    completedBackups: number;
    activeFeatureFlags: number;
    systemUptimeSeconds: number;
    databaseStatus: string;
    redisStatus: string;
  };
  systemHealth: Record<string, string>;
  performance: {
    rssMb: number;
    heapUsedMb: number;
    heapTotalMb: number;
    nodeVersion: string;
    platform: string;
    environment: string;
  };
}

export interface SystemSettingsData {
  appName: string;
  appLogo?: string;
  appDescription?: string;
  defaultLanguage: 'bn' | 'en';
  supportedLanguages: string[];
  defaultTimezone: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  numberFormat: 'en-IN' | 'bn-BD';
  currency: {
    code: string;
    symbol: string;
    position: 'PREFIX' | 'SUFFIX';
    decimalPlaces: number;
  };
  fiscalYearStartMonth: number;
  defaultPaginationSize: number;
  sessionTimeoutMinutes: number;
  maintenanceMode: {
    isEnabled: boolean;
    message: string;
    allowedRoles: string[];
    allowedIps: string[];
  };
}

export interface SecurityPolicyData {
  minPasswordLength: number;
  requireSpecialChar: boolean;
  requireNumber: boolean;
  requireUppercase: boolean;
  passwordExpiresDays: number;
  failedLoginLockoutThreshold: number;
  lockoutDurationMinutes: number;
  maxConcurrentSessions: number;
  refreshTokenRotationEnabled: boolean;
  ipWhitelist: string[];
}

export interface BackupItem {
  _id: string;
  backupId: string;
  backupType: 'AUTOMATED' | 'MANUAL';
  status: 'COMPLETED' | 'IN_PROGRESS' | 'FAILED';
  sizeBytes: number;
  destination: string;
  fileName: string;
  checksum?: string;
  collectionsCount: number;
  documentCount: number;
  createdAt: string;
  triggeredBy?: { fullName: string; email: string };
}

export interface RestoreItem {
  _id: string;
  restoreId: string;
  backupId: string;
  status: string;
  targetEnvironment: string;
  preRestoreBackupId?: string;
  durationSeconds: number;
  executedAt: string;
  outcomeNotes?: string;
}

export interface IntegrationItem {
  _id: string;
  integrationKey: string;
  displayName: string;
  category: string;
  isEnabled: boolean;
  status: 'HEALTHY' | 'DEGRADED' | 'DOWN' | 'UNCONFIGURED';
  maskedCredentials: Record<string, string>;
  lastCheckedAt?: string;
  latencyMs?: number;
}

export interface FeatureFlagItem {
  _id: string;
  flagKey: string;
  displayName: string;
  description?: string;
  isGloballyEnabled: boolean;
  enabledRoles: string[];
  changeHistory: Array<{ modifiedAt: string; isEnabled: boolean; notes?: string }>;
}

export interface SystemLogItem {
  _id: string;
  timestamp: string;
  severity: 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';
  service: string;
  module: string;
  message: string;
  ipAddress?: string;
}

export interface SessionItem {
  _id: string;
  tokenHash: string;
  expiresAt: string;
  isRevoked: boolean;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  userId?: {
    fullName: string;
    email: string;
    userType: string;
    status: string;
  };
}

export class SystemAdminService {
  public static async getDashboard(): Promise<SystemDashboardData> {
    const res = await apiClient.get<{ success: boolean; data: SystemDashboardData }>('/erp/system/dashboard');
    return res.data;
  }

  public static async getSettings(): Promise<SystemSettingsData> {
    const res = await apiClient.get<{ success: boolean; data: SystemSettingsData }>('/erp/system/settings');
    return res.data;
  }

  public static async updateSettings(data: Partial<SystemSettingsData>): Promise<SystemSettingsData> {
    const res = await apiClient.put<{ success: boolean; data: SystemSettingsData }>('/erp/system/settings', data);
    return res.data;
  }

  public static async getSecurityPolicy(): Promise<SecurityPolicyData> {
    const res = await apiClient.get<{ success: boolean; data: SecurityPolicyData }>('/erp/system/security/policy');
    return res.data;
  }

  public static async updateSecurityPolicy(data: Partial<SecurityPolicyData>): Promise<SecurityPolicyData> {
    const res = await apiClient.put<{ success: boolean; data: SecurityPolicyData }>('/erp/system/security/policy', data);
    return res.data;
  }

  public static async getDatabaseMetrics(): Promise<any> {
    const res = await apiClient.get<{ success: boolean; data: any }>('/erp/system/database/metrics');
    return res.data;
  }

  public static async triggerBackup(type: 'MANUAL' | 'AUTOMATED' = 'MANUAL'): Promise<BackupItem> {
    const res = await apiClient.post<{ success: boolean; data: BackupItem }>('/erp/system/backups/trigger', { backupType: type });
    return res.data;
  }

  public static async getBackupHistory(): Promise<BackupItem[]> {
    const res = await apiClient.get<{ success: boolean; data: BackupItem[] }>('/erp/system/backups/history');
    return res.data;
  }

  public static async executeRestore(backupId: string, targetEnvironment: string = 'STAGING'): Promise<RestoreItem> {
    const res = await apiClient.post<{ success: boolean; data: RestoreItem }>('/erp/system/restores/execute', {
      backupId,
      targetEnvironment,
    });
    return res.data;
  }

  public static async getRestoreHistory(): Promise<RestoreItem[]> {
    const res = await apiClient.get<{ success: boolean; data: RestoreItem[] }>('/erp/system/restores/history');
    return res.data;
  }

  public static async getStorageMetrics(): Promise<any> {
    const res = await apiClient.get<{ success: boolean; data: any }>('/erp/system/storage/metrics');
    return res.data;
  }

  public static async getIntegrations(): Promise<IntegrationItem[]> {
    const res = await apiClient.get<{ success: boolean; data: IntegrationItem[] }>('/erp/system/integrations');
    return res.data;
  }

  public static async testIntegration(key: string): Promise<any> {
    const res = await apiClient.post<{ success: boolean; data: any }>('/erp/system/integrations/test', { key });
    return res.data;
  }

  public static async getQueueMetrics(): Promise<any> {
    const res = await apiClient.get<{ success: boolean; data: any }>('/erp/system/queues/metrics');
    return res.data;
  }

  public static async getLogs(params?: { severity?: string; module?: string; search?: string; page?: number; limit?: number }): Promise<{ logs: SystemLogItem[]; pagination: any }> {
    const q = new URLSearchParams();
    if (params?.severity) q.set('severity', params.severity);
    if (params?.module) q.set('module', params.module);
    if (params?.search) q.set('search', params.search);
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    const url = `/erp/system/logs${q.toString() ? `?${q.toString()}` : ''}`;
    const res = await apiClient.get<{ success: boolean; data: { logs: SystemLogItem[]; pagination: any } }>(url);
    return res.data;
  }

  public static async getFeatureFlags(): Promise<FeatureFlagItem[]> {
    const res = await apiClient.get<{ success: boolean; data: FeatureFlagItem[] }>('/erp/system/feature-flags');
    return res.data;
  }

  public static async toggleFeatureFlag(flagKey: string, isEnabled: boolean): Promise<FeatureFlagItem> {
    const res = await apiClient.post<{ success: boolean; data: FeatureFlagItem }>('/erp/system/feature-flags/toggle', {
      flagKey,
      isEnabled,
    });
    return res.data;
  }

  public static async getSessions(): Promise<SessionItem[]> {
    const res = await apiClient.get<{ success: boolean; data: SessionItem[] }>('/erp/system/sessions');
    return res.data;
  }

  public static async revokeSession(sessionId: string): Promise<boolean> {
    const res = await apiClient.post<{ success: boolean }>(`/erp/system/sessions/${sessionId}/revoke`);
    return Boolean(res.success);
  }

  public static async getLoginHistory(): Promise<any> {
    const res = await apiClient.get<{ success: boolean; data: any }>('/erp/system/login-history');
    return res.data;
  }

  public static async createDataExchange(jobType: 'IMPORT' | 'EXPORT', entityType: string, format: string, organizationId: string): Promise<any> {
    const res = await apiClient.post<{ success: boolean; data: any }>('/erp/system/data-exchange', {
      jobType,
      entityType,
      format,
      organizationId,
    });
    return res.data;
  }
}
