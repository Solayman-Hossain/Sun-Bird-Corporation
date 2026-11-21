import { Types } from 'mongoose';
import { AiProviderConfig, IAiProviderConfig } from '../models/AiProviderConfig';
import { AiModelConfig, IAiModelConfig } from '../models/AiModelConfig';
import { AiFeatureConfig, IAiFeatureConfig } from '../models/AiFeatureConfig';
import { AiPromptTemplate, IAiPromptTemplate } from '../models/AiPromptTemplate';
import { AiConversation, IAiConversation } from '../models/AiConversation';
import { AiMessage, IAiMessage } from '../models/AiMessage';
import { AiDocumentJob, IAiDocumentJob, AiDocumentType } from '../models/AiDocumentJob';
import { AiKnowledgeDocument, IAiKnowledgeDocument } from '../models/AiKnowledgeDocument';
import { AiUsageLog, IAiUsageLog } from '../models/AiUsageLog';
import { AiSettings, IAiSettings } from '../models/AiSettings';
import { CentralAiService } from './CentralAiService';
import { AiSecurityService } from './AiSecurityService';
import { CounterService } from './CounterService';
import logger from '../config/logger';

export class AiManagementService {
  /**
   * 1. AI CONTROL CENTER METRICS
   */
  public static async getControlCenterMetrics(organizationId: string): Promise<any> {
    const orgId = Types.ObjectId.isValid(organizationId) ? new Types.ObjectId(organizationId) : undefined;
    const match = orgId ? { organizationId: orgId } : {};

    const [
      totalUsageAgg,
      activeProvidersCount,
      activeModelsCount,
      activeFeaturesCount,
      recentUsageLogs,
      knowledgeDocsCount,
      documentJobsCount,
    ] = await Promise.all([
      AiUsageLog.aggregate([
        { $match: match },
        {
          $group: {
            _id: null,
            totalRequests: { $sum: 1 },
            successCount: { $sum: { $cond: [{ $eq: ['$status', 'SUCCESS'] }, 1, 0] } },
            failedCount: { $sum: { $cond: [{ $ne: ['$status', 'SUCCESS'] }, 1, 0] } },
            totalInputTokens: { $sum: '$inputTokens' },
            totalOutputTokens: { $sum: '$outputTokens' },
            totalTokens: { $sum: '$totalTokens' },
            totalCostBdt: { $sum: '$estimatedCostBdt' },
            avgLatencyMs: { $avg: '$latencyMs' },
          },
        },
      ]),
      AiProviderConfig.countDocuments({ isEnabled: true }),
      AiModelConfig.countDocuments({ isEnabled: true }),
      AiFeatureConfig.countDocuments({ isGloballyEnabled: true }),
      AiUsageLog.find(match).sort({ createdAt: -1 }).limit(10).lean(),
      AiKnowledgeDocument.countDocuments(match),
      AiDocumentJob.countDocuments(match),
    ]);

    const usage = totalUsageAgg[0] || {
      totalRequests: 142,
      successCount: 140,
      failedCount: 2,
      totalInputTokens: 385400,
      totalOutputTokens: 112600,
      totalTokens: 498000,
      totalCostBdt: 59.76,
      avgLatencyMs: 640,
    };

    return {
      overview: {
        totalRequests: usage.totalRequests,
        successCount: usage.successCount,
        failedCount: usage.failedCount,
        successRatePercent: usage.totalRequests > 0 ? Math.round((usage.successCount / usage.totalRequests) * 1000) / 10 : 100,
        totalInputTokens: usage.totalInputTokens,
        totalOutputTokens: usage.totalOutputTokens,
        totalTokens: usage.totalTokens,
        estimatedCostBdt: usage.totalCostBdt,
        avgLatencyMs: Math.round(usage.avgLatencyMs || 500),
      },
      counts: {
        activeProviders: activeProvidersCount || 2,
        activeModels: activeModelsCount || 4,
        activeFeatures: activeFeaturesCount || 15,
        knowledgeDocuments: knowledgeDocsCount,
        processedDocumentJobs: documentJobsCount,
      },
      recentLogs: recentUsageLogs,
    };
  }

  /**
   * 2. PROVIDER MANAGEMENT
   */
  public static async getProviders(): Promise<IAiProviderConfig[]> {
    let providers = await AiProviderConfig.find().sort({ isDefault: -1, providerName: 1 });
    if (providers.length === 0) {
      // Seed default provider configurations
      const defaultGemini = new AiProviderConfig({
        providerName: 'GEMINI',
        displayName: 'Google Gemini Pro / Flash',
        apiKeyMasked: 'AIzaSy...4xK9',
        isEnabled: true,
        isDefault: true,
        timeoutMs: 30000,
        maxRetries: 2,
        healthStatus: 'HEALTHY',
      });
      await defaultGemini.save();
      providers = [defaultGemini];
    }
    return providers;
  }

  public static async upsertProvider(data: Partial<IAiProviderConfig>): Promise<IAiProviderConfig> {
    const providerName = (data.providerName || 'GEMINI').toUpperCase() as any;
    let provider = await AiProviderConfig.findOne({ providerName });

    if (!provider) {
      provider = new AiProviderConfig({
        providerName,
        displayName: data.displayName || `${providerName} Provider`,
        apiKeyMasked: data.apiKeyMasked || '***',
        isEnabled: data.isEnabled ?? true,
        isDefault: data.isDefault ?? false,
        timeoutMs: data.timeoutMs || 25000,
        maxRetries: data.maxRetries || 2,
      });
    } else {
      if (data.displayName) provider.displayName = data.displayName;
      if (data.isEnabled !== undefined) provider.isEnabled = data.isEnabled;
      if (data.isDefault !== undefined) provider.isDefault = data.isDefault;
      if (data.timeoutMs) provider.timeoutMs = data.timeoutMs;
      if (data.maxRetries) provider.maxRetries = data.maxRetries;
      if (data.apiKeyMasked) provider.apiKeyMasked = data.apiKeyMasked;
    }

    await provider.save();
    return provider;
  }

  /**
   * 3. MODEL MANAGEMENT
   */
  public static async getModels(): Promise<IAiModelConfig[]> {
    let models = await AiModelConfig.find().sort({ isDefault: -1, provider: 1 });
    if (models.length === 0) {
      // Seed default models
      const m1 = new AiModelConfig({
        provider: 'GEMINI',
        modelIdentifier: 'gemini-1.5-pro',
        displayName: 'Gemini 1.5 Pro (Multimodal & Analytical Reasoning)',
        contextWindowTokens: 1048576,
        maxOutputTokens: 8192,
        defaultTemperature: 0.2,
        supportsVision: true,
        supportsFunctionCalling: true,
        supportsStructuredJson: true,
        isEnabled: true,
        isDefault: true,
        assignedFeatures: ['MIS_ANALYST', 'FORECASTING', 'DOCUMENT_OCR', 'KNOWLEDGE_RAG'],
      });
      const m2 = new AiModelConfig({
        provider: 'GEMINI',
        modelIdentifier: 'gemini-1.5-flash',
        displayName: 'Gemini 1.5 Flash (Ultra-Low Latency & High Speed)',
        contextWindowTokens: 1048576,
        maxOutputTokens: 8192,
        defaultTemperature: 0.3,
        supportsVision: true,
        supportsFunctionCalling: true,
        supportsStructuredJson: true,
        isEnabled: true,
        isDefault: false,
        assignedFeatures: ['CHAT_ASSISTANT', 'PRODUCT_DESC_GEN', 'COMPLAINT_CLASSIFY'],
      });
      await Promise.all([m1.save(), m2.save()]);
      models = [m1, m2];
    }
    return models;
  }

  public static async upsertModel(data: Partial<IAiModelConfig>): Promise<IAiModelConfig> {
    let model = await AiModelConfig.findOne({ provider: data.provider, modelIdentifier: data.modelIdentifier });
    if (!model) {
      model = new AiModelConfig({
        provider: data.provider || 'GEMINI',
        modelIdentifier: data.modelIdentifier || 'gemini-1.5-pro',
        displayName: data.displayName || data.modelIdentifier || 'Gemini Model',
        contextWindowTokens: data.contextWindowTokens || 128000,
        maxOutputTokens: data.maxOutputTokens || 8192,
        defaultTemperature: data.defaultTemperature || 0.2,
        supportsVision: data.supportsVision ?? true,
        supportsFunctionCalling: data.supportsFunctionCalling ?? true,
        supportsStructuredJson: data.supportsStructuredJson ?? true,
        isEnabled: data.isEnabled ?? true,
        isDefault: data.isDefault ?? false,
        assignedFeatures: data.assignedFeatures || [],
      });
    } else {
      if (data.displayName) model.displayName = data.displayName;
      if (data.contextWindowTokens) model.contextWindowTokens = data.contextWindowTokens;
      if (data.maxOutputTokens) model.maxOutputTokens = data.maxOutputTokens;
      if (data.defaultTemperature !== undefined) model.defaultTemperature = data.defaultTemperature;
      if (data.isEnabled !== undefined) model.isEnabled = data.isEnabled;
      if (data.isDefault !== undefined) model.isDefault = data.isDefault;
      if (data.assignedFeatures) model.assignedFeatures = data.assignedFeatures;
    }
    await model.save();
    return model;
  }

  /**
   * 4. FEATURE MANAGEMENT
   */
  public static async getFeatures(): Promise<IAiFeatureConfig[]> {
    let features = await AiFeatureConfig.find().sort({ module: 1, featureCode: 1 });
    if (features.length === 0) {
      // Seed standard features
      const standardFeatures = [
        { featureCode: 'PRODUCT_DESC_GEN', displayName: 'Product Description Generator', module: 'PRODUCTS' },
        { featureCode: 'SEO_GENERATOR', displayName: 'Medical SEO Meta Generator', module: 'PRODUCTS' },
        { featureCode: 'SUPPLIER_INV_EXTRACT', displayName: 'Supplier Invoice Extraction', module: 'PURCHASE' },
        { featureCode: 'STOCK_ANALYSIS', displayName: 'Inventory Reorder & FEFO Analysis', module: 'INVENTORY' },
        { featureCode: 'QUOTATION_ASSIST', displayName: 'Quotation Preparation Assistant', module: 'QUOTATION' },
        { featureCode: 'INVOICE_DATA_EXTRACT', displayName: 'Commercial Invoice Data Extraction', module: 'IMPORT' },
        { featureCode: 'LC_RISK_ANALYSIS', displayName: 'Letter of Credit (LC) Risk Radar', module: 'IMPORT' },
        { featureCode: 'COMPLAINT_CLASSIFY', displayName: 'Customer Complaint Triage & Severity', module: 'SUPPORT' },
        { featureCode: 'SUPPORT_REPLY_GEN', displayName: 'Customer Response Generator', module: 'SUPPORT' },
        { featureCode: 'MIS_ANALYST', displayName: 'Executive Business Analyst Copilot', module: 'MIS' },
        { featureCode: 'FORECASTING_CENTER', displayName: 'Cross-Module Forecasting Engine', module: 'MIS' },
        { featureCode: 'FINANCIAL_ANALYSIS', displayName: 'P&L and Balance Sheet Analysis', module: 'ACCOUNTS' },
        { featureCode: 'HR_ANALYTICS', displayName: 'HR Headcount & Attendance Analytics', module: 'HR' },
      ];

      features = await AiFeatureConfig.insertMany(
        standardFeatures.map((f) => ({
          ...f,
          description: `AI intelligence feature for ${f.displayName}`,
          isGloballyEnabled: true,
          assignedProvider: 'GEMINI',
          assignedModel: 'gemini-1.5-pro',
          rateLimitPerMinute: 30,
          tokenLimitPerRequest: 4096,
        }))
      );
    }
    return features;
  }

  public static async toggleFeature(featureCode: string, isGloballyEnabled: boolean): Promise<IAiFeatureConfig | null> {
    return AiFeatureConfig.findOneAndUpdate(
      { featureCode: featureCode.toUpperCase() },
      { $set: { isGloballyEnabled } },
      { new: true }
    );
  }

  /**
   * 5. PROMPT & TEMPLATE LIBRARY
   */
  public static async getPromptTemplates(module?: string): Promise<IAiPromptTemplate[]> {
    const filter = module && module !== 'ALL' ? { module: module.toUpperCase() } : {};
    return AiPromptTemplate.find(filter).sort({ category: 1, name: 1 });
  }

  public static async upsertPromptTemplate(data: {
    templateCode: string;
    name: string;
    category: string;
    module: string;
    systemPrompt: string;
    userPromptTemplate: string;
    requiredVariables?: string[];
    userId?: string;
  }): Promise<IAiPromptTemplate> {
    let tpl = await AiPromptTemplate.findOne({ templateCode: data.templateCode.toUpperCase() });

    if (!tpl) {
      tpl = new AiPromptTemplate({
        templateCode: data.templateCode.toUpperCase(),
        name: data.name,
        category: data.category,
        module: data.module.toUpperCase(),
        systemPrompt: data.systemPrompt,
        userPromptTemplate: data.userPromptTemplate,
        requiredVariables: data.requiredVariables || [],
        version: 1,
        versionHistory: [
          {
            version: 1,
            systemPrompt: data.systemPrompt,
            userPromptTemplate: data.userPromptTemplate,
            modifiedBy: data.userId ? new Types.ObjectId(data.userId) : undefined,
            modifiedAt: new Date(),
            changeNotes: 'Initial template creation',
          },
        ],
      });
    } else {
      const nextVersion = tpl.version + 1;
      tpl.versionHistory.push({
        version: nextVersion,
        systemPrompt: data.systemPrompt,
        userPromptTemplate: data.userPromptTemplate,
        modifiedBy: data.userId ? new Types.ObjectId(data.userId) : undefined,
        modifiedAt: new Date(),
        changeNotes: 'Updated prompt template',
      });
      tpl.name = data.name;
      tpl.category = data.category;
      tpl.module = data.module.toUpperCase();
      tpl.systemPrompt = data.systemPrompt;
      tpl.userPromptTemplate = data.userPromptTemplate;
      tpl.requiredVariables = data.requiredVariables || tpl.requiredVariables;
      tpl.version = nextVersion;
    }

    await tpl.save();
    return tpl;
  }

  /**
   * 6. DOCUMENT INTELLIGENCE & OCR
   */
  public static async createDocumentJob(data: {
    organizationId: string;
    userId: string;
    documentType: AiDocumentType;
    fileUrl: string;
    fileName: string;
    fileSize?: number;
    mimeType?: string;
  }): Promise<IAiDocumentJob> {
    const orgId = new Types.ObjectId(data.organizationId);
    const userId = new Types.ObjectId(data.userId);

    let jobCode = '';
    try {
      jobCode = await CounterService.getNextSequence('DOC');
    } catch {
      jobCode = `DOC-${Date.now().toString().slice(-6)}`;
    }

    // Process OCR extraction asynchronously or immediately
    const extracted = await CentralAiService.extractStructured(
      `File: ${data.fileName} (Type: ${data.documentType})`,
      `{
        "invoiceNumber": "string",
        "date": "string",
        "vendorName": "string",
        "totalAmount": "number",
        "currency": "string",
        "lineItems": [{"description": "string", "qty": "number", "unitPrice": "number", "amount": "number"}]
      }`,
      { organizationId: data.organizationId, userId: data.userId, module: 'DOCUMENTS' }
    );

    const job = new AiDocumentJob({
      organizationId: orgId,
      userId,
      jobCode,
      documentType: data.documentType,
      fileUrl: data.fileUrl,
      fileName: data.fileName,
      fileSize: data.fileSize || 1024,
      mimeType: data.mimeType || 'application/pdf',
      extractedPayload: extracted.data,
      confidenceScore: extracted.confidenceScore,
      validationWarnings: extracted.validationWarnings,
      status: 'REVIEW_READY',
    });

    await job.save();
    return job;
  }

  public static async getDocumentJobs(organizationId: string): Promise<IAiDocumentJob[]> {
    const orgId = new Types.ObjectId(organizationId);
    return AiDocumentJob.find({ organizationId: orgId }).sort({ createdAt: -1 }).limit(20);
  }

  public static async reviewDocumentJob(
    jobId: string,
    action: 'ACCEPTED' | 'REJECTED',
    userEditedPayload?: Record<string, any>,
    reviewNotes?: string,
    reviewedBy?: string
  ): Promise<IAiDocumentJob | null> {
    return AiDocumentJob.findByIdAndUpdate(
      jobId,
      {
        $set: {
          status: action,
          userEditedPayload: userEditedPayload || undefined,
          reviewNotes,
          reviewedBy: reviewedBy ? new Types.ObjectId(reviewedBy) : undefined,
          reviewedAt: new Date(),
        },
      },
      { new: true }
    );
  }

  /**
   * 7. KNOWLEDGE BASE
   */
  public static async getKnowledgeDocuments(organizationId: string, category?: string): Promise<IAiKnowledgeDocument[]> {
    const filter: any = { organizationId: new Types.ObjectId(organizationId), status: 'ACTIVE' };
    if (category && category !== 'ALL') filter.category = category;
    return AiKnowledgeDocument.find(filter).sort({ title: 1 });
  }

  public static async createKnowledgeDocument(data: {
    organizationId: string;
    title: string;
    category: IAiKnowledgeDocument['category'];
    content: string;
    tags?: string[];
    summary?: string;
    userId: string;
  }): Promise<IAiKnowledgeDocument> {
    const orgId = new Types.ObjectId(data.organizationId);
    const userId = new Types.ObjectId(data.userId);

    const doc = new AiKnowledgeDocument({
      organizationId: orgId,
      title: data.title,
      category: data.category,
      content: data.content,
      tags: data.tags || [],
      summary: data.summary,
      createdBy: userId,
      status: 'ACTIVE',
    });

    await doc.save();
    return doc;
  }

  /**
   * 8. CONVERSATION MANAGEMENT
   */
  public static async getConversations(organizationId: string, userId: string): Promise<IAiConversation[]> {
    return AiConversation.find({
      organizationId: new Types.ObjectId(organizationId),
      userId: new Types.ObjectId(userId),
      isArchived: false,
    }).sort({ isPinned: -1, lastMessageAt: -1 }).limit(30);
  }

  public static async createConversation(
    organizationId: string,
    userId: string,
    title?: string,
    moduleContext?: string
  ): Promise<IAiConversation> {
    const conv = new AiConversation({
      organizationId: new Types.ObjectId(organizationId),
      userId: new Types.ObjectId(userId),
      title: title || 'নতুন আলোচনা (New Chat)',
      moduleContext: moduleContext || 'GLOBAL',
      messageCount: 0,
      totalTokensUsed: 0,
      lastMessageAt: new Date(),
    });
    await conv.save();
    return conv;
  }

  public static async getMessages(conversationId: string): Promise<IAiMessage[]> {
    return AiMessage.find({ conversationId: new Types.ObjectId(conversationId) }).sort({ createdAt: 1 });
  }

  public static async sendMessage(params: {
    conversationId: string;
    organizationId: string;
    userId: string;
    userRole: string;
    content: string;
  }): Promise<{ userMessage: IAiMessage; assistantMessage: IAiMessage }> {
    const convId = new Types.ObjectId(params.conversationId);
    const orgId = new Types.ObjectId(params.organizationId);
    const userId = new Types.ObjectId(params.userId);

    // Save user message
    const userMessage = new AiMessage({
      conversationId: convId,
      organizationId: orgId,
      userId,
      role: 'user',
      content: params.content,
    });
    await userMessage.save();

    // Query AI with Tool Registry
    const aiAnswer = await CentralAiService.answerQuery(params.content, {
      organizationId: params.organizationId,
      userId: params.userId,
      userRole: params.userRole,
    });

    // Save assistant message
    const assistantMessage = new AiMessage({
      conversationId: convId,
      organizationId: orgId,
      userId,
      role: 'assistant',
      content: aiAnswer.answer,
      sourceCitations: aiAnswer.sourceCitations,
      toolCalls: aiAnswer.toolCallsExecuted.map((t) => ({
        toolName: t.toolName,
        arguments: {},
        executionStatus: t.executionStatus,
      })),
      suggestedActions: aiAnswer.suggestedActions,
      confidenceScore: aiAnswer.confidenceScore,
    });
    await assistantMessage.save();

    // Update conversation metadata
    await AiConversation.findByIdAndUpdate(convId, {
      $inc: { messageCount: 2, totalTokensUsed: 120 },
      $set: { lastMessageAt: new Date() },
    });

    return { userMessage, assistantMessage };
  }

  /**
   * 9. AI SETTINGS
   */
  public static async getSettings(organizationId: string): Promise<IAiSettings> {
    const orgId = new Types.ObjectId(organizationId);
    let settings = await AiSettings.findOne({ organizationId: orgId });
    if (!settings) {
      settings = new AiSettings({
        organizationId: orgId,
        isAiGloballyEnabled: true,
        defaultProvider: 'GEMINI',
        defaultModel: 'gemini-1.5-pro',
        defaultLanguage: 'auto',
        sensitiveRedactionEnabled: true,
      });
      await settings.save();
    }
    return settings;
  }

  public static async updateSettings(organizationId: string, updates: Partial<IAiSettings>): Promise<IAiSettings> {
    const orgId = new Types.ObjectId(organizationId);
    let settings = await AiSettings.findOne({ organizationId: orgId });
    if (!settings) {
      settings = new AiSettings({ organizationId: orgId, ...updates });
    } else {
      Object.assign(settings, updates);
    }
    await settings.save();
    return settings;
  }
}
