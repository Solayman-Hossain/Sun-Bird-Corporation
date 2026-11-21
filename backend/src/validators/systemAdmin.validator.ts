import { z } from 'zod';

export const updateSystemSettingsSchema = z.object({
  appName: z.string().min(2).optional(),
  appLogo: z.string().optional(),
  appDescription: z.string().optional(),
  defaultLanguage: z.enum(['bn', 'en']).optional(),
  supportedLanguages: z.array(z.string()).optional(),
  defaultTimezone: z.string().optional(),
  dateFormat: z.string().optional(),
  timeFormat: z.enum(['12h', '24h']).optional(),
  numberFormat: z.enum(['en-IN', 'bn-BD']).optional(),
  currency: z
    .object({
      code: z.string().default('BDT'),
      symbol: z.string().default('৳'),
      position: z.enum(['PREFIX', 'SUFFIX']).default('PREFIX'),
      decimalPlaces: z.number().default(2),
    })
    .optional(),
  fiscalYearStartMonth: z.number().min(1).max(12).optional(),
  defaultPaginationSize: z.number().min(5).max(100).optional(),
  sessionTimeoutMinutes: z.number().min(5).max(1440).optional(),
});

export const updateSecurityPolicySchema = z.object({
  minPasswordLength: z.number().min(6).max(32).optional(),
  requireSpecialChar: z.boolean().optional(),
  requireNumber: z.boolean().optional(),
  requireUppercase: z.boolean().optional(),
  passwordExpiresDays: z.number().min(0).max(365).optional(),
  failedLoginLockoutThreshold: z.number().min(3).max(20).optional(),
  lockoutDurationMinutes: z.number().min(1).max(1440).optional(),
  maxConcurrentSessions: z.number().min(1).max(10).optional(),
  refreshTokenRotationEnabled: z.boolean().optional(),
  ipWhitelist: z.array(z.string()).optional(),
  loginAlertEmailEnabled: z.boolean().optional(),
  suspiciousActivityAlerts: z.boolean().optional(),
});

export const triggerBackupSchema = z.object({
  backupType: z.enum(['AUTOMATED', 'MANUAL']).default('MANUAL'),
});

export const executeRestoreSchema = z.object({
  backupId: z.string().min(3),
  targetEnvironment: z.string().default('STAGING'),
});

export const testIntegrationSchema = z.object({
  key: z.string().min(2),
});

export const toggleFeatureFlagSchema = z.object({
  flagKey: z.string().min(2),
  isEnabled: z.boolean(),
  notes: z.string().optional(),
});

export const maintenanceModeSchema = z.object({
  isEnabled: z.boolean(),
  message: z.string().min(5),
});

export const dataExchangeJobSchema = z.object({
  jobType: z.enum(['IMPORT', 'EXPORT']),
  entityType: z.enum(['PRODUCT', 'CUSTOMER', 'INVENTORY', 'SALES', 'CHART_OF_ACCOUNTS', 'EMPLOYEE']),
  format: z.enum(['CSV', 'JSON', 'XLSX']).default('CSV'),
  organizationId: z.string().min(10),
});
