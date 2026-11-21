import { Request, Response } from 'express';
import { SystemAdminService } from '../services/SystemAdminService';
import logger from '../config/logger';

export class SystemAdminController {
  public static async getDashboard(req: Request, res: Response) {
    try {
      const orgId = req.query.organizationId as string | undefined;
      const data = await SystemAdminService.getDashboardMetrics(orgId);
      res.json({ success: true, data });
    } catch (error: any) {
      logger.error('Error in SystemAdminController.getDashboard:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async getSettings(_req: Request, res: Response) {
    try {
      const data = await SystemAdminService.getSystemSettings();
      res.json({ success: true, data });
    } catch (error: any) {
      logger.error('Error in SystemAdminController.getSettings:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async updateSettings(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id || (req as any).user?._id;
      const data = await SystemAdminService.updateSystemSettings(req.body, userId);
      res.json({ success: true, message: 'System settings updated successfully', data });
    } catch (error: any) {
      logger.error('Error in SystemAdminController.updateSettings:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async getSecurityPolicy(_req: Request, res: Response) {
    try {
      const data = await SystemAdminService.getSecurityPolicy();
      res.json({ success: true, data });
    } catch (error: any) {
      logger.error('Error in SystemAdminController.getSecurityPolicy:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async updateSecurityPolicy(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id || (req as any).user?._id;
      const data = await SystemAdminService.updateSecurityPolicy(req.body, userId);
      res.json({ success: true, message: 'Security policy updated successfully', data });
    } catch (error: any) {
      logger.error('Error in SystemAdminController.updateSecurityPolicy:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async getDatabaseMetrics(_req: Request, res: Response) {
    try {
      const data = await SystemAdminService.getDatabaseMonitoringMetrics();
      res.json({ success: true, data });
    } catch (error: any) {
      logger.error('Error in SystemAdminController.getDatabaseMetrics:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async triggerBackup(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id || (req as any).user?._id;
      const type = req.body.backupType || 'MANUAL';
      const data = await SystemAdminService.triggerBackup(type, userId);
      res.json({ success: true, message: 'Database backup completed successfully', data });
    } catch (error: any) {
      logger.error('Error in SystemAdminController.triggerBackup:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async getBackupHistory(req: Request, res: Response) {
    try {
      const limit = Number(req.query.limit) || 20;
      const data = await SystemAdminService.getBackupHistory(limit);
      res.json({ success: true, data });
    } catch (error: any) {
      logger.error('Error in SystemAdminController.getBackupHistory:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async executeRestore(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id || (req as any).user?._id;
      const { backupId, targetEnvironment } = req.body;
      const data = await SystemAdminService.executeRestore({
        backupId,
        targetEnvironment,
        confirmedBy: userId,
      });
      res.json({ success: true, message: 'Database restore executed and verified', data });
    } catch (error: any) {
      logger.error('Error in SystemAdminController.executeRestore:', error);
      res.status(400).json({ success: false, message: error.message });
    }
  }

  public static async getRestoreHistory(req: Request, res: Response) {
    try {
      const limit = Number(req.query.limit) || 20;
      const data = await SystemAdminService.getRestoreHistory(limit);
      res.json({ success: true, data });
    } catch (error: any) {
      logger.error('Error in SystemAdminController.getRestoreHistory:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async getStorageMetrics(_req: Request, res: Response) {
    try {
      const data = await SystemAdminService.getFileStorageMetrics();
      res.json({ success: true, data });
    } catch (error: any) {
      logger.error('Error in SystemAdminController.getStorageMetrics:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async getIntegrations(_req: Request, res: Response) {
    try {
      const data = await SystemAdminService.getIntegrationsList();
      res.json({ success: true, data });
    } catch (error: any) {
      logger.error('Error in SystemAdminController.getIntegrations:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async testIntegration(req: Request, res: Response) {
    try {
      const { key } = req.body;
      const data = await SystemAdminService.testIntegration(key);
      res.json({ success: true, data });
    } catch (error: any) {
      logger.error('Error in SystemAdminController.testIntegration:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async getQueueMetrics(_req: Request, res: Response) {
    try {
      const data = await SystemAdminService.getQueueMonitoringMetrics();
      res.json({ success: true, data });
    } catch (error: any) {
      logger.error('Error in SystemAdminController.getQueueMetrics:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async getLogs(req: Request, res: Response) {
    try {
      const { severity, module, search, page, limit } = req.query;
      const data = await SystemAdminService.getApplicationLogs({
        severity: severity as string,
        module: module as string,
        search: search as string,
        page: Number(page),
        limit: Number(limit),
      });
      res.json({ success: true, data });
    } catch (error: any) {
      logger.error('Error in SystemAdminController.getLogs:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async getFeatureFlags(_req: Request, res: Response) {
    try {
      const data = await SystemAdminService.getFeatureFlags();
      res.json({ success: true, data });
    } catch (error: any) {
      logger.error('Error in SystemAdminController.getFeatureFlags:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async toggleFeatureFlag(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id || (req as any).user?._id;
      const { flagKey, isEnabled, notes } = req.body;
      const data = await SystemAdminService.toggleFeatureFlag(flagKey, isEnabled, userId, notes);
      res.json({ success: true, message: `Feature flag ${flagKey} updated`, data });
    } catch (error: any) {
      logger.error('Error in SystemAdminController.toggleFeatureFlag:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async createDataExchange(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id || (req as any).user?._id;
      const data = await SystemAdminService.createDataExchangeJob({
        ...req.body,
        requestedBy: userId,
      });
      res.json({ success: true, message: `Data ${req.body.jobType.toLowerCase()} job created`, data });
    } catch (error: any) {
      logger.error('Error in SystemAdminController.createDataExchange:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async getDataExchangeHistory(req: Request, res: Response) {
    try {
      const orgId = req.query.organizationId as string | undefined;
      const limit = Number(req.query.limit) || 20;
      const data = await SystemAdminService.getDataExchangeHistory(orgId, limit);
      res.json({ success: true, data });
    } catch (error: any) {
      logger.error('Error in SystemAdminController.getDataExchangeHistory:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async getSessions(_req: Request, res: Response) {
    try {
      const data = await SystemAdminService.getActiveSessions();
      res.json({ success: true, data });
    } catch (error: any) {
      logger.error('Error in SystemAdminController.getSessions:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async revokeSession(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id || (req as any).user?._id;
      const sessionId = Array.isArray(req.params.sessionId) ? req.params.sessionId[0] : req.params.sessionId;
      const success = await SystemAdminService.revokeSession(sessionId, userId);
      res.json({ success, message: success ? 'Session revoked successfully' : 'Session not found' });
    } catch (error: any) {
      logger.error('Error in SystemAdminController.revokeSession:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async getLoginHistory(req: Request, res: Response) {
    try {
      const { status, email, page, limit } = req.query;
      const data = await SystemAdminService.getLoginHistory({
        status: status as string,
        email: email as string,
        page: Number(page),
        limit: Number(limit),
      });
      res.json({ success: true, data });
    } catch (error: any) {
      logger.error('Error in SystemAdminController.getLoginHistory:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
