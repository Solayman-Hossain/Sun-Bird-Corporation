import { Router } from 'express';
import { SupportController } from '../../controllers/SupportController';
import { authGuard } from '../../middlewares/authGuard';
import { hasPermission } from '../../middlewares/rbacGuard';
import { validateRequest } from '../../middlewares/validateRequest';
import {
  createTicketSchema,
  addTicketMessageSchema,
  assignTicketSchema,
  escalateTicketSchema,
  resolveTicketSchema,
  createRmaSchema,
  approveRmaSchema,
  updateShippingSchema,
  createInspectionSchema,
  registerWarrantySchema,
  createWarrantyClaimSchema,
  createRepairJobCardSchema,
  updateRepairJobCardSchema,
  submitCustomerFeedbackSchema,
  updateSupportSettingsSchema,
  aiQuerySchema,
} from '../../validators/support.validator';

const router = Router();

// ─────────────────────────────────────────────────────────────
// 1. DASHBOARD & MIS ANALYTICS
// ─────────────────────────────────────────────────────────────
router.get('/dashboard', authGuard, hasPermission('support', 'VIEW'), SupportController.getDashboard);
router.get('/analytics/mis', authGuard, hasPermission('support', 'VIEW'), SupportController.getMisAnalytics);

// ─────────────────────────────────────────────────────────────
// 2. TICKETS & COMPLAINTS
// ─────────────────────────────────────────────────────────────
router.get('/tickets', authGuard, hasPermission('support', 'VIEW'), SupportController.getTickets);
router.post(
  '/tickets',
  authGuard,
  hasPermission('support', 'CREATE'),
  validateRequest({ body: createTicketSchema }),
  SupportController.createTicket
);
router.get('/tickets/:id', authGuard, hasPermission('support', 'READ'), SupportController.getTicketById);
router.post(
  '/tickets/:id/assign',
  authGuard,
  hasPermission('support', 'ASSIGN'),
  validateRequest({ body: assignTicketSchema }),
  SupportController.assignTicket
);
router.post(
  '/tickets/:id/escalate',
  authGuard,
  hasPermission('support', 'ESCALATE'),
  validateRequest({ body: escalateTicketSchema }),
  SupportController.escalateTicket
);
router.post(
  '/tickets/:id/messages',
  authGuard,
  hasPermission('support', 'UPDATE'),
  validateRequest({ body: addTicketMessageSchema }),
  SupportController.addTicketMessage
);
router.post(
  '/tickets/:id/resolve',
  authGuard,
  hasPermission('support', 'RESOLVE'),
  validateRequest({ body: resolveTicketSchema }),
  SupportController.resolveTicket
);

// ─────────────────────────────────────────────────────────────
// 3. RMA & RETURN MANAGEMENT
// ─────────────────────────────────────────────────────────────
router.get('/rmas', authGuard, hasPermission('support', 'VIEW'), SupportController.getRmas);
router.post(
  '/rmas',
  authGuard,
  hasPermission('support', 'CREATE'),
  validateRequest({ body: createRmaSchema }),
  SupportController.createRma
);
router.get('/rmas/:id', authGuard, hasPermission('support', 'READ'), SupportController.getRmaById);
router.post(
  '/rmas/:id/approve',
  authGuard,
  hasPermission('support', 'RMA_APPROVE'),
  validateRequest({ body: approveRmaSchema }),
  SupportController.approveOrRejectRma
);
router.put(
  '/rmas/:id/shipping',
  authGuard,
  hasPermission('support', 'UPDATE'),
  validateRequest({ body: updateShippingSchema }),
  SupportController.updateRmaShipping
);
router.post(
  '/rmas/:id/inspections',
  authGuard,
  hasPermission('support', 'INSPECT'),
  validateRequest({ body: createInspectionSchema }),
  SupportController.createRmaInspection
);
router.post('/rmas/:id/refund', authGuard, hasPermission('support', 'REFUND_APPROVE'), SupportController.processRmaRefund);
router.post('/rmas/:id/replacement', authGuard, hasPermission('support', 'RESOLVE'), SupportController.completeRmaReplacement);

// ─────────────────────────────────────────────────────────────
// 4. WARRANTY & SERVICE CENTER
// ─────────────────────────────────────────────────────────────
router.get('/warranties', authGuard, hasPermission('support', 'VIEW'), SupportController.getWarranties);
router.post(
  '/warranties',
  authGuard,
  hasPermission('support', 'WARRANTY_MANAGE'),
  validateRequest({ body: registerWarrantySchema }),
  SupportController.registerWarranty
);
router.get('/warranties/expiring', authGuard, hasPermission('support', 'VIEW'), SupportController.getExpiringWarranties);
router.get('/warranties/verify/:serialNumber', authGuard, hasPermission('support', 'VIEW'), SupportController.verifyWarranty);

router.get('/claims', authGuard, hasPermission('support', 'VIEW'), SupportController.getWarrantyClaims);
router.post(
  '/claims',
  authGuard,
  hasPermission('support', 'WARRANTY_MANAGE'),
  validateRequest({ body: createWarrantyClaimSchema }),
  SupportController.createWarrantyClaim
);

router.get('/repairs', authGuard, hasPermission('support', 'VIEW'), SupportController.getRepairJobCards);
router.post(
  '/repairs',
  authGuard,
  hasPermission('support', 'SERVICE_JOB'),
  validateRequest({ body: createRepairJobCardSchema }),
  SupportController.createRepairJobCard
);
router.put(
  '/repairs/:id',
  authGuard,
  hasPermission('support', 'SERVICE_JOB'),
  validateRequest({ body: updateRepairJobCardSchema }),
  SupportController.updateRepairJobCard
);

// ─────────────────────────────────────────────────────────────
// 5. AI CO-PILOT
// ─────────────────────────────────────────────────────────────
router.post('/ai/classify-complaint', authGuard, hasPermission('support', 'AI_USE'), SupportController.classifyComplaintAi);
router.post('/ai/draft-reply', authGuard, hasPermission('support', 'AI_USE'), SupportController.draftAiReply);
router.post('/ai/troubleshooting', authGuard, hasPermission('support', 'AI_USE'), SupportController.getTroubleshootingAi);
router.post(
  '/ai/assistant',
  authGuard,
  hasPermission('support', 'AI_USE'),
  validateRequest({ body: aiQuerySchema }),
  SupportController.askAiAssistant
);

// ─────────────────────────────────────────────────────────────
// 6. FEEDBACK, KB, SETTINGS & AUDIT LOGS
// ─────────────────────────────────────────────────────────────
router.get('/feedback', authGuard, hasPermission('support', 'VIEW'), SupportController.getFeedbacks);
router.post('/feedback', authGuard, validateRequest({ body: submitCustomerFeedbackSchema }), SupportController.submitCustomerFeedback);

router.get('/knowledge-base', authGuard, hasPermission('support', 'VIEW'), SupportController.getKnowledgeBase);
router.post('/knowledge-base', authGuard, hasPermission('support', 'UPDATE'), SupportController.createKnowledgeBaseArticle);

router.get('/settings', authGuard, hasPermission('support', 'VIEW'), SupportController.getSettings);
router.put(
  '/settings',
  authGuard,
  hasPermission('support', 'MANAGE_SETTINGS'),
  validateRequest({ body: updateSupportSettingsSchema }),
  SupportController.updateSettings
);

router.get('/audit-logs', authGuard, hasPermission('support', 'VIEW'), SupportController.getAuditLogs);

export default router;
