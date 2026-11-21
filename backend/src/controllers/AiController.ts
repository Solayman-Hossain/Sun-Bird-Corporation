import { Request, Response, NextFunction } from 'express';
import { AiManagementService } from '../services/AiManagementService';
import { CentralAiService } from '../services/CentralAiService';
import { NotFoundError } from '../errors/AppError';
import logger from '../config/logger';

export class AiController {
  private static getOrgId(req: Request): string {
    const orgId =
      (req.user as any)?.organizationId ||
      req.query.organizationId ||
      req.headers['x-organization-id'] ||
      '600000000000000000000001';
    return String(orgId);
  }

  private static getUserId(req: Request): string {
    const user = (req.user as any) || {};
    return String(user._id || user.id || '600000000000000000000002');
  }

  private static getUserRole(req: Request): string {
    return String((req.user as any)?.role || 'staff');
  }

  // 1. CONTROL CENTER METRICS
  public static async getControlCenter(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = AiController.getOrgId(req);
      const metrics = await AiManagementService.getControlCenterMetrics(orgId);
      res.status(200).json({ success: true, data: metrics });
    } catch (err) {
      next(err);
    }
  }

  // 2. CHAT & CONVERSATIONAL ASSISTANT
  public static async chat(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = AiController.getOrgId(req);
      const userId = AiController.getUserId(req);
      const userRole = AiController.getUserRole(req);
      const { query, conversationId, moduleContext } = req.body;

      let convId = conversationId;
      if (!convId) {
        const newConv = await AiManagementService.createConversation(orgId, userId, query.slice(0, 30), moduleContext);
        convId = newConv._id.toString();
      }

      const result = await AiManagementService.sendMessage({
        conversationId: convId,
        organizationId: orgId,
        userId,
        userRole,
        content: query,
      });

      res.status(200).json({
        success: true,
        data: {
          conversationId: convId,
          userMessage: result.userMessage,
          assistantMessage: result.assistantMessage,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  // 3. PROVIDERS
  public static async getProviders(req: Request, res: Response, next: NextFunction) {
    try {
      const providers = await AiManagementService.getProviders();
      res.status(200).json({ success: true, data: providers });
    } catch (err) {
      next(err);
    }
  }

  public static async upsertProvider(req: Request, res: Response, next: NextFunction) {
    try {
      const provider = await AiManagementService.upsertProvider(req.body);
      res.status(200).json({ success: true, data: provider });
    } catch (err) {
      next(err);
    }
  }

  // 4. MODELS
  public static async getModels(req: Request, res: Response, next: NextFunction) {
    try {
      const models = await AiManagementService.getModels();
      res.status(200).json({ success: true, data: models });
    } catch (err) {
      next(err);
    }
  }

  public static async upsertModel(req: Request, res: Response, next: NextFunction) {
    try {
      const model = await AiManagementService.upsertModel(req.body);
      res.status(200).json({ success: true, data: model });
    } catch (err) {
      next(err);
    }
  }

  // 5. FEATURES
  public static async getFeatures(req: Request, res: Response, next: NextFunction) {
    try {
      const features = await AiManagementService.getFeatures();
      res.status(200).json({ success: true, data: features });
    } catch (err) {
      next(err);
    }
  }

  public static async toggleFeature(req: Request, res: Response, next: NextFunction) {
    try {
      const { featureCode, isGloballyEnabled } = req.body;
      const updated = await AiManagementService.toggleFeature(featureCode, isGloballyEnabled);
      if (!updated) throw new NotFoundError('Feature configuration not found');
      res.status(200).json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }

  // 6. PROMPTS
  public static async getPrompts(req: Request, res: Response, next: NextFunction) {
    try {
      const prompts = await AiManagementService.getPromptTemplates(req.query.module as string);
      res.status(200).json({ success: true, data: prompts });
    } catch (err) {
      next(err);
    }
  }

  public static async upsertPrompt(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = AiController.getUserId(req);
      const prompt = await AiManagementService.upsertPromptTemplate({ ...req.body, userId });
      res.status(200).json({ success: true, data: prompt });
    } catch (err) {
      next(err);
    }
  }

  // 7. DOCUMENT INTELLIGENCE & OCR
  public static async getDocumentJobs(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = AiController.getOrgId(req);
      const jobs = await AiManagementService.getDocumentJobs(orgId);
      res.status(200).json({ success: true, data: jobs });
    } catch (err) {
      next(err);
    }
  }

  public static async createDocumentJob(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = AiController.getOrgId(req);
      const userId = AiController.getUserId(req);
      const job = await AiManagementService.createDocumentJob({
        organizationId: orgId,
        userId,
        ...req.body,
      });
      res.status(201).json({ success: true, data: job });
    } catch (err) {
      next(err);
    }
  }

  public static async reviewDocumentJob(req: Request, res: Response, next: NextFunction) {
    try {
      const jobId = String(req.params.id);
      const userId = AiController.getUserId(req);
      const { action, userEditedPayload, reviewNotes } = req.body;

      const job = await AiManagementService.reviewDocumentJob(jobId, action, userEditedPayload, reviewNotes, userId);
      if (!job) throw new NotFoundError('Document job not found');
      res.status(200).json({ success: true, data: job });
    } catch (err) {
      next(err);
    }
  }

  // 8. KNOWLEDGE BASE
  public static async getKnowledgeDocs(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = AiController.getOrgId(req);
      const docs = await AiManagementService.getKnowledgeDocuments(orgId, req.query.category as string);
      res.status(200).json({ success: true, data: docs });
    } catch (err) {
      next(err);
    }
  }

  public static async createKnowledgeDoc(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = AiController.getOrgId(req);
      const userId = AiController.getUserId(req);
      const doc = await AiManagementService.createKnowledgeDocument({
        organizationId: orgId,
        userId,
        ...req.body,
      });
      res.status(201).json({ success: true, data: doc });
    } catch (err) {
      next(err);
    }
  }

  // 9. CONVERSATIONS
  public static async getConversations(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = AiController.getOrgId(req);
      const userId = AiController.getUserId(req);
      const convs = await AiManagementService.getConversations(orgId, userId);
      res.status(200).json({ success: true, data: convs });
    } catch (err) {
      next(err);
    }
  }

  public static async getMessages(req: Request, res: Response, next: NextFunction) {
    try {
      const messages = await AiManagementService.getMessages(String(req.params.id));
      res.status(200).json({ success: true, data: messages });
    } catch (err) {
      next(err);
    }
  }

  // 10. SETTINGS
  public static async getSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = AiController.getOrgId(req);
      const settings = await AiManagementService.getSettings(orgId);
      res.status(200).json({ success: true, data: settings });
    } catch (err) {
      next(err);
    }
  }

  public static async updateSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = AiController.getOrgId(req);
      const settings = await AiManagementService.updateSettings(orgId, req.body);
      res.status(200).json({ success: true, data: settings });
    } catch (err) {
      next(err);
    }
  }
}
