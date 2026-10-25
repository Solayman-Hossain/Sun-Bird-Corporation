import { Router } from 'express';
import { ProcurementController } from '../../controllers/ProcurementController';
import { authGuard } from '../../middlewares/authGuard';
import { hasPermission } from '../../middlewares/rbacGuard';
import { validateRequest } from '../../middlewares/validateRequest';
import {
  createSupplierSchema,
  updateSupplierSchema,
  linkSupplierUserSchema,
  broadcastRfqSchema,
  compileCsSchema,
  createPoFromCsSchema,
  createImportLcSchema,
  transitionLcStageSchema,
  recordCustomsAssessmentSchema,
  settleLcSchema,
  calculateDemurrageSchema,
  createLandedCostSchema,
} from '../../validators/procurement.validator';

const router = Router();

/**
 * @route   GET /api/v1/erp/procurement/suppliers
 * @desc    Lists suppliers with filters and pagination
 * @access  Bearer JWT (procurement:READ)
 */
router.get(
  '/suppliers',
  authGuard,
  hasPermission('procurement', 'READ'),
  ProcurementController.listSuppliers
);

/**
 * @route   POST /api/v1/erp/procurement/suppliers
 * @desc    Registers a new vendor/supplier
 * @access  Bearer JWT (procurement:CREATE)
 */
router.post(
  '/suppliers',
  authGuard,
  hasPermission('procurement', 'CREATE'),
  validateRequest({ body: createSupplierSchema }),
  ProcurementController.createSupplier
);

/**
 * @route   GET /api/v1/erp/procurement/suppliers/:id
 * @desc    Retrieves a supplier by ObjectId
 * @access  Bearer JWT (procurement:READ)
 */
router.get(
  '/suppliers/:id',
  authGuard,
  hasPermission('procurement', 'READ'),
  ProcurementController.getSupplierById
);

/**
 * @route   PUT /api/v1/erp/procurement/suppliers/:id
 * @desc    Updates supplier details or banking credentials
 * @access  Bearer JWT (procurement:UPDATE)
 */
router.put(
  '/suppliers/:id',
  authGuard,
  hasPermission('procurement', 'UPDATE'),
  validateRequest({ body: updateSupplierSchema }),
  ProcurementController.updateSupplier
);

/**
 * @route   POST /api/v1/erp/procurement/suppliers/:id/link-user
 * @desc    Links an authenticated portal user to a supplier profile
 * @access  Bearer JWT (procurement:UPDATE)
 */
router.post(
  '/suppliers/:id/link-user',
  authGuard,
  hasPermission('procurement', 'UPDATE'),
  validateRequest({ body: linkSupplierUserSchema }),
  ProcurementController.linkUserToSupplier
);

/**
 * @route   POST /api/v1/erp/procurement/rfqs
 * @desc    Broadcasts an RFQ tender for bidding
 * @access  Bearer JWT (procurement:CREATE)
 */
router.post(
  '/rfqs',
  authGuard,
  hasPermission('procurement', 'CREATE'),
  validateRequest({ body: broadcastRfqSchema }),
  ProcurementController.broadcastRfq
);

/**
 * @route   GET /api/v1/erp/procurement/rfqs
 * @desc    Lists open RFQ tenders
 * @access  Bearer JWT (procurement:READ)
 */
router.get(
  '/rfqs',
  authGuard,
  hasPermission('procurement', 'READ'),
  ProcurementController.listRfqs
);

/**
 * @route   GET /api/v1/erp/procurement/quotations
 * @desc    Lists all bid quotations
 * @access  Bearer JWT (procurement:READ)
 */
router.get(
  '/quotations',
  authGuard,
  hasPermission('procurement', 'READ'),
  ProcurementController.listQuotations
);

/**
 * @route   POST /api/v1/erp/procurement/comparative-statements
 * @desc    Compiles submitted bids for an RFQ into a 100-point CS evaluation matrix with Gemini AI summary
 * @access  Bearer JWT (procurement:CREATE)
 */
router.post(
  '/comparative-statements',
  authGuard,
  hasPermission('procurement', 'CREATE'),
  validateRequest({ body: compileCsSchema }),
  ProcurementController.compileComparativeStatement
);

/**
 * @route   GET /api/v1/erp/procurement/comparative-statements
 * @desc    Lists all Comparative Statements with filtering and pagination
 * @access  Bearer JWT (procurement:READ)
 */
router.get(
  '/comparative-statements',
  authGuard,
  hasPermission('procurement', 'READ'),
  ProcurementController.listComparativeStatements
);

/**
 * @route   GET /api/v1/erp/procurement/comparative-statements/:id
 * @desc    Retrieves a Comparative Statement by ID
 * @access  Bearer JWT (procurement:READ)
 */
router.get(
  '/comparative-statements/:id',
  authGuard,
  hasPermission('procurement', 'READ'),
  ProcurementController.getComparativeStatementById
);

/**
 * @route   POST /api/v1/erp/procurement/comparative-statements/:id/generate-ai-summary
 * @desc    Regenerates Google Gemini AI procurement advisor summary
 * @access  Bearer JWT (procurement:UPDATE)
 */
router.post(
  '/comparative-statements/:id/generate-ai-summary',
  authGuard,
  hasPermission('procurement', 'UPDATE'),
  ProcurementController.generateAiSummary
);

/**
 * @route   PUT /api/v1/erp/procurement/comparative-statements/:id/finalize
 * @desc    Finalizes and locks a Comparative Statement
 * @access  Bearer JWT (procurement:APPROVE)
 */
router.put(
  '/comparative-statements/:id/finalize',
  authGuard,
  hasPermission('procurement', 'APPROVE'),
  ProcurementController.finalizeComparativeStatement
);

/**
 * @route   POST /api/v1/erp/procurement/purchase-orders/from-cs
 * @desc    Generates a Purchase Order from a finalized CS with automated Quorum Approval tier assignment
 * @access  Bearer JWT (procurement:CREATE)
 */
router.post(
  '/purchase-orders/from-cs',
  authGuard,
  hasPermission('procurement', 'CREATE'),
  validateRequest({ body: createPoFromCsSchema }),
  ProcurementController.createPoFromCs
);

/**
 * @route   GET /api/v1/erp/procurement/purchase-orders
 * @desc    Lists Purchase Orders with filtering and pagination
 * @access  Bearer JWT (procurement:READ)
 */
router.get(
  '/purchase-orders',
  authGuard,
  hasPermission('procurement', 'READ'),
  ProcurementController.listPurchaseOrders
);

/**
 * @route   GET /api/v1/erp/procurement/purchase-orders/:id
 * @desc    Retrieves a Purchase Order by ObjectId
 * @access  Bearer JWT (procurement:READ)
 */
router.get(
  '/purchase-orders/:id',
  authGuard,
  hasPermission('procurement', 'READ'),
  ProcurementController.getPurchaseOrderById
);

// ════════════════════════════════════════════════════════════════════════
// IMPORT LETTERS OF CREDIT (LC) & DEMURRAGE
// ════════════════════════════════════════════════════════════════════════

/**
 * @route   POST /api/v1/erp/procurement/lcs
 * @desc    Opens a new Import Letter of Credit (LC) with 1st-Tier opening FX rate
 * @access  Bearer JWT (procurement:CREATE)
 */
router.post(
  '/lcs',
  authGuard,
  hasPermission('procurement', 'CREATE'),
  validateRequest({ body: createImportLcSchema }),
  ProcurementController.createImportLc
);

/**
 * @route   GET /api/v1/erp/procurement/lcs
 * @desc    Lists Import LCs with filters and pagination
 * @access  Bearer JWT (procurement:READ)
 */
router.get(
  '/lcs',
  authGuard,
  hasPermission('procurement', 'READ'),
  ProcurementController.listImportLcs
);

/**
 * @route   GET /api/v1/erp/procurement/lcs/:id
 * @desc    Retrieves an Import LC by ObjectId
 * @access  Bearer JWT (procurement:READ)
 */
router.get(
  '/lcs/:id',
  authGuard,
  hasPermission('procurement', 'READ'),
  ProcurementController.getImportLcById
);

/**
 * @route   PUT /api/v1/erp/procurement/lcs/:id/stage
 * @desc    Transitions an LC through lifecycle stages
 * @access  Bearer JWT (procurement:UPDATE)
 */
router.put(
  '/lcs/:id/stage',
  authGuard,
  hasPermission('procurement', 'UPDATE'),
  validateRequest({ body: transitionLcStageSchema }),
  ProcurementController.transitionLcStage
);

/**
 * @route   PUT /api/v1/erp/procurement/lcs/:id/customs-assessment
 * @desc    Records 2nd-Tier FX Rate: Bill of Entry / Customs Assessment Rate
 * @access  Bearer JWT (procurement:UPDATE)
 */
router.put(
  '/lcs/:id/customs-assessment',
  authGuard,
  hasPermission('procurement', 'UPDATE'),
  validateRequest({ body: recordCustomsAssessmentSchema }),
  ProcurementController.recordCustomsAssessment
);

/**
 * @route   PUT /api/v1/erp/procurement/lcs/:id/settle
 * @desc    Records 3rd-Tier FX Rate: Final Bank Settlement Rate and realizes FX variance
 * @access  Bearer JWT (procurement:UPDATE)
 */
router.put(
  '/lcs/:id/settle',
  authGuard,
  hasPermission('procurement', 'UPDATE'),
  validateRequest({ body: settleLcSchema }),
  ProcurementController.settleLc
);

/**
 * @route   POST /api/v1/erp/procurement/lcs/:id/calculate-demurrage
 * @desc    Calculates port dwelling demurrage penalties based on free days
 * @access  Bearer JWT (procurement:READ)
 */
router.post(
  '/lcs/:id/calculate-demurrage',
  authGuard,
  hasPermission('procurement', 'READ'),
  validateRequest({ body: calculateDemurrageSchema }),
  ProcurementController.calculateDemurrage
);

// ════════════════════════════════════════════════════════════════════════
// LANDED COST BREAKDOWN & INVENTORY WAC CAPITALIZATION
// ════════════════════════════════════════════════════════════════════════

/**
 * @route   POST /api/v1/erp/procurement/landed-costs
 * @desc    Creates or updates landed cost breakdown sheet and allocates costs across SKUs
 * @access  Bearer JWT (procurement:CREATE)
 */
router.post(
  '/landed-costs',
  authGuard,
  hasPermission('procurement', 'CREATE'),
  validateRequest({ body: createLandedCostSchema }),
  ProcurementController.createOrUpdateLandedCost
);

/**
 * @route   GET /api/v1/erp/procurement/landed-costs/:lcId
 * @desc    Retrieves landed cost sheet by LC ObjectId or LC number
 * @access  Bearer JWT (procurement:READ)
 */
router.get(
  '/landed-costs/:lcId',
  authGuard,
  hasPermission('procurement', 'READ'),
  ProcurementController.getLandedCostByLcId
);

/**
 * @route   PUT /api/v1/erp/procurement/landed-costs/:lcId/finalize
 * @desc    Finalizes landed cost, capitalizes batch WAC unit costs, records GRN, and posts balanced Journal Entry
 * @access  Bearer JWT (procurement:APPROVE)
 */
router.put(
  '/landed-costs/:lcId/finalize',
  authGuard,
  hasPermission('procurement', 'APPROVE'),
  ProcurementController.finalizeLandedCost
);

export default router;



