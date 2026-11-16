import { Router } from 'express';
import { ApprovalWorkflowController } from '../../controllers/ApprovalWorkflowController';
import { authGuard } from '../../middlewares/authGuard';

const router = Router();

/**
 * @route   GET /api/v1/erp/approval-workflows/delegations
 */
router.get('/delegations', authGuard, ApprovalWorkflowController.listDelegations);

/**
 * @route   POST /api/v1/erp/approval-workflows/delegations
 */
router.post('/delegations', authGuard, ApprovalWorkflowController.createDelegation);

/**
 * @route   DELETE /api/v1/erp/approval-workflows/delegations/:id
 */
router.delete('/delegations/:id', authGuard, ApprovalWorkflowController.revokeDelegation);

/**
 * @route   POST /api/v1/erp/approval-workflows/seed
 */
router.post('/seed', authGuard, ApprovalWorkflowController.seedWorkflows);

/**
 * @route   GET /api/v1/erp/approval-workflows
 */
router.get('/', authGuard, ApprovalWorkflowController.listWorkflows);

/**
 * @route   POST /api/v1/erp/approval-workflows
 */
router.post('/', authGuard, ApprovalWorkflowController.createWorkflow);

/**
 * @route   GET /api/v1/erp/approval-workflows/:id
 */
router.get('/:id', authGuard, ApprovalWorkflowController.getWorkflowById);

/**
 * @route   PUT /api/v1/erp/approval-workflows/:id
 */
router.put('/:id', authGuard, ApprovalWorkflowController.updateWorkflow);

/**
 * @route   DELETE /api/v1/erp/approval-workflows/:id
 */
router.delete('/:id', authGuard, ApprovalWorkflowController.deleteWorkflow);

export default router;

