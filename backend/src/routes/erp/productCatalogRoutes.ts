import { Router } from 'express';
import { ProductCatalogController } from '../../controllers/ProductCatalogController';
import { authGuard } from '../../middlewares/authGuard';
import { hasPermission } from '../../middlewares/rbacGuard';

const router = Router();

// 1. Dashboard
router.get(
  '/dashboard',
  authGuard,
  hasPermission('products', 'VIEW'),
  ProductCatalogController.getDashboard
);

// 2. Seeder for standard categories & brands
router.post(
  '/seed-defaults',
  authGuard,
  hasPermission('products', 'CREATE'),
  ProductCatalogController.seedDefaults
);

// 3. Categories
router.get(
  '/categories',
  authGuard,
  hasPermission('products', 'VIEW'),
  ProductCatalogController.listCategories
);
router.get(
  '/categories/tree',
  authGuard,
  hasPermission('products', 'VIEW'),
  ProductCatalogController.getCategoryTree
);
router.post(
  '/categories',
  authGuard,
  hasPermission('products', 'CREATE'),
  ProductCatalogController.createCategory
);
router.put(
  '/categories/:id',
  authGuard,
  hasPermission('products', 'UPDATE'),
  ProductCatalogController.updateCategory
);
router.delete(
  '/categories/:id',
  authGuard,
  hasPermission('products', 'DELETE'),
  ProductCatalogController.deleteCategory
);

// 4. Brands
router.get(
  '/brands',
  authGuard,
  hasPermission('products', 'VIEW'),
  ProductCatalogController.listBrands
);
router.post(
  '/brands',
  authGuard,
  hasPermission('products', 'CREATE'),
  ProductCatalogController.createBrand
);
router.put(
  '/brands/:id',
  authGuard,
  hasPermission('products', 'UPDATE'),
  ProductCatalogController.updateBrand
);
router.delete(
  '/brands/:id',
  authGuard,
  hasPermission('products', 'DELETE'),
  ProductCatalogController.deleteBrand
);

// 5. Attributes
router.get(
  '/attributes',
  authGuard,
  hasPermission('products', 'VIEW'),
  ProductCatalogController.listAttributes
);
router.post(
  '/attributes',
  authGuard,
  hasPermission('products', 'CREATE'),
  ProductCatalogController.createAttribute
);

// 6. Bulk Import & Export
router.post(
  '/import',
  authGuard,
  hasPermission('products', 'CREATE'),
  ProductCatalogController.importProducts
);
router.get(
  '/export',
  authGuard,
  hasPermission('products', 'EXPORT'),
  ProductCatalogController.exportProducts
);

// 7. Bulk Operations
router.post(
  '/products/bulk-publish',
  authGuard,
  hasPermission('products', 'UPDATE'),
  ProductCatalogController.bulkPublish
);

// 8. Product Master CRUD & Extensions
router.get(
  '/products',
  authGuard,
  hasPermission('products', 'VIEW'),
  ProductCatalogController.listProducts
);
router.get(
  '/products/:id',
  authGuard,
  hasPermission('products', 'VIEW'),
  ProductCatalogController.getProduct
);
router.post(
  '/products',
  authGuard,
  hasPermission('products', 'CREATE'),
  ProductCatalogController.createProduct
);
router.put(
  '/products/:id',
  authGuard,
  hasPermission('products', 'UPDATE'),
  ProductCatalogController.updateProduct
);

// 9. Specific Sub-extensions
router.put(
  '/products/:id/catalog',
  authGuard,
  hasPermission('products', 'UPDATE'),
  ProductCatalogController.updateCatalog
);
router.put(
  '/products/:id/gallery',
  authGuard,
  hasPermission('products', 'UPDATE'),
  ProductCatalogController.updateGallery
);
router.put(
  '/products/:id/pricing',
  authGuard,
  hasPermission('products', 'UPDATE'),
  ProductCatalogController.updatePricing
);
router.put(
  '/products/:id/seo',
  authGuard,
  hasPermission('products', 'UPDATE'),
  ProductCatalogController.updateSeo
);
router.put(
  '/products/:id/variants',
  authGuard,
  hasPermission('products', 'UPDATE'),
  ProductCatalogController.updateVariants
);
router.post(
  '/products/:id/publish',
  authGuard,
  hasPermission('products', 'UPDATE'),
  ProductCatalogController.publishProduct
);
router.post(
  '/products/:id/unpublish',
  authGuard,
  hasPermission('products', 'UPDATE'),
  ProductCatalogController.unpublishProduct
);

export default router;
