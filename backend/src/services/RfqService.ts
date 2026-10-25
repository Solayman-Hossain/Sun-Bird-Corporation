import { Types } from 'mongoose';
import { RfqModel, IRfq } from '../models/Rfq';
import {
  SupplierQuotationModel,
  ISupplierQuotation,
  QuotationCurrency,
} from '../models/SupplierQuotation';
import { SupplierModel } from '../models/Supplier';
import { ProductModel } from '../models/Product';
import {
  NotFoundError,
  ValidationError,
  DuplicateKeyError,
  ForbiddenError,
} from '../errors/AppError';
import logger from '../config/logger';

export interface BroadcastRfqDTO {
  rfqNumber: string;
  title: string;
  productId: string | Types.ObjectId;
  targetQuantity: number;
  uom?: string;
  targetDeliveryDate?: Date | string;
  deadline: Date | string;
  invitedSuppliers?: Array<string | Types.ObjectId>;
  notes?: string;
  createdBy: string | Types.ObjectId;
}

export interface SubmitBidDTO {
  rfqNumber: string;
  productId: string | Types.ObjectId;
  sku: string;
  quotedUnitPrice: number;
  currency: QuotationCurrency;
  leadTimeDays: number;
  paymentTerms?: string;
  moq?: number;
  validUntil?: Date | string;
  aiRiskFlags?: string[];
  supplierId?: string | Types.ObjectId; // Optional if submitting via authenticated vendor user
}

export class RfqService {
  /**
   * Broadcasts an RFQ tender to registered suppliers.
   */
  public static async broadcastRfq(dto: BroadcastRfqDTO): Promise<IRfq> {
    const normalizedRfqNumber = dto.rfqNumber.trim().toUpperCase();

    const existing = await RfqModel.findOne({ rfqNumber: normalizedRfqNumber });
    if (existing) {
      throw new DuplicateKeyError(`RFQ tender with number '${normalizedRfqNumber}' already exists`);
    }

    const product = await ProductModel.findById(dto.productId);
    if (!product) {
      throw new NotFoundError('Product', dto.productId.toString());
    }

    const deadlineDate = new Date(dto.deadline);
    if (isNaN(deadlineDate.getTime()) || deadlineDate <= new Date()) {
      throw new ValidationError('RFQ deadline must be a valid future date');
    }

    const invited = (dto.invitedSuppliers || []).map((id) => new Types.ObjectId(id));

    const rfq = await RfqModel.create({
      rfqNumber: normalizedRfqNumber,
      title: dto.title.trim(),
      productId: product._id,
      sku: product.sku,
      targetQuantity: dto.targetQuantity,
      uom: dto.uom || product.baseUom,
      targetDeliveryDate: dto.targetDeliveryDate ? new Date(dto.targetDeliveryDate) : undefined,
      deadline: deadlineDate,
      invitedSuppliers: invited,
      status: 'OPEN',
      notes: dto.notes,
      createdBy: new Types.ObjectId(dto.createdBy),
    });

    logger.info(`RFQ broadcasted: ${rfq.rfqNumber} for ${rfq.sku} (Qty: ${rfq.targetQuantity})`);
    return rfq;
  }

  /**
   * Submits a supplier bid quotation for an RFQ.
   * Can be submitted by:
   * 1. A vendor user authenticated via vendor portal (`vendorUserId`)
   * 2. An ERP procurement officer specifying `supplierId`
   */
  public static async submitBidQuotation(
    dto: SubmitBidDTO,
    vendorUserId?: string | Types.ObjectId
  ): Promise<ISupplierQuotation> {
    const normalizedRfqNumber = dto.rfqNumber.trim().toUpperCase();
    const normalizedSku = dto.sku.trim().toUpperCase();

    // 1. Resolve supplier
    let supplierId: Types.ObjectId;

    if (vendorUserId) {
      const supplier = await SupplierModel.findOne({
        userId: new Types.ObjectId(vendorUserId),
      });
      if (!supplier) {
        throw new ForbiddenError(
          'Authenticated user is not linked to any registered vendor/supplier profile'
        );
      }
      if (!supplier.isActive) {
        throw new ForbiddenError('Vendor account is deactivated');
      }
      supplierId = supplier._id;
    } else if (dto.supplierId) {
      const supplier = await SupplierModel.findById(dto.supplierId);
      if (!supplier) {
        throw new NotFoundError('Supplier', dto.supplierId.toString());
      }
      supplierId = supplier._id;
    } else {
      throw new ValidationError('Supplier ID is required for bid quotation submission');
    }

    // 2. Validate product exists
    const product = await ProductModel.findById(dto.productId);
    if (!product) {
      throw new NotFoundError('Product', dto.productId.toString());
    }

    // 3. Verify RFQ validity and deadline if registered RFQ exists
    const rfq = await RfqModel.findOne({ rfqNumber: normalizedRfqNumber });
    const now = new Date();

    if (rfq) {
      if (rfq.status !== 'OPEN') {
        throw new ValidationError(
          `RFQ tender '${normalizedRfqNumber}' is ${rfq.status} and is no longer accepting bids`
        );
      }
      if (rfq.deadline < now) {
        throw new ValidationError(
          `RFQ tender '${normalizedRfqNumber}' expired on ${rfq.deadline.toISOString()}`
        );
      }
      // If invitedSuppliers list is populated, verify vendor was invited
      if (
        rfq.invitedSuppliers.length > 0 &&
        !rfq.invitedSuppliers.some((id) => id.toString() === supplierId.toString())
      ) {
        throw new ForbiddenError(
          `Supplier is not in the invited vendor list for RFQ '${normalizedRfqNumber}'`
        );
      }
    }

    // 4. Validate validUntil date
    const validUntilDate = dto.validUntil ? new Date(dto.validUntil) : undefined;
    if (validUntilDate && validUntilDate < now) {
      throw new ValidationError('Quotation validUntil date cannot be in the past');
    }

    // 5. Check duplicate bid by same supplier for this RFQ
    const existingQuotation = await SupplierQuotationModel.findOne({
      supplierId,
      rfqNumber: normalizedRfqNumber,
    });
    if (existingQuotation) {
      throw new DuplicateKeyError(
        `Supplier already submitted a quotation for RFQ '${normalizedRfqNumber}'`
      );
    }

    // 6. Create quotation
    const quotation = await SupplierQuotationModel.create({
      rfqNumber: normalizedRfqNumber,
      supplierId,
      productId: product._id,
      sku: normalizedSku,
      quotedUnitPrice: dto.quotedUnitPrice,
      currency: dto.currency || 'USD',
      leadTimeDays: dto.leadTimeDays,
      paymentTerms: dto.paymentTerms,
      moq: dto.moq || 1,
      validUntil: validUntilDate,
      aiRiskFlags: dto.aiRiskFlags || [],
    });

    logger.info(
      `Bid quotation registered: RFQ ${normalizedRfqNumber} by Supplier ${supplierId} (${dto.quotedUnitPrice} ${quotation.currency})`
    );
    return quotation;
  }

  /**
   * Retrieves all quotations for an RFQ or SKU.
   */
  public static async listQuotations(
    filterParams: {
      rfqNumber?: string;
      sku?: string;
      supplierId?: string | Types.ObjectId;
    },
    pagination: { page?: number; limit?: number }
  ): Promise<{
    data: ISupplierQuotation[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const filter: Record<string, any> = {};

    if (filterParams.rfqNumber) {
      filter.rfqNumber = filterParams.rfqNumber.trim().toUpperCase();
    }
    if (filterParams.sku) {
      filter.sku = filterParams.sku.trim().toUpperCase();
    }
    if (filterParams.supplierId) {
      filter.supplierId = new Types.ObjectId(filterParams.supplierId);
    }

    const page = Math.max(1, pagination.page || 1);
    const limit = Math.min(100, Math.max(1, pagination.limit || 20));
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      SupplierQuotationModel.find(filter)
        .populate('supplierId', 'companyName supplierCode country currency supplierType')
        .populate('productId', 'nameEn nameBn sku baseUom')
        .sort({ quotedUnitPrice: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      SupplierQuotationModel.countDocuments(filter),
    ]);

    return {
      data: data as unknown as ISupplierQuotation[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Retrieves active open RFQ tenders.
   */
  public static async listRfqs(
    supplierId?: string | Types.ObjectId
  ): Promise<IRfq[]> {
    const now = new Date();
    const filter: Record<string, any> = {
      status: 'OPEN',
      deadline: { $gt: now },
    };

    if (supplierId) {
      const sId = new Types.ObjectId(supplierId);
      filter.$or = [
        { invitedSuppliers: { $size: 0 } }, // Open to all
        { invitedSuppliers: sId }, // Or specifically invited
      ];
    }

    const rfqs = await RfqModel.find(filter)
      .populate('productId', 'nameEn sku baseUom')
      .sort({ deadline: 1 })
      .lean();

    return rfqs as unknown as IRfq[];
  }
}

export default RfqService;
