import { Router } from 'express';
import { AiController } from '../../controllers/AiController';
import { authGuard } from '../../middlewares/authGuard';
import { hasPermission } from '../../middlewares/rbacGuard';
import { validateRequest } from '../../middlewares/validateRequest';
import {
  aiChatQuerySchema,
  upsertProviderSchema,
  upsertModelSchema,
  toggleFeatureSchema,
  upsertPromptSchema,
  createDocumentJobSchema,
  reviewDocumentJobSchema,
  createKnowledgeDocSchema,
  updateAiSettingsSchema,
} from '../../validators/ai.validator';

const router = Router();

// ─────────────────────────────────────────────────────────────
// 1. AI CONTROL CENTER & ANALYTICS
// ─────────────────────────────────────────────────────────────
router.get('/control-center', authGuard, hasPermission('ai', 'CONTROL_CENTER'), AiController.getControlCenter);

// ─────────────────────────────────────────────────────────────
// 2. CONVERSATIONAL ASSISTANT & CHAT
// ─────────────────────────────────────────────────────────────
router.post(
  '/chat',
  authGuard,
  hasPermission('ai', 'CHAT'),
  validateRequest({ body: aiChatQuerySchema }),
  AiController.chat
);
router.get('/conversations', authGuard, hasPermission('ai', 'CHAT'), AiController.getConversations);
router.get('/conversations/:id/messages', authGuard, hasPermission('ai', 'CHAT'), AiController.getMessages);

// ─────────────────────────────────────────────────────────────
// 3. PROVIDER & MODEL MANAGEMENT
// ─────────────────────────────────────────────────────────────
router.get('/providers', authGuard, hasPermission('ai', 'MANAGE_PROVIDERS'), AiController.getProviders);
router.post(
  '/providers',
  authGuard,
  hasPermission('ai', 'MANAGE_PROVIDERS'),
  validateRequest({ body: upsertProviderSchema }),
  AiController.upsertProvider
);

router.get('/models', authGuard, hasPermission('ai', 'MANAGE_MODELS'), AiController.getModels);
router.post(
  '/models',
  authGuard,
  hasPermission('ai', 'MANAGE_MODELS'),
  validateRequest({ body: upsertModelSchema }),
  AiController.upsertModel
);

// ─────────────────────────────────────────────────────────────
// 4. FEATURE MANAGEMENT
// ─────────────────────────────────────────────────────────────
router.get('/features', authGuard, hasPermission('ai', 'MANAGE_FEATURES'), AiController.getFeatures);
router.post(
  '/features/toggle',
  authGuard,
  hasPermission('ai', 'MANAGE_FEATURES'),
  validateRequest({ body: toggleFeatureSchema }),
  AiController.toggleFeature
);

// ─────────────────────────────────────────────────────────────
// 5. PROMPT & TEMPLATE LIBRARY
// ─────────────────────────────────────────────────────────────
router.get('/prompts', authGuard, hasPermission('ai', 'MANAGE_PROMPTS'), AiController.getPrompts);
router.post(
  '/prompts',
  authGuard,
  hasPermission('ai', 'MANAGE_PROMPTS'),
  validateRequest({ body: upsertPromptSchema }),
  AiController.upsertPrompt
);

// ─────────────────────────────────────────────────────────────
// 6. DOCUMENT INTELLIGENCE & OCR
// ─────────────────────────────────────────────────────────────
router.get('/documents', authGuard, hasPermission('ai', 'DOCUMENT_INTELLIGENCE'), AiController.getDocumentJobs);
router.post(
  '/documents',
  authGuard,
  hasPermission('ai', 'DOCUMENT_INTELLIGENCE'),
  validateRequest({ body: createDocumentJobSchema }),
  AiController.createDocumentJob
);
router.put(
  '/documents/:id/review',
  authGuard,
  hasPermission('ai', 'DOCUMENT_INTELLIGENCE'),
  validateRequest({ body: reviewDocumentJobSchema }),
  AiController.reviewDocumentJob
);

// ─────────────────────────────────────────────────────────────
// 7. KNOWLEDGE BASE
// ─────────────────────────────────────────────────────────────
router.get('/knowledge', authGuard, hasPermission('ai', 'MANAGE_KNOWLEDGE'), AiController.getKnowledgeDocs);
router.post(
  '/knowledge',
  authGuard,
  hasPermission('ai', 'MANAGE_KNOWLEDGE'),
  validateRequest({ body: createKnowledgeDocSchema }),
  AiController.createKnowledgeDoc
);

// ─────────────────────────────────────────────────────────────
// 8. AI SETTINGS
// ─────────────────────────────────────────────────────────────
router.get('/settings', authGuard, hasPermission('ai', 'MANAGE_SETTINGS'), AiController.getSettings);
router.put(
  '/settings',
  authGuard,
  hasPermission('ai', 'MANAGE_SETTINGS'),
  validateRequest({ body: updateAiSettingsSchema }),
  AiController.updateSettings
);

export default router;
