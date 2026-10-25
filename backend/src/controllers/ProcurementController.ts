import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { SupplierService } from '../services/SupplierService';
import { RfqService } from '../services/RfqService';
import { ComparativeStatementService } from '../services/ComparativeStatementService';
import { PurchaseOrderService } from '../services/PurchaseOrderService';
import { ImportLcService } from '../services/ImportLcService';
import { LandedCostService } from '../services/LandedCostService';
import { ValidationError } from '../errors/AppError';

export class ProcurementController {
  /**
   * @route   GET /api/v1/erp/procurement/suppliers
   * @desc    Lists all suppliers with search, category filters, and pagination
   * @access  Bearer JWT (procurement:READ)
   */
  public static async listSuppliers(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { supplierType, country, currency, isActive, search, page, limit } = req.query;

      const result = await SupplierService.listSuppliers(
        {
          supplierType: supplierType ? String(supplierType) : undefined,
          country: country ? String(country) : undefined,
          currency: currency ? String(currency) : undefined,
          isActive: isActive !== undefined ? String(isActive) === 'true' : undefined,
          search: search ? String(search) : undefined,
        },
        {
          page: page ? parseInt(String(page), 10) : 1,
          limit: limit ? parseInt(String(limit), 10) : 20,
        }
      );

      res.status(200).json({
        success: true,
        statusCode: 200,
        data: result.data,
        meta: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   POST /api/v1/erp/procurement/suppliers
   * @desc    Registers a new supplier/vendor record
   * @access  Bearer JWT (procurement:CREATE or procurement:MANAGE)
   */
  public static async createSupplier(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const supplier = await SupplierService.createSupplier(req.body);

      res.status(201).json({
        success: true,
        statusCode: 201,
        message: 'Supplier registered successfully',
        data: supplier,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   GET /api/v1/erp/procurement/suppliers/:id
   * @desc    Retrieves a supplier profile by ObjectId
   * @access  Bearer JWT (procurement:READ)
   */
  public static async getSupplierById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const rawId = req.params.id;
      const id = Array.isArray(rawId) ? rawId[0] : rawId;

      if (!id || !Types.ObjectId.isValid(id)) {
        throw new ValidationError(`Invalid supplier ObjectId: '${id}'`);
      }

      const supplier = await SupplierService.getSupplierById(id);

      res.status(200).json({
        success: true,
        statusCode: 200,
        data: supplier,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   PUT /api/v1/erp/procurement/suppliers/:id
   * @desc    Updates an existing supplier profile, bank details, or SWIFT code
   * @access  Bearer JWT (procurement:UPDATE or procurement:MANAGE)
   */
  public static async updateSupplier(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const rawId = req.params.id;
      const id = Array.isArray(rawId) ? rawId[0] : rawId;

      if (!id || !Types.ObjectId.isValid(id)) {
        throw new ValidationError(`Invalid supplier ObjectId: '${id}'`);
      }

      const updated = await SupplierService.updateSupplier(id, req.body);

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Supplier updated successfully',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   POST /api/v1/erp/procurement/suppliers/:id/link-user
   * @desc    Links an authenticated portal user to a supplier record
   * @access  Bearer JWT (procurement:MANAGE)
   */
  public static async linkUserToSupplier(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const rawId = req.params.id;
      const id = Array.isArray(rawId) ? rawId[0] : rawId;
      const { userId } = req.body;

      if (!id || !Types.ObjectId.isValid(id)) {
        throw new ValidationError(`Invalid supplier ObjectId: '${id}'`);
      }

      const supplier = await SupplierService.linkUserToSupplier(id, userId);

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'User successfully linked to supplier',
        data: supplier,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   POST /api/v1/erp/procurement/rfqs
   * @desc    Broadcasts an RFQ tender for bidding
   * @access  Bearer JWT (procurement:CREATE or procurement:MANAGE)
   */
  public static async broadcastRfq(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const createdBy = req.user?.userId || new Types.ObjectId().toString();
      const rfq = await RfqService.broadcastRfq({
        ...req.body,
        createdBy,
      });

      res.status(201).json({
        success: true,
        statusCode: 201,
        message: 'RFQ tender broadcasted successfully',
        data: rfq,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   GET /api/v1/erp/procurement/rfqs
   * @desc    Lists open RFQ tenders
   * @access  Bearer JWT (procurement:READ)
   */
  public static async listRfqs(
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const rfqs = await RfqService.listRfqs();

      res.status(200).json({
        success: true,
        statusCode: 200,
        data: rfqs,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   GET /api/v1/erp/procurement/quotations
   * @desc    Lists supplier bid quotations across RFQs
   * @access  Bearer JWT (procurement:READ)
   */
  public static async listQuotations(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { rfqNumber, sku, supplierId, page, limit } = req.query;

      const result = await RfqService.listQuotations(
        {
          rfqNumber: rfqNumber ? String(rfqNumber) : undefined,
          sku: sku ? String(sku) : undefined,
          supplierId: supplierId ? String(supplierId) : undefined,
        },
        {
          page: page ? parseInt(String(page), 10) : 1,
          limit: limit ? parseInt(String(limit), 10) : 20,
        }
      );

      res.status(200).json({
        success: true,
        statusCode: 200,
        data: result.data,
        meta: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   POST /api/v1/erp/procurement/comparative-statements
   * @desc    Compiles submitted bids for an RFQ into a 100-point CS matrix with Gemini AI summary
   * @access  Bearer JWT (procurement:CREATE)
   */
  public static async compileComparativeStatement(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const preparedBy = req.user?.userId || new Types.ObjectId().toString();
      const cs = await ComparativeStatementService.compileComparativeStatement({
        rfqNumber: req.body.rfqNumber,
        csNumber: req.body.csNumber,
        preparedBy,
      });

      res.status(201).json({
        success: true,
        statusCode: 201,
        message: 'Comparative Statement compiled successfully with 100-point evaluation matrix',
        data: cs,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   GET /api/v1/erp/procurement/comparative-statements
   * @desc    Lists all Comparative Statements with filtering and pagination
   * @access  Bearer JWT (procurement:READ)
   */
  public static async listComparativeStatements(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { sku, status, productId, page, limit } = req.query;

      const result = await ComparativeStatementService.listComparativeStatements(
        {
          sku: sku ? String(sku) : undefined,
          status: status ? (String(status) as any) : undefined,
          productId: productId ? String(productId) : undefined,
        },
        {
          page: page ? parseInt(String(page), 10) : 1,
          limit: limit ? parseInt(String(limit), 10) : 20,
        }
      );

      res.status(200).json({
        success: true,
        statusCode: 200,
        data: result.data,
        meta: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   GET /api/v1/erp/procurement/comparative-statements/:id
   * @desc    Retrieves a Comparative Statement by ObjectId
   * @access  Bearer JWT (procurement:READ)
   */
  public static async getComparativeStatementById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const rawId = req.params.id;
      const id = Array.isArray(rawId) ? rawId[0] : rawId;

      if (!id || !Types.ObjectId.isValid(id)) {
        throw new ValidationError(`Invalid Comparative Statement ObjectId: '${id}'`);
      }

      const cs = await ComparativeStatementService.getById(id);

      res.status(200).json({
        success: true,
        statusCode: 200,
        data: cs,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   POST /api/v1/erp/procurement/comparative-statements/:id/generate-ai-summary
   * @desc    Re-evaluates and refreshes the Google Gemini AI procurement advisor summary
   * @access  Bearer JWT (procurement:UPDATE)
   */
  public static async generateAiSummary(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const rawId = req.params.id;
      const id = Array.isArray(rawId) ? rawId[0] : rawId;

      if (!id || !Types.ObjectId.isValid(id)) {
        throw new ValidationError(`Invalid Comparative Statement ObjectId: '${id}'`);
      }

      const cs = await ComparativeStatementService.generateAiSummary(id);

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Google Gemini AI executive procurement summary regenerated successfully',
        data: cs,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   PUT /api/v1/erp/procurement/comparative-statements/:id/finalize
   * @desc    Finalizes and locks a Comparative Statement
   * @access  Bearer JWT (procurement:APPROVE or procurement:MANAGE)
   */
  public static async finalizeComparativeStatement(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const rawId = req.params.id;
      const id = Array.isArray(rawId) ? rawId[0] : rawId;
      const approvedBy = req.user?.userId || new Types.ObjectId().toString();

      if (!id || !Types.ObjectId.isValid(id)) {
        throw new ValidationError(`Invalid Comparative Statement ObjectId: '${id}'`);
      }

      const cs = await ComparativeStatementService.finalizeComparativeStatement({
        csId: id,
        approvedBy,
      });

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Comparative Statement finalized successfully',
        data: cs,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   POST /api/v1/erp/procurement/purchase-orders/from-cs
   * @desc    Generates a Purchase Order from a finalized CS with automated Quorum Approval tier assignment
   * @access  Bearer JWT (procurement:CREATE)
   */
  public static async createPoFromCs(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user?.userId || new Types.ObjectId().toString();
      const { csId, winningBidId, ...options } = req.body;

      const result = await PurchaseOrderService.createPoFromCs(
        csId,
        winningBidId,
        userId,
        undefined,
        options
      );

      res.status(201).json({
        success: true,
        statusCode: 201,
        message: 'Purchase Order generated successfully',
        data: result.purchaseOrder,
        quorumApproval: result.quorumApproval,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   GET /api/v1/erp/procurement/purchase-orders/:id
   * @desc    Retrieves a Purchase Order by ObjectId
   * @access  Bearer JWT (procurement:READ)
   */
  public static async getPurchaseOrderById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const rawId = req.params.id;
      const id = Array.isArray(rawId) ? rawId[0] : rawId;

      if (!id || !Types.ObjectId.isValid(id)) {
        throw new ValidationError(`Invalid Purchase Order ObjectId: '${id}'`);
      }

      const po = await PurchaseOrderService.getById(id);

      res.status(200).json({
        success: true,
        statusCode: 200,
        data: po,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   GET /api/v1/erp/procurement/purchase-orders
   * @desc    Lists Purchase Orders with filtering and pagination
   * @access  Bearer JWT (procurement:READ)
   */
  public static async listPurchaseOrders(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { status, supplierId, approvalQuorumTier, search, page, limit } = req.query;

      const result = await PurchaseOrderService.listPurchaseOrders(
        {
          status: status ? (String(status) as any) : undefined,
          supplierId: supplierId ? String(supplierId) : undefined,
          approvalQuorumTier: approvalQuorumTier ? parseInt(String(approvalQuorumTier), 10) : undefined,
          search: search ? String(search) : undefined,
        },
        {
          page: page ? parseInt(String(page), 10) : 1,
          limit: limit ? parseInt(String(limit), 10) : 20,
        }
      );

      res.status(200).json({
        success: true,
        statusCode: 200,
        data: result.data,
        meta: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // ════════════════════════════════════════════════════════════════════════
  // IMPORT LETTERS OF CREDIT (LC) & DEMURRAGE
  // ════════════════════════════════════════════════════════════════════════

  /**
   * @route   POST /api/v1/erp/procurement/lcs
   * @desc    Opens a new Import Letter of Credit (LC) with 1st-Tier opening FX rate
   * @access  Bearer JWT (procurement:CREATE)
   */
  public static async createImportLc(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const lc = await ImportLcService.createImportLc(req.body);

      res.status(201).json({
        success: true,
        statusCode: 201,
        message: 'Import Letter of Credit opened successfully',
        data: lc,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   GET /api/v1/erp/procurement/lcs
   * @desc    Lists Import LCs with filters and pagination
   * @access  Bearer JWT (procurement:READ)
   */
  public static async listImportLcs(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { status, supplierId, search, page, limit } = req.query;

      const result = await ImportLcService.listImportLcs(
        {
          status: status ? (String(status) as any) : undefined,
          supplierId: supplierId ? String(supplierId) : undefined,
          search: search ? String(search) : undefined,
        },
        {
          page: page ? parseInt(String(page), 10) : 1,
          limit: limit ? parseInt(String(limit), 10) : 20,
        }
      );

      res.status(200).json({
        success: true,
        statusCode: 200,
        data: result.data,
        meta: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   GET /api/v1/erp/procurement/lcs/:id
   * @desc    Retrieves an Import LC by ObjectId
   * @access  Bearer JWT (procurement:READ)
   */
  public static async getImportLcById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const rawId = req.params.id;
      const id = Array.isArray(rawId) ? rawId[0] : rawId;

      if (!id || !Types.ObjectId.isValid(id)) {
        throw new ValidationError(`Invalid Import LC ObjectId: '${id}'`);
      }

      const lc = await ImportLcService.getById(id);

      res.status(200).json({
        success: true,
        statusCode: 200,
        data: lc,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   PUT /api/v1/erp/procurement/lcs/:id/stage
   * @desc    Transitions an LC through its lifecycle stages (DRAFT -> LC_OPENED -> SHIPMENT_IN_TRANSIT -> PORT_ARRIVED -> CUSTOMS_CLEARED -> FINAL_SETTLEMENT)
   * @access  Bearer JWT (procurement:UPDATE)
   */
  public static async transitionLcStage(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const rawId = req.params.id;
      const id = Array.isArray(rawId) ? rawId[0] : rawId;

      if (!id || !Types.ObjectId.isValid(id)) {
        throw new ValidationError(`Invalid Import LC ObjectId: '${id}'`);
      }

      const lc = await ImportLcService.transitionLcStage({
        lcId: id,
        ...req.body,
      });

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: `Import LC transitioned to stage '${lc.status}' successfully`,
        data: lc,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   PUT /api/v1/erp/procurement/lcs/:id/customs-assessment
   * @desc    Records 2nd-Tier FX Rate: Bill of Entry / Customs Assessment Rate
   * @access  Bearer JWT (procurement:UPDATE)
   */
  public static async recordCustomsAssessment(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const rawId = req.params.id;
      const id = Array.isArray(rawId) ? rawId[0] : rawId;

      if (!id || !Types.ObjectId.isValid(id)) {
        throw new ValidationError(`Invalid Import LC ObjectId: '${id}'`);
      }

      const lc = await ImportLcService.recordCustomsAssessment({
        lcId: id,
        ...req.body,
      });

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Customs assessment rate recorded successfully',
        data: lc,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   PUT /api/v1/erp/procurement/lcs/:id/settle
   * @desc    Records 3rd-Tier FX Rate: Final Bank Settlement Rate and realizes FX gain/loss
   * @access  Bearer JWT (procurement:UPDATE)
   */
  public static async settleLc(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const rawId = req.params.id;
      const id = Array.isArray(rawId) ? rawId[0] : rawId;

      if (!id || !Types.ObjectId.isValid(id)) {
        throw new ValidationError(`Invalid Import LC ObjectId: '${id}'`);
      }

      const lc = await ImportLcService.settleLc({
        lcId: id,
        ...req.body,
      });

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Import LC final settlement recorded successfully',
        data: lc,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   POST /api/v1/erp/procurement/lcs/:id/calculate-demurrage
   * @desc    Calculates port dwelling demurrage penalties based on free days
   * @access  Bearer JWT (procurement:READ or procurement:UPDATE)
   */
  public static async calculateDemurrage(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const rawId = req.params.id;
      const id = Array.isArray(rawId) ? rawId[0] : rawId;

      if (!id || !Types.ObjectId.isValid(id)) {
        throw new ValidationError(`Invalid Import LC ObjectId: '${id}'`);
      }

      const { arrivalDate, clearanceDate, dailyRateBDT } = req.body;
      const result = await ImportLcService.calculateAndSaveDemurrage(
        id,
        arrivalDate,
        clearanceDate,
        dailyRateBDT
      );

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Port demurrage penalty calculated successfully',
        demurrage: result.demurrage,
        data: result.lc,
      });
    } catch (error) {
      next(error);
    }
  }

  // ════════════════════════════════════════════════════════════════════════
  // LANDED COST BREAKDOWN & INVENTORY WAC CAPITALIZATION
  // ════════════════════════════════════════════════════════════════════════

  /**
   * @route   POST /api/v1/erp/procurement/landed-costs
   * @desc    Creates or updates landed cost breakdown sheet and allocates costs across SKUs
   * @access  Bearer JWT (procurement:CREATE)
   */
  public static async createOrUpdateLandedCost(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const reviewedBy = req.user?.userId || new Types.ObjectId().toString();
      const landedCost = await LandedCostService.createOrUpdateLandedCost({
        ...req.body,
        reviewedBy,
      });

      res.status(201).json({
        success: true,
        statusCode: 201,
        message: 'Landed cost sheet calculated and allocated successfully',
        data: landedCost,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   GET /api/v1/erp/procurement/landed-costs/:lcId
   * @desc    Retrieves landed cost sheet by LC ObjectId or LC number
   * @access  Bearer JWT (procurement:READ)
   */
  public static async getLandedCostByLcId(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const rawId = req.params.lcId;
      const lcId = Array.isArray(rawId) ? rawId[0] : rawId;

      const landedCost = await LandedCostService.getByLcId(lcId);

      res.status(200).json({
        success: true,
        statusCode: 200,
        data: landedCost,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   PUT /api/v1/erp/procurement/landed-costs/:lcId/finalize
   * @desc    Finalizes landed cost sheet, capitalizes batch WAC unit costs, records GRN, and posts balanced Journal Entry
   * @access  Bearer JWT (procurement:APPROVE or procurement:MANAGE)
   */
  public static async finalizeLandedCost(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const rawId = req.params.lcId;
      const lcId = Array.isArray(rawId) ? rawId[0] : rawId;
      const userId = req.user?.userId || new Types.ObjectId().toString();

      const result = await LandedCostService.finalizeLandedCost(lcId, userId);

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Landed cost finalized, batch WAC capitalized, GRN recorded, and Journal Entry posted',
        data: result.landedCost,
        batches: result.batches,
        journalEntry: result.journalEntry,
      });
    } catch (error) {
      next(error);
    }
  }
}



