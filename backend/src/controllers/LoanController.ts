import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { LoanModel } from '../models/Loan';
import { PartnerModel } from '../models/Partner';
import { LoanService } from '../services/LoanService';
import { PartnerService } from '../services/PartnerService';
import { NotFoundError, ValidationError, UnauthorizedError } from '../errors/AppError';

export class LoanController {
  /**
   * @route   POST /api/v1/erp/loans
   * @desc    Creates a new multi-type loan (Bank, Employee, Director, Supplier, Customer Advance)
   * @access  Bearer JWT (finance:MANAGE, loans:APPROVE)
   */
  public static async createLoan(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user?.userId;
      const loan = await LoanService.createLoan(req.body, userId);

      res.status(201).json({
        success: true,
        statusCode: 201,
        message: 'Loan registered successfully',
        data: loan,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   GET /api/v1/erp/loans
   * @desc    Lists loans with filtering and pagination
   * @access  Bearer JWT (finance:READ)
   */
  public static async getLoans(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
      const limit = Math.max(1, Math.min(100, parseInt(String(req.query.limit || '20'), 10)));

      const result = await LoanService.getLoans({
        loanType: req.query.loanType as any,
        status: req.query.status as any,
        borrowerType: req.query.borrowerType as any,
        borrowerId: req.query.borrowerId ? String(req.query.borrowerId) : undefined,
        page,
        limit,
      });

      res.status(200).json({
        success: true,
        statusCode: 200,
        data: result.loans,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: Math.ceil(result.total / result.limit),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   GET /api/v1/erp/loans/:loanCode
   * @desc    Retrieves loan details and full repayment schedule by loanCode
   * @access  Bearer JWT (finance:READ)
   */
  public static async getLoanByCode(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const loanCode = String(req.params.loanCode);
      let loan;

      if (Types.ObjectId.isValid(loanCode)) {
        loan = await LoanModel.findById(loanCode).lean();
      } else {
        loan = await LoanService.getLoanByCode(loanCode);
      }

      if (!loan) {
        throw new NotFoundError(`Loan '${loanCode}' not found`);
      }

      res.status(200).json({
        success: true,
        statusCode: 200,
        data: loan,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   POST /api/v1/erp/loans/:id/repay or /api/v1/erp/loans/repay
   * @desc    Records a loan repayment installment and automatically posts clearance JV
   * @access  Bearer JWT (finance:MANAGE, loans:APPROVE)
   */
  public static async recordLoanRepayment(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user?.userId;
      const loanIdentifier = req.params.id
        ? String(req.params.id)
        : req.body.loanCode
        ? String(req.body.loanCode)
        : undefined;

      if (!loanIdentifier) {
        throw new ValidationError("loanCode or route parameter 'id' is required");
      }

      // If id is ObjectId, resolve loanCode
      let resolvedCode = loanIdentifier;
      if (Types.ObjectId.isValid(loanIdentifier)) {
        const doc = await LoanModel.findById(loanIdentifier);
        if (!doc) throw new NotFoundError(`Loan not found with ID ${loanIdentifier}`);
        resolvedCode = doc.loanCode;
      }

      const paymentAmount = req.body.paymentAmount;
      const result = await LoanService.recordLoanRepayment(resolvedCode, paymentAmount, {
        userId,
        paymentAccountCode: req.body.paymentAccountCode,
        transactionDate: req.body.transactionDate,
        notes: req.body.notes,
      });

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: `Repayment of ${result.paymentAmount} BDT recorded for loan ${result.loanCode}`,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   POST /api/v1/erp/loans/calculate-schedule
   * @desc    Previews repayment schedule without persisting in database
   * @access  Bearer JWT (finance:READ)
   */
  public static async calculateSchedule(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const {
        principalBDT,
        tenureMonths,
        startDate,
        isInterestFree = false,
        interestRate = 0,
        interestMethod = 'REDUCING_BALANCE',
      } = req.body;

      const schedule = LoanService.generateRepaymentSchedule({
        principalBDT,
        tenureMonths,
        startDate: startDate ? new Date(startDate) : new Date(),
        isInterestFree,
        interestRate,
        interestMethod,
      });

      res.status(200).json({
        success: true,
        statusCode: 200,
        totalInstallments: schedule.length,
        data: schedule,
      });
    } catch (error) {
      next(error);
    }
  }

  // ── Partner Management & Profit Distribution Endpoints (§6.6) ─────────────

  /**
   * @route   GET /api/v1/erp/partners
   * @desc    Retrieves all partner capital accounts
   * @access  Bearer JWT (DIRECTOR role or accounts:READ)
   */
  public static async getPartners(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const isActive = req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined;
      const partners = await PartnerService.getPartners({ isActive });

      res.status(200).json({
        success: true,
        statusCode: 200,
        total: partners.length,
        data: partners,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   POST /api/v1/erp/partners
   * @desc    Creates a new partnership capital account
   * @access  Bearer JWT (DIRECTOR role)
   */
  public static async createPartner(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const partner = await PartnerService.createPartner(req.body);

      res.status(201).json({
        success: true,
        statusCode: 201,
        message: 'Partner profile registered successfully',
        data: partner,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   POST /api/v1/erp/partners/distribute-profit
   * @desc    Distributes annual net profit among partners with Tier 4 Quorum and JV generation
   * @access  Bearer JWT (DIRECTOR role + Tier 4 Quorum)
   */
  public static async distributeProfit(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { fiscalYear, netProfitBDT } = req.body;

      const result = await PartnerService.distributeAnnualProfit(
        fiscalYear,
        netProfitBDT,
        undefined,
        userId
      );

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: `Annual profit for FY ${result.fiscalYear} distributed successfully`,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   POST /api/v1/erp/partners/:id/drawings
   * @desc    Records partner drawings against their capital account
   * @access  Bearer JWT (DIRECTOR role)
   */
  public static async recordDrawings(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user?.userId;
      const id = String(req.params.id);

      const result = await PartnerService.recordPartnerDrawings({
        partnerId: id,
        amountBDT: req.body.amountBDT,
        paymentAccountCode: req.body.paymentAccountCode,
        notes: req.body.notes,
        initiatingUserId: userId,
      });

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: `Drawings of ${result.drawingsAmount} BDT recorded successfully`,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default LoanController;
