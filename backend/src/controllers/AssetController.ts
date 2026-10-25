import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { FixedAssetModel } from '../models/FixedAsset';
import { FixedAssetService } from '../services/FixedAssetService';
import { NotFoundError, ValidationError, UnauthorizedError } from '../errors/AppError';

export class AssetController {
  /**
   * @route   POST /api/v1/erp/assets
   * @desc    Registers a new Fixed Asset with automatic SLM monthly depreciation calculation
   * @access  Bearer JWT (finance:MANAGE)
   */
  public static async registerAsset(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const asset = await FixedAssetService.registerAsset(req.body);

      res.status(201).json({
        success: true,
        statusCode: 201,
        message: 'Fixed asset registered successfully',
        data: asset,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   GET /api/v1/erp/assets
   * @desc    Lists all fixed assets with filtering and pagination
   * @access  Bearer JWT (finance:READ)
   */
  public static async getAssets(
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
      if (req.query.category) filter.category = req.query.category;
      if (req.query.warehouseId) {
        filter.warehouseId = new Types.ObjectId(String(req.query.warehouseId));
      }

      const [assets, total] = await Promise.all([
        FixedAssetModel.find(filter)
          .sort({ purchaseDate: -1, createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        FixedAssetModel.countDocuments(filter),
      ]);

      res.status(200).json({
        success: true,
        statusCode: 200,
        data: assets,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   GET /api/v1/erp/assets/:id
   * @desc    Retrieves a fixed asset by id or asset code
   * @access  Bearer JWT (finance:READ)
   */
  public static async getAssetById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = String(req.params.id);

      let asset;
      if (Types.ObjectId.isValid(id)) {
        asset = await FixedAssetModel.findById(id).lean();
      } else {
        asset = await FixedAssetModel.findOne({ assetCode: id.trim().toUpperCase() }).lean();
      }

      if (!asset) {
        throw new NotFoundError(`Asset '${id}' not found`);
      }

      res.status(200).json({
        success: true,
        statusCode: 200,
        data: asset,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   POST /api/v1/erp/assets/run-depreciation
   * @desc    Executes monthly straight-line depreciation run across active assets and posts JV
   * @access  Bearer JWT (finance:MANAGE)
   */
  public static async runMonthlyDepreciation(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new UnauthorizedError('User authentication required to execute depreciation run');
      }

      const { fiscalMonthYear } = req.body;
      const result = await FixedAssetService.runMonthlyDepreciation(fiscalMonthYear, userId);

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: `Monthly depreciation executed for ${result.fiscalMonthYear}`,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   POST /api/v1/erp/assets/:id/dispose
   * @desc    Disposes or sells a fixed asset
   * @access  Bearer JWT (finance:MANAGE)
   */
  public static async disposeAsset(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new UnauthorizedError('User authentication required to dispose assets');
      }

      const id = String(req.params.id);
      const result = await FixedAssetService.disposeAsset(id, req.body, userId);

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Fixed asset disposed successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default AssetController;
