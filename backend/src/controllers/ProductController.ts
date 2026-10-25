import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { ProductModel, IProduct } from '../models/Product';
import { ProductBatchModel } from '../models/ProductBatch';
import { UomConversionModel } from '../models/UomConversion';
import { NotFoundError, DuplicateKeyError, ValidationError } from '../errors/AppError';

export class ProductController {
  /**
   * @route   GET /api/v1/public/products
   * @desc    Lists active storefront products with search, filtering, and stock badges
   * @access  Public
   */
  public static async listPublicProducts(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { category, brand, search, inStockOnly, sort } = req.query;

      const filter: Record<string, any> = { isActive: true };

      if (category) {
        filter.category = String(category).trim();
      }
      if (brand) {
        filter.brand = new RegExp(String(brand).trim(), 'i');
      }
      if (search) {
        const searchRegex = new RegExp(String(search).trim(), 'i');
        filter.$or = [
          { sku: searchRegex },
          { nameEn: searchRegex },
          { nameBn: searchRegex },
          { brand: searchRegex },
          { barcodes: searchRegex },
        ];
      }

      // Handle pagination
      const page = Math.max(1, parseInt(String(req.query.page), 10) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit), 10) || 20));
      const skip = (page - 1) * limit;

      // Handle sorting
      let sortOption: Record<string, 1 | -1> = { createdAt: -1 };
      if (sort) {
        const sortStr = String(sort).trim();
        if (sortStr.startsWith('-')) {
          sortOption = { [sortStr.substring(1)]: -1 };
        } else {
          sortOption = { [sortStr]: 1 };
        }
      }

      // Query database
      const [products, total] = await Promise.all([
        ProductModel.find(filter)
          .select('-createdBy -__v')
          .sort(sortOption)
          .skip(skip)
          .limit(limit)
          .lean(),
        ProductModel.countDocuments(filter),
      ]);

      // Calculate stock status for retrieved products
      const productSkus = products.map((p) => p.sku);
      const stockBatches = await ProductBatchModel.aggregate([
        {
          $match: {
            sku: { $in: productSkus },
            currentQty: { $gt: 0 },
            $or: [
              { category: 'NON_EXPIRING' },
              { expiryDate: { $gt: new Date() } },
            ],
          },
        },
        {
          $group: {
            _id: '$sku',
            totalAvailableQty: { $sum: '$currentQty' },
          },
        },
      ]);

      const stockMap = new Map<string, number>();
      stockBatches.forEach((batch) => {
        stockMap.set(batch._id, batch.totalAvailableQty);
      });

      let items = products.map((product) => {
        const availableQty = stockMap.get(product.sku) || 0;
        return {
          ...product,
          inStock: availableQty > 0,
          availableStock: availableQty,
        };
      });

      if (String(inStockOnly) === 'true') {
        items = items.filter((p) => p.inStock);
      }

      res.status(200).json({
        success: true,
        statusCode: 200,
        data: items,
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   GET /api/v1/public/products/:idOrSku
   * @desc    Retrieves public product detail by ObjectId or SKU
   * @access  Public
   */
  public static async getPublicProductDetail(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const rawIdOrSku = req.params.idOrSku;
      const idOrSku = Array.isArray(rawIdOrSku) ? rawIdOrSku[0] : rawIdOrSku;

      if (!idOrSku) {
        throw new ValidationError('Product ID or SKU is required');
      }

      let product = null;
      if (Types.ObjectId.isValid(idOrSku)) {
        product = await ProductModel.findOne({ _id: idOrSku, isActive: true }).lean();
      }

      if (!product) {
        product = await ProductModel.findOne({
          sku: idOrSku.trim().toUpperCase(),
          isActive: true,
        }).lean();
      }

      if (!product) {
        throw new NotFoundError(`Product '${idOrSku}' not found or inactive`);
      }

      // Check stock availability across batches
      const stockBatches = await ProductBatchModel.find({
        sku: product.sku,
        currentQty: { $gt: 0 },
        $or: [
          { category: 'NON_EXPIRING' },
          { expiryDate: { $gt: new Date() } },
        ],
      }).select('batchNumber expiryDate currentQty warehouseId');

      const totalAvailable = stockBatches.reduce((acc, b) => acc + b.currentQty, 0);

      res.status(200).json({
        success: true,
        statusCode: 200,
        data: {
          ...product,
          inStock: totalAvailable > 0,
          availableStock: totalAvailable,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   POST /api/v1/erp/products
   * @desc    Registers a new master product SKU
   * @access  Bearer JWT (products:CREATE)
   */
  public static async createProduct(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { sku, ...rest } = req.body;
      const normalizedSku = sku.trim().toUpperCase();

      const existing = await ProductModel.findOne({ sku: normalizedSku });
      if (existing) {
        throw new DuplicateKeyError(`Product with SKU '${normalizedSku}' already exists`);
      }

      const product = await ProductModel.create({
        sku: normalizedSku,
        ...rest,
        showroomPrice: rest.showroomPrice !== undefined ? rest.showroomPrice : rest.retailPrice,
        createdBy: req.user?.userId ? new Types.ObjectId(req.user.userId) : undefined,
      });

      res.status(201).json({
        success: true,
        statusCode: 201,
        message: 'Product registered successfully',
        data: product,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   PUT /api/v1/erp/products/:id
   * @desc    Updates master product SKU details
   * @access  Bearer JWT (products:UPDATE)
   */
  public static async updateProduct(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const rawId = req.params.id;
      const id = Array.isArray(rawId) ? rawId[0] : rawId;

      if (!id || !Types.ObjectId.isValid(id)) {
        throw new ValidationError(`Invalid product ObjectId: '${id}'`);
      }

      const updateData = { ...req.body };

      if (updateData.sku) {
        updateData.sku = updateData.sku.trim().toUpperCase();
        const existing = await ProductModel.findOne({
          sku: updateData.sku,
          _id: { $ne: id },
        });
        if (existing) {
          throw new DuplicateKeyError(`Product with SKU '${updateData.sku}' already exists`);
        }
      }

      const product = await ProductModel.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
      );

      if (!product) {
        throw new NotFoundError(`Product with ID '${id}' not found`);
      }

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Product updated successfully',
        data: product,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   DELETE /api/v1/erp/products/:id
   * @desc    Deactivates a product SKU (soft delete)
   * @access  Bearer JWT (products:DELETE)
   */
  public static async deactivateProduct(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const rawId = req.params.id;
      const id = Array.isArray(rawId) ? rawId[0] : rawId;

      if (!id || !Types.ObjectId.isValid(id)) {
        throw new ValidationError(`Invalid product ObjectId: '${id}'`);
      }

      const product = await ProductModel.findByIdAndUpdate(
        id,
        { $set: { isActive: false } },
        { new: true }
      );

      if (!product) {
        throw new NotFoundError(`Product with ID '${id}' not found`);
      }

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: `Product '${product.sku}' deactivated successfully`,
        data: product,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   POST /api/v1/erp/products/uom-conversions
   * @desc    Creates or updates a multi-UOM conversion factor
   * @access  Bearer JWT (products:MANAGE or products:CREATE)
   */
  public static async createUomConversion(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { productId, sku, fromUom, toUom, conversionFactor } = req.body;

      const normalizedSku = sku.trim().toUpperCase();
      const product = await ProductModel.findById(productId);
      if (!product) {
        throw new NotFoundError(`Product with ID '${productId}' not found`);
      }

      const uomConversion = await UomConversionModel.findOneAndUpdate(
        {
          productId: new Types.ObjectId(productId),
          fromUom: fromUom.trim(),
          toUom: toUom.trim(),
        },
        {
          sku: normalizedSku,
          conversionFactor,
        },
        { upsert: true, new: true, runValidators: true }
      );

      res.status(201).json({
        success: true,
        statusCode: 201,
        message: `UOM conversion 1 ${fromUom} = ${conversionFactor} ${toUom} saved successfully`,
        data: uomConversion,
      });
    } catch (error) {
      next(error);
    }
  }
}
