import { Router } from 'express';
import { ApprovalController } from '../../controllers/ApprovalController';
import { ApprovalRequestController } from '../../controllers/ApprovalRequestController';
import { authGuard } from '../../middlewares/authGuard';
import { hasPermission } from '../../middlewares/rbacGuard';

const router = Router();

/**
 * @route   GET /api/v1/erp/approvals/dashboard
 * @desc    Get dashboard metrics for approval & audit
 * @access  Bearer JWT (approvals:READ or approvals:VIEW)
 */
router.get('/dashboard', authGuard, ApprovalController.getDashboard);

/**
 * @route   GET /api/v1/erp/approvals/pending
 * @desc    Checker queue: Requests awaiting approval by current user
 * @access  Bearer JWT
 */
router.get('/pending', authGuard, ApprovalController.getMyPendingApprovals);

/**
 * @route   GET /api/v1/erp/approvals/submitted
 * @desc    Maker queue: Requests submitted by current user
 * @access  Bearer JWT
 */
router.get('/submitted', authGuard, ApprovalController.getMySubmittedRequests);

/**
 * @route   POST /api/v1/erp/approvals/check-overdue
 * @desc    Overdue SLA check and escalation trigger
 * @access  Bearer JWT
 */
router.post('/check-overdue', authGuard, ApprovalController.checkOverdueEscalations);

/**
 * @route   GET /api/v1/erp/approvals
 * @desc    List all approval requests with filters
 * @access  Bearer JWT
 */
router.get('/', authGuard, ApprovalController.listRequests);

/**
 * @route   POST /api/v1/erp/approvals
 * @desc    Submit new approval request
 * @access  Bearer JWT
 */
router.post('/', authGuard, ApprovalController.createRequest);

/**
 * @route   GET /api/v1/erp/approvals/:id
 * @desc    Get request details by ID
 * @access  Bearer JWT
 */
router.get('/:id', authGuard, ApprovalController.getRequestById);

/**
 * @route   POST /api/v1/erp/approvals/:id/approve
 * @desc    Checker approves request
 * @access  Bearer JWT
 */
router.post('/:id/approve', authGuard, ApprovalController.approveRequest);

/**
 * @route   POST /api/v1/erp/approvals/:id/reject
 * @desc    Checker rejects request
 * @access  Bearer JWT
 */
router.post('/:id/reject', authGuard, ApprovalController.rejectRequest);

/**
 * @route   POST /api/v1/erp/approvals/:id/return
 * @desc    Checker returns request for correction
 * @access  Bearer JWT
 */
router.post('/:id/return', authGuard, ApprovalController.returnRequest);

/**
 * @route   POST /api/v1/erp/approvals/:id/request-information
 * @desc    Checker requests more information
 * @access  Bearer JWT
 */
router.post('/:id/request-information', authGuard, ApprovalController.requestInformation);

/**
 * @route   POST /api/v1/erp/approvals/:id/cancel
 * @desc    Maker cancels request
 * @access  Bearer JWT
 */
router.post('/:id/cancel', authGuard, ApprovalController.cancelRequest);

/**
 * @route   PUT /api/v1/erp/approvals/:id/action
 * @desc    Backward-compatible checker action endpoint
 * @access  Bearer JWT
 */
router.put('/:id/action', authGuard, ApprovalRequestController.actionRequest);

export default router;
