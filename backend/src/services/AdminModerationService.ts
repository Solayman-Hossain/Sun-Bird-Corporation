import { ReviewService } from './ReviewService';
import { DisputeService } from './DisputeService';
import { BannedNidModel } from '../models/BannedNid';
import { UserModel } from '../models/User';
import { CustomerModel } from '../models/Customer';
import { ValidationError, NotFoundError } from '../errors/AppError';

export class AdminModerationService {
  /**
   * Comprehensive moderation summary for ERP Admin
   */
  public static async getModerationOverview(): Promise<{
    pendingReviews: number;
    pendingDisputes: number;
    bannedNidsCount: number;
  }> {
    const [reviews, disputes, bannedNidsCount] = await Promise.all([
      ReviewService.getModerationQueue('PENDING', 1, 1),
      DisputeService.getClaimsQueue('PENDING_REVIEW', 1, 1),
      BannedNidModel.countDocuments(),
    ]);

    return {
      pendingReviews: reviews.total,
      pendingDisputes: disputes.total,
      bannedNidsCount,
    };
  }

  /**
   * Ban customer or user with corporate compliance record
   */
  public static async banCustomerOrUser(
    targetId: string,
    targetType: 'CUSTOMER' | 'USER',
    reason: string,
    bannedBy: string,
    nid?: string
  ): Promise<void> {
    if (targetType === 'USER') {
      const user = await UserModel.findByIdAndUpdate(targetId, { isActive: false });
      if (!user) throw new NotFoundError('User not found');
    } else {
      const customer = await CustomerModel.findByIdAndUpdate(targetId, { isActive: false });
      if (!customer) throw new NotFoundError('Customer not found');
    }

    if (nid && nid.trim().length > 0) {
      await BannedNidModel.findOneAndUpdate(
        { nidHash: nid.trim() },
        {
          nidHash: nid.trim(),
          reason,
          bannedBy,
          bannedAt: new Date(),
        },
        { upsert: true, new: true }
      );
    }
  }
}
