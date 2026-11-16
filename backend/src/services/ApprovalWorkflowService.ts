import { Types } from 'mongoose';
import {
  ApprovalWorkflowModel,
  IApprovalWorkflow,
  IWorkflowLevel,
} from '../models/ApprovalWorkflow';
import { AuditLogService } from './AuditLogService';
import {
  NotFoundError,
  DuplicateKeyError,
  ValidationError,
} from '../errors/AppError';

function getSafeActorId(actorId?: string | Types.ObjectId): Types.ObjectId {
  if (actorId && Types.ObjectId.isValid(actorId.toString()) && actorId.toString().length === 24) {
    return new Types.ObjectId(actorId.toString());
  }
  return new Types.ObjectId('000000000000000000000001');
}

export class ApprovalWorkflowService {
  /**
   * List approval workflows with filtering and pagination
   */
  public static async listWorkflows(
    filterParams: {
      organizationId?: string;
      module?: string;
      transactionType?: string;
      isActive?: boolean;
      search?: string;
    } = {},
    page: number = 1,
    limit: number = 50
  ) {
    const query: Record<string, any> = {};

    if (filterParams.organizationId && Types.ObjectId.isValid(filterParams.organizationId)) {
      query.$or = [
        { organizationId: new Types.ObjectId(filterParams.organizationId) },
        { organizationId: null },
      ];
    }

    if (filterParams.module) {
      query.module = filterParams.module.toUpperCase().trim();
    }

    if (filterParams.transactionType) {
      query.transactionType = filterParams.transactionType.toUpperCase().trim();
    }

    if (filterParams.isActive !== undefined) {
      query.isActive = filterParams.isActive;
    }

    if (filterParams.search) {
      const searchRegex = new RegExp(filterParams.search.trim(), 'i');
      query.$or = [
        { workflowName: searchRegex },
        { workflowCode: searchRegex },
        { transactionType: searchRegex },
      ];
    }

    const safePage = Math.max(1, page);
    const safeLimit = Math.min(100, Math.max(1, limit));
    const skip = (safePage - 1) * safeLimit;

    const [workflows, total] = await Promise.all([
      ApprovalWorkflowModel.find(query)
        .populate('organizationId', 'organizationCode displayName legalName')
        .populate('approvalLevels.roleId', 'roleName slug')
        .populate('approvalLevels.approverId', 'fullName email')
        .sort({ module: 1, minAmount: 1, createdAt: -1 })
        .skip(skip)
        .limit(safeLimit)
        .lean(),
      ApprovalWorkflowModel.countDocuments(query),
    ]);

    return {
      workflows,
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit),
    };
  }

  /**
   * Get workflow by ID
   */
  public static async getWorkflowById(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundError('ApprovalWorkflow', id);
    }

    const workflow = await ApprovalWorkflowModel.findById(id)
      .populate('organizationId', 'organizationCode displayName legalName')
      .populate('approvalLevels.roleId', 'roleName slug')
      .populate('approvalLevels.approverId', 'fullName email');

    if (!workflow) {
      throw new NotFoundError('ApprovalWorkflow', id);
    }

    return workflow;
  }

  /**
   * Create a new approval workflow
   */
  public static async createWorkflow(data: any, actorId?: string) {
    const workflowCode = (data.workflowCode || `WF_${Date.now()}`).toUpperCase().trim();

    const existing = await ApprovalWorkflowModel.findOne({ workflowCode });
    if (existing) {
      throw new DuplicateKeyError('workflowCode', workflowCode);
    }

    const workflow = await ApprovalWorkflowModel.create({
      workflowName: data.workflowName.trim(),
      workflowCode,
      organizationId: data.organizationId ? new Types.ObjectId(data.organizationId) : undefined,
      module: data.module.toUpperCase().trim(),
      transactionType: data.transactionType.toUpperCase().trim(),
      minAmount: data.minAmount !== undefined ? Number(data.minAmount) : 0,
      maxAmount: data.maxAmount !== undefined ? Number(data.maxAmount) : 1000000000,
      approvalLevels: data.approvalLevels || [],
      autoEscalation: data.autoEscalation || false,
      escalateAfterHours: data.escalateAfterHours || 48,
      escalateToRoleId: data.escalateToRoleId ? new Types.ObjectId(data.escalateToRoleId) : undefined,
      effectiveDate: data.effectiveDate ? new Date(data.effectiveDate) : new Date(),
      expiryDate: data.expiryDate ? new Date(data.expiryDate) : undefined,
      isActive: data.isActive !== undefined ? data.isActive : true,
      createdBy: getSafeActorId(actorId),
    });

    await AuditLogService.logAction({
      action: 'APPROVAL_WORKFLOW_CREATE',
      actorId: getSafeActorId(actorId),
      actorRole: 'ADMIN',
      targetCollection: 'approval_workflows',
      targetId: workflow._id,
      notes: `Created approval workflow ${workflow.workflowName} (${workflow.workflowCode}) for ${workflow.module}`,
    });

    return workflow;
  }

  /**
   * Update workflow
   */
  public static async updateWorkflow(id: string, data: any, actorId?: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundError('ApprovalWorkflow', id);
    }

    const workflow = await ApprovalWorkflowModel.findById(id);
    if (!workflow) {
      throw new NotFoundError('ApprovalWorkflow', id);
    }

    if (data.workflowName) workflow.workflowName = data.workflowName.trim();
    if (data.module) workflow.module = data.module.toUpperCase().trim();
    if (data.transactionType) workflow.transactionType = data.transactionType.toUpperCase().trim();
    if (data.minAmount !== undefined) workflow.minAmount = Number(data.minAmount);
    if (data.maxAmount !== undefined) workflow.maxAmount = Number(data.maxAmount);
    if (data.approvalLevels) workflow.approvalLevels = data.approvalLevels;
    if (data.autoEscalation !== undefined) workflow.autoEscalation = data.autoEscalation;
    if (data.escalateAfterHours !== undefined) workflow.escalateAfterHours = data.escalateAfterHours;
    if (data.escalateToRoleId !== undefined) {
      workflow.escalateToRoleId = data.escalateToRoleId ? new Types.ObjectId(data.escalateToRoleId) : undefined;
    }
    if (data.isActive !== undefined) workflow.isActive = data.isActive;
    if (data.organizationId !== undefined) {
      workflow.organizationId = data.organizationId ? new Types.ObjectId(data.organizationId) : undefined;
    }

    await workflow.save();

    await AuditLogService.logAction({
      action: 'APPROVAL_WORKFLOW_UPDATE',
      actorId: getSafeActorId(actorId),
      actorRole: 'ADMIN',
      targetCollection: 'approval_workflows',
      targetId: workflow._id,
      notes: `Updated workflow ${workflow.workflowName} (${workflow.workflowCode})`,
    });

    return workflow;
  }

  /**
   * Delete workflow
   */
  public static async deleteWorkflow(id: string, actorId?: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundError('ApprovalWorkflow', id);
    }

    const workflow = await ApprovalWorkflowModel.findById(id);
    if (!workflow) {
      throw new NotFoundError('ApprovalWorkflow', id);
    }

    await ApprovalWorkflowModel.findByIdAndDelete(id);

    await AuditLogService.logAction({
      action: 'APPROVAL_WORKFLOW_DELETE',
      actorId: getSafeActorId(actorId),
      actorRole: 'ADMIN',
      targetCollection: 'approval_workflows',
      targetId: new Types.ObjectId(id),
      notes: `Deleted approval workflow ${workflow.workflowName} (${workflow.workflowCode})`,
    });

    return { deleted: true, message: `Workflow '${workflow.workflowName}' deleted successfully` };
  }

  /**
   * Matches a transaction to the most specific active workflow
   * Hierarchy:
   * 1. Exact match on organization + module + transactionType + amount range
   * 2. Global match (organizationId = null) on module + transactionType + amount range
   * 3. Fallback on module only
   */
  public static async findMatchingWorkflow(
    organizationId?: string | Types.ObjectId,
    module: string = 'PURCHASE',
    transactionType: string = 'PURCHASE_ORDER',
    amount: number = 0
  ): Promise<IApprovalWorkflow | null> {
    const mod = module.toUpperCase().trim();
    const type = transactionType.toUpperCase().trim();
    const amt = Number(amount) || 0;

    // 1. Try organization-specific workflow first
    if (organizationId && Types.ObjectId.isValid(organizationId.toString())) {
      const orgWorkflow = await ApprovalWorkflowModel.findOne({
        organizationId: new Types.ObjectId(organizationId.toString()),
        module: mod,
        transactionType: type,
        minAmount: { $lte: amt },
        maxAmount: { $gte: amt },
        isActive: true,
      }).sort({ minAmount: -1 });

      if (orgWorkflow) return orgWorkflow;
    }

    // 2. Try global workflow (organizationId is null or missing)
    const globalWorkflow = await ApprovalWorkflowModel.findOne({
      $or: [{ organizationId: null }, { organizationId: { $exists: false } }],
      module: mod,
      transactionType: type,
      minAmount: { $lte: amt },
      maxAmount: { $gte: amt },
      isActive: true,
    }).sort({ minAmount: -1 });

    if (globalWorkflow) return globalWorkflow;

    // 3. Fallback on module with broadest match
    const moduleFallback = await ApprovalWorkflowModel.findOne({
      module: mod,
      isActive: true,
    }).sort({ createdAt: -1 });

    return moduleFallback;
  }

  /**
   * Seed standard enterprise approval workflows covering all 7 business domains
   */
  public static async seedDefaultWorkflows(actorId?: string) {
    const defaultWorkflows = [
      // A. PURCHASE MANAGEMENT
      {
        workflowName: 'Standard Purchase Order Tier 1 (Up to BDT 50,000)',
        workflowCode: 'WF_PO_TIER_1',
        module: 'PURCHASE',
        transactionType: 'PURCHASE_ORDER',
        minAmount: 0,
        maxAmount: 50000,
        approvalLevels: [
          {
            levelNumber: 1,
            levelName: 'Store / Department Manager Verification',
            approverType: 'ROLE',
            roleSlug: 'store_manager',
            requiredCount: 1,
            isParallel: false,
            slaHours: 24,
          },
        ],
      },
      {
        workflowName: 'Standard Purchase Order Tier 2 (BDT 50,001 to 200,000)',
        workflowCode: 'WF_PO_TIER_2',
        module: 'PURCHASE',
        transactionType: 'PURCHASE_ORDER',
        minAmount: 50001,
        maxAmount: 200000,
        approvalLevels: [
          {
            levelNumber: 1,
            levelName: 'Purchase Manager Review',
            approverType: 'ROLE',
            roleSlug: 'purchase_manager',
            requiredCount: 1,
            isParallel: false,
            slaHours: 24,
          },
          {
            levelNumber: 2,
            levelName: 'Finance Manager Commercial Sign-off',
            approverType: 'ROLE',
            roleSlug: 'finance_manager',
            requiredCount: 1,
            isParallel: false,
            slaHours: 24,
          },
        ],
      },
      {
        workflowName: 'High-Value Purchase Order Tier 3 (Above BDT 200,000)',
        workflowCode: 'WF_PO_TIER_3',
        module: 'PURCHASE',
        transactionType: 'PURCHASE_ORDER',
        minAmount: 200001,
        maxAmount: 1000000000,
        approvalLevels: [
          {
            levelNumber: 1,
            levelName: 'Finance Manager Audit',
            approverType: 'ROLE',
            roleSlug: 'finance_manager',
            requiredCount: 1,
            isParallel: false,
            slaHours: 24,
          },
          {
            levelNumber: 2,
            levelName: 'Managing Director Final Authorization',
            approverType: 'ROLE',
            roleSlug: 'managing_director',
            requiredCount: 1,
            isParallel: false,
            slaHours: 48,
          },
        ],
      },

      // B. SALES & INVOICE
      {
        workflowName: 'Special Sales Order & Quotation Discount Approval',
        workflowCode: 'WF_SALES_DISCOUNT',
        module: 'SALES',
        transactionType: 'INVOICE_DISCOUNT',
        minAmount: 10000,
        maxAmount: 1000000000,
        approvalLevels: [
          {
            levelNumber: 1,
            levelName: 'Sales Manager Commercial Review',
            approverType: 'ROLE',
            roleSlug: 'sales_manager',
            requiredCount: 1,
            isParallel: false,
            slaHours: 12,
          },
        ],
      },

      // C. INVENTORY
      {
        workflowName: 'Stock Adjustment & Write-off Verification',
        workflowCode: 'WF_INVENTORY_ADJUST',
        module: 'INVENTORY',
        transactionType: 'STOCK_ADJUSTMENT',
        minAmount: 0,
        maxAmount: 1000000000,
        approvalLevels: [
          {
            levelNumber: 1,
            levelName: 'Inventory Officer Batch Check',
            approverType: 'ROLE',
            roleSlug: 'inventory_officer',
            requiredCount: 1,
            isParallel: false,
            slaHours: 24,
          },
          {
            levelNumber: 2,
            levelName: 'Store Manager Final Disposal Sign-off',
            approverType: 'ROLE',
            roleSlug: 'store_manager',
            requiredCount: 1,
            isParallel: false,
            slaHours: 24,
          },
        ],
      },

      // D. ACCOUNTING
      {
        workflowName: 'Payment & Expense Voucher Authorization',
        workflowCode: 'WF_ACCOUNTS_PAYMENT',
        module: 'ACCOUNTING',
        transactionType: 'PAYMENT_VOUCHER',
        minAmount: 0,
        maxAmount: 1000000000,
        approvalLevels: [
          {
            levelNumber: 1,
            levelName: 'Accounts Officer Voucher Preparation',
            approverType: 'ROLE',
            roleSlug: 'accounts_officer',
            requiredCount: 1,
            isParallel: false,
            slaHours: 12,
          },
          {
            levelNumber: 2,
            levelName: 'Finance Manager GL Disbursement Approval',
            approverType: 'ROLE',
            roleSlug: 'finance_manager',
            requiredCount: 1,
            isParallel: false,
            slaHours: 24,
          },
        ],
      },

      // E. HR & PAYROLL
      {
        workflowName: 'Monthly Payroll Run & Salary Disbursement Approval',
        workflowCode: 'WF_HRM_PAYROLL',
        module: 'HRM',
        transactionType: 'PAYROLL_APPROVAL',
        minAmount: 0,
        maxAmount: 1000000000,
        approvalLevels: [
          {
            levelNumber: 1,
            levelName: 'HR Manager Attendance & Calculation Audit',
            approverType: 'ROLE',
            roleSlug: 'hr_manager',
            requiredCount: 1,
            isParallel: false,
            slaHours: 24,
          },
          {
            levelNumber: 2,
            levelName: 'Managing Director Remittance Release',
            approverType: 'ROLE',
            roleSlug: 'managing_director',
            requiredCount: 1,
            isParallel: false,
            slaHours: 48,
          },
        ],
      },

      // F. ORGANIZATION MANAGEMENT
      {
        workflowName: 'Bank Account & Official Signatory Change Approval',
        workflowCode: 'WF_ORG_BANK_CHANGE',
        module: 'ORGANIZATION',
        transactionType: 'BANK_ACCOUNT_CHANGE',
        minAmount: 0,
        maxAmount: 1000000000,
        approvalLevels: [
          {
            levelNumber: 1,
            levelName: 'System Administrator Verification',
            approverType: 'ROLE',
            roleSlug: 'system_admin',
            requiredCount: 1,
            isParallel: false,
            slaHours: 24,
          },
          {
            levelNumber: 2,
            levelName: 'Managing Director Legal Sanction',
            approverType: 'ROLE',
            roleSlug: 'managing_director',
            requiredCount: 1,
            isParallel: false,
            slaHours: 24,
          },
        ],
      },

      // G. E-COMMERCE
      {
        workflowName: 'Customer Refund & RMA Replacement Authorization',
        workflowCode: 'WF_ECOMMERCE_REFUND',
        module: 'ECOMMERCE',
        transactionType: 'REFUND_APPROVAL',
        minAmount: 0,
        maxAmount: 1000000000,
        approvalLevels: [
          {
            levelNumber: 1,
            levelName: 'Customer Support Lead Review',
            approverType: 'ROLE',
            roleSlug: 'customer_support',
            requiredCount: 1,
            isParallel: false,
            slaHours: 12,
          },
          {
            levelNumber: 2,
            levelName: 'Finance Manager Refund Disbursement',
            approverType: 'ROLE',
            roleSlug: 'finance_manager',
            requiredCount: 1,
            isParallel: false,
            slaHours: 24,
          },
        ],
      },

      // H. PRODUCT & CATALOG MANAGEMENT
      {
        workflowName: 'Product E-Commerce Publication & Price Authorization',
        workflowCode: 'WF_PRODUCT_PUBLISH',
        module: 'PRODUCT',
        transactionType: 'PRODUCT_PUBLICATION',
        minAmount: 0,
        maxAmount: 1000000000,
        approvalLevels: [
          {
            levelNumber: 1,
            levelName: 'E-commerce Manager Content & Pricing Audit',
            approverType: 'ROLE',
            roleSlug: 'ecommerce_manager',
            requiredCount: 1,
            isParallel: false,
            slaHours: 24,
          },
          {
            levelNumber: 2,
            levelName: 'General Manager Commercial Sanction',
            approverType: 'ROLE',
            roleSlug: 'general_manager',
            requiredCount: 1,
            isParallel: false,
            slaHours: 48,
          },
        ],
      },
    ];

    const created: string[] = [];
    const existing: string[] = [];

    for (const item of defaultWorkflows) {
      const found = await ApprovalWorkflowModel.findOne({ workflowCode: item.workflowCode });
      if (!found) {
        await ApprovalWorkflowModel.create({
          ...item,
          isActive: true,
          createdBy: getSafeActorId(actorId),
        });
        created.push(item.workflowName);
      } else {
        existing.push(item.workflowName);
      }
    }

    if (created.length > 0) {
      await AuditLogService.logAction({
        action: 'APPROVAL_WORKFLOWS_SEEDED',
        actorId: getSafeActorId(actorId),
        actorRole: 'SYSTEM',
        targetCollection: 'approval_workflows',
        targetId: new Types.ObjectId('000000000000000000000001'),
        notes: `Seeded standard approval workflows. Created: ${created.length}`,
      });
    }

    return { created, existing };
  }
}

export default ApprovalWorkflowService;

