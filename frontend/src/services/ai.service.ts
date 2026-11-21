import { apiClient } from '../lib/api';

export interface AiControlCenterData {
  overview: {
    totalRequests: number;
    successCount: number;
    failedCount: number;
    successRatePercent: number;
    totalInputTokens: number;
    totalOutputTokens: number;
    totalTokens: number;
    estimatedCostBdt: number;
    avgLatencyMs: number;
  };
  counts: {
    activeProviders: number;
    activeModels: number;
    activeFeatures: number;
    knowledgeDocuments: number;
    processedDocumentJobs: number;
  };
  recentLogs: Array<{
    _id: string;
    featureCode: string;
    module: string;
    provider: string;
    model: string;
    totalTokens: number;
    latencyMs: number;
    status: string;
    createdAt: string;
  }>;
}

export interface AiProviderRecord {
  _id: string;
  providerName: 'GEMINI' | 'OPENAI' | 'ANTHROPIC' | 'LOCAL_MOCK';
  displayName: string;
  apiKeyMasked: string;
  isEnabled: boolean;
  isDefault: boolean;
  isFallback: boolean;
  timeoutMs: number;
  maxRetries: number;
  healthStatus: 'HEALTHY' | 'DEGRADED' | 'OFFLINE' | 'UNCONFIGURED';
}

export interface AiModelRecord {
  _id: string;
  provider: string;
  modelIdentifier: string;
  displayName: string;
  contextWindowTokens: number;
  maxOutputTokens: number;
  defaultTemperature: number;
  supportsVision: boolean;
  supportsFunctionCalling: boolean;
  supportsStructuredJson: boolean;
  isEnabled: boolean;
  isDefault: boolean;
  assignedFeatures: string[];
}

export interface AiFeatureRecord {
  _id: string;
  featureCode: string;
  displayName: string;
  module: string;
  description: string;
  isGloballyEnabled: boolean;
  assignedProvider: string;
  assignedModel: string;
  rateLimitPerMinute: number;
  tokenLimitPerRequest: number;
}

export interface AiPromptTemplateRecord {
  _id: string;
  templateCode: string;
  name: string;
  category: string;
  module: string;
  systemPrompt: string;
  userPromptTemplate: string;
  version: number;
  isActive: boolean;
}

export interface AiDocumentJobRecord {
  _id: string;
  jobCode: string;
  documentType: string;
  fileUrl: string;
  fileName: string;
  confidenceScore: number;
  validationWarnings: string[];
  status: 'QUEUED' | 'PROCESSING' | 'REVIEW_READY' | 'ACCEPTED' | 'REJECTED' | 'FAILED';
  extractedPayload: Record<string, any>;
  userEditedPayload?: Record<string, any>;
  reviewNotes?: string;
  createdAt: string;
}

export interface AiKnowledgeDocRecord {
  _id: string;
  title: string;
  category: string;
  content: string;
  summary?: string;
  tags: string[];
  status: string;
  createdAt: string;
}

export interface AiConversationRecord {
  _id: string;
  title: string;
  moduleContext: string;
  messageCount: number;
  totalTokensUsed: number;
  lastMessageAt: string;
}

export interface AiMessageRecord {
  _id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  sourceCitations?: Array<{ module: string; metric?: string; title?: string; value?: any }>;
  toolCalls?: Array<{ toolName: string; executionStatus: string }>;
  suggestedActions?: string[];
  confidenceScore?: number;
  createdAt: string;
}

export interface AiSettingsData {
  _id: string;
  isAiGloballyEnabled: boolean;
  defaultProvider: string;
  defaultModel: string;
  defaultLanguage: 'bn' | 'en' | 'auto';
  responseStyle: string;
  timeoutMs: number;
  sensitiveRedactionEnabled: boolean;
  dailyTokenLimitPerOrg: number;
  monthlyBudgetBdt: number;
}

export class AiService {
  // 1. Control Center
  public static async getControlCenter(): Promise<AiControlCenterData> {
    const res = await apiClient<{ success: boolean; data: AiControlCenterData }>('/api/v1/erp/ai/control-center');
    return res.data;
  }

  // 2. Chat
  public static async sendChatMessage(query: string, conversationId?: string, moduleContext?: string) {
    const res = await apiClient<{
      success: boolean;
      data: { conversationId: string; userMessage: AiMessageRecord; assistantMessage: AiMessageRecord };
    }>('/api/v1/erp/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ query, conversationId, moduleContext }),
    });
    return res.data;
  }

  public static async getConversations(): Promise<AiConversationRecord[]> {
    const res = await apiClient<{ success: boolean; data: AiConversationRecord[] }>('/api/v1/erp/ai/conversations');
    return res.data;
  }

  public static async getConversationMessages(conversationId: string): Promise<AiMessageRecord[]> {
    const res = await apiClient<{ success: boolean; data: AiMessageRecord[] }>(
      `/api/v1/erp/ai/conversations/${conversationId}/messages`
    );
    return res.data;
  }

  // 3. Providers
  public static async getProviders(): Promise<AiProviderRecord[]> {
    const res = await apiClient<{ success: boolean; data: AiProviderRecord[] }>('/api/v1/erp/ai/providers');
    return res.data;
  }

  public static async upsertProvider(data: Partial<AiProviderRecord>): Promise<AiProviderRecord> {
    const res = await apiClient<{ success: boolean; data: AiProviderRecord }>('/api/v1/erp/ai/providers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data;
  }

  // 4. Models
  public static async getModels(): Promise<AiModelRecord[]> {
    const res = await apiClient<{ success: boolean; data: AiModelRecord[] }>('/api/v1/erp/ai/models');
    return res.data;
  }

  public static async upsertModel(data: Partial<AiModelRecord>): Promise<AiModelRecord> {
    const res = await apiClient<{ success: boolean; data: AiModelRecord }>('/api/v1/erp/ai/models', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data;
  }

  // 5. Features
  public static async getFeatures(): Promise<AiFeatureRecord[]> {
    const res = await apiClient<{ success: boolean; data: AiFeatureRecord[] }>('/api/v1/erp/ai/features');
    return res.data;
  }

  public static async toggleFeature(featureCode: string, isGloballyEnabled: boolean): Promise<AiFeatureRecord> {
    const res = await apiClient<{ success: boolean; data: AiFeatureRecord }>('/api/v1/erp/ai/features/toggle', {
      method: 'POST',
      body: JSON.stringify({ featureCode, isGloballyEnabled }),
    });
    return res.data;
  }

  // 6. Prompts
  public static async getPrompts(module?: string): Promise<AiPromptTemplateRecord[]> {
    const res = await apiClient<{ success: boolean; data: AiPromptTemplateRecord[] }>(
      `/api/v1/erp/ai/prompts${module ? `?module=${module}` : ''}`
    );
    return res.data;
  }

  public static async upsertPrompt(data: any): Promise<AiPromptTemplateRecord> {
    const res = await apiClient<{ success: boolean; data: AiPromptTemplateRecord }>('/api/v1/erp/ai/prompts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data;
  }

  // 7. Documents
  public static async getDocumentJobs(): Promise<AiDocumentJobRecord[]> {
    const res = await apiClient<{ success: boolean; data: AiDocumentJobRecord[] }>('/api/v1/erp/ai/documents');
    return res.data;
  }

  public static async createDocumentJob(data: any): Promise<AiDocumentJobRecord> {
    const res = await apiClient<{ success: boolean; data: AiDocumentJobRecord }>('/api/v1/erp/ai/documents', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data;
  }

  public static async reviewDocumentJob(
    id: string,
    action: 'ACCEPTED' | 'REJECTED',
    userEditedPayload?: Record<string, any>,
    reviewNotes?: string
  ): Promise<AiDocumentJobRecord> {
    const res = await apiClient<{ success: boolean; data: AiDocumentJobRecord }>(`/api/v1/erp/ai/documents/${id}/review`, {
      method: 'PUT',
      body: JSON.stringify({ action, userEditedPayload, reviewNotes }),
    });
    return res.data;
  }

  // 8. Knowledge
  public static async getKnowledgeDocs(category?: string): Promise<AiKnowledgeDocRecord[]> {
    const res = await apiClient<{ success: boolean; data: AiKnowledgeDocRecord[] }>(
      `/api/v1/erp/ai/knowledge${category ? `?category=${category}` : ''}`
    );
    return res.data;
  }

  public static async createKnowledgeDoc(data: any): Promise<AiKnowledgeDocRecord> {
    const res = await apiClient<{ success: boolean; data: AiKnowledgeDocRecord }>('/api/v1/erp/ai/knowledge', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data;
  }

  // 9. Settings
  public static async getSettings(): Promise<AiSettingsData> {
    const res = await apiClient<{ success: boolean; data: AiSettingsData }>('/api/v1/erp/ai/settings');
    return res.data;
  }

  public static async updateSettings(data: any): Promise<AiSettingsData> {
    const res = await apiClient<{ success: boolean; data: AiSettingsData }>('/api/v1/erp/ai/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return res.data;
  }
}
