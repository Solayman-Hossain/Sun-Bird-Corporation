import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { ChartOfAccountsModel } from '../models/ChartOfAccounts';
import { JournalEntryModel } from '../models/JournalEntry';
import { AccountingService } from '../services/AccountingService';
import { FinancialReportService } from '../services/FinancialReportService';
import { NotFoundError, ValidationError, UnauthorizedError } from '../errors/AppError';
import logger from '../config/logger';

// Standard 35 Chart of Accounts per PRD §4, Database.md §8, and api-spec.md §6.1
export const STANDARD_35_COA = [
  // ── Assets (1000s) ──────────────────────────────────────────────────────────
  { accountCode: 1010, accountName: 'Cash on Hand', accountType: 'ASSET' as const, normalBalance: 'DEBIT' as const, isControl: false },
  { accountCode: 1020, accountName: 'Bank Accounts — Operations', accountType: 'ASSET' as const, normalBalance: 'DEBIT' as const, isControl: false },
  { accountCode: 1030, accountName: 'Accounts Receivable — POS / MFS', accountType: 'ASSET' as const, normalBalance: 'DEBIT' as const, isControl: false },
  { accountCode: 1100, accountName: 'Accounts Receivable — Trade Debtors', accountType: 'ASSET' as const, normalBalance: 'DEBIT' as const, isControl: true },
  { accountCode: 1140, accountName: 'Employee Advances and Loans', accountType: 'ASSET' as const, normalBalance: 'DEBIT' as const, isControl: false },
  { accountCode: 1150, accountName: 'Partner & Director Loans Receivable', accountType: 'ASSET' as const, normalBalance: 'DEBIT' as const, isControl: false },
  { accountCode: 1200, accountName: 'Inventory Asset — Merchandise', accountType: 'ASSET' as const, normalBalance: 'DEBIT' as const, isControl: true },
  { accountCode: 1210, accountName: 'Inventory — Goods in Transit', accountType: 'ASSET' as const, normalBalance: 'DEBIT' as const, isControl: false },
  { accountCode: 1510, accountName: 'Fixed Assets — IT & Office Equipment', accountType: 'ASSET' as const, normalBalance: 'DEBIT' as const, isControl: false },
  { accountCode: 1520, accountName: 'Fixed Assets — Medical & Diagnostic Devices', accountType: 'ASSET' as const, normalBalance: 'DEBIT' as const, isControl: false },
  { accountCode: 1530, accountName: 'Fixed Assets — Vehicles & Delivery Fleet', accountType: 'ASSET' as const, normalBalance: 'DEBIT' as const, isControl: false },
  { accountCode: 1590, accountName: 'Accumulated Depreciation', accountType: 'ASSET' as const, normalBalance: 'CREDIT' as const, isControl: false },

  // ── Liabilities (2000s) ─────────────────────────────────────────────────────
  { accountCode: 2010, accountName: 'Accounts Payable — Trade Creditors', accountType: 'LIABILITY' as const, normalBalance: 'CREDIT' as const, isControl: true },
  { accountCode: 2020, accountName: 'Accounts Payable — Foreign Suppliers (Import LC)', accountType: 'LIABILITY' as const, normalBalance: 'CREDIT' as const, isControl: false },
  { accountCode: 2050, accountName: 'VAT Output Payable (Mushak-6.3)', accountType: 'LIABILITY' as const, normalBalance: 'CREDIT' as const, isControl: false },
  { accountCode: 2060, accountName: 'Supplementary Duty (SD) Payable', accountType: 'LIABILITY' as const, normalBalance: 'CREDIT' as const, isControl: false },
  { accountCode: 2070, accountName: 'Advance Income Tax (AIT) Withheld', accountType: 'LIABILITY' as const, normalBalance: 'CREDIT' as const, isControl: false },
  { accountCode: 2110, accountName: 'Short-Term Bank Borrowings & Overdraft', accountType: 'LIABILITY' as const, normalBalance: 'CREDIT' as const, isControl: false },
  { accountCode: 2120, accountName: 'Partner & Director Loans Payable', accountType: 'LIABILITY' as const, normalBalance: 'CREDIT' as const, isControl: false },
  { accountCode: 2130, accountName: 'Customer Advances and Deposits', accountType: 'LIABILITY' as const, normalBalance: 'CREDIT' as const, isControl: false },
  { accountCode: 2210, accountName: 'Long-Term Bank Loans', accountType: 'LIABILITY' as const, normalBalance: 'CREDIT' as const, isControl: false },

  // ── Equity (3000s) ──────────────────────────────────────────────────────────
  { accountCode: 3010, accountName: 'Partner Capital & Current Accounts', accountType: 'EQUITY' as const, normalBalance: 'CREDIT' as const, isControl: false },
  { accountCode: 3020, accountName: 'Retained Earnings & Accumulated Reserves', accountType: 'EQUITY' as const, normalBalance: 'CREDIT' as const, isControl: false },
  { accountCode: 3030, accountName: 'Partner Drawings', accountType: 'EQUITY' as const, normalBalance: 'DEBIT' as const, isControl: false },

  // ── Revenue (4000s) ─────────────────────────────────────────────────────────
  { accountCode: 4010, accountName: 'Sales Revenue — Healthcare & Equipment', accountType: 'REVENUE' as const, normalBalance: 'CREDIT' as const, isControl: false },
  { accountCode: 4020, accountName: 'Sales Revenue — General E-Commerce & Retail', accountType: 'REVENUE' as const, normalBalance: 'CREDIT' as const, isControl: false },
  { accountCode: 4030, accountName: 'Service & Installation Revenue', accountType: 'REVENUE' as const, normalBalance: 'CREDIT' as const, isControl: false },
  { accountCode: 4090, accountName: 'Other Revenue & Interest Income', accountType: 'REVENUE' as const, normalBalance: 'CREDIT' as const, isControl: false },
  { accountCode: 4095, accountName: 'Foreign Exchange Realized Gain', accountType: 'REVENUE' as const, normalBalance: 'CREDIT' as const, isControl: false },

  // ── Expenses (5000s & 6000s) ────────────────────────────────────────────────
  { accountCode: 5010, accountName: 'Cost of Goods Sold (COGS)', accountType: 'EXPENSE' as const, normalBalance: 'DEBIT' as const, isControl: false },
  { accountCode: 6010, accountName: 'Salaries & Staff Allowances', accountType: 'EXPENSE' as const, normalBalance: 'DEBIT' as const, isControl: false },
  { accountCode: 6020, accountName: 'Sales Commission & Staff Incentives', accountType: 'EXPENSE' as const, normalBalance: 'DEBIT' as const, isControl: false },
  { accountCode: 6110, accountName: 'Office Rent & Commercial Utilities', accountType: 'EXPENSE' as const, normalBalance: 'DEBIT' as const, isControl: false },
  { accountCode: 6210, accountName: 'Logistics, Freight & Courier Charges', accountType: 'EXPENSE' as const, normalBalance: 'DEBIT' as const, isControl: false },
  { accountCode: 6310, accountName: 'Depreciation Expense', accountType: 'EXPENSE' as const, normalBalance: 'DEBIT' as const, isControl: false },
  { accountCode: 6410, accountName: 'Interest & Financing Expense', accountType: 'EXPENSE' as const, normalBalance: 'DEBIT' as const, isControl: false },
  { accountCode: 6510, accountName: 'Foreign Exchange Realized Loss', accountType: 'EXPENSE' as const, normalBalance: 'DEBIT' as const, isControl: false },
];

export class AccountingController {
  /**
   * @route   GET /api/v1/erp/accounts/coa
   * @desc    Retrieves hierarchical 35 standard Sun Bird Chart of Accounts (1010 to 6510).
   *          Auto-seeds missing standard accounts if necessary.
   * @access  Bearer JWT (accounts:READ)
   */
  public static async getChartOfAccounts(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // 1. Ensure all 35 standard accounts exist
      const existingAccounts = await ChartOfAccountsModel.find({ isActive: true });
      if (existingAccounts.length < STANDARD_35_COA.length) {
        for (const item of STANDARD_35_COA) {
          const found = existingAccounts.some((a) => a.accountCode === item.accountCode);
          if (!found) {
            await ChartOfAccountsModel.findOneAndUpdate(
              { accountCode: item.accountCode },
              { $setOnInsert: { ...item, isActive: true } },
              { upsert: true, new: true }
            );
          }
        }
      }

      const allAccounts = await ChartOfAccountsModel.find({ isActive: true })
        .sort({ accountCode: 1 })
        .lean();

      res.status(200).json({
        success: true,
        statusCode: 200,
        total: allAccounts.length,
        data: allAccounts,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   POST /api/v1/erp/accounts/coa
   * @desc    Creates a new custom account in Chart of Accounts
   * @access  Bearer JWT (accounts:MANAGE)
   */
  public static async createChartOfAccount(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { accountCode, accountName, accountType, normalBalance, parentCode, isControl } =
        req.body;

      const existing = await ChartOfAccountsModel.findOne({ accountCode });
      if (existing) {
        throw new ValidationError(`Account code ${accountCode} already exists in Chart of Accounts`);
      }

      const created = await ChartOfAccountsModel.create({
        accountCode,
        accountName,
        accountType,
        normalBalance,
        parentCode,
        isControl: !!isControl,
        isActive: true,
      });

      res.status(201).json({
        success: true,
        statusCode: 201,
        message: 'Account created successfully in Chart of Accounts',
        data: created,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   POST /api/v1/erp/accounts/journals
   * @desc    Creates a double-entry balanced Journal Voucher with strict mathematical checks
   * @access  Bearer JWT (accounts:CREATE)
   */
  public static async createJournalEntry(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new UnauthorizedError('User authentication required to post journal vouchers');
      }

      const idempotencyKey =
        (req.header('X-Idempotency-Key') || req.body.idempotencyKey || '').trim() || undefined;

      const result = await AccountingService.createJournalVoucher(
        {
          ...req.body,
          idempotencyKey,
        },
        userId
      );

      res.status(201).json({
        success: true,
        statusCode: 201,
        message: 'Journal entry created successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   GET /api/v1/erp/accounts/journals
   * @desc    Lists journal vouchers with pagination and filtering
   * @access  Bearer JWT (accounts:READ)
   */
  public static async getJournalEntries(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
      const limit = Math.max(1, Math.min(100, parseInt(String(req.query.limit || '20'), 10)));
      const skip = (page - 1) * limit;

      const filter: any = {};
      if (req.query.status) filter.status = req.query.status;
      if (req.query.voucherType) filter.voucherType = req.query.voucherType;
      if (req.query.sourceDocumentRef) filter.sourceDocumentRef = req.query.sourceDocumentRef;
      if (req.query.accountCode) {
        filter['lines.accountCode'] = parseInt(String(req.query.accountCode), 10);
      }

      const [journals, total] = await Promise.all([
        JournalEntryModel.find(filter)
          .sort({ transactionDate: -1, createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        JournalEntryModel.countDocuments(filter),
      ]);

      res.status(200).json({
        success: true,
        statusCode: 200,
        data: journals,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   GET /api/v1/erp/accounts/journals/:voucherNo
   * @desc    Retrieves a single journal voucher by voucher number
   * @access  Bearer JWT (accounts:READ)
   */
  public static async getJournalEntryByVoucher(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const voucherNo = String(req.params.voucherNo).trim().toUpperCase();
      const journal = await JournalEntryModel.findOne({ voucherNo }).lean();

      if (!journal) {
        throw new NotFoundError(`Journal Voucher '${voucherNo}' not found`);
      }

      res.status(200).json({
        success: true,
        statusCode: 200,
        data: journal,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   POST /api/v1/erp/accounts/journals/:id/reverse
   * @desc    Reverses a posted journal voucher by generating an exact contra-entry
   * @access  Bearer JWT (accounts:POST)
   */
  public static async reverseJournalEntry(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new UnauthorizedError('User authentication required to reverse journal vouchers');
      }

      const { reason } = req.body;

      if (!reason || !reason.trim()) {
        throw new ValidationError('Reversal reason is mandatory');
      }

      const id = String(req.params.id);

      // Check whether id is an ObjectId or a voucherNo
      let targetVoucherNo: string;
      if (Types.ObjectId.isValid(id)) {
        const jv = await JournalEntryModel.findById(id);
        if (!jv) throw new NotFoundError(`Journal voucher not found with ID ${id}`);
        targetVoucherNo = jv.voucherNo;
      } else {
        targetVoucherNo = id;
      }

      const result = await AccountingService.reverseJournalVoucher(
        targetVoucherNo,
        reason.trim(),
        userId
      );

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: `Voucher ${targetVoucherNo} reversed successfully`,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   GET /api/v1/erp/accounts/reports/trial-balance
   * @desc    Aggregates real-time Trial Balance report
   * @access  Bearer JWT (finance:REPORTS)
   */
  public static async getTrialBalance(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const startDate = req.query.startDate ? new Date(String(req.query.startDate)) : undefined;
      const endDate = req.query.endDate ? new Date(String(req.query.endDate)) : undefined;

      const report = await FinancialReportService.getTrialBalance(startDate, endDate);

      res.status(200).json({
        success: true,
        statusCode: 200,
        data: report,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   GET /api/v1/erp/accounts/reports/profit-loss
   * @desc    Aggregates real-time Profit and Loss (Income Statement) report
   * @access  Bearer JWT (finance:REPORTS)
   */
  public static async getProfitAndLoss(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const startDate = req.query.startDate ? new Date(String(req.query.startDate)) : undefined;
      const endDate = req.query.endDate ? new Date(String(req.query.endDate)) : undefined;

      const report = await FinancialReportService.getProfitAndLoss(startDate, endDate);

      res.status(200).json({
        success: true,
        statusCode: 200,
        data: report,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   GET /api/v1/erp/accounts/reports/balance-sheet
   * @desc    Aggregates real-time Balance Sheet statement
   * @access  Bearer JWT (finance:REPORTS)
   */
  public static async getBalanceSheet(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const asOfDate = req.query.asOfDate ? new Date(String(req.query.asOfDate)) : new Date();

      const report = await FinancialReportService.getBalanceSheet(asOfDate);

      res.status(200).json({
        success: true,
        statusCode: 200,
        data: report,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   GET /api/v1/erp/accounts/reports/general-ledger
   * @desc    Generates drill-down chronological General Ledger statement for an account
   * @access  Bearer JWT (finance:REPORTS)
   */
  public static async getGeneralLedger(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.query.accountCode) {
        throw new ValidationError("Query parameter 'accountCode' is required");
      }

      const accountCode = parseInt(String(req.query.accountCode), 10);
      const startDate = req.query.startDate ? new Date(String(req.query.startDate)) : undefined;
      const endDate = req.query.endDate ? new Date(String(req.query.endDate)) : undefined;

      const report = await FinancialReportService.getGeneralLedgerDrilldown(
        accountCode,
        startDate,
        endDate
      );

      res.status(200).json({
        success: true,
        statusCode: 200,
        data: report,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default AccountingController;
