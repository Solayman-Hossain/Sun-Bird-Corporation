import { z } from 'zod';

export const aiChatQuerySchema = z.object({
  query: z.string().trim().min(1, 'Query cannot be empty'),
  conversationId: z.string().trim().optional(),
  moduleContext: z.string().trim().optional(),
});

export const upsertProviderSchema = z.object({
  providerName: z.enum(['GEMINI', 'OPENAI', 'ANTHROPIC', 'LOCAL_MOCK']),
  displayName: z.string().trim().min(2),
  apiKey: z.string().trim().optional(),
  baseUrl: z.string().trim().optional(),
  isEnabled: z.boolean().optional(),
  isDefault: z.boolean().optional(),
  timeoutMs: z.number().min(1000).optional(),
  maxRetries: z.number().min(0).max(5).optional(),
});

export const upsertModelSchema = z.object({
  provider: z.enum(['GEMINI', 'OPENAI', 'ANTHROPIC', 'LOCAL_MOCK']),
  modelIdentifier: z.string().trim().min(2),
  displayName: z.string().trim().min(2),
  contextWindowTokens: z.number().min(1000).optional(),
  maxOutputTokens: z.number().min(100).optional(),
  defaultTemperature: z.number().min(0).max(1).optional(),
  isEnabled: z.boolean().optional(),
  isDefault: z.boolean().optional(),
  assignedFeatures: z.array(z.string()).optional(),
});

export const toggleFeatureSchema = z.object({
  featureCode: z.string().trim().min(2),
  isGloballyEnabled: z.boolean(),
});

export const upsertPromptSchema = z.object({
  templateCode: z.string().trim().min(2),
  name: z.string().trim().min(2),
  category: z.string().trim().min(2),
  module: z.string().trim().min(2),
  systemPrompt: z.string().trim().min(5),
  userPromptTemplate: z.string().trim().min(5),
  requiredVariables: z.array(z.string()).optional(),
});

export const createDocumentJobSchema = z.object({
  documentType: z.enum([
    'SUPPLIER_INVOICE',
    'COMMERCIAL_INVOICE',
    'PACKING_LIST',
    'BILL_OF_LADING',
    'AIRWAY_BILL',
    'PURCHASE_ORDER',
    'DELIVERY_CHALLAN',
    'CUSTOMS_DECLARATION',
    'CERTIFICATE_OF_ANALYSIS',
    'WARRANTY_CARD',
    'OTHER',
  ]),
  fileUrl: z.string().trim().min(1),
  fileName: z.string().trim().min(1),
  fileSize: z.number().optional(),
  mimeType: z.string().optional(),
});

export const reviewDocumentJobSchema = z.object({
  action: z.enum(['ACCEPTED', 'REJECTED']),
  userEditedPayload: z.record(z.string(), z.any()).optional(),
  reviewNotes: z.string().trim().optional(),
});

export const createKnowledgeDocSchema = z.object({
  title: z.string().trim().min(2),
  category: z.enum([
    'COMPANY_POLICY',
    'PRODUCT_MANUAL',
    'HR_POLICY',
    'PURCHASE_SOP',
    'IMPORT_SOP',
    'SUPPORT_GUIDELINE',
    'WARRANTY_POLICY',
    'OPERATIONAL_SOP',
  ]),
  content: z.string().trim().min(10),
  tags: z.array(z.string()).optional(),
  summary: z.string().trim().optional(),
});

export const updateAiSettingsSchema = z.object({
  isAiGloballyEnabled: z.boolean().optional(),
  defaultProvider: z.string().optional(),
  defaultModel: z.string().optional(),
  defaultLanguage: z.enum(['bn', 'en', 'auto']).optional(),
  responseStyle: z.enum(['PROFESSIONAL', 'CONCISE', 'DETAILED']).optional(),
  timeoutMs: z.number().min(5000).optional(),
  sensitiveRedactionEnabled: z.boolean().optional(),
  dailyTokenLimitPerOrg: z.number().optional(),
  monthlyBudgetBdt: z.number().optional(),
});
