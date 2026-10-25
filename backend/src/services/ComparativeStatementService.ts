import { Types } from 'mongoose';
import {
  ComparativeStatementModel,
  IComparativeStatement,
  ICSBid,
  ComparativeStatementStatus,
} from '../models/ComparativeStatement';
import { SupplierQuotationModel, ISupplierQuotation } from '../models/SupplierQuotation';
import { SupplierModel } from '../models/Supplier';
import { ProductModel } from '../models/Product';
import { RfqModel } from '../models/Rfq';
import { GeminiAdvisor, AnonymizedBidSummary } from '../integrations/geminiAdvisor';
import {
  NotFoundError,
  ValidationError,
  DuplicateKeyError,
} from '../errors/AppError';
import logger from '../config/logger';

export interface CompileCsDTO {
  rfqNumber: string;
  csNumber?: string;
  preparedBy: string | Types.ObjectId;
}

export interface FinalizeCsDTO {
  csId: string | Types.ObjectId;
  approvedBy: string | Types.ObjectId;
}

export class ComparativeStatementService {
  /**
   * Calculates terms score based on commercial credit / LC terms (Max 15 points).
   * Favorable deferred credit/LC receives higher score; full cash advance receives lower score.
   */
  public static calculateTermsScore(paymentTerms?: string): number {
    if (!paymentTerms || paymentTerms.trim() === '') {
      return 8.0;
    }
    const lower = paymentTerms.toLowerCase();
    if (
      lower.includes('90') ||
      lower.includes('deferred') ||
      lower.includes('net 90') ||
      lower.includes('net 60')
    ) {
      return 15.0;
    }
    if (lower.includes('60') || lower.includes('net 45')) {
      return 13.0;
    }
    if (lower.includes('30') || lower.includes('net 30')) {
      return 12.0;
    }
    if (lower.includes('sight') || lower.includes('lc') || lower.includes('letter of credit')) {
      return 10.0;
    }
    if (lower.includes('50% advance') || lower.includes('partial advance')) {
      return 7.0;
    }
    if (
      lower.includes('advance') ||
      lower.includes('cash') ||
      lower.includes('cia') ||
      lower.includes('tt in advance')
    ) {
      return 4.0;
    }
    return 8.0;
  }

  /**
   * Calculates vendor reliability score based on vendor aiRiskScore (Max 10 points).
   * Clamped to [0, 10] range, rounded to 2 decimal places.
   */
  public static calculateVendorScore(aiRiskScore?: number): number {
    if (aiRiskScore === undefined || aiRiskScore === null || isNaN(aiRiskScore)) {
      return 7.0; // Standard neutral baseline
    }
    const normalized = Math.min(10, Math.max(0, aiRiskScore / 10));
    return Number(normalized.toFixed(2));
  }

  /**
   * Compiles bids submitted for an RFQ into a single Comparative Statement (CS) document.
   * Calculates 100-point weighted composite matrix:
   * - Price Score: Max 50 points (50 * lowestPrice / bidPrice)
   * - Lead Time Score: Max 25 points (25 * shortestLeadTime / bidLeadTime)
   * - Terms Score: Max 15 points (LC / credit terms weight)
   * - Vendor Reliability Score: Max 10 points (aiRiskScore / 10)
   *
   * Assigns winning recommendation and generates Google Gemini AI executive summary.
   */
  public static async compileComparativeStatement(
    dto: CompileCsDTO
  ): Promise<IComparativeStatement> {
    const normalizedRfq = dto.rfqNumber.trim().toUpperCase();

    // 1. Fetch submitted quotations for this RFQ
    const quotations = await SupplierQuotationModel.find({
      rfqNumber: normalizedRfq,
    })
      .populate('supplierId', 'companyName supplierCode country currency aiRiskScore isActive')
      .populate('productId', 'nameEn nameBn sku baseUom');

    if (!quotations || quotations.length === 0) {
      throw new ValidationError(
        `No supplier bids found for RFQ '${normalizedRfq}'. At least 1 bid is required to compile a CS.`
      );
    }

    // 2. Fetch associated RFQ (if exists) and product details
    const rfq = await RfqModel.findOne({ rfqNumber: normalizedRfq });
    const firstQuote = quotations[0];
    const productId = rfq ? rfq.productId : firstQuote.productId;
    const sku = rfq ? rfq.sku : firstQuote.sku;

    const product = await ProductModel.findById(productId);
    const productName = product?.nameEn || sku;

    // 3. Find baseline extrema: lowest price and shortest lead time
    const lowestPrice = Math.min(...quotations.map((q) => q.quotedUnitPrice));
    const shortestLeadTime = Math.min(...quotations.map((q) => q.leadTimeDays));

    if (lowestPrice <= 0) {
      throw new ValidationError('Invalid quotation detected: bid unit price must be greater than zero');
    }
    if (shortestLeadTime <= 0) {
      throw new ValidationError('Invalid quotation detected: bid lead time must be at least 1 day');
    }

    // 4. Calculate 100-point scores for each quotation bid
    interface ScoredBidData {
      bid: ICSBid;
      quotation: ISupplierQuotation;
      vendorAlias: string;
    }

    const scoredBids: ScoredBidData[] = quotations.map((q, index) => {
      const supplier: any = q.supplierId;
      const supplierName = supplier?.companyName || `Supplier ${index + 1}`;
      const supplierCode = supplier?.supplierCode || `V-${index + 1}`;
      const supplierAiScore = supplier?.aiRiskScore;

      // Price Score: Max 50
      const priceScore = Number(((50 * lowestPrice) / q.quotedUnitPrice).toFixed(2));

      // Lead Time Score: Max 25
      const leadScore = Number(((25 * shortestLeadTime) / q.leadTimeDays).toFixed(2));

      // Terms Score: Max 15
      const termsScore = this.calculateTermsScore(q.paymentTerms);

      // Vendor Score: Max 10
      const vendorScore = this.calculateVendorScore(supplierAiScore);

      // Total Score: Max 100
      const totalScore = Number(
        Math.min(100, Math.max(0, priceScore + leadScore + termsScore + vendorScore)).toFixed(2)
      );

      // Anomaly / Risk Flags
      const flags: string[] = [...(q.aiRiskFlags || [])];
      if (q.leadTimeDays > 45) {
        flags.push('EXTENDED_LEAD_TIME');
      }
      if (q.quotedUnitPrice > lowestPrice * 1.25) {
        flags.push('PRICE_OUTLIER_HIGH');
      }
      if (q.paymentTerms && q.paymentTerms.toLowerCase().includes('advance')) {
        flags.push('CASH_OUTFLOW_RISK');
      }
      if (supplierAiScore !== undefined && supplierAiScore < 50) {
        flags.push('ELEVATED_VENDOR_RISK');
      }

      const bidItem: ICSBid = {
        bidId: q._id,
        supplierId: supplier?._id || q.supplierId,
        supplierName,
        unitPrice: q.quotedUnitPrice,
        currency: q.currency,
        leadTimeDays: q.leadTimeDays,
        paymentTerms: q.paymentTerms,
        priceScore,
        leadScore,
        termsScore,
        vendorScore,
        totalScore,
        aiRiskFlags: Array.from(new Set(flags)),
        isRecommended: false,
      };

      return {
        bid: bidItem,
        quotation: q,
        vendorAlias: `${supplierName} (${supplierCode})`,
      };
    });

    // 5. Sort bids descending by totalScore (tiebreaker: lower unitPrice)
    scoredBids.sort((a, b) => {
      if (b.bid.totalScore !== a.bid.totalScore) {
        return (b.bid.totalScore || 0) - (a.bid.totalScore || 0);
      }
      return (a.bid.unitPrice || 0) - (b.bid.unitPrice || 0);
    });

    // Highest composite score is marked as recommended
    scoredBids[0].bid.isRecommended = true;
    const winningBid = scoredBids[0].bid;

    // Persist calculated csScore back to supplier quotation records
    await Promise.all(
      scoredBids.map((sb) =>
        SupplierQuotationModel.findByIdAndUpdate(sb.quotation._id, {
          csScore: sb.bid.totalScore,
          aiRiskFlags: sb.bid.aiRiskFlags,
        })
      )
    );

    // 6. Generate sequential or provided CS Number
    let csNumber = dto.csNumber?.trim().toUpperCase();
    if (!csNumber) {
      const year = new Date().getFullYear();
      const count = await ComparativeStatementModel.countDocuments();
      csNumber = `CS-${year}-${String(count + 1).padStart(5, '0')}`;
    }

    const existingCs = await ComparativeStatementModel.findOne({ csNumber });
    if (existingCs) {
      throw new DuplicateKeyError(`Comparative Statement with number '${csNumber}' already exists`);
    }

    // 7. Generate Google Gemini AI executive procurement summary
    const anonymizedBids: AnonymizedBidSummary[] = scoredBids.map((sb) => ({
      vendorAlias: sb.vendorAlias,
      unitPrice: sb.bid.unitPrice || 0,
      currency: sb.bid.currency || 'USD',
      leadTimeDays: sb.bid.leadTimeDays || 0,
      paymentTerms: sb.bid.paymentTerms,
      priceScore: sb.bid.priceScore || 0,
      leadScore: sb.bid.leadScore || 0,
      termsScore: sb.bid.termsScore || 0,
      vendorScore: sb.bid.vendorScore || 0,
      totalScore: sb.bid.totalScore || 0,
      isRecommended: sb.bid.isRecommended,
    }));

    const aiSummary = await GeminiAdvisor.generateCsSummary({
      csNumber,
      sku,
      productName,
      bids: anonymizedBids,
    });

    // 8. Create and persist ComparativeStatement document
    const comparativeStatement = await ComparativeStatementModel.create({
      csNumber,
      productId,
      sku,
      requestDate: new Date(),
      bids: scoredBids.map((sb) => sb.bid),
      recommendedSupplierId: winningBid.supplierId,
      aiSummary,
      status: 'DRAFT',
      preparedBy: new Types.ObjectId(dto.preparedBy),
    });

    logger.info(
      `Comparative Statement compiled: ${csNumber} for ${sku} (Winner: ${winningBid.supplierName}, Score: ${winningBid.totalScore}/100)`
    );

    return comparativeStatement;
  }

  /**
   * Re-evaluates and regenerates the Gemini AI executive narrative for an existing CS.
   */
  public static async generateAiSummary(csId: string | Types.ObjectId): Promise<IComparativeStatement> {
    const cs = await ComparativeStatementModel.findById(csId)
      .populate('productId', 'nameEn sku')
      .populate('bids.supplierId', 'companyName supplierCode');

    if (!cs) {
      throw new NotFoundError('ComparativeStatement', csId.toString());
    }

    const product: any = cs.productId;
    const productName = product?.nameEn || cs.sku;

    const anonymizedBids: AnonymizedBidSummary[] = cs.bids.map((b, idx) => {
      const supplier: any = b.supplierId;
      const alias = supplier?.companyName
        ? `${supplier.companyName} (${supplier.supplierCode || 'V' + (idx + 1)})`
        : b.supplierName || `Bidder ${idx + 1}`;

      return {
        vendorAlias: alias,
        unitPrice: b.unitPrice || 0,
        currency: b.currency || 'USD',
        leadTimeDays: b.leadTimeDays || 0,
        paymentTerms: b.paymentTerms,
        priceScore: b.priceScore || 0,
        leadScore: b.leadScore || 0,
        termsScore: b.termsScore || 0,
        vendorScore: b.vendorScore || 0,
        totalScore: b.totalScore || 0,
        isRecommended: b.isRecommended,
      };
    });

    const narrative = await GeminiAdvisor.generateCsSummary({
      csNumber: cs.csNumber,
      sku: cs.sku,
      productName,
      bids: anonymizedBids,
    });

    cs.aiSummary = narrative;
    await cs.save();

    logger.info(`Updated Gemini AI narrative for CS ${cs.csNumber}`);
    return cs;
  }

  /**
   * Finalizes a Comparative Statement, locking it from edits and setting approvedBy.
   */
  public static async finalizeComparativeStatement(
    dto: FinalizeCsDTO
  ): Promise<IComparativeStatement> {
    const cs = await ComparativeStatementModel.findById(dto.csId);
    if (!cs) {
      throw new NotFoundError('ComparativeStatement', dto.csId.toString());
    }

    if (cs.status === 'FINALIZED') {
      throw new ValidationError(`Comparative Statement '${cs.csNumber}' is already finalized`);
    }
    if (cs.status === 'AWARDED') {
      throw new ValidationError(
        `Comparative Statement '${cs.csNumber}' is already awarded and cannot be modified`
      );
    }

    cs.status = 'FINALIZED';
    cs.approvedBy = new Types.ObjectId(dto.approvedBy);
    await cs.save();

    logger.info(`Comparative Statement ${cs.csNumber} finalized by User ${dto.approvedBy}`);
    return cs;
  }

  /**
   * Retrieves a Comparative Statement by ID with populated relations.
   */
  public static async getById(csId: string | Types.ObjectId): Promise<IComparativeStatement> {
    const cs = await ComparativeStatementModel.findById(csId)
      .populate('productId', 'nameEn nameBn sku hsCode baseUom')
      .populate('recommendedSupplierId', 'companyName supplierCode country currency')
      .populate('preparedBy', 'fullName email')
      .populate('approvedBy', 'fullName email')
      .populate('bids.supplierId', 'companyName supplierCode country currency');

    if (!cs) {
      throw new NotFoundError('ComparativeStatement', csId.toString());
    }

    return cs;
  }

  /**
   * Lists Comparative Statements with filtering and pagination.
   */
  public static async listComparativeStatements(
    filters: { sku?: string; status?: ComparativeStatementStatus; productId?: string },
    pagination: { page?: number; limit?: number }
  ): Promise<{
    data: IComparativeStatement[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const query: Record<string, any> = {};

    if (filters.sku) {
      query.sku = filters.sku.trim().toUpperCase();
    }
    if (filters.status) {
      query.status = filters.status;
    }
    if (filters.productId) {
      query.productId = new Types.ObjectId(filters.productId);
    }

    const page = Math.max(1, pagination.page || 1);
    const limit = Math.min(100, Math.max(1, pagination.limit || 20));
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      ComparativeStatementModel.find(query)
        .populate('productId', 'nameEn sku baseUom')
        .populate('recommendedSupplierId', 'companyName supplierCode')
        .populate('preparedBy', 'fullName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ComparativeStatementModel.countDocuments(query),
    ]);

    return {
      data: data as unknown as IComparativeStatement[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}

export default ComparativeStatementService;
