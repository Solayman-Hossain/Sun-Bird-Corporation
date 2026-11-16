import { Types } from 'mongoose';
import { ApprovalRequestModel } from '../models/ApprovalRequest';
import { SupplierModel } from '../models/Supplier';
import { SupplierQuotationModel } from '../models/SupplierQuotation';
import {
  NotFoundError,
  ValidationError,
} from '../errors/AppError';
import logger from '../config/logger';

// Dynamic imports for new models
let PurchaseRequisitionModel: any;
let GoodsReceiveNoteModel: any;
let PurchaseInvoiceModel: any;
let SupplierPaymentModel: any;
let PurchaseReturnModel: any;
let PurchaseOrderModel: any;

async function loadModels() {
  const loads = [
    import('../models/PurchaseRequisition.js').then((m) => { PurchaseRequisitionModel = m.PurchaseRequisitionModel; }).catch(() => {}),
    import('../models/GoodsReceiveNote.js').then((m) => { GoodsReceiveNoteModel = m.GoodsReceiveNoteModel; }).catch(() => {}),
    import('../models/PurchaseInvoice.js').then((m) => { PurchaseInvoiceModel = m.PurchaseInvoiceModel; }).catch(() => {}),
    import('../models/SupplierPayment.js').then((m) => { SupplierPaymentModel = m.SupplierPaymentModel; }).catch(() => {}),
    import('../models/PurchaseReturn.js').then((m) => { PurchaseReturnModel = m.PurchaseReturnModel; }).catch(() => {}),
    import('../models/PurchaseOrder.js').then((m) => { PurchaseOrderModel = m.PurchaseOrderModel || m.default; }).catch(() => {}),
  ];
  await Promise.all(loads);
}

export class PurchaseDashboardService {
  /**
   * Aggregate dashboard metrics from all purchase collections for an org
   */
  public static async getDashboardMetrics(
    orgId: string,
    dateFilter?: { startDate?: string; endDate?: string }
  ) {
    if (!Types.ObjectId.isValid(orgId)) throw new ValidationError('Invalid orgId');
    await loadModels();

    const orgObjId = new Types.ObjectId(orgId);
    const today = new Date();

    // Date range for filtering
    const dateRange: Record<string, any> = {};
    if (dateFilter?.startDate) dateRange.$gte = new Date(dateFilter.startDate);
    if (dateFilter?.endDate) dateRange.$lte = new Date(dateFilter.endDate);
    const hasDateFilter = Object.keys(dateRange).length > 0;

    // 12-month window for trend
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
    twelveMonthsAgo.setDate(1);
    twelveMonthsAgo.setHours(0, 0, 0, 0);

    const [
      supplierStats,
      requisitionStats,
      poStats,
      grnCount,
      invoiceStats,
      paymentCount,
      returnStats,
      pendingApprovals,
      pendingQuotations,
      monthlyTrend,
      topProducts,
      supplierWise,
    ] = await Promise.all([
      // Supplier stats
      SupplierModel.aggregate([
        { $match: { organizationId: orgObjId } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            active: { $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] } },
            inactive: { $sum: { $cond: [{ $eq: ['$isActive', false] }, 1, 0] } },
          },
        },
      ]),

      // Requisition stats
      PurchaseRequisitionModel
        ? PurchaseRequisitionModel.aggregate([
            { $match: { organizationId: orgObjId } },
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                pending: {
                  $sum: { $cond: [{ $in: ['$status', ['DRAFT', 'SUBMITTED', 'PENDING_APPROVAL']] }, 1, 0] },
                },
              },
            },
          ])
        : Promise.resolve([]),

      // PO stats
      PurchaseOrderModel
        ? PurchaseOrderModel.aggregate([
            { $match: { organizationId: orgObjId } },
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                open: { $sum: { $cond: [{ $eq: ['$status', 'APPROVED'] }, 1, 0] } },
                partiallyReceived: { $sum: { $cond: [{ $eq: ['$status', 'PARTIALLY_RECEIVED'] }, 1, 0] } },
                completed: { $sum: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, 1, 0] } },
              },
            },
          ])
        : Promise.resolve([]),

      // GRN count
      GoodsReceiveNoteModel
        ? GoodsReceiveNoteModel.countDocuments({ organizationId: orgObjId })
        : Promise.resolve(0),

      // Invoice stats (pending, total value, outstanding, overdue)
      PurchaseInvoiceModel
        ? PurchaseInvoiceModel.aggregate([
            { $match: { organizationId: orgObjId } },
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                pending: {
                  $sum: { $cond: [{ $in: ['$status', ['DRAFT', 'SUBMITTED']] }, 1, 0] },
                },
                totalPurchaseValue: {
                  $sum: { $cond: [{ $eq: ['$status', 'POSTED'] }, '$grandTotal', 0] },
                },
                outstandingPayables: {
                  $sum: {
                    $cond: [{ $not: [{ $in: ['$status', ['PAID', 'CANCELLED']] }] }, '$outstandingAmount', 0],
                  },
                },
                overduePayables: {
                  $sum: {
                    $cond: [
                      {
                        $and: [
                          { $lt: ['$dueDate', today] },
                          { $not: [{ $in: ['$status', ['PAID', 'CANCELLED']] }] },
                        ],
                      },
                      '$outstandingAmount',
                      0,
                    ],
                  },
                },
              },
            },
          ])
        : Promise.resolve([]),

      // Payment count
      SupplierPaymentModel
        ? SupplierPaymentModel.countDocuments({ organizationId: orgObjId })
        : Promise.resolve(0),

      // Return stats
      PurchaseReturnModel
        ? PurchaseReturnModel.aggregate([
            { $match: { organizationId: orgObjId } },
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                totalReturnValue: { $sum: '$totalReturnValue' },
              },
            },
          ])
        : Promise.resolve([]),

      // Pending approvals for PURCHASE module
      ApprovalRequestModel.countDocuments({
        $or: [{ organizationId: orgObjId }, { organizationId: null }],
        module: 'PURCHASE',
        currentStatus: { $in: ['PENDING', 'UNDER_REVIEW', 'PARTIALLY_APPROVED'] },
      }),

      // Pending quotations
      SupplierQuotationModel.countDocuments({
        organizationId: orgObjId,
        status: { $in: ['DRAFT', 'SENT', 'RECEIVED'] },
      }),

      // Monthly purchase trend (last 12 months)
      PurchaseInvoiceModel
        ? PurchaseInvoiceModel.aggregate([
            {
              $match: {
                organizationId: orgObjId,
                status: 'POSTED',
                invoiceDate: { $gte: twelveMonthsAgo },
              },
            },
            {
              $group: {
                _id: {
                  year: { $year: '$invoiceDate' },
                  month: { $month: '$invoiceDate' },
                },
                totalValue: { $sum: '$grandTotal' },
                count: { $sum: 1 },
              },
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } },
            {
              $project: {
                _id: 0,
                month: {
                  $concat: [
                    { $toString: '$_id.year' },
                    '-',
                    {
                      $cond: [
                        { $lt: ['$_id.month', 10] },
                        { $concat: ['0', { $toString: '$_id.month' }] },
                        { $toString: '$_id.month' },
                      ],
                    },
                  ],
                },
                totalValue: 1,
                count: 1,
              },
            },
          ])
        : Promise.resolve([]),

      // Top 10 purchased products (by quantity from GRN items)
      GoodsReceiveNoteModel
        ? GoodsReceiveNoteModel.aggregate([
            { $match: { organizationId: orgObjId, status: 'POSTED' } },
            { $unwind: '$items' },
            {
              $group: {
                _id: '$items.sku',
                productName: { $first: '$items.productName' },
                totalQty: { $sum: '$items.acceptedQty' },
                totalValue: { $sum: '$items.lineTotal' },
              },
            },
            { $sort: { totalQty: -1 } },
            { $limit: 10 },
            {
              $project: {
                sku: '$_id',
                productName: 1,
                totalQty: 1,
                totalValue: 1,
                _id: 0,
              },
            },
          ])
        : Promise.resolve([]),

      // Supplier-wise summary: top 10 by purchase value
      PurchaseInvoiceModel
        ? PurchaseInvoiceModel.aggregate([
            { $match: { organizationId: orgObjId, status: 'POSTED' } },
            {
              $group: {
                _id: '$supplierId',
                totalPurchaseValue: { $sum: '$grandTotal' },
                invoiceCount: { $sum: 1 },
                outstandingAmount: { $sum: '$outstandingAmount' },
              },
            },
            { $sort: { totalPurchaseValue: -1 } },
            { $limit: 10 },
            {
              $lookup: {
                from: 'suppliers',
                localField: '_id',
                foreignField: '_id',
                as: 'supplier',
              },
            },
            { $unwind: { path: '$supplier', preserveNullAndEmptyArrays: true } },
            {
              $project: {
                supplierId: '$_id',
                supplierName: { $ifNull: ['$supplier.companyName', 'Unknown'] },
                supplierCode: '$supplier.supplierCode',
                totalPurchaseValue: 1,
                invoiceCount: 1,
                outstandingAmount: 1,
                _id: 0,
              },
            },
          ])
        : Promise.resolve([]),
    ]);

    const sup = supplierStats[0] || { total: 0, active: 0, inactive: 0 };
    const req = requisitionStats[0] || { total: 0, pending: 0 };
    const po = poStats[0] || { total: 0, open: 0, partiallyReceived: 0, completed: 0 };
    const inv = invoiceStats[0] || {
      total: 0,
      pending: 0,
      totalPurchaseValue: 0,
      outstandingPayables: 0,
      overduePayables: 0,
    };
    const ret = returnStats[0] || { total: 0, totalReturnValue: 0 };

    return {
      // Suppliers
      totalSuppliers: sup.total,
      activeSuppliers: sup.active,
      inactiveSuppliers: sup.inactive,

      // Requisitions
      totalRequisitions: req.total,
      pendingRequisitions: req.pending,

      // Quotations & Approvals
      pendingQuotations,
      pendingApprovals,

      // Purchase Orders
      totalPOs: po.total,
      openPOs: po.open,
      partiallyReceivedPOs: po.partiallyReceived,
      completedPOs: po.completed,

      // GRNs
      totalGRNs: grnCount,

      // Invoices
      totalInvoices: inv.total,
      pendingInvoices: inv.pending,
      totalPurchaseValue: inv.totalPurchaseValue,
      outstandingPayables: inv.outstandingPayables,
      overduePayables: inv.overduePayables,

      // Payments
      totalPayments: paymentCount,

      // Returns
      totalReturns: ret.total,
      totalReturnValue: ret.totalReturnValue,

      // Trends & analytics
      monthlyPurchaseTrend: monthlyTrend,
      topPurchasedProducts: topProducts,
      supplierWiseSummary: supplierWise,
    };
  }
}
