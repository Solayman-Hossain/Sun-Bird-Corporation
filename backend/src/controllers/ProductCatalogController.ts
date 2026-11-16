import { Request, Response, NextFunction } from 'express';
import { ProductCatalogService } from '../services/ProductCatalogService';
import { CategoryService } from '../services/CategoryService';
import { BrandService } from '../services/BrandService';
import { ProductAttributeService } from '../services/ProductAttributeService';

export class ProductCatalogController {
  public static async getDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = req.query.organizationId ? String(req.query.organizationId) : undefined;
      const metrics = await ProductCatalogService.getProductDashboardMetrics(orgId);
      res.status(200).json({ success: true, data: metrics });
    } catch (err) {
      next(err);
    }
  }

  public static async listProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters = {
        organizationId: req.query.organizationId ? String(req.query.organizationId) : undefined,
        category: req.query.category ? String(req.query.category) : undefined,
        brand: req.query.brand ? String(req.query.brand) : undefined,
        status: req.query.status ? String(req.query.status) : undefined,
        publicationStatus: req.query.publicationStatus ? String(req.query.publicationStatus) : undefined,
        search: req.query.search ? String(req.query.search) : undefined,
        inStockOnly: req.query.inStockOnly === 'true',
        minPrice: req.query.minPrice ? parseFloat(String(req.query.minPrice)) : undefined,
        maxPrice: req.query.maxPrice ? parseFloat(String(req.query.maxPrice)) : undefined,
        isFeatured: req.query.isFeatured !== undefined ? req.query.isFeatured === 'true' : undefined,
        isNewArrival: req.query.isNewArrival !== undefined ? req.query.isNewArrival === 'true' : undefined,
        isBestSeller: req.query.isBestSeller !== undefined ? req.query.isBestSeller === 'true' : undefined,
        page: req.query.page ? parseInt(String(req.query.page), 10) : 1,
        limit: req.query.limit ? parseInt(String(req.query.limit), 10) : 20,
        sort: req.query.sort ? String(req.query.sort) : undefined,
      };

      // Check user permissions for internal cost visibility
      const user = (req as any).user;
      const canViewCost = user && (user.roles?.includes('super_admin') || user.roles?.includes('managing_director') || user.roles?.includes('finance_manager'));

      const result = await ProductCatalogService.listProducts(filters, canViewCost);
      res.status(200).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  public static async getProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user;
      const canViewCost = user && (user.roles?.includes('super_admin') || user.roles?.includes('managing_director') || user.roles?.includes('finance_manager'));
      const id = Array.isArray(req.params.id) ? req.params.id[0] : String(req.params.id);
      const product = await ProductCatalogService.getProductByIdOrSku(id, canViewCost);
      res.status(200).json({ success: true, data: product });
    } catch (err) {
      next(err);
    }
  }

  public static async createProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actorId = (req as any).user?.id || (req as any).user?._id;
      const product = await ProductCatalogService.createProduct(req.body, actorId);
      res.status(201).json({ success: true, message: 'Master product created successfully', data: product });
    } catch (err) {
      next(err);
    }
  }

  public static async updateProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actorId = (req as any).user?.id || (req as any).user?._id;
      const id = Array.isArray(req.params.id) ? req.params.id[0] : String(req.params.id);
      const product = await ProductCatalogService.updateProduct(id, req.body, actorId);
      res.status(200).json({ success: true, message: 'Product updated successfully', data: product });
    } catch (err) {
      next(err);
    }
  }

  public static async updateCatalog(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actorId = (req as any).user?.id || (req as any).user?._id;
      const id = Array.isArray(req.params.id) ? req.params.id[0] : String(req.params.id);
      const product = await ProductCatalogService.updateCatalog(id, req.body, actorId);
      res.status(200).json({ success: true, message: 'E-commerce catalog updated successfully', data: product });
    } catch (err) {
      next(err);
    }
  }

  public static async updateGallery(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actorId = (req as any).user?.id || (req as any).user?._id;
      const id = Array.isArray(req.params.id) ? req.params.id[0] : String(req.params.id);
      const images = Array.isArray(req.body) ? req.body : req.body.images;
      const product = await ProductCatalogService.updateGallery(id, images, actorId);
      res.status(200).json({ success: true, message: 'Product gallery updated successfully', data: product });
    } catch (err) {
      next(err);
    }
  }

  public static async updatePricing(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actorId = (req as any).user?.id || (req as any).user?._id;
      const id = Array.isArray(req.params.id) ? req.params.id[0] : String(req.params.id);
      const product = await ProductCatalogService.updatePricing(id, req.body, actorId);
      res.status(200).json({ success: true, message: 'Product pricing updated successfully', data: product });
    } catch (err) {
      next(err);
    }
  }

  public static async updateSeo(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actorId = (req as any).user?.id || (req as any).user?._id;
      const id = Array.isArray(req.params.id) ? req.params.id[0] : String(req.params.id);
      const product = await ProductCatalogService.updateSeo(id, req.body, actorId);
      res.status(200).json({ success: true, message: 'SEO configuration updated successfully', data: product });
    } catch (err) {
      next(err);
    }
  }

  public static async updateVariants(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actorId = (req as any).user?.id || (req as any).user?._id;
      const id = Array.isArray(req.params.id) ? req.params.id[0] : String(req.params.id);
      const variants = Array.isArray(req.body) ? req.body : req.body.variants;
      const product = await ProductCatalogService.updateVariants(id, variants, actorId);
      res.status(200).json({ success: true, message: 'Product variants updated successfully', data: product });
    } catch (err) {
      next(err);
    }
  }

  public static async publishProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actorId = (req as any).user?.id || (req as any).user?._id;
      const id = Array.isArray(req.params.id) ? req.params.id[0] : String(req.params.id);
      const requireApproval = req.body.requireApproval === true;
      const result = await ProductCatalogService.requestPublish(
        id,
        actorId,
        req.body.organizationId,
        requireApproval
      );
      res.status(200).json({
        success: true,
        message: result.status === 'PUBLISHED' ? 'Product published to website successfully' : 'Product publication submitted for approval',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async unpublishProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actorId = (req as any).user?.id || (req as any).user?._id;
      const id = Array.isArray(req.params.id) ? req.params.id[0] : String(req.params.id);
      const product = await ProductCatalogService.unpublishProduct(id, actorId);
      res.status(200).json({ success: true, message: 'Product unpublished from website', data: product });
    } catch (err) {
      next(err);
    }
  }

  public static async bulkPublish(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actorId = (req as any).user?.id || (req as any).user?._id;
      const { productIds, action } = req.body;
      const result = await ProductCatalogService.bulkPublish(productIds, action || 'PUBLISH', actorId);
      res.status(200).json({ success: true, message: `Bulk ${action} processed successfully`, data: result });
    } catch (err) {
      next(err);
    }
  }

  public static async importProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actorId = (req as any).user?.id || (req as any).user?._id;
      const { records, updateExisting, organizationId } = req.body;
      const result = await ProductCatalogService.importProducts(records || [], { updateExisting, organizationId }, actorId);
      res.status(200).json({ success: true, message: 'Import completed', data: result });
    } catch (err) {
      next(err);
    }
  }

  public static async exportProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters = {
        category: req.query.category ? String(req.query.category) : undefined,
        brand: req.query.brand ? String(req.query.brand) : undefined,
        status: req.query.status ? String(req.query.status) : undefined,
      };
      const data = await ProductCatalogService.exportProducts(filters);
      res.status(200).json({ success: true, count: data.length, data });
    } catch (err) {
      next(err);
    }
  }

  // Categories Handlers
  public static async listCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categories = await CategoryService.listCategories({
        isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined,
        parentId: req.query.parentId !== undefined ? String(req.query.parentId) : undefined,
      });
      res.status(200).json({ success: true, count: categories.length, data: categories });
    } catch (err) {
      next(err);
    }
  }

  public static async getCategoryTree(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tree = await CategoryService.getCategoryTree();
      res.status(200).json({ success: true, data: tree });
    } catch (err) {
      next(err);
    }
  }

  public static async createCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actorId = (req as any).user?.id || (req as any).user?._id;
      const category = await CategoryService.createCategory(req.body, actorId);
      res.status(201).json({ success: true, message: 'Category created successfully', data: category });
    } catch (err) {
      next(err);
    }
  }

  public static async updateCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actorId = (req as any).user?.id || (req as any).user?._id;
      const id = Array.isArray(req.params.id) ? req.params.id[0] : String(req.params.id);
      const category = await CategoryService.updateCategory(id, req.body, actorId);
      res.status(200).json({ success: true, message: 'Category updated successfully', data: category });
    } catch (err) {
      next(err);
    }
  }

  public static async deleteCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actorId = (req as any).user?.id || (req as any).user?._id;
      const id = Array.isArray(req.params.id) ? req.params.id[0] : String(req.params.id);
      await CategoryService.deleteCategory(id, actorId);
      res.status(200).json({ success: true, message: 'Category removed or archived' });
    } catch (err) {
      next(err);
    }
  }

  // Brands Handlers
  public static async listBrands(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const brands = await BrandService.listBrands({
        isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined,
      });
      res.status(200).json({ success: true, count: brands.length, data: brands });
    } catch (err) {
      next(err);
    }
  }

  public static async createBrand(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actorId = (req as any).user?.id || (req as any).user?._id;
      const brand = await BrandService.createBrand(req.body, actorId);
      res.status(201).json({ success: true, message: 'Brand created successfully', data: brand });
    } catch (err) {
      next(err);
    }
  }

  public static async updateBrand(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actorId = (req as any).user?.id || (req as any).user?._id;
      const id = Array.isArray(req.params.id) ? req.params.id[0] : String(req.params.id);
      const brand = await BrandService.updateBrand(id, req.body, actorId);
      res.status(200).json({ success: true, message: 'Brand updated successfully', data: brand });
    } catch (err) {
      next(err);
    }
  }

  public static async deleteBrand(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actorId = (req as any).user?.id || (req as any).user?._id;
      const id = Array.isArray(req.params.id) ? req.params.id[0] : String(req.params.id);
      await BrandService.deleteBrand(id, actorId);
      res.status(200).json({ success: true, message: 'Brand removed or archived' });
    } catch (err) {
      next(err);
    }
  }

  // Attributes Handlers
  public static async listAttributes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const attrs = await ProductAttributeService.listAttributes();
      res.status(200).json({ success: true, data: attrs });
    } catch (err) {
      next(err);
    }
  }

  public static async createAttribute(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actorId = (req as any).user?.id || (req as any).user?._id;
      const attr = await ProductAttributeService.createAttribute(req.body, actorId);
      res.status(201).json({ success: true, message: 'Attribute created successfully', data: attr });
    } catch (err) {
      next(err);
    }
  }

  public static async seedDefaults(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const catCount = await CategoryService.seedDefaultCategories();
      const brandCount = await BrandService.seedDefaultBrands();
      const attrCount = await ProductAttributeService.seedDefaultAttributes();
      res.status(200).json({
        success: true,
        message: 'Default catalog masters seeded successfully',
        data: { seededCategories: catCount, seededBrands: brandCount, seededAttributes: attrCount },
      });
    } catch (err) {
      next(err);
    }
  }
}
