import { Types } from 'mongoose';
import { DisputeClaim, IDisputeClaim, ClaimType, ClaimStatus } from '../models/DisputeClaim';
import { CounterService } from './CounterService';
import { ValidationError, NotFoundError } from '../errors/AppError';

export interface SubmitDisputeInput {
  orderId: string;
  orderNumber?: string;
  productSku: string;
  productName: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  claimType: ClaimType;
  description: string;
  evidenceUrls?: string[];
}

export interface ResolveDisputeInput {
  claimId: string;
  status: 'APPROVED_REPLACEMENT' | 'APPROVED_REFUND' | 'REJECTED' | 'RESOLVED';
  moderatorNotes: string;
  adminId?: string;
  replacementOrderId?: string;
}

export class DisputeService {
  /**
   * Submit a new RMA / Warranty / Defective Item Dispute Claim
   */
  public static async submitClaim(input: SubmitDisputeInput): Promise<IDisputeClaim> {
    const {
      orderId,
      orderNumber,
      productSku,
      productName,
      customerName,
      customerPhone,
      customerEmail,
      claimType,
      description,
      evidenceUrls,
    } = input;

    if (!orderId || !productSku || !customerName || !customerPhone || !description) {
      throw new ValidationError('Required dispute claim fields are missing');
    }

    // Generate unique claim ticket number RMA-2026-XXXX
    let claimNumber = `RMA-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    try {
      claimNumber = await CounterService.getNextSequence('RMA');
    } catch {
      // fallback random
    }

    const claim = await DisputeClaim.create({
      claimNumber,
      orderId: orderId.trim(),
      orderNumber: orderNumber?.trim(),
      productSku: productSku.trim().toUpperCase(),
      productName: productName.trim(),
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerEmail: customerEmail?.trim(),
      claimType,
      description: description.trim(),
      evidenceUrls: evidenceUrls || [],
      status: 'PENDING_REVIEW',
    });

    return claim;
  }

  /**
   * Admin / ERP Moderation Queue for Claims & Disputes
   */
  public static async getClaimsQueue(
    status?: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ claims: IDisputeClaim[]; total: number; page: number }> {
    const query = status ? { status } : {};
    const skip = (page - 1) * limit;

    const [claims, total] = await Promise.all([
      DisputeClaim.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      DisputeClaim.countDocuments(query),
    ]);

    return { claims, total, page };
  }

  /**
   * Resolve an RMA / Dispute claim with admin decision and notes
   */
  public static async resolveClaim(input: ResolveDisputeInput): Promise<IDisputeClaim> {
    const { claimId, status, moderatorNotes, adminId, replacementOrderId } = input;

    if (!Types.ObjectId.isValid(claimId)) {
      throw new ValidationError('Invalid claim ID');
    }

    const claim = await DisputeClaim.findById(claimId);
    if (!claim) {
      throw new NotFoundError('Dispute claim not found');
    }

    claim.status = status;
    claim.moderatorNotes = moderatorNotes;
    claim.resolvedAt = new Date();
    if (adminId && Types.ObjectId.isValid(adminId)) {
      claim.resolvedBy = new Types.ObjectId(adminId);
    }
    if (replacementOrderId) {
      claim.replacementOrderId = replacementOrderId;
    }

    await claim.save();
    return claim;
  }

  /**
   * Get dispute claims by customer phone or order ID
   */
  public static async getCustomerClaims(searchQuery: string): Promise<IDisputeClaim[]> {
    const clean = searchQuery.trim();
    return DisputeClaim.find({
      $or: [{ customerPhone: clean }, { orderId: clean }, { claimNumber: clean }],
    }).sort({ createdAt: -1 });
  }
}
