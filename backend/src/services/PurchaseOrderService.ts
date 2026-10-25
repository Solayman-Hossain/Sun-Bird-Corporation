import { Types, ClientSession } from 'mongoose';
import {
  PurchaseOrderModel,
  IPurchaseOrder,
  IPOItem,
  POStatus,
  POCurrency,
} from '../models/PurchaseOrder';
import { ComparativeStatementModel, IComparativeStatement } from '../models/ComparativeStatement';
import { ProductModel } from '../models/Product';
import { SupplierModel } from '../models/Supplier';
import { RfqModel } from '../models/Rfq';
import { WarehouseModel } from '../models/Warehouse';
import { QuorumApprovalModel, IQuorumApproval } from '../models/QuorumApproval';
import { CounterService } from './CounterService';
import {
  NotFoundError,
  ValidationError,
  DuplicateKeyError,
} from '../errors/AppError';
import logger from '../config/logger';

export interface CreatePoFromCsOptions {
  quantity?: number;
  exchangeRate?: number;
  deliveryWarehouseId?: string | Types.ObjectId;
  deliveryDeadline?: Date | string;
  taxAmount?: number;
  shippingTerms?: string;
  notes?: string;
}

export interface DetermineQuorumTierResult {
  tier: 1 | 2 | 3 | 4;
  requiredDirectors: number;
}

export class PurchaseOrderService {
  /**
   * Automatically determines the approval quorum tier based on the BDT grand total value.
   * Business Policy (PRD §4, §5.2):
   * - <= 500,000 BDT: Tier 1 (Manager approval)
   * - 500,001 - 1,000,000 BDT: Tier 2 (Officer/Checker approval)
   * - 1,000,001 - 5,000,000 BDT: Tier 3 (2 Directors Quorum)
   * - > 5,000,000 BDT: Tier 4 (3 Directors Quorum)
   */
  public static determineQuorumTier(bdtGrandTotal: number): DetermineQuorumTierResult {
    if (bdtGrandTotal <= 500000) {
      return { tier: 1, requiredDirectors: 0 };
    }
    if (bdtGrandTotal <= 1000000) {
      return { tier: 2, requiredDirectors: 0 };
    }
    if (bdtGrandTotal <= 5000000) {
      return { tier: 3, requiredDirectors: 2 };
    }
    return { tier: 4, requiredDirectors: 3 };
  }

  /**
   * Builds and generates a Purchase Order from a finalized Comparative Statement (CS).
   * Generates sequential PO code via CounterService (e.g. PO-2026-00042),
   * calculates BDT grand total with exchange rate, determines quorum approval tier,
   * enlists Quorum Approval records for Tier 3/4, and transitions CS to AWARDED.
   *
   * @param csId Comparative Statement ObjectId
   * @param winningBidId Bid identifier (bidId, supplierId, or CS bid item id)
   * @param userId Authenticated procurement officer ID issuing the PO
   * @param session Optional MongoDB ClientSession for ACID transaction
   * @param options Additional delivery, quantity, and exchange rate parameters
   */
  public static async createPoFromCs(
    csId: string | Types.ObjectId,
    winningBidId: string | Types.ObjectId,
    userId: string | Types.ObjectId,
    session?: ClientSession,
    options?: CreatePoFromCsOptions
  ): Promise<{ purchaseOrder: IPurchaseOrder; quorumApproval?: IQuorumApproval }> {
    // 1. Fetch Comparative Statement
    const cs = await ComparativeStatementModel.findById(csId).session(session || null);
    if (!cs) {
      throw new NotFoundError('ComparativeStatement', csId.toString());
    }

    // 2. Validate CS status: must be FINALIZED
    if (cs.status !== 'FINALIZED') {
      throw new ValidationError(
        `Cannot generate Purchase Order: Comparative Statement '${cs.csNumber}' is in '${cs.status}' status. It must be in 'FINALIZED' status before awarding.`
      );
    }

    // 3. Locate winning bid in CS evaluation matrix
    const bidTarget = winningBidId.toString();
    const winningBid = cs.bids.find(
      (b: any) =>
        b._id?.toString() === bidTarget ||
        b.bidId?.toString() === bidTarget ||
        b.supplierId?.toString() === bidTarget
    );

    if (!winningBid) {
      throw new NotFoundError(
        'Bid in Comparative Statement',
        `No bid matching '${winningBidId}' found in CS ${cs.csNumber}`
      );
    }

    if (!winningBid.supplierId) {
      throw new ValidationError('Winning bid is missing supplierId reference');
    }

    // 4. Resolve Product and Supplier details
    const product = await ProductModel.findById(cs.productId).session(session || null);
    if (!product) {
      throw new NotFoundError('Product', cs.productId.toString());
    }

    const supplier = await SupplierModel.findById(winningBid.supplierId).session(session || null);
    if (!supplier) {
      throw new NotFoundError('Supplier', winningBid.supplierId.toString());
    }

    // 5. Determine order quantity and delivery parameters
    let quantity = options?.quantity;
    if (!quantity || quantity <= 0) {
      const rfq = await RfqModel.findOne({ sku: cs.sku }).session(session || null);
      quantity = rfq?.targetQuantity || 1;
    }

    const unitPrice = winningBid.unitPrice || 0;
    if (unitPrice <= 0) {
      throw new ValidationError('Winning bid quoted unit price must be greater than zero');
    }

    const lineTotal = Number((quantity * unitPrice).toFixed(2));
    const subtotal = lineTotal;
    const taxAmount = Number((options?.taxAmount || 0).toFixed(2));
    const grandTotal = Number((subtotal + taxAmount).toFixed(2));

    // 6. Currency & Exchange Rate Resolution (DFD DF-08 / BDT conversion)
    const currency: POCurrency = (winningBid.currency as POCurrency) || (supplier.currency as POCurrency) || 'BDT';
    let exchangeRate = options?.exchangeRate;
    if (!exchangeRate || exchangeRate <= 0) {
      if (currency === 'BDT') {
        exchangeRate = 1.0;
      } else if (currency === 'USD') {
        exchangeRate = 120.0;
      } else if (currency === 'EUR') {
        exchangeRate = 130.0;
      } else if (currency === 'CNY') {
        exchangeRate = 17.0;
      } else {
        exchangeRate = 1.0;
      }
    }

    const bdtGrandTotal = Number((grandTotal * exchangeRate).toFixed(2));

    // 7. Determine Approval Quorum Tier (PRD §4, §5.2)
    const { tier: approvalQuorumTier, requiredDirectors } = this.determineQuorumTier(bdtGrandTotal);

    // Initial status:
    // If Tier 3 or 4, automatic Quorum Approval required -> set PO status to SUBMITTED
    // If Tier 1 or 2, single manager/officer approval -> set PO status to DRAFT
    const poStatus: POStatus = approvalQuorumTier >= 3 ? 'SUBMITTED' : 'DRAFT';

    // 8. Resolve Delivery Warehouse
    let warehouseId: Types.ObjectId;
    if (options?.deliveryWarehouseId) {
      const wh = await WarehouseModel.findById(options.deliveryWarehouseId).session(session || null);
      if (!wh) {
        throw new NotFoundError('Warehouse', options.deliveryWarehouseId.toString());
      }
      warehouseId = wh._id;
    } else {
      let defaultWh = await WarehouseModel.findOne({ isCentralHub: true }).session(session || null);
      if (!defaultWh) {
        defaultWh = await WarehouseModel.findOne().session(session || null);
      }
      if (!defaultWh) {
        // Create standard central warehouse if none exists
        const createdWhs = await WarehouseModel.create(
          [
            {
              warehouseCode: 'WH-CENTRAL-01',
              name: 'Central Medical Technology Hub',
              type: 'CENTRAL',
              address: 'Tejgaon Industrial Area, Dhaka-1208',
              district: 'Dhaka',
              isCentralHub: true,
              isActive: true,
            },
          ],
          { session }
        );
        defaultWh = createdWhs[0];
      }
      if (!defaultWh) {
        throw new NotFoundError('Warehouse', 'Default warehouse could not be initialized');
      }
      warehouseId = defaultWh._id;
    }

    // 9. Delivery Deadline
    let deliveryDeadline: Date;
    if (options?.deliveryDeadline) {
      deliveryDeadline = new Date(options.deliveryDeadline);
    } else {
      const leadDays = winningBid.leadTimeDays || 30;
      deliveryDeadline = new Date(Date.now() + leadDays * 24 * 60 * 60 * 1000);
    }

    // 10. Generate sequential PO number via CounterService
    const poNumber = await CounterService.getNextSequence('PO', session);

    // 11. Create PO Items Array
    const poItem: IPOItem = {
      productId: product._id,
      sku: product.sku,
      productName: product.nameEn,
      quantity,
      uom: product.baseUom,
      unitPrice,
      lineTotal,
      receivedQty: 0,
    };

    // 12. Create and persist Purchase Order
    const poDocArray = await PurchaseOrderModel.create(
      [
        {
          poNumber,
          csId: cs._id,
          supplierId: supplier._id,
          poDate: new Date(),
          deliveryDeadline,
          currency,
          exchangeRate,
          items: [poItem],
          subtotal,
          taxAmount,
          grandTotal,
          paymentTerms: winningBid.paymentTerms || supplier.paymentTerms || 'Standard Terms',
          shippingTerms: options?.shippingTerms || 'FOB',
          deliveryWarehouseId: warehouseId,
          status: poStatus,
          approvalQuorumTier,
          issuedBy: new Types.ObjectId(userId),
        },
      ],
      { session }
    );
    const purchaseOrder = poDocArray[0];

    // 13. If Tier 3 or 4, create record in quorum_approvals collection
    let quorumApproval: IQuorumApproval | undefined;
    if (approvalQuorumTier === 3 || approvalQuorumTier === 4) {
      const quorumDocs = await QuorumApprovalModel.create(
        [
          {
            targetCollection: 'purchase_orders',
            targetId: purchaseOrder._id,
            targetRef: purchaseOrder.poNumber,
            quorumTier: approvalQuorumTier,
            requiredCount: requiredDirectors,
            approvals: [],
            isComplete: false,
            emergencyOverride: false,
          },
        ],
        { session }
      );
      quorumApproval = quorumDocs[0];

      logger.info(
        `Quorum Approval record created for PO ${purchaseOrder.poNumber} (Tier ${approvalQuorumTier}, Required Signatures: ${requiredDirectors})`
      );
    }

    // 14. Transition CS status to AWARDED
    cs.status = 'AWARDED';
    cs.recommendedSupplierId = supplier._id;
    await cs.save({ session });

    logger.info(
      `Purchase Order created: ${poNumber} from CS ${cs.csNumber} for ${supplier.companyName} (Grand Total: ${grandTotal} ${currency} = ${bdtGrandTotal} BDT, Tier: ${approvalQuorumTier}, Status: ${poStatus})`
    );

    return { purchaseOrder, quorumApproval };
  }

  /**
   * Retrieves a Purchase Order by ObjectId with populated relations.
   */
  public static async getById(poId: string | Types.ObjectId): Promise<IPurchaseOrder> {
    const po = await PurchaseOrderModel.findById(poId)
      .populate('csId', 'csNumber status aiSummary')
      .populate('supplierId', 'companyName supplierCode country currency swiftCode')
      .populate('deliveryWarehouseId', 'name warehouseCode district')
      .populate('issuedBy', 'fullName email')
      .populate('approvedBy', 'fullName email')
      .populate('items.productId', 'nameEn nameBn sku baseUom');

    if (!po) {
      throw new NotFoundError('PurchaseOrder', poId.toString());
    }

    return po;
  }

  /**
   * Lists Purchase Orders with filtering and pagination.
   */
  public static async listPurchaseOrders(
    filters: {
      status?: POStatus;
      supplierId?: string | Types.ObjectId;
      approvalQuorumTier?: number;
      search?: string;
    },
    pagination: { page?: number; limit?: number }
  ): Promise<{
    data: IPurchaseOrder[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const query: Record<string, any> = {};

    if (filters.status) {
      query.status = filters.status;
    }
    if (filters.supplierId) {
      query.supplierId = new Types.ObjectId(filters.supplierId);
    }
    if (filters.approvalQuorumTier) {
      query.approvalQuorumTier = filters.approvalQuorumTier;
    }
    if (filters.search) {
      query.poNumber = { $regex: filters.search.trim(), $options: 'i' };
    }

    const page = Math.max(1, pagination.page || 1);
    const limit = Math.min(100, Math.max(1, pagination.limit || 20));
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      PurchaseOrderModel.find(query)
        .populate('supplierId', 'companyName supplierCode country currency')
        .populate('deliveryWarehouseId', 'name warehouseCode')
        .populate('issuedBy', 'fullName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      PurchaseOrderModel.countDocuments(query),
    ]);

    return {
      data: data as unknown as IPurchaseOrder[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}

export default PurchaseOrderService;
