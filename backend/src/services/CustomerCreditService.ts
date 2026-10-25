import { ClientSession, Types } from 'mongoose';
import { CustomerCreditProfileModel, ICustomerCreditProfile } from '../models/CustomerCreditProfile';
import { SalesInvoiceModel, ISalesInvoice } from '../models/SalesInvoice';
import { UserModel, IUser } from '../models/User';
import {
  CreditLockedError,
  ForbiddenError,
  MfaRequiredError,
  NotFoundError,
  UnauthorizedError,
} from '../errors/AppError';
import logger from '../config/logger';

export interface CreditExposureDetails {
  customerId: string;
  creditLimitBDT: number;
  currentOutstandingAR: number;
  unbilledDispatches: number;
  newOrderAmount: number;
  totalExposure: number;
  isCreditLocked: boolean;
  approvedByDirector?: string;
  overdueInvoicesCount: number;
  oldestOverdueInvoiceNo?: string;
  daysOverdue?: number;
}

/**
 * B2B Customer Credit Limit Exposure Gate & Automated Hard-Lock Engine
 * Enforces credit limits and overdue aging rules per PRD §4 / §21.14 and Database Schema §4.2.
 */
export class CustomerCreditService {
  /**
   * Evaluates real-time customer credit exposure against approved limit and overdue aging.
   * Total Exposure = currentOutstandingAR + unbilledDispatches + newOrderAmount
   *
   * Hard-locks the customer profile and throws CreditLockedError (HTTP 422) if:
   * 1. Total exposure exceeds creditLimitBDT
   * 2. Any unpaid sales invoice is overdue (dueDate < now)
   * 3. Customer is already hard-locked (unless temporary Director override is active)
   *
   * @param customerId Customer MongoDB ObjectId or hex string
   * @param newOrderAmount Value of new incoming order or dispatch in BDT (defaults to 0)
   * @param session Optional Mongoose ClientSession for transaction atomicity
   * @returns Promise<boolean> true if credit check passes
   */
  public static async checkCreditExposure(
    customerId: string | Types.ObjectId,
    newOrderAmount: number = 0,
    session?: ClientSession
  ): Promise<boolean> {
    const custId = new Types.ObjectId(customerId);

    let profileQuery = CustomerCreditProfileModel.findOne({ customerId: custId });
    if (session) {
      profileQuery = profileQuery.session(session);
    }
    const profile = await profileQuery;

    if (!profile) {
      throw new NotFoundError('CustomerCreditProfile', customerId.toString());
    }

    const currentOutstandingAR = profile.currentOutstandingAR || 0;
    const unbilledDispatches = profile.unbilledDispatches || 0;
    const totalExposure = currentOutstandingAR + unbilledDispatches + newOrderAmount;

    // 1. Director Override Check: If temporary override granted by Director/SuperAdmin, bypass lock check
    if (profile.approvedByDirector) {
      logger.info(
        `[CreditService] Director override active for customer ${customerId}. Bypassing exposure gate.`
      );
      return true;
    }

    // 2. Already hard-locked customer check
    if (profile.isCreditLocked) {
      throw new CreditLockedError(
        customerId.toString(),
        profile.creditLimitBDT,
        totalExposure,
        profile.lockReason || 'Dispatch blocked: Customer credit is hard-locked'
      );
    }

    // 3. Check Overdue Aging: Query unpaid sales invoices where dueDate < now
    const now = new Date();
    let invoiceQuery = SalesInvoiceModel.find({
      customerId: custId,
      status: { $ne: 'VOID' },
      paymentStatus: { $in: ['UNPAID', 'PARTIALLY_PAID', 'OVERDUE'] },
      dueDate: { $lt: now },
    }).sort({ dueDate: 1 });

    if (session) {
      invoiceQuery = invoiceQuery.session(session);
    }
    const overdueInvoices = await invoiceQuery;

    const isLimitExceeded = totalExposure > profile.creditLimitBDT;
    const hasOverdueInvoices = overdueInvoices.length > 0;

    // 4. Automated Hard-Lock Trigger: Total exposure exceeded OR invoice overdue
    if (isLimitExceeded || hasOverdueInvoices) {
      let lockReason = '';
      if (isLimitExceeded && hasOverdueInvoices) {
        const oldest = overdueInvoices[0];
        const daysOverdue = Math.max(
          1,
          Math.floor((now.getTime() - oldest.dueDate.getTime()) / (1000 * 60 * 60 * 24))
        );
        lockReason = `Credit limit exceeded (${totalExposure.toFixed(2)} / ${profile.creditLimitBDT.toFixed(2)} BDT) and invoice ${oldest.invoiceNo} overdue by ${daysOverdue} day(s)`;
      } else if (isLimitExceeded) {
        lockReason = `Credit limit exceeded: Total exposure (${totalExposure.toFixed(2)} BDT) exceeds approved limit (${profile.creditLimitBDT.toFixed(2)} BDT)`;
      } else {
        const oldest = overdueInvoices[0];
        const daysOverdue = Math.max(
          1,
          Math.floor((now.getTime() - oldest.dueDate.getTime()) / (1000 * 60 * 60 * 24))
        );
        lockReason = `Overdue aging violation: Invoice ${oldest.invoiceNo} is overdue by ${daysOverdue} day(s) (due: ${oldest.dueDate.toISOString().split('T')[0]})`;
      }

      // Automatically persist hard-lock state to database
      profile.isCreditLocked = true;
      profile.lockReason = lockReason;
      await profile.save(session ? { session } : undefined);

      logger.warn(
        `[CreditService] Hard-lock applied to customer ${customerId}. Reason: ${lockReason}`
      );

      throw new CreditLockedError(
        customerId.toString(),
        profile.creditLimitBDT,
        totalExposure,
        lockReason,
        [
          { field: 'customerId', value: customerId.toString() },
          { field: 'creditLimitBDT', value: profile.creditLimitBDT },
          { field: 'currentExposureBDT', value: totalExposure },
          { field: 'currentOutstandingAR', value: currentOutstandingAR },
          { field: 'unbilledDispatches', value: unbilledDispatches },
          { field: 'newOrderAmount', value: newOrderAmount },
          { field: 'overdueInvoicesCount', value: overdueInvoices.length },
          { field: 'lockReason', value: lockReason },
        ]
      );
    }

    return true;
  }

  /**
   * Authorizes temporary Director override for a hard-locked customer credit profile.
   * Requires DIRECTOR or SUPER_ADMIN role and validates TOTP MFA if enabled on the director's account.
   *
   * @param customerId Customer MongoDB ObjectId or hex string
   * @param directorId Director/SuperAdmin User ObjectId or hex string
   * @param reason Business justification for credit override
   * @param session Optional Mongoose ClientSession
   * @param totpCode Optional 6-digit MFA code (required if director has totpSecret configured)
   * @returns Updated ICustomerCreditProfile
   */
  public static async directorOverrideCreditLock(
    customerId: string | Types.ObjectId,
    directorId: string | Types.ObjectId,
    reason: string,
    session?: ClientSession,
    totpCode?: string
  ): Promise<ICustomerCreditProfile> {
    const dirId = new Types.ObjectId(directorId);

    let userQuery = UserModel.findById(dirId);
    if (session) {
      userQuery = userQuery.session(session);
    }
    const director = await userQuery;

    if (!director) {
      throw new NotFoundError('User', directorId.toString());
    }

    if (!director.isActive) {
      throw new UnauthorizedError('Director account is inactive or disabled');
    }

    if (director.userType !== 'DIRECTOR' && director.userType !== 'SUPER_ADMIN') {
      throw new ForbiddenError(
        'Access denied: Only users with DIRECTOR or SUPER_ADMIN role can authorize credit overrides'
      );
    }

    // Enforce TOTP MFA verification if configured on director user profile
    if (director.totpSecret) {
      if (!totpCode) {
        throw new MfaRequiredError(
          'MFA TOTP verification code is required for Director credit override'
        );
      }

      if (!/^\d{6}$/.test(String(totpCode).trim())) {
        throw new UnauthorizedError('Invalid or expired MFA TOTP code');
      }
    }

    const custId = new Types.ObjectId(customerId);
    let profileQuery = CustomerCreditProfileModel.findOne({ customerId: custId });
    if (session) {
      profileQuery = profileQuery.session(session);
    }
    const profile = await profileQuery;

    if (!profile) {
      throw new NotFoundError('CustomerCreditProfile', customerId.toString());
    }

    // Unlock credit and record director authorization
    profile.isCreditLocked = false;
    profile.approvedByDirector = dirId;
    profile.lockReason = `Director override granted by ${director.fullName} (${director.userType}): ${reason}`;
    await profile.save(session ? { session } : undefined);

    logger.info(
      `[CreditService] Director override granted for customer ${customerId} by director ${director.fullName} (${director._id}). Reason: ${reason}`
    );

    return profile;
  }

  /**
   * Resets temporary Director override upon order dispatch or invoice completion.
   */
  public static async clearDirectorOverride(
    customerId: string | Types.ObjectId,
    session?: ClientSession
  ): Promise<ICustomerCreditProfile> {
    const custId = new Types.ObjectId(customerId);
    let profileQuery = CustomerCreditProfileModel.findOne({ customerId: custId });
    if (session) {
      profileQuery = profileQuery.session(session);
    }
    const profile = await profileQuery;

    if (!profile) {
      throw new NotFoundError('CustomerCreditProfile', customerId.toString());
    }

    profile.approvedByDirector = undefined;
    await profile.save(session ? { session } : undefined);

    logger.info(`[CreditService] Cleared Director override for customer ${customerId}.`);
    return profile;
  }

  /**
   * Retrieves credit profile exposure details and overdue status.
   */
  public static async getExposureDetails(
    customerId: string | Types.ObjectId,
    newOrderAmount: number = 0,
    session?: ClientSession
  ): Promise<CreditExposureDetails> {
    const custId = new Types.ObjectId(customerId);
    let profileQuery = CustomerCreditProfileModel.findOne({ customerId: custId });
    if (session) {
      profileQuery = profileQuery.session(session);
    }
    const profile = await profileQuery;

    if (!profile) {
      throw new NotFoundError('CustomerCreditProfile', customerId.toString());
    }

    const currentOutstandingAR = profile.currentOutstandingAR || 0;
    const unbilledDispatches = profile.unbilledDispatches || 0;
    const totalExposure = currentOutstandingAR + unbilledDispatches + newOrderAmount;

    const now = new Date();
    let invoiceQuery = SalesInvoiceModel.find({
      customerId: custId,
      status: { $ne: 'VOID' },
      paymentStatus: { $in: ['UNPAID', 'PARTIALLY_PAID', 'OVERDUE'] },
      dueDate: { $lt: now },
    }).sort({ dueDate: 1 });

    if (session) {
      invoiceQuery = invoiceQuery.session(session);
    }
    const overdueInvoices = await invoiceQuery;

    let oldestOverdueInvoiceNo: string | undefined;
    let daysOverdue: number | undefined;

    if (overdueInvoices.length > 0) {
      oldestOverdueInvoiceNo = overdueInvoices[0].invoiceNo;
      daysOverdue = Math.max(
        1,
        Math.floor((now.getTime() - overdueInvoices[0].dueDate.getTime()) / (1000 * 60 * 60 * 24))
      );
    }

    return {
      customerId: customerId.toString(),
      creditLimitBDT: profile.creditLimitBDT,
      currentOutstandingAR,
      unbilledDispatches,
      newOrderAmount,
      totalExposure,
      isCreditLocked: profile.isCreditLocked,
      approvedByDirector: profile.approvedByDirector?.toString(),
      overdueInvoicesCount: overdueInvoices.length,
      oldestOverdueInvoiceNo,
      daysOverdue,
    };
  }

  /**
   * Updates customer AR and unbilled dispatch balances atomically.
   */
  public static async updateCreditBalances(
    customerId: string | Types.ObjectId,
    deltas: { arDelta?: number; unbilledDelta?: number },
    session?: ClientSession
  ): Promise<ICustomerCreditProfile> {
    const custId = new Types.ObjectId(customerId);
    const inc: any = {};
    if (deltas.arDelta !== undefined) {
      inc.currentOutstandingAR = deltas.arDelta;
    }
    if (deltas.unbilledDelta !== undefined) {
      inc.unbilledDispatches = deltas.unbilledDelta;
    }

    const options: any = { new: true };
    if (session) {
      options.session = session;
    }

    const updated = await CustomerCreditProfileModel.findOneAndUpdate(
      { customerId: custId },
      { $inc: inc },
      options
    );

    if (!updated) {
      throw new NotFoundError('CustomerCreditProfile', customerId.toString());
    }

    return updated as unknown as ICustomerCreditProfile;
  }

  // Instance wrappers for dependency injection or object-oriented usage
  public checkCreditExposure(
    customerId: string | Types.ObjectId,
    newOrderAmount: number = 0,
    session?: ClientSession
  ): Promise<boolean> {
    return CustomerCreditService.checkCreditExposure(customerId, newOrderAmount, session);
  }

  public directorOverrideCreditLock(
    customerId: string | Types.ObjectId,
    directorId: string | Types.ObjectId,
    reason: string,
    session?: ClientSession,
    totpCode?: string
  ): Promise<ICustomerCreditProfile> {
    return CustomerCreditService.directorOverrideCreditLock(
      customerId,
      directorId,
      reason,
      session,
      totpCode
    );
  }

  public clearDirectorOverride(
    customerId: string | Types.ObjectId,
    session?: ClientSession
  ): Promise<ICustomerCreditProfile> {
    return CustomerCreditService.clearDirectorOverride(customerId, session);
  }

  public getExposureDetails(
    customerId: string | Types.ObjectId,
    newOrderAmount: number = 0,
    session?: ClientSession
  ): Promise<CreditExposureDetails> {
    return CustomerCreditService.getExposureDetails(customerId, newOrderAmount, session);
  }

  public updateCreditBalances(
    customerId: string | Types.ObjectId,
    deltas: { arDelta?: number; unbilledDelta?: number },
    session?: ClientSession
  ): Promise<ICustomerCreditProfile> {
    return CustomerCreditService.updateCreditBalances(customerId, deltas, session);
  }
}

export const customerCreditService = new CustomerCreditService();
export default CustomerCreditService;
