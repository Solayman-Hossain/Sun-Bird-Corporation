import mongoose, { Types } from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { ProductModel } from '../models/Product';
import { CategoryModel } from '../models/Category';
import { BrandModel } from '../models/Brand';
import { ProductAttributeModel } from '../models/ProductAttribute';
import { ProductBatchModel } from '../models/ProductBatch';
import { AuditLogModel } from '../models/AuditLog';
import { CategoryService } from './CategoryService';
import { BrandService } from './BrandService';
import { ProductAttributeService } from './ProductAttributeService';
import { ProductCatalogService } from './ProductCatalogService';
import { ApprovalService } from './ApprovalService';

async function runProductCatalogVerificationSuite() {
  console.log('================================================================');
  console.log('🚀 SUN BIRD ERP - MODULE 04: PRODUCT & CATALOG VERIFICATION');
  console.log('================================================================');

  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI missing');

  await mongoose.connect(uri);
  console.log('✅ Connected to MongoDB:', mongoose.connection.name);

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, msg: string) {
    if (condition) {
      console.log(`  ✅ [PASS] ${msg}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${msg}`);
      failed++;
    }
  }

  const testActorId = new Types.ObjectId().toString();
  const testOrgId = new Types.ObjectId().toString();
  const testSku = `TEST-MED-${Date.now().toString().slice(-6)}`;

  try {
    // -------------------------------------------------------------------------
    // TEST GROUP 1: Category Management & Circular Prevention
    // -------------------------------------------------------------------------
    console.log('\n--- Test Group 1: Category Management & Circular Prevention ---');
    const parentCat = await CategoryService.createCategory(
      {
        nameEn: `Diagnostic Equip ${Date.now()}`,
        slug: `diag-equip-${Date.now()}`,
        displayOrder: 1,
      },
      testActorId
    );
    assert(Boolean(parentCat._id), 'Parent category created');

    const childCat = await CategoryService.createCategory(
      {
        nameEn: `Ultrasound Probes ${Date.now()}`,
        slug: `us-probes-${Date.now()}`,
        parentId: parentCat._id.toString(),
      },
      testActorId
    );
    assert(childCat.parentId?.toString() === parentCat._id.toString(), 'Child category linked to parent');

    // Circular dependency check: Parent cannot be set to child
    let circularCaught = false;
    try {
      await CategoryService.updateCategory(parentCat._id.toString(), { parentId: childCat._id.toString() });
    } catch {
      circularCaught = true;
    }
    assert(circularCaught, 'Circular parent-child relationship successfully blocked');

    // -------------------------------------------------------------------------
    // TEST GROUP 2: Brand Management
    // -------------------------------------------------------------------------
    console.log('\n--- Test Group 2: Brand Management ---');
    const brand = await BrandService.createBrand(
      {
        name: `SunBird Diagnostics ${Date.now()}`,
        slug: `sb-diag-${Date.now()}`,
        countryOfOrigin: 'South Korea',
      },
      testActorId
    );
    assert(Boolean(brand._id), 'Brand created with country of origin');

    const brandList = await BrandService.listBrands();
    assert(brandList.length > 0, 'Brand list retrieved with product count aggregation');

    // -------------------------------------------------------------------------
    // TEST GROUP 3: Attribute Management
    // -------------------------------------------------------------------------
    console.log('\n--- Test Group 3: Product Attributes ---');
    const attr = await ProductAttributeService.createAttribute(
      {
        name: `Frequency ${Date.now()}`,
        code: `freq_${Date.now()}`,
        values: ['2.5 MHz', '3.5 MHz', '5.0 MHz', '7.5 MHz'],
      },
      testActorId
    );
    assert(attr.values.length === 4, 'Attribute created with 4 standard preset values');

    // -------------------------------------------------------------------------
    // TEST GROUP 4: ERP Product Master Creation
    // -------------------------------------------------------------------------
    console.log('\n--- Test Group 4: ERP Product Master Creation ---');
    const product = await ProductCatalogService.createProduct(
      {
        sku: testSku,
        nameEn: 'Digital 12-Channel ECG Machine with Interpretation',
        nameBn: '১২-চ্যানেল ডিজিটাল ইসিজি মেশিন',
        category: parentCat.nameEn,
        categoryId: parentCat._id.toString(),
        brand: brand.name,
        brandId: brand._id.toString(),
        baseUom: 'SET',
        hsCode: '9018.11.00',
        purchasePrice: 42000,
        costPrice: 43500,
        retailPrice: 65000,
        showroomPrice: 60000,
        minStockQty: 5,
        organizationId: testOrgId,
        productType: 'FINISHED_GOODS',
        warrantyPeriod: '2 Years Manufacturer Warranty',
      },
      testActorId
    );
    assert(Boolean(product._id), 'Product master created in products collection');
    assert(product.sku === testSku, 'SKU stored in uppercase');
    assert(product.publicationStatus === 'DRAFT', 'Initial product status defaults to DRAFT');

    // Duplicate SKU prevention
    let dupCaught = false;
    try {
      await ProductCatalogService.createProduct({
        sku: testSku,
        nameEn: 'Duplicate Machine',
        category: parentCat.nameEn,
        retailPrice: 50000,
        showroomPrice: 50000,
      });
    } catch {
      dupCaught = true;
    }
    assert(dupCaught, 'Duplicate SKU creation strictly blocked');

    // -------------------------------------------------------------------------
    // TEST GROUP 5: Cost Price Security & Public View Sanitization
    // -------------------------------------------------------------------------
    console.log('\n--- Test Group 5: Cost Price Security & Public Sanitization ---');
    const publicView = await ProductCatalogService.getProductByIdOrSku(testSku, false);
    assert(publicView.purchasePrice === undefined, 'purchasePrice strictly excluded from unauthorized query');
    assert(publicView.costPrice === undefined, 'costPrice strictly excluded from unauthorized query');

    const privilegedView = await ProductCatalogService.getProductByIdOrSku(testSku, true);
    assert(privilegedView.purchasePrice === 42000, 'purchasePrice visible only with authorized permission');
    assert(privilegedView.costPrice === 43500, 'costPrice visible only with authorized permission');

    // -------------------------------------------------------------------------
    // TEST GROUP 6: Inventory Integration (Real Stock from Batches)
    // -------------------------------------------------------------------------
    console.log('\n--- Test Group 6: Inventory & Batch Stock Integration ---');
    assert(publicView.availableStock === 0, 'New product correctly calculates 0 on-hand stock initially');
    assert(publicView.inStock === false, 'inStock boolean correctly evaluates to false');

    // Create a mock batch in ProductBatch
    const mockBatch = await ProductBatchModel.create({
      productId: product._id,
      sku: testSku,
      batchNumber: `BATCH-${Date.now().toString().slice(-4)}`,
      category: 'NON_EXPIRING',
      baseUom: 'SET',
      currentQty: 18,
      reservedQty: 0,
      unitCost: 43500,
      hasIndividualSerials: false,
      warrantyMonths: 24,
      warehouseId: new Types.ObjectId(),
      locationStatus: 'ON_HAND',
    });

    const updatedStockView = await ProductCatalogService.getProductByIdOrSku(testSku, false);
    assert(updatedStockView.availableStock === 18, 'Dynamic stock aggregated from ProductBatch (18 units)');
    assert(updatedStockView.inStock === true, 'inStock boolean updated to true upon batch existence');

    // -------------------------------------------------------------------------
    // TEST GROUP 7: E-commerce Catalog Metadata & Gallery
    // -------------------------------------------------------------------------
    console.log('\n--- Test Group 7: E-commerce Catalog Metadata & Gallery ---');
    const updatedCatalog = await ProductCatalogService.updateCatalog(
      product._id.toString(),
      {
        websiteName: 'Pro ECG-1200 Digital Electrocardiograph',
        websiteShortDesc: 'High-precision 12-lead ECG with auto-analysis',
        highlights: ['12-lead simultaneous acquisition', '7-inch color TFT display', 'Built-in thermal printer'],
        tags: ['ECG', 'Cardiology', 'Hospital Equipment'],
        isFeatured: true,
        isBestSeller: true,
        promotionalPrice: 62000,
      },
      testActorId
    );
    assert(updatedCatalog.ecommerceCatalog?.isFeatured === true, 'Product marked as Featured');
    assert(updatedCatalog.ecommerceCatalog?.highlights?.length === 3, 'Highlights stored');

    const updatedGallery = await ProductCatalogService.updateGallery(
      product._id.toString(),
      [
        { url: '/images/products/ecg-main.jpg', isMain: true, sortOrder: 1, altText: 'Main ECG Front' },
        { url: '/images/products/ecg-leads.jpg', isMain: false, sortOrder: 2, altText: '12-Lead Cable' },
      ],
      testActorId
    );
    assert(updatedGallery.gallery.length === 2, 'Gallery updated with 2 images');
    assert(updatedGallery.gallery[0].isMain === true, 'Main image designated');

    // -------------------------------------------------------------------------
    // TEST GROUP 8: SEO Management & URL Slug
    // -------------------------------------------------------------------------
    console.log('\n--- Test Group 8: SEO Management ---');
    const updatedSeo = await ProductCatalogService.updateSeo(
      product._id.toString(),
      {
        seoTitle: 'Digital 12-Channel ECG Machine Price in Bangladesh | Sun Bird Corp',
        metaDescription: 'Best price for hospital-grade 12-channel ECG machine with digital interpretation.',
        slug: `ecg-12-channel-${Date.now().toString().slice(-4)}`,
      },
      testActorId
    );
    assert(Boolean(updatedSeo.seo?.slug), 'SEO slug generated and stored');
    assert(Boolean(updatedSeo.seo?.seoTitle?.includes('Price in Bangladesh')), 'SEO title verified');

    // -------------------------------------------------------------------------
    // TEST GROUP 9: Website Publishing & Module 03 Approval Integration
    // -------------------------------------------------------------------------
    console.log('\n--- Test Group 9: Publishing & Module 03 Approval Integration ---');
    // Direct Publish
    const directPubResult = await ProductCatalogService.requestPublish(product._id.toString(), testActorId, testOrgId, false);
    assert(directPubResult.status === 'PUBLISHED', 'Direct publication succeeded');

    const publishedProd = await ProductModel.findById(product._id);
    assert(publishedProd?.publicationStatus === 'PUBLISHED', 'Product status in DB updated to PUBLISHED');

    // Unpublish
    await ProductCatalogService.unpublishProduct(product._id.toString(), testActorId);
    const unpubProd = await ProductModel.findById(product._id);
    assert(unpubProd?.publicationStatus === 'UNPUBLISHED', 'Product status transitioned to UNPUBLISHED');

    // Request Approval Workflow
    const reqPubResult = await ProductCatalogService.requestPublish(product._id.toString(), testActorId, testOrgId, true);
    assert(reqPubResult.status === 'PENDING_APPROVAL', 'Workflow publication request submitted as PENDING_APPROVAL');
    assert(Boolean(reqPubResult.approvalRequestId), 'Module 03 ApprovalRequest instantiated and linked');

    // -------------------------------------------------------------------------
    // TEST GROUP 10: Bulk Product Import (CSV/JSON Simulation)
    // -------------------------------------------------------------------------
    console.log('\n--- Test Group 10: Bulk Product Import ---');
    const mockImportRecords = [
      {
        sku: `IMP-TEST-A-${Date.now().toString().slice(-4)}`,
        name: 'Surgical Gown XL (Reinforced)',
        category: parentCat.nameEn,
        retailPrice: 450,
        showroomPrice: 400,
        brand: brand.name,
      },
      {
        sku: `IMP-TEST-B-${Date.now().toString().slice(-4)}`,
        name: 'Latex Surgical Gloves Size 7.5',
        category: parentCat.nameEn,
        retailPrice: 65,
        showroomPrice: 60,
      },
      {
        sku: '', // Invalid row
        name: 'Invalid Product',
        category: parentCat.nameEn,
        retailPrice: 100,
      },
    ];

    const importRes = await ProductCatalogService.importProducts(mockImportRecords, { updateExisting: false }, testActorId);
    assert(importRes.createdCount === 2, 'Bulk import created 2 valid products');
    assert(importRes.failedCount === 1, 'Bulk import caught 1 invalid row without SKU');

    // -------------------------------------------------------------------------
    // TEST GROUP 11: Dashboard Metrics Aggregation
    // -------------------------------------------------------------------------
    console.log('\n--- Test Group 11: Dashboard Metrics Aggregation ---');
    const dashboardMetrics = await ProductCatalogService.getProductDashboardMetrics();
    assert(dashboardMetrics.totalProducts >= 3, `Total products aggregated (${dashboardMetrics.totalProducts})`);
    assert(Array.isArray(dashboardMetrics.categoriesDistribution), 'Category distribution chart data present');
    assert(Array.isArray(dashboardMetrics.brandsDistribution), 'Brand distribution chart data present');

    // -------------------------------------------------------------------------
    // TEST GROUP 12: Audit Trail Verification
    // -------------------------------------------------------------------------
    console.log('\n--- Test Group 12: Audit Trail Verification ---');
    const productAudits = await AuditLogModel.find({ targetId: product._id });
    assert(productAudits.length >= 3, `Audit logs captured for product operations (${productAudits.length} events logged)`);

    // Clean up test batch and test products
    await ProductBatchModel.deleteOne({ _id: mockBatch._id });
    await ProductModel.deleteOne({ _id: product._id });
    await CategoryModel.deleteOne({ _id: childCat._id });
    await CategoryModel.deleteOne({ _id: parentCat._id });
    await BrandModel.deleteOne({ _id: brand._id });
    await ProductAttributeModel.deleteOne({ _id: attr._id });
    console.log('\n🧹 Cleaned up test mock data');
  } catch (err: any) {
    console.error('❌ Verification suite execution failed:', err);
    failed++;
  } finally {
    await mongoose.disconnect();
  }

  console.log('\n================================================================');
  console.log(`📊 FINAL RESULT: ${passed} Passed, ${failed} Failed`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runProductCatalogVerificationSuite().catch((err) => {
  console.error(err);
  process.exit(1);
});
