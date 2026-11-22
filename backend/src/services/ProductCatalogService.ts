import { Types } from 'mongoose';
import { ProductModel, IProduct, ProductPublicationStatus } from '../models/Product';
import { ProductBatchModel } from '../models/ProductBatch';
import { CategoryModel } from '../models/Category';
import { BrandModel } from '../models/Brand';
import { NotFoundError, ValidationError, DuplicateKeyError } from '../errors/AppError';
import { AuditLogService } from './AuditLogService';
import { ApprovalService } from './ApprovalService';

export interface ProductQueryFilters {
  organizationId?: string;
  category?: string;
  brand?: string;
  status?: string;
  publicationStatus?: string;
  search?: string;
  inStockOnly?: boolean;
  minPrice?: number;
  maxPrice?: number;
  isFeatured?: boolean;
  isNewArrival?: boolean;
  isBestSeller?: boolean;
  page?: number;
  limit?: number;
  sort?: string;
}

export interface ProductMasterDTO {
  organizationId?: string;
  sku: string;
  productCode?: string;
  barcode?: string;
  internalReference?: string;
  nameEn: string;
  nameBn?: string;
  category: string;
  categoryId?: string;
  hsCode?: string;
  baseUom?: string;
  purchaseUnit?: string;
  salesUnit?: string;
  brand?: string;
  brandId?: string;
  manufacturer?: string;
  modelNumber?: string;
  productType?: string;
  description?: string;
  shortDescription?: string;
  isMedical?: boolean;
  isExpirable?: boolean;
  minStockQty?: number;
  weight?: number;
  length?: number;
  width?: number;
  height?: number;
  volume?: number;
  purchasePrice?: number;
  costPrice?: number;
  defaultSalesPrice?: number;
  minSalesPrice?: number;
  wholesalePrice?: number;
  retailPrice: number;
  showroomPrice: number;
  taxRate?: number;
  warrantyPeriod?: string;
  reorderLevel?: number;
  barcodes?: string[];
  status?: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
}

export class ProductCatalogService {
  /**
   * Helper: Generate URL slug
   */
  public static generateSlug(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * 1. Product Dashboard Analytics
   */
  public static async getProductDashboardMetrics(organizationId?: string): Promise<any> {
    const baseFilter: Record<string, any> = {};
    if (organizationId) {
      baseFilter.organizationId = new Types.ObjectId(organizationId);
    }

    const [
      totalProducts,
      activeProducts,
      inactiveProducts,
      draftProducts,
      publishedProducts,
      unpublishedProducts,
      pendingApprovalProducts,
      noImagesProducts,
      noSeoProducts,
      categoryCounts,
      brandCounts,
      allProducts,
    ] = await Promise.all([
      ProductModel.countDocuments(baseFilter),
      ProductModel.countDocuments({ ...baseFilter, status: 'ACTIVE', isActive: true }),
      ProductModel.countDocuments({ ...baseFilter, status: 'INACTIVE' }),
      ProductModel.countDocuments({ ...baseFilter, publicationStatus: 'DRAFT' }),
      ProductModel.countDocuments({ ...baseFilter, publicationStatus: 'PUBLISHED' }),
      ProductModel.countDocuments({ ...baseFilter, publicationStatus: 'UNPUBLISHED' }),
      ProductModel.countDocuments({ ...baseFilter, publicationStatus: 'PENDING_APPROVAL' }),
      ProductModel.countDocuments({
        ...baseFilter,
        $or: [{ gallery: { $exists: false } }, { gallery: { $size: 0 } }],
      }),
      ProductModel.countDocuments({
        ...baseFilter,
        $and: [
          { $or: [{ 'seo.seoTitle': { $exists: false } }, { 'seo.seoTitle': '' }] },
          { $or: [{ 'seoContent.metaTitle': { $exists: false } }, { 'seoContent.metaTitle': '' }] },
        ],
      }),
      ProductModel.aggregate([
        { $match: baseFilter },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      ProductModel.aggregate([
        { $match: { ...baseFilter, brand: { $ne: null } } },
        { $group: { _id: '$brand', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      ProductModel.find(baseFilter).select('sku minStockQty').lean(),
    ]);

    // Calculate live stock status using ProductBatch
    const skus = allProducts.map((p) => p.sku);
    const stockBatches = await ProductBatchModel.aggregate([
      { $match: { sku: { $in: skus }, currentQty: { $gt: 0 } } },
      { $group: { _id: '$sku', available: { $sum: '$currentQty' } } },
    ]);
    const stockMap = new Map<string, number>();
    stockBatches.forEach((sb) => stockMap.set(sb._id, sb.available));

    let outOfStockCount = 0;
    let lowStockCount = 0;
    let inStockCount = 0;

    allProducts.forEach((p) => {
      const avail = stockMap.get(p.sku) || 0;
      if (avail <= 0) {
        outOfStockCount++;
      } else if (avail <= (p.minStockQty || 10)) {
        lowStockCount++;
      } else {
        inStockCount++;
      }
    });

    return {
      totalProducts,
      activeProducts,
      inactiveProducts,
      draftProducts,
      publishedProducts,
      unpublishedProducts,
      pendingApprovalProducts,
      outOfStockCount,
      lowStockCount,
      inStockCount,
      noImagesProducts,
      noSeoProducts,
      categoriesDistribution: categoryCounts.map((c) => ({ category: c._id || 'Unassigned', count: c.count })),
      brandsDistribution: brandCounts.map((b) => ({ brand: b._id || 'Unbranded', count: b.count })),
      publicationRatio: {
        published: publishedProducts,
        unpublished: unpublishedProducts + draftProducts,
        pending: pendingApprovalProducts,
      },
    };
  }

  /**
   * 2. List Products (ERP Master)
   */
  public static async listProducts(
    filters: ProductQueryFilters,
    includeInternalCost = false
  ): Promise<{ items: any[]; total: number; page: number; limit: number; totalPages: number }> {
    const mongoFilter: Record<string, any> = {};

    if (filters.organizationId) {
      mongoFilter.organizationId = new Types.ObjectId(filters.organizationId);
    }
    if (filters.category && filters.category !== 'ALL') {
      mongoFilter.category = filters.category;
    }
    if (filters.brand && filters.brand !== 'ALL') {
      mongoFilter.brand = filters.brand;
    }
    if (filters.status && filters.status !== 'ALL') {
      mongoFilter.status = filters.status;
    }
    if (filters.publicationStatus && filters.publicationStatus !== 'ALL') {
      mongoFilter.publicationStatus = filters.publicationStatus;
    }
    if (filters.isFeatured !== undefined) {
      mongoFilter['ecommerceCatalog.isFeatured'] = filters.isFeatured;
    }
    if (filters.isNewArrival !== undefined) {
      mongoFilter['ecommerceCatalog.isNewArrival'] = filters.isNewArrival;
    }
    if (filters.isBestSeller !== undefined) {
      mongoFilter['ecommerceCatalog.isBestSeller'] = filters.isBestSeller;
    }

    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      mongoFilter.retailPrice = {};
      if (filters.minPrice !== undefined) mongoFilter.retailPrice.$gte = filters.minPrice;
      if (filters.maxPrice !== undefined) mongoFilter.retailPrice.$lte = filters.maxPrice;
    }

    if (filters.search) {
      const q = String(filters.search).trim();
      const sRegex = new RegExp(q, 'i');
      mongoFilter.$or = [
        { sku: sRegex },
        { productCode: sRegex },
        { barcode: sRegex },
        { nameEn: sRegex },
        { nameBn: sRegex },
        { brand: sRegex },
        { 'seo.slug': sRegex },
        { barcodes: sRegex },
      ];
    }

    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(100, Math.max(1, filters.limit || 20));
    const skip = (page - 1) * limit;

    let sortObj: Record<string, 1 | -1> = { createdAt: -1 };
    if (filters.sort) {
      const s = filters.sort;
      if (s === 'price_asc') sortObj = { retailPrice: 1 };
      else if (s === 'price_desc') sortObj = { retailPrice: -1 };
      else if (s === 'name_asc') sortObj = { nameEn: 1 };
      else if (s === 'name_desc') sortObj = { nameEn: -1 };
      else if (s === 'oldest') sortObj = { createdAt: 1 };
      else if (s === 'newest') sortObj = { createdAt: -1 };
    }

    // Projection: Strip purchasePrice and costPrice if includeInternalCost is false
    let projection = '-__v';
    if (!includeInternalCost) {
      projection += ' -purchasePrice -costPrice -landedCost -supplier -costPerUnit -supplierPrice -supplierId -unitCost';
    }

    const [products, total] = await Promise.all([
      ProductModel.find(mongoFilter)
        .select(projection)
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .lean(),
      ProductModel.countDocuments(mongoFilter),
    ]);

    // Aggregate live stock from ProductBatch
    const productSkus = products.map((p) => p.sku);
    const stockBatches = await ProductBatchModel.aggregate([
      { $match: { sku: { $in: productSkus }, currentQty: { $gt: 0 } } },
      { $group: { _id: '$sku', availableStock: { $sum: '$currentQty' } } },
    ]);
    const stockMap = new Map<string, number>();
    stockBatches.forEach((sb) => stockMap.set(sb._id, sb.availableStock));

    let items = products.map((p) => {
      const availableStock = stockMap.get(p.sku) || 0;
      return {
        ...p,
        availableStock,
        inStock: availableStock > 0,
      };
    });

    if (filters.inStockOnly) {
      items = items.filter((p) => p.inStock);
    }

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 3. Get Product By ID or SKU
   */
  public static async getProductByIdOrSku(
    idOrSku: string,
    includeInternalCost = false
  ): Promise<any> {
    const query = Types.ObjectId.isValid(idOrSku)
      ? { $or: [{ _id: new Types.ObjectId(idOrSku) }, { sku: idOrSku.toUpperCase() }] }
      : { sku: idOrSku.toUpperCase() };

    let projection = '-__v';
    if (!includeInternalCost) {
      projection += ' -purchasePrice -costPrice -landedCost -supplier -costPerUnit -supplierPrice -supplierId -unitCost';
    }

    const product = await ProductModel.findOne(query).select(projection).lean();
    if (!product) {
      throw new NotFoundError(`Product '${idOrSku}' not found.`);
    }

    // Retrieve active stock batches
    const batches = await ProductBatchModel.find({
      sku: product.sku,
      currentQty: { $gt: 0 },
    })
      .select('batchNumber expiryDate currentQty warehouseId locationStatus')
      .lean();

    const availableStock = batches.reduce((acc, b) => acc + (b.currentQty || 0), 0);

    return {
      ...product,
      availableStock,
      inStock: availableStock > 0,
      stockBatches: batches,
    };
  }

  /**
   * 4. Create Product (ERP Product Master)
   */
  public static async createProduct(dto: ProductMasterDTO, actorId?: string): Promise<IProduct> {
    const cleanSku = dto.sku.toUpperCase().trim();

    const existing = await ProductModel.findOne({ sku: cleanSku });
    if (existing) {
      throw new DuplicateKeyError(`Product with SKU '${cleanSku}' already exists in Product Master.`);
    }

    const slug = this.generateSlug(dto.nameEn);

    const product = new ProductModel({
      organizationId: dto.organizationId ? new Types.ObjectId(dto.organizationId) : undefined,
      sku: cleanSku,
      productCode: dto.productCode || cleanSku,
      barcode: dto.barcode,
      internalReference: dto.internalReference,
      nameEn: dto.nameEn,
      nameBn: dto.nameBn,
      category: dto.category,
      categoryId: dto.categoryId ? new Types.ObjectId(dto.categoryId) : undefined,
      hsCode: dto.hsCode || '9018.39.00',
      baseUom: dto.baseUom || 'PCS',
      purchaseUnit: dto.purchaseUnit || dto.baseUom || 'PCS',
      salesUnit: dto.salesUnit || dto.baseUom || 'PCS',
      brand: dto.brand,
      brandId: dto.brandId ? new Types.ObjectId(dto.brandId) : undefined,
      manufacturer: dto.manufacturer,
      modelNumber: dto.modelNumber,
      productType: dto.productType || 'FINISHED_GOODS',
      description: dto.description,
      shortDescription: dto.shortDescription,
      isMedical: dto.isMedical !== false,
      isExpirable: dto.isExpirable || false,
      minStockQty: dto.minStockQty || 0,
      weight: dto.weight || 0,
      length: dto.length || 0,
      width: dto.width || 0,
      height: dto.height || 0,
      volume: dto.volume || 0,
      purchasePrice: dto.purchasePrice || 0,
      costPrice: dto.costPrice || dto.purchasePrice || 0,
      defaultSalesPrice: dto.defaultSalesPrice || dto.retailPrice,
      minSalesPrice: dto.minSalesPrice || 0,
      wholesalePrice: dto.wholesalePrice || dto.showroomPrice || dto.retailPrice,
      retailPrice: dto.retailPrice,
      showroomPrice: dto.showroomPrice || dto.retailPrice,
      resellerTierPrices: [
        { tier: 1, price: dto.retailPrice * 0.95 },
        { tier: 2, price: dto.retailPrice * 0.9 },
        { tier: 3, price: dto.retailPrice * 0.85 },
      ],
      taxRate: dto.taxRate || 0,
      warrantyPeriod: dto.warrantyPeriod,
      reorderLevel: dto.reorderLevel || 10,
      barcodes: dto.barcodes || (dto.barcode ? [dto.barcode] : []),
      status: dto.status || 'ACTIVE',
      publicationStatus: 'DRAFT',
      seo: {
        seoTitle: dto.nameEn,
        metaDescription: dto.shortDescription || dto.description,
        slug,
      },
      seoContent: {
        metaTitle: dto.nameEn,
        descriptionEn: dto.description,
        descriptionBn: dto.nameBn,
      },
      createdBy: actorId ? new Types.ObjectId(actorId) : undefined,
    });

    await product.save();

    if (actorId) {
      await AuditLogService.record({
        action: 'PRODUCT_CREATE',
        targetCollection: 'products',
        targetId: product._id,
        actorId: new Types.ObjectId(actorId),
        diff: { sku: cleanSku, nameEn: dto.nameEn, retailPrice: dto.retailPrice },
        module: 'PRODUCTS',
      });
    }

    return product;
  }

  /**
   * 5. Update Product Master
   */
  public static async updateProduct(
    id: string,
    dto: Partial<ProductMasterDTO>,
    actorId?: string
  ): Promise<IProduct> {
    const product = await ProductModel.findById(id);
    if (!product) throw new NotFoundError(`Product '${id}' not found.`);

    if (dto.nameEn) product.nameEn = dto.nameEn;
    if (dto.nameBn !== undefined) product.nameBn = dto.nameBn;
    if (dto.category) product.category = dto.category;
    if (dto.categoryId) product.categoryId = new Types.ObjectId(dto.categoryId);
    if (dto.brand !== undefined) product.brand = dto.brand;
    if (dto.brandId) product.brandId = new Types.ObjectId(dto.brandId);
    if (dto.hsCode) product.hsCode = dto.hsCode;
    if (dto.baseUom) product.baseUom = dto.baseUom;
    if (dto.purchaseUnit) product.purchaseUnit = dto.purchaseUnit;
    if (dto.salesUnit) product.salesUnit = dto.salesUnit;
    if (dto.productType) product.productType = dto.productType as any;
    if (dto.manufacturer !== undefined) product.manufacturer = dto.manufacturer;
    if (dto.modelNumber !== undefined) product.modelNumber = dto.modelNumber;
    if (dto.description !== undefined) product.description = dto.description;
    if (dto.shortDescription !== undefined) product.shortDescription = dto.shortDescription;
    if (dto.weight !== undefined) product.weight = dto.weight;
    if (dto.length !== undefined) product.length = dto.length;
    if (dto.width !== undefined) product.width = dto.width;
    if (dto.height !== undefined) product.height = dto.height;
    if (dto.volume !== undefined) product.volume = dto.volume;
    if (dto.purchasePrice !== undefined) product.purchasePrice = dto.purchasePrice;
    if (dto.costPrice !== undefined) product.costPrice = dto.costPrice;
    if (dto.defaultSalesPrice !== undefined) product.defaultSalesPrice = dto.defaultSalesPrice;
    if (dto.minSalesPrice !== undefined) product.minSalesPrice = dto.minSalesPrice;
    if (dto.wholesalePrice !== undefined) product.wholesalePrice = dto.wholesalePrice;
    if (dto.retailPrice !== undefined) product.retailPrice = dto.retailPrice;
    if (dto.showroomPrice !== undefined) product.showroomPrice = dto.showroomPrice;
    if (dto.taxRate !== undefined) product.taxRate = dto.taxRate;
    if (dto.warrantyPeriod !== undefined) product.warrantyPeriod = dto.warrantyPeriod;
    if (dto.reorderLevel !== undefined) product.reorderLevel = dto.reorderLevel;
    if (dto.minStockQty !== undefined) product.minStockQty = dto.minStockQty;
    if (dto.barcode !== undefined) product.barcode = dto.barcode;
    if (dto.status !== undefined) {
      product.status = dto.status;
      product.isActive = dto.status === 'ACTIVE';
    }

    if (actorId) product.updatedBy = new Types.ObjectId(actorId);

    await product.save();

    if (actorId) {
      await AuditLogService.record({
        action: 'PRODUCT_UPDATE',
        targetCollection: 'products',
        targetId: product._id,
        actorId: new Types.ObjectId(actorId),
        diff: dto,
        module: 'PRODUCTS',
      });
    }

    return product;
  }

  /**
   * 6. Update E-Commerce Catalog Metadata
   */
  public static async updateCatalog(
    productId: string,
    catalog: any,
    actorId?: string
  ): Promise<IProduct> {
    const product = await ProductModel.findById(productId);
    if (!product) throw new NotFoundError(`Product '${productId}' not found.`);

    product.ecommerceCatalog = {
      websiteName: catalog.websiteName || product.ecommerceCatalog?.websiteName || product.nameEn,
      websiteShortDesc: catalog.websiteShortDesc ?? product.ecommerceCatalog?.websiteShortDesc,
      websiteFullDesc: catalog.websiteFullDesc ?? product.ecommerceCatalog?.websiteFullDesc,
      highlights: catalog.highlights || product.ecommerceCatalog?.highlights || [],
      specifications: catalog.specifications || product.ecommerceCatalog?.specifications || {},
      features: catalog.features || product.ecommerceCatalog?.features || [],
      tags: catalog.tags || product.ecommerceCatalog?.tags || [],
      searchKeywords: catalog.searchKeywords || product.ecommerceCatalog?.searchKeywords || [],
      isFeatured: catalog.isFeatured ?? product.ecommerceCatalog?.isFeatured ?? false,
      isNewArrival: catalog.isNewArrival ?? product.ecommerceCatalog?.isNewArrival ?? false,
      isBestSeller: catalog.isBestSeller ?? product.ecommerceCatalog?.isBestSeller ?? false,
      isPromotional: catalog.isPromotional ?? product.ecommerceCatalog?.isPromotional ?? false,
      promotionalPrice: catalog.promotionalPrice ?? product.ecommerceCatalog?.promotionalPrice,
      relatedProductSkus: catalog.relatedProductSkus || product.ecommerceCatalog?.relatedProductSkus || [],
      frequentlyBoughtTogetherSkus: catalog.frequentlyBoughtTogetherSkus || product.ecommerceCatalog?.frequentlyBoughtTogetherSkus || [],
    };

    await product.save();

    if (actorId) {
      await AuditLogService.record({
        action: 'PRODUCT_CATALOG_UPDATE',
        targetCollection: 'products',
        targetId: product._id,
        actorId: new Types.ObjectId(actorId),
        diff: catalog,
        module: 'PRODUCTS',
      });
    }

    return product;
  }

  /**
   * 7. Update Gallery Images
   */
  public static async updateGallery(
    productId: string,
    images: Array<{ url: string; altText?: string; caption?: string; isMain?: boolean; sortOrder: number }>,
    actorId?: string
  ): Promise<IProduct> {
    const product = await ProductModel.findById(productId);
    if (!product) throw new NotFoundError(`Product '${productId}' not found.`);

    product.gallery = images;
    await product.save();

    if (actorId) {
      await AuditLogService.record({
        action: 'PRODUCT_GALLERY_UPDATE',
        targetCollection: 'products',
        targetId: product._id,
        actorId: new Types.ObjectId(actorId),
        diff: { imageCount: images.length },
        module: 'PRODUCTS',
      });
    }

    return product;
  }

  /**
   * 8. Update Pricing Configuration
   */
  public static async updatePricing(
    productId: string,
    pricing: {
      retailPrice?: number;
      showroomPrice?: number;
      wholesalePrice?: number;
      promotionalPrice?: number;
      minSalesPrice?: number;
      resellerTierPrices?: Array<{ tier: 1 | 2 | 3; price: number }>;
    },
    actorId?: string
  ): Promise<IProduct> {
    const product = await ProductModel.findById(productId);
    if (!product) throw new NotFoundError(`Product '${productId}' not found.`);

    if (pricing.retailPrice !== undefined) product.retailPrice = pricing.retailPrice;
    if (pricing.showroomPrice !== undefined) product.showroomPrice = pricing.showroomPrice;
    if (pricing.wholesalePrice !== undefined) product.wholesalePrice = pricing.wholesalePrice;
    if (pricing.minSalesPrice !== undefined) product.minSalesPrice = pricing.minSalesPrice;
    if (pricing.resellerTierPrices) product.resellerTierPrices = pricing.resellerTierPrices;

    if (pricing.promotionalPrice !== undefined) {
      if (!product.ecommerceCatalog) product.ecommerceCatalog = {};
      product.ecommerceCatalog.promotionalPrice = pricing.promotionalPrice;
      product.ecommerceCatalog.isPromotional = pricing.promotionalPrice > 0;
    }

    await product.save();

    if (actorId) {
      await AuditLogService.record({
        action: 'PRODUCT_PRICING_UPDATE',
        targetCollection: 'products',
        targetId: product._id,
        actorId: new Types.ObjectId(actorId),
        diff: pricing,
        module: 'PRODUCTS',
      });
    }

    return product;
  }

  /**
   * 9. Update SEO Metadata
   */
  public static async updateSeo(
    productId: string,
    seo: {
      seoTitle?: string;
      metaDescription?: string;
      metaKeywords?: string[];
      slug?: string;
      canonicalUrl?: string;
      ogTitle?: string;
      ogDescription?: string;
      ogImage?: string;
    },
    actorId?: string
  ): Promise<IProduct> {
    const product = await ProductModel.findById(productId);
    if (!product) throw new NotFoundError(`Product '${productId}' not found.`);

    const slug = seo.slug ? this.generateSlug(seo.slug) : this.generateSlug(product.nameEn);

    // Duplicate slug detection
    const existing = await ProductModel.findOne({ 'seo.slug': slug, _id: { $ne: product._id } });
    if (existing) {
      throw new ValidationError(`Product URL slug '${slug}' is already taken by another product.`);
    }

    product.seo = {
      seoTitle: seo.seoTitle || product.nameEn,
      metaDescription: seo.metaDescription || product.shortDescription,
      metaKeywords: seo.metaKeywords || [],
      slug,
      canonicalUrl: seo.canonicalUrl,
      ogTitle: seo.ogTitle || seo.seoTitle || product.nameEn,
      ogDescription: seo.ogDescription || seo.metaDescription,
      ogImage: seo.ogImage || (product.gallery?.[0]?.url || ''),
    };

    product.seoContent = {
      metaTitle: seo.seoTitle,
      metaDescription: seo.metaDescription,
      descriptionEn: product.description,
      descriptionBn: product.nameBn,
    };

    await product.save();

    if (actorId) {
      await AuditLogService.record({
        action: 'PRODUCT_SEO_UPDATE',
        targetCollection: 'products',
        targetId: product._id,
        actorId: new Types.ObjectId(actorId),
        diff: { slug, seoTitle: seo.seoTitle },
        module: 'PRODUCTS',
      });
    }

    return product;
  }

  /**
   * 10. Update Product Variants
   */
  public static async updateVariants(
    productId: string,
    variants: Array<{
      sku: string;
      barcode?: string;
      attributes: Record<string, string>;
      additionalPrice: number;
      image?: string;
      weight?: number;
      status: 'ACTIVE' | 'INACTIVE';
    }>,
    actorId?: string
  ): Promise<IProduct> {
    const product = await ProductModel.findById(productId);
    if (!product) throw new NotFoundError(`Product '${productId}' not found.`);

    product.variants = variants;
    await product.save();

    if (actorId) {
      await AuditLogService.record({
        action: 'PRODUCT_VARIANTS_UPDATE',
        targetCollection: 'products',
        targetId: product._id,
        actorId: new Types.ObjectId(actorId),
        diff: { variantCount: variants.length },
        module: 'PRODUCTS',
      });
    }

    return product;
  }

  /**
   * 11. Request Website Publication (With Module 03 Approval Integration)
   */
  public static async requestPublish(
    productId: string,
    actorId: string,
    organizationId?: string,
    requireApproval = false
  ): Promise<{ status: ProductPublicationStatus; approvalRequestId?: string }> {
    const product = await ProductModel.findById(productId);
    if (!product) throw new NotFoundError(`Product '${productId}' not found.`);

    // Pre-publication validations
    if (!product.isActive || product.status !== 'ACTIVE') {
      throw new ValidationError('Only active products can be published to the website.');
    }
    if (!product.retailPrice || product.retailPrice <= 0) {
      throw new ValidationError('Product must have a valid retail price before publishing.');
    }
    if (!product.category) {
      throw new ValidationError('Product must be assigned to an approved category before publishing.');
    }

    if (requireApproval) {
      // Create Module 03 Approval Request
      const appReq = await ApprovalService.createApprovalRequest(
        {
          documentType: 'PRODUCT',
          documentId: product._id.toString(),
          documentRef: product.sku,
          module: 'PRODUCT',
          transactionType: 'PRODUCT_PUBLICATION',
          transactionAmount: product.retailPrice,
          organizationId: organizationId || product.organizationId?.toString(),
          priority: 'MEDIUM',
          transactionSnapshot: {
            sku: product.sku,
            nameEn: product.nameEn,
            retailPrice: product.retailPrice,
            reason: `Request to publish product ${product.sku} on public e-commerce catalog.`,
          },
        },
        actorId
      );

      product.publicationStatus = 'PENDING_APPROVAL';
      product.approvalRequestId = appReq._id;
      await product.save();

      return {
        status: 'PENDING_APPROVAL',
        approvalRequestId: appReq._id.toString(),
      };
    }

    // Direct publish if approval is not required or user is authorized
    product.publicationStatus = 'PUBLISHED';
    product.publishedAt = new Date();
    await product.save();

    await AuditLogService.record({
      action: 'PRODUCT_PUBLISHED',
      targetCollection: 'products',
      targetId: product._id,
      actorId: new Types.ObjectId(actorId),
      diff: { publicationStatus: 'PUBLISHED' },
      module: 'PRODUCTS',
    });

    return { status: 'PUBLISHED' };
  }

  /**
   * 12. Unpublish Product
   */
  public static async unpublishProduct(productId: string, actorId?: string): Promise<IProduct> {
    const product = await ProductModel.findById(productId);
    if (!product) throw new NotFoundError(`Product '${productId}' not found.`);

    product.publicationStatus = 'UNPUBLISHED';
    await product.save();

    if (actorId) {
      await AuditLogService.record({
        action: 'PRODUCT_UNPUBLISHED',
        targetCollection: 'products',
        targetId: product._id,
        actorId: new Types.ObjectId(actorId),
        diff: { publicationStatus: 'UNPUBLISHED' },
        module: 'PRODUCTS',
      });
    }

    return product;
  }

  /**
   * 13. Bulk Publish / Unpublish
   */
  public static async bulkPublish(
    productIds: string[],
    action: 'PUBLISH' | 'UNPUBLISH',
    actorId?: string
  ): Promise<{ affected: number }> {
    const targetStatus: ProductPublicationStatus = action === 'PUBLISH' ? 'PUBLISHED' : 'UNPUBLISHED';
    const objectIds = productIds.map((id) => new Types.ObjectId(id));

    const result = await ProductModel.updateMany(
      { _id: { $in: objectIds } },
      { $set: { publicationStatus: targetStatus, publishedAt: action === 'PUBLISH' ? new Date() : undefined } }
    );

    if (actorId) {
      await AuditLogService.record({
        action: `PRODUCT_BULK_${action}`,
        targetCollection: 'products',
        targetId: objectIds[0],
        actorId: new Types.ObjectId(actorId),
        diff: { count: result.modifiedCount, targetStatus },
        module: 'PRODUCTS',
      });
    }

    return { affected: result.modifiedCount };
  }

  /**
   * 14. Bulk Product Import (CSV / XLSX Records)
   */
  public static async importProducts(
    records: any[],
    options: { updateExisting?: boolean; organizationId?: string } = {},
    actorId?: string
  ): Promise<{
    totalRows: number;
    createdCount: number;
    updatedCount: number;
    failedCount: number;
    errors: Array<{ row: number; sku: string; error: string }>;
  }> {
    let createdCount = 0;
    let updatedCount = 0;
    const errors: Array<{ row: number; sku: string; error: string }> = [];

    for (let i = 0; i < records.length; i++) {
      const rowNum = i + 1;
      const row = records[i];

      const sku = String(row.sku || row.SKU || '').toUpperCase().trim();
      const nameEn = String(row.nameEn || row.name || row.Name || '').trim();
      const category = String(row.category || row.Category || '').trim();
      const retailPrice = parseFloat(row.retailPrice || row.price || row.Price || 0);

      if (!sku) {
        errors.push({ row: rowNum, sku: 'N/A', error: 'Missing mandatory SKU' });
        continue;
      }
      if (!nameEn) {
        errors.push({ row: rowNum, sku, error: 'Missing mandatory Product Name' });
        continue;
      }
      if (!category) {
        errors.push({ row: rowNum, sku, error: 'Missing mandatory Category' });
        continue;
      }
      if (isNaN(retailPrice) || retailPrice < 0) {
        errors.push({ row: rowNum, sku, error: 'Invalid or negative Retail Price' });
        continue;
      }

      try {
        const existing = await ProductModel.findOne({ sku });
        if (existing) {
          if (options.updateExisting) {
            existing.nameEn = nameEn;
            existing.category = category;
            existing.retailPrice = retailPrice;
            if (row.brand) existing.brand = String(row.brand).trim();
            if (row.showroomPrice) existing.showroomPrice = parseFloat(row.showroomPrice);
            if (row.baseUom) existing.baseUom = String(row.baseUom).trim();
            await existing.save();
            updatedCount++;
          } else {
            errors.push({ row: rowNum, sku, error: 'Duplicate SKU exists and overwrite is disabled.' });
          }
        } else {
          await this.createProduct(
            {
              sku,
              nameEn,
              category,
              retailPrice,
              showroomPrice: parseFloat(row.showroomPrice || retailPrice),
              brand: row.brand ? String(row.brand).trim() : undefined,
              baseUom: row.baseUom ? String(row.baseUom).trim() : 'PCS',
              hsCode: row.hsCode ? String(row.hsCode).trim() : '9018.39.00',
              description: row.description ? String(row.description).trim() : undefined,
              organizationId: options.organizationId,
            },
            actorId
          );
          createdCount++;
        }
      } catch (err: any) {
        errors.push({ row: rowNum, sku, error: err.message || 'Database error during import' });
      }
    }

    return {
      totalRows: records.length,
      createdCount,
      updatedCount,
      failedCount: errors.length,
      errors,
    };
  }

  /**
   * 15. Export Products (Sanitized)
   */
  public static async exportProducts(filters: ProductQueryFilters = {}): Promise<any[]> {
    const listResult = await this.listProducts({ ...filters, limit: 1000 }, false);
    return listResult.items.map((p) => ({
      SKU: p.sku,
      ProductCode: p.productCode || p.sku,
      NameEn: p.nameEn,
      NameBn: p.nameBn || '',
      Category: p.category,
      Brand: p.brand || '',
      BaseUOM: p.baseUom,
      RetailPrice: p.retailPrice,
      ShowroomPrice: p.showroomPrice,
      StockAvailable: p.availableStock || 0,
      Status: p.status,
      PublicationStatus: p.publicationStatus,
      CreatedDate: p.createdAt ? new Date(p.createdAt).toISOString().split('T')[0] : '',
    }));
  }
}
