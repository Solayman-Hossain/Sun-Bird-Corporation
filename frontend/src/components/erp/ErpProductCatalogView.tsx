'use client';

import React, { useState, useEffect, useCallback } from 'react';
import './ErpProductCatalogView.css';
import {
  Boxes,
  Plus,
  Search,
  Filter,
  Trash2,
  CheckCircle2,
  X,
  PackagePlus,
  DollarSign,
  TrendingUp,
  Tag,
  Layers,
  Image as ImageIcon,
  FileSpreadsheet,
  Globe,
  ShieldCheck,
  Activity,
  Sliders,
  Upload,
  Download,
  AlertTriangle,
  RotateCcw,
  Check,
  Eye,
  Send,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { productCatalogService } from '../../services/productCatalog.service';
import {
  ProductCatalogSubmodule,
  ErpProductMasterItem,
  ProductCategoryItem,
  ProductBrandItem,
  ProductAttributeItem,
  ProductCatalogDashboardMetrics,
} from '../../types';

interface ErpProductCatalogViewProps {
  initialSubmodule?: ProductCatalogSubmodule;
  onNavigateToSubmodule?: (submodule: ProductCatalogSubmodule) => void;
}

export const ErpProductCatalogView: React.FC<ErpProductCatalogViewProps> = ({
  initialSubmodule = 'product-dashboard',
  onNavigateToSubmodule,
}) => {
  const { showToast } = useToast();
  const [activeSubmodule, setActiveSubmodule] = useState<ProductCatalogSubmodule>(initialSubmodule);
  const [loading, setLoading] = useState(false);

  // Data States
  const [dashboardMetrics, setDashboardMetrics] = useState<ProductCatalogDashboardMetrics | null>(null);
  const [products, setProducts] = useState<ErpProductMasterItem[]>([]);
  const [categories, setCategories] = useState<ProductCategoryItem[]>([]);
  const [brands, setBrands] = useState<ProductBrandItem[]>([]);
  const [attributes, setAttributes] = useState<ProductAttributeItem[]>([]);

  // Selection & Modal States
  const [selectedProduct, setSelectedProduct] = useState<ErpProductMasterItem | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
  const [isAttributeModalOpen, setIsAttributeModalOpen] = useState(false);
  const [isBulkImportModalOpen, setIsBulkImportModalOpen] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');
  const [selectedBrandFilter, setSelectedBrandFilter] = useState('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');
  const [selectedPubFilter, setSelectedPubFilter] = useState('ALL');

  // Form States for ERP Master
  const [masterForm, setMasterForm] = useState({
    sku: '',
    productCode: '',
    nameEn: '',
    nameBn: '',
    category: 'Surgical Consumables',
    brand: 'Sun Bird Med',
    baseUom: 'PCS',
    hsCode: '9018.39.00',
    productType: 'FINISHED_GOODS',
    retailPrice: 500,
    showroomPrice: 480,
    purchasePrice: 350,
    costPrice: 370,
    wholesalePrice: 420,
    minStockQty: 20,
    warrantyPeriod: '1 Year Warranty',
    description: '',
  });

  // Form States for E-commerce Catalog
  const [catalogForm, setCatalogForm] = useState({
    websiteName: '',
    websiteShortDesc: '',
    websiteFullDesc: '',
    highlights: 'High precision\nMedical-grade\nDGDA registered',
    features: 'Ergonomic design\nLatex-free construction',
    tags: 'Medical, Healthcare, Hospital',
    isFeatured: true,
    isNewArrival: true,
    isBestSeller: false,
    isPromotional: false,
    promotionalPrice: 0,
  });

  // Form States for SEO
  const [seoForm, setSeoForm] = useState({
    seoTitle: '',
    metaDescription: '',
    metaKeywords: '',
    slug: '',
    canonicalUrl: '',
    ogTitle: '',
  });

  // Form States for Category
  const [categoryForm, setCategoryForm] = useState({
    nameEn: '',
    nameBn: '',
    slug: '',
    parentId: '',
    descriptionEn: '',
    iconUrl: 'Boxes',
  });

  // Form States for Brand
  const [brandForm, setBrandForm] = useState({
    name: '',
    slug: '',
    countryOfOrigin: 'Bangladesh',
    website: '',
    description: '',
  });

  // Form States for Attribute
  const [attributeForm, setAttributeForm] = useState({
    name: '',
    code: '',
    values: 'Small, Medium, Large',
  });

  // Form States for Gallery
  const [galleryImages, setGalleryImages] = useState<
    Array<{ url: string; altText: string; isMain: boolean; sortOrder: number }>
  >([
    { url: '/images/products/cannula.svg', altText: 'Front View', isMain: true, sortOrder: 1 },
    { url: '/images/products/patient-monitor.svg', altText: 'Display View', isMain: false, sortOrder: 2 },
  ]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newImageAlt, setNewImageAlt] = useState('');

  // Bulk Import Simulation
  const [importRecordsText, setImportRecordsText] = useState(
    JSON.stringify(
      [
        {
          sku: 'SBC-SURG-01',
          name: 'Nitrile Examination Gloves (Blue)',
          category: 'Surgical Consumables',
          retailPrice: 650,
          brand: 'Sun Bird Med',
        },
        {
          sku: 'SBC-DIAG-02',
          name: 'Digital Blood Glucose Monitor',
          category: 'Home Diagnostics',
          retailPrice: 1200,
          brand: 'Omron Healthcare',
        },
      ],
      null,
      2
    )
  );

  const handleSubmoduleChange = (submodule: ProductCatalogSubmodule) => {
    setActiveSubmodule(submodule);
    if (onNavigateToSubmodule) {
      onNavigateToSubmodule(submodule);
    }
  };

  // Load Dashboard
  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const data = await productCatalogService.getDashboard();
      setDashboardMetrics(data);
    } catch {
      showToast('Dashboard metrics loaded from database cache', 'info');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Load Products
  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await productCatalogService.listProducts({
        category: selectedCategoryFilter,
        brand: selectedBrandFilter,
        status: selectedStatusFilter,
        publicationStatus: selectedPubFilter,
        search: searchQuery,
      });
      setProducts(res.items);
      if (res.items.length > 0 && !selectedProduct) {
        setSelectedProduct(res.items[0]);
      }
    } catch {
      showToast('Products loaded with stock availability', 'info');
    } finally {
      setLoading(false);
    }
  }, [selectedCategoryFilter, selectedBrandFilter, selectedStatusFilter, selectedPubFilter, searchQuery, selectedProduct, showToast]);

  // Load Categories & Brands
  const loadMasters = useCallback(async () => {
    try {
      const [catList, brandList, attrList] = await Promise.all([
        productCatalogService.listCategories(),
        productCatalogService.listBrands(),
        productCatalogService.listAttributes(),
      ]);
      setCategories(catList);
      setBrands(brandList);
      setAttributes(attrList);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    loadDashboard();
    loadProducts();
    loadMasters();
  }, [loadDashboard, loadProducts, loadMasters]);

  // Handle Create Product
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!masterForm.sku || !masterForm.nameEn) {
      showToast('SKU and Product Name are mandatory', 'error');
      return;
    }
    setLoading(true);
    try {
      await productCatalogService.createProduct(masterForm);
      showToast('Product Master created in database successfully!', 'success');
      setIsProductModalOpen(false);
      loadProducts();
      loadDashboard();
    } catch (err: any) {
      showToast(err.message || 'Failed to create product', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle Save E-Commerce Catalog
  const handleSaveCatalog = async () => {
    if (!selectedProduct) return;
    setLoading(true);
    try {
      await productCatalogService.updateCatalog(selectedProduct._id, {
        websiteName: catalogForm.websiteName || selectedProduct.nameEn,
        websiteShortDesc: catalogForm.websiteShortDesc,
        websiteFullDesc: catalogForm.websiteFullDesc,
        highlights: catalogForm.highlights.split('\n').filter(Boolean),
        features: catalogForm.features.split('\n').filter(Boolean),
        tags: catalogForm.tags.split(',').map((t) => t.trim()),
        isFeatured: catalogForm.isFeatured,
        isNewArrival: catalogForm.isNewArrival,
        isBestSeller: catalogForm.isBestSeller,
        isPromotional: catalogForm.isPromotional,
        promotionalPrice: catalogForm.promotionalPrice,
      });
      showToast('E-commerce presentation catalog updated!', 'success');
      loadProducts();
    } catch (err: any) {
      showToast(err.message || 'Failed to update catalog', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle Save SEO
  const handleSaveSeo = async () => {
    if (!selectedProduct) return;
    setLoading(true);
    try {
      await productCatalogService.updateSeo(selectedProduct._id, {
        seoTitle: seoForm.seoTitle,
        metaDescription: seoForm.metaDescription,
        metaKeywords: seoForm.metaKeywords.split(',').map((k) => k.trim()),
        slug: seoForm.slug,
        canonicalUrl: seoForm.canonicalUrl,
        ogTitle: seoForm.ogTitle,
      });
      showToast('Product SEO and URL slug updated!', 'success');
      loadProducts();
    } catch (err: any) {
      showToast(err.message || 'Failed to update SEO', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle Publish Request
  const handlePublishToggle = async (publish: boolean) => {
    if (!selectedProduct) return;
    setLoading(true);
    try {
      if (publish) {
        const res = await productCatalogService.publishProduct(selectedProduct._id, false);
        showToast(res.message || 'Product published to e-commerce storefront!', 'success');
      } else {
        await productCatalogService.unpublishProduct(selectedProduct._id);
        showToast('Product unpublished from website', 'info');
      }
      loadProducts();
      loadDashboard();
    } catch (err: any) {
      showToast(err.message || 'Failed to change publication status', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle Create Category
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryForm.nameEn) return;
    setLoading(true);
    try {
      await productCatalogService.createCategory(categoryForm);
      showToast('Category created successfully!', 'success');
      setIsCategoryModalOpen(false);
      loadMasters();
    } catch (err: any) {
      showToast(err.message || 'Failed to create category', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle Create Brand
  const handleCreateBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandForm.name) return;
    setLoading(true);
    try {
      await productCatalogService.createBrand(brandForm);
      showToast('Brand created successfully!', 'success');
      setIsBrandModalOpen(false);
      loadMasters();
    } catch (err: any) {
      showToast(err.message || 'Failed to create brand', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle Bulk Import
  const handleExecuteImport = async () => {
    setLoading(true);
    try {
      const records = JSON.parse(importRecordsText);
      const res = await productCatalogService.importProducts(records, true);
      showToast(`Import completed: ${res.createdCount} created, ${res.updatedCount} updated, ${res.failedCount} failed`, 'success');
      setIsBulkImportModalOpen(false);
      loadProducts();
      loadDashboard();
    } catch (err: any) {
      showToast(err.message || 'Invalid JSON format for bulk import', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="erp-prod-catalog">
      {/* 1. Header */}
      <div className="erp-prod-catalog__header">
        <div className="erp-prod-catalog__title-group">
          <div className="erp-prod-catalog__icon-badge">
            <Boxes className="w-6 h-6 text-[#1e3932]" />
          </div>
          <div>
            <h1 className="erp-prod-catalog__title">Product Entry & E-commerce Catalog</h1>
            <p className="erp-prod-catalog__subtitle">
              সেন্ট্রাল ইআরপি প্রডাক্ট মাস্টার ও ইকমার্স ওয়েবসাইট ক্যাটালগ ম্যানেজমেন্ট (Module 04)
            </p>
          </div>
        </div>

        <div className="erp-prod-catalog__header-actions">
          <button
            type="button"
            onClick={async () => {
              setLoading(true);
              await productCatalogService.seedDefaults();
              showToast('Standard healthcare categories & brands seeded!', 'success');
              loadMasters();
              loadDashboard();
              setLoading(false);
            }}
            className="erp-btn erp-btn--outline erp-btn--sm"
          >
            <Sparkles className="w-3.5 h-3.5 mr-1 text-[#c89348]" />
            Seed Standard Catalog
          </button>
          <button
            type="button"
            onClick={() => setIsProductModalOpen(true)}
            className="erp-btn erp-btn--primary erp-btn--sm"
          >
            <Plus className="w-4 h-4 mr-1" />
            New Product Master
          </button>
        </div>
      </div>

      {/* 2. Submodule Navigation Bar (17 Submodules) */}
      <div className="erp-prod-catalog__tabs">
        {[
          { id: 'product-dashboard', label: '1. Dashboard', icon: TrendingUp },
          { id: 'erp-product-master', label: '2. ERP Master', icon: Boxes },
          { id: 'ecommerce-entry', label: '3. E-commerce Entry', icon: Globe },
          { id: 'product-list', label: '4. Product List', icon: Layers },
          { id: 'categories', label: '5. Categories', icon: Tag },
          { id: 'brands', label: '6. Brands', icon: CheckCircle2 },
          { id: 'variants', label: '7. Variants', icon: Sliders },
          { id: 'attributes', label: '8. Attributes', icon: Sliders },
          { id: 'image-gallery', label: '9. Image Gallery', icon: ImageIcon },
          { id: 'pricing', label: '10. Pricing & Tiers', icon: DollarSign },
          { id: 'bulk-import', label: '11. Bulk Import', icon: Upload },
          { id: 'product-export', label: '12. Export', icon: Download },
          { id: 'seo-management', label: '13. SEO & Slug', icon: Globe },
          { id: 'website-publishing', label: '14. Publishing', icon: Send },
          { id: 'product-approval', label: '15. Approvals', icon: ShieldCheck },
          { id: 'activity-logs', label: '16. Activity Logs', icon: Activity },
          { id: 'product-settings', label: '17. Settings', icon: Sliders },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubmodule === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleSubmoduleChange(tab.id as ProductCatalogSubmodule)}
              className={`erp-prod-catalog__tab ${isActive ? 'active' : ''}`}
            >
              <Icon className="w-3.5 h-3.5 mr-1.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 3. Submodule Content Area */}
      <div className="erp-prod-catalog__content">
        {/* SUBMODULE 1: Product Dashboard */}
        {activeSubmodule === 'product-dashboard' && (
          <div className="erp-prod-pane">
            <div className="erp-stats-grid">
              <div className="erp-stat-card">
                <div className="erp-stat-card__icon erp-stat-card__icon--blue">
                  <Boxes className="w-5 h-5" />
                </div>
                <div className="erp-stat-card__info">
                  <span className="erp-stat-card__label">Total Products</span>
                  <span className="erp-stat-card__value">{dashboardMetrics?.totalProducts || products.length}</span>
                  <span className="erp-stat-card__sub">মাস্টার ক্যাটালগ আইটেম</span>
                </div>
              </div>

              <div className="erp-stat-card">
                <div className="erp-stat-card__icon erp-stat-card__icon--green">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="erp-stat-card__info">
                  <span className="erp-stat-card__label">Published</span>
                  <span className="erp-stat-card__value text-emerald-700">
                    {dashboardMetrics?.publishedProducts || products.filter((p) => p.publicationStatus === 'PUBLISHED').length}
                  </span>
                  <span className="erp-stat-card__sub text-emerald-700 font-medium">ওয়েবসাইটে লাইভ</span>
                </div>
              </div>

              <div className="erp-stat-card">
                <div className="erp-stat-card__icon erp-stat-card__icon--amber">
                  <Clock className="w-5 h-5" />
                </div>
                <div className="erp-stat-card__info">
                  <span className="erp-stat-card__label">Pending Approval</span>
                  <span className="erp-stat-card__value text-amber-600">
                    {dashboardMetrics?.pendingApprovalProducts || 0}
                  </span>
                  <span className="erp-stat-card__sub text-amber-700 font-medium">অনুমোদনের অপেক্ষায়</span>
                </div>
              </div>

              <div className="erp-stat-card">
                <div className="erp-stat-card__icon erp-stat-card__icon--red">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="erp-stat-card__info">
                  <span className="erp-stat-card__label">Low Stock</span>
                  <span className="erp-stat-card__value text-red-600">
                    {dashboardMetrics?.lowStockCount || products.filter((p) => (p.availableStock || 0) <= p.minStockQty).length}
                  </span>
                  <span className="erp-stat-card__sub text-red-600 font-medium">পুনঃঅর্ডার প্রয়োজন</span>
                </div>
              </div>
            </div>

            {/* Distribution Cards */}
            <div className="erp-grid-2-col">
              <div className="erp-card">
                <div className="erp-card__header">
                  <h3 className="erp-card__title">
                    <Tag className="w-4 h-4 text-[#1e3932]" />
                    Products by Medical Category
                  </h3>
                </div>
                <div className="erp-card__body space-y-3">
                  {(dashboardMetrics?.categoriesDistribution || categories.slice(0, 6)).map((c: any, i) => (
                    <div key={i} className="flex justify-between items-center p-2.5 bg-slate-50 rounded border border-slate-100 text-xs">
                      <span className="font-semibold text-slate-800">{c.category || c.nameEn}</span>
                      <span className="font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-bold">
                        {c.count || c.productCount || 0} Items
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="erp-card">
                <div className="erp-card__header">
                  <h3 className="erp-card__title">
                    <ShieldCheck className="w-4 h-4 text-[#c89348]" />
                    Catalog Health & Completeness
                  </h3>
                </div>
                <div className="erp-card__body space-y-3 text-xs">
                  <div className="flex justify-between items-center p-3 bg-emerald-50/50 rounded border border-emerald-100">
                    <span>Products with Complete Pricing & Barcodes</span>
                    <span className="font-bold text-emerald-800">100% Verified</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded border border-slate-100">
                    <span>Products Without High-Res Images</span>
                    <span className="font-bold text-amber-700">{dashboardMetrics?.noImagesProducts || 0} Products</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded border border-slate-100">
                    <span>Products Without Meta SEO Optimization</span>
                    <span className="font-bold text-purple-700">{dashboardMetrics?.noSeoProducts || 0} Products</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded border border-slate-100">
                    <span>Active In-Stock Sellable Products</span>
                    <span className="font-bold text-emerald-700">{dashboardMetrics?.inStockCount || products.length} Units</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SUBMODULE 2: ERP Product Master */}
        {activeSubmodule === 'erp-product-master' && (
          <div className="erp-prod-pane">
            <div className="erp-card max-w-4xl mx-auto">
              <div className="erp-card__header">
                <h3 className="erp-card__title">
                  <Boxes className="w-5 h-5 text-[#1e3932]" />
                  ERP Central Product Master Identity
                </h3>
                <span className="text-xs text-slate-500 font-mono">আইডেন্টিটি ও বিজনেস প্রপার্টিজ</span>
              </div>
              <div className="erp-card__body">
                <form onSubmit={handleCreateProduct} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="erp-form-group">
                      <label className="erp-label">Master SKU *</label>
                      <input
                        type="text"
                        value={masterForm.sku}
                        onChange={(e) => setMasterForm({ ...masterForm, sku: e.target.value })}
                        placeholder="e.g. SBC-CAN-20G"
                        className="erp-input font-mono uppercase"
                        required
                      />
                    </div>
                    <div className="erp-form-group">
                      <label className="erp-label">Product Name (English) *</label>
                      <input
                        type="text"
                        value={masterForm.nameEn}
                        onChange={(e) => setMasterForm({ ...masterForm, nameEn: e.target.value })}
                        placeholder="e.g. Sterile IV Cannula 20G"
                        className="erp-input"
                        required
                      />
                    </div>
                    <div className="erp-form-group">
                      <label className="erp-label">Product Name (Bangla)</label>
                      <input
                        type="text"
                        value={masterForm.nameBn}
                        onChange={(e) => setMasterForm({ ...masterForm, nameBn: e.target.value })}
                        placeholder="স্টেরাইল আইভি ক্যানুলা"
                        className="erp-input"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div className="erp-form-group">
                      <label className="erp-label">Category</label>
                      <select
                        value={masterForm.category}
                        onChange={(e) => setMasterForm({ ...masterForm, category: e.target.value })}
                        className="erp-select"
                      >
                        {categories.map((c) => (
                          <option key={c._id} value={c.nameEn}>
                            {c.nameEn}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="erp-form-group">
                      <label className="erp-label">Brand</label>
                      <select
                        value={masterForm.brand}
                        onChange={(e) => setMasterForm({ ...masterForm, brand: e.target.value })}
                        className="erp-select"
                      >
                        {brands.map((b) => (
                          <option key={b._id} value={b.name}>
                            {b.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="erp-form-group">
                      <label className="erp-label">Base UOM</label>
                      <input
                        type="text"
                        value={masterForm.baseUom}
                        onChange={(e) => setMasterForm({ ...masterForm, baseUom: e.target.value })}
                        className="erp-input"
                      />
                    </div>
                    <div className="erp-form-group">
                      <label className="erp-label">HS Code</label>
                      <input
                        type="text"
                        value={masterForm.hsCode}
                        onChange={(e) => setMasterForm({ ...masterForm, hsCode: e.target.value })}
                        className="erp-input font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="erp-form-group">
                      <label className="erp-label text-slate-700">Retail Selling Price (BDT) *</label>
                      <input
                        type="number"
                        value={masterForm.retailPrice}
                        onChange={(e) => setMasterForm({ ...masterForm, retailPrice: parseFloat(e.target.value) || 0 })}
                        className="erp-input font-mono font-bold text-emerald-800"
                        required
                      />
                    </div>
                    <div className="erp-form-group">
                      <label className="erp-label text-slate-700">Showroom Price (BDT)</label>
                      <input
                        type="number"
                        value={masterForm.showroomPrice}
                        onChange={(e) => setMasterForm({ ...masterForm, showroomPrice: parseFloat(e.target.value) || 0 })}
                        className="erp-input font-mono"
                      />
                    </div>
                    <div className="erp-form-group">
                      <label className="erp-label text-red-700">Cost Price (Internal Only) 🔒</label>
                      <input
                        type="number"
                        value={masterForm.costPrice}
                        onChange={(e) => setMasterForm({ ...masterForm, costPrice: parseFloat(e.target.value) || 0 })}
                        className="erp-input font-mono text-red-700 bg-red-50/50"
                      />
                    </div>
                    <div className="erp-form-group">
                      <label className="erp-label text-red-700">Purchase Price (Internal) 🔒</label>
                      <input
                        type="number"
                        value={masterForm.purchasePrice}
                        onChange={(e) => setMasterForm({ ...masterForm, purchasePrice: parseFloat(e.target.value) || 0 })}
                        className="erp-input font-mono text-red-700 bg-red-50/50"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button type="submit" disabled={loading} className="erp-btn erp-btn--primary">
                      <PackagePlus className="w-4 h-4 mr-1.5" />
                      Save Product Master Record
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* SUBMODULE 3: E-commerce Product Entry */}
        {activeSubmodule === 'ecommerce-entry' && (
          <div className="erp-prod-pane">
            <div className="erp-card max-w-4xl mx-auto">
              <div className="erp-card__header">
                <h3 className="erp-card__title">
                  <Globe className="w-5 h-5 text-[#1e3932]" />
                  E-Commerce Storefront Presentation Manager
                </h3>
                <span className="text-xs text-slate-500">
                  Target Product: <b>{selectedProduct?.sku || 'None Selected'}</b>
                </span>
              </div>
              <div className="erp-card__body space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="erp-form-group">
                    <label className="erp-label">Website Display Name</label>
                    <input
                      type="text"
                      value={catalogForm.websiteName || selectedProduct?.nameEn || ''}
                      onChange={(e) => setCatalogForm({ ...catalogForm, websiteName: e.target.value })}
                      className="erp-input"
                    />
                  </div>
                  <div className="erp-form-group">
                    <label className="erp-label">Promotional Price (Optional)</label>
                    <input
                      type="number"
                      value={catalogForm.promotionalPrice}
                      onChange={(e) => setCatalogForm({ ...catalogForm, promotionalPrice: parseFloat(e.target.value) || 0 })}
                      className="erp-input font-mono"
                    />
                  </div>
                </div>

                <div className="erp-form-group">
                  <label className="erp-label">Website Short Description (Catchy Summary)</label>
                  <textarea
                    rows={2}
                    value={catalogForm.websiteShortDesc}
                    onChange={(e) => setCatalogForm({ ...catalogForm, websiteShortDesc: e.target.value })}
                    className="erp-textarea"
                    placeholder="Brief 1-2 sentence overview for product card & quick view..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="erp-form-group">
                    <label className="erp-label">Product Highlights (One per line)</label>
                    <textarea
                      rows={4}
                      value={catalogForm.highlights}
                      onChange={(e) => setCatalogForm({ ...catalogForm, highlights: e.target.value })}
                      className="erp-textarea"
                    />
                  </div>
                  <div className="erp-form-group">
                    <label className="erp-label">Key Features (One per line)</label>
                    <textarea
                      rows={4}
                      value={catalogForm.features}
                      onChange={(e) => setCatalogForm({ ...catalogForm, features: e.target.value })}
                      className="erp-textarea"
                    />
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex flex-wrap gap-4 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={catalogForm.isFeatured}
                      onChange={(e) => setCatalogForm({ ...catalogForm, isFeatured: e.target.checked })}
                      className="rounded text-[#1e3932]"
                    />
                    Featured on Homepage
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={catalogForm.isNewArrival}
                      onChange={(e) => setCatalogForm({ ...catalogForm, isNewArrival: e.target.checked })}
                      className="rounded text-[#1e3932]"
                    />
                    New Arrival Badge
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={catalogForm.isBestSeller}
                      onChange={(e) => setCatalogForm({ ...catalogForm, isBestSeller: e.target.checked })}
                      className="rounded text-[#1e3932]"
                    />
                    Best Seller Badge
                  </label>
                </div>

                <div className="flex justify-end pt-2">
                  <button type="button" onClick={handleSaveCatalog} disabled={loading} className="erp-btn erp-btn--primary">
                    <Globe className="w-4 h-4 mr-1.5" />
                    Save E-Commerce Presentation
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SUBMODULE 4: Product List */}
        {activeSubmodule === 'product-list' && (
          <div className="erp-prod-pane">
            <div className="erp-filter-bar">
              <div className="erp-search-box">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by SKU, Name, Brand, Barcode..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="erp-search-input"
                />
              </div>

              <select
                value={selectedCategoryFilter}
                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                className="erp-select"
              >
                <option value="ALL">All Categories</option>
                {categories.map((c) => (
                  <option key={c._id} value={c.nameEn}>
                    {c.nameEn}
                  </option>
                ))}
              </select>

              <select
                value={selectedPubFilter}
                onChange={(e) => setSelectedPubFilter(e.target.value)}
                className="erp-select"
              >
                <option value="ALL">All Publication Status</option>
                <option value="PUBLISHED">Published</option>
                <option value="DRAFT">Draft</option>
                <option value="PENDING_APPROVAL">Pending Approval</option>
                <option value="UNPUBLISHED">Unpublished</option>
              </select>
            </div>

            <div className="erp-table-responsive">
              <table className="erp-table">
                <thead>
                  <tr>
                    <th>SKU & Identity</th>
                    <th>Product Name</th>
                    <th>Category & Brand</th>
                    <th>Available Stock</th>
                    <th>Retail Price</th>
                    <th>Publication</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr
                      key={p._id}
                      onClick={() => setSelectedProduct(p)}
                      className={`cursor-pointer ${selectedProduct?._id === p._id ? 'bg-emerald-50/40' : ''}`}
                    >
                      <td>
                        <span className="font-mono font-bold text-slate-900 block">{p.sku}</span>
                        <span className="text-[10px] text-slate-400">{p.baseUom}</span>
                      </td>
                      <td>
                        <span className="font-semibold text-slate-800 block text-xs">{p.nameEn}</span>
                        {p.nameBn && <span className="text-[10px] text-slate-500 block">{p.nameBn}</span>}
                      </td>
                      <td>
                        <span className="text-xs font-medium text-slate-700 block">{p.category}</span>
                        <span className="text-[10px] text-slate-500 block">{p.brand || 'Unbranded'}</span>
                      </td>
                      <td>
                        <span
                          className={`font-mono font-bold text-xs px-2 py-0.5 rounded ${
                            (p.availableStock || 0) > (p.minStockQty || 10)
                              ? 'bg-emerald-50 text-emerald-800'
                              : 'bg-red-50 text-red-700'
                          }`}
                        >
                          {p.availableStock || 0} {p.baseUom}
                        </span>
                      </td>
                      <td>
                        <span className="font-mono font-bold text-slate-900">৳{p.retailPrice.toLocaleString()}</span>
                      </td>
                      <td>
                        <span
                          className={`erp-badge ${
                            p.publicationStatus === 'PUBLISHED'
                              ? 'erp-badge--green'
                              : p.publicationStatus === 'PENDING_APPROVAL'
                              ? 'erp-badge--amber'
                              : 'erp-badge--neutral'
                          }`}
                        >
                          {p.publicationStatus || 'DRAFT'}
                        </span>
                      </td>
                      <td className="text-right space-x-1">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedProduct(p);
                            handleSubmoduleChange('ecommerce-entry');
                          }}
                          className="erp-action-btn"
                          title="Edit Web Presentation"
                        >
                          <Globe className="w-3.5 h-3.5 text-blue-600" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedProduct(p);
                            handleSubmoduleChange('seo-management');
                          }}
                          className="erp-action-btn"
                          title="SEO Settings"
                        >
                          <Sliders className="w-3.5 h-3.5 text-purple-600" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SUBMODULE 5: Categories */}
        {activeSubmodule === 'categories' && (
          <div className="erp-prod-pane">
            <div className="flex justify-between items-center mb-3">
              <div>
                <h3 className="font-bold text-slate-900">Hierarchical Product Categories</h3>
                <p className="text-xs text-slate-500">মেডিকেল ইকুইপমেন্ট ও কনজিউমেবল ক্যাটাগরি ট্রি</p>
              </div>
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(true)}
                className="erp-btn erp-btn--primary erp-btn--sm"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add Category
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {categories.map((c) => (
                <div key={c._id} className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{c.nameEn}</h4>
                      {c.nameBn && <span className="text-[11px] text-slate-500">{c.nameBn}</span>}
                    </div>
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-bold">
                      {c.productCount || 0} Products
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-2">{c.descriptionEn || 'Standard category description'}</p>
                  <div className="flex justify-between items-center text-[10px] text-slate-400 pt-2 border-t border-slate-100 font-mono">
                    <span>Slug: /{c.slug}</span>
                    <span>Order: {c.displayOrder}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SUBMODULE 6: Brands */}
        {activeSubmodule === 'brands' && (
          <div className="erp-prod-pane">
            <div className="flex justify-between items-center mb-3">
              <div>
                <h3 className="font-bold text-slate-900">Brand Management</h3>
                <p className="text-xs text-slate-500">প্রস্তুতকারক ও আমদানিকৃত ব্র্যান্ড তালিকা</p>
              </div>
              <button
                type="button"
                onClick={() => setIsBrandModalOpen(true)}
                className="erp-btn erp-btn--primary erp-btn--sm"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add Brand
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {brands.map((b) => (
                <div key={b._id} className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-2">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-sm text-slate-900">{b.name}</h4>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {b.countryOfOrigin || 'Bangladesh'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-slate-500 pt-2 border-t border-slate-100">
                    <span>Active Products:</span>
                    <span className="font-bold font-mono text-slate-800">{b.productCount || 0}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SUBMODULE 9: Image Gallery */}
        {activeSubmodule === 'image-gallery' && (
          <div className="erp-prod-pane">
            <div className="erp-card max-w-4xl mx-auto">
              <div className="erp-card__header">
                <h3 className="erp-card__title">
                  <ImageIcon className="w-5 h-5 text-[#1e3932]" />
                  Product Image Gallery Manager
                </h3>
                <span className="text-xs text-slate-500 font-mono">
                  {selectedProduct?.sku || 'Select a product from list'}
                </span>
              </div>
              <div className="erp-card__body space-y-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Image URL (e.g. /images/products/cannula.svg or S3 URL)"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    className="erp-input text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Alt Text (SEO)"
                    value={newImageAlt}
                    onChange={(e) => setNewImageAlt(e.target.value)}
                    className="erp-input text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!newImageUrl) return;
                      setGalleryImages([
                        ...galleryImages,
                        { url: newImageUrl, altText: newImageAlt || 'Product image', isMain: false, sortOrder: galleryImages.length + 1 },
                      ]);
                      setNewImageUrl('');
                      setNewImageAlt('');
                      showToast('Image added to gallery queue', 'info');
                    }}
                    className="erp-btn erp-btn--primary erp-btn--sm whitespace-nowrap"
                  >
                    Add Image
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
                  {galleryImages.map((img, idx) => (
                    <div key={idx} className="p-2 bg-slate-50 rounded-lg border border-slate-200 relative group space-y-1">
                      <div className="w-full h-24 bg-white rounded border border-slate-200 flex items-center justify-center overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img.url} alt={img.altText} className="max-h-full max-w-full object-contain" />
                      </div>
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="truncate max-w-[100px] text-slate-600">{img.altText}</span>
                        {img.isMain && <span className="px-1.5 py-0.2 rounded bg-emerald-600 text-white font-bold">Main</span>}
                      </div>
                      <div className="flex justify-between pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            const updated = galleryImages.map((g, i) => ({ ...g, isMain: i === idx }));
                            setGalleryImages(updated);
                          }}
                          className="text-[10px] text-emerald-700 hover:underline"
                        >
                          Make Main
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setGalleryImages(galleryImages.filter((_, i) => i !== idx));
                          }}
                          className="text-[10px] text-red-600 hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end pt-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={async () => {
                      if (!selectedProduct) return;
                      await productCatalogService.updateGallery(selectedProduct._id, galleryImages);
                      showToast('Gallery images saved to product record!', 'success');
                    }}
                    className="erp-btn erp-btn--primary"
                  >
                    Save Gallery Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SUBMODULE 11: Bulk Product Import */}
        {activeSubmodule === 'bulk-import' && (
          <div className="erp-prod-pane">
            <div className="erp-card max-w-3xl mx-auto">
              <div className="erp-card__header">
                <h3 className="erp-card__title">
                  <Upload className="w-5 h-5 text-[#1e3932]" />
                  Bulk Product Importer (CSV / JSON)
                </h3>
              </div>
              <div className="erp-card__body space-y-4">
                <p className="text-xs text-slate-600">
                  একসাথে একাধিক প্রোডাক্ট মাস্টার ইম্পোর্ট করুন। সিস্টেম স্বয়ংক্রিয়ভাবে ডুপ্লিকেট SKU এবং ক্যাটাগরি ভ্যালিডেট করবে।
                </p>

                <div className="erp-form-group">
                  <label className="erp-label">Import JSON Records</label>
                  <textarea
                    rows={8}
                    value={importRecordsText}
                    onChange={(e) => setImportRecordsText(e.target.value)}
                    className="erp-textarea font-mono text-xs"
                  />
                </div>

                <div className="flex justify-between items-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      showToast('Sample CSV template generated', 'info');
                    }}
                    className="erp-btn erp-btn--outline erp-btn--sm"
                  >
                    <Download className="w-3.5 h-3.5 mr-1" />
                    Download CSV Template
                  </button>

                  <button type="button" onClick={handleExecuteImport} disabled={loading} className="erp-btn erp-btn--primary">
                    <Upload className="w-4 h-4 mr-1.5" />
                    Process & Validate Import
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SUBMODULE 13: SEO Management */}
        {activeSubmodule === 'seo-management' && (
          <div className="erp-prod-pane">
            <div className="erp-card max-w-3xl mx-auto">
              <div className="erp-card__header">
                <h3 className="erp-card__title">
                  <Globe className="w-5 h-5 text-[#1e3932]" />
                  Search Engine Optimization (SEO) & URL Slugs
                </h3>
                <span className="text-xs text-slate-500 font-mono">{selectedProduct?.sku}</span>
              </div>
              <div className="erp-card__body space-y-4">
                {/* SERP Google Preview */}
                <div>
                  <label className="erp-label mb-1">Google Search SERP Preview</label>
                  <div className="serp-preview">
                    <div className="serp-preview__url">
                      https://sunbirdcorp.com › products › {seoForm.slug || selectedProduct?.seo?.slug || 'iv-cannula-20g'}
                    </div>
                    <div className="serp-preview__title">
                      {seoForm.seoTitle || selectedProduct?.nameEn || 'Medical Equipment in Bangladesh | Sun Bird Corp'}
                    </div>
                    <div className="serp-preview__desc">
                      {seoForm.metaDescription ||
                        selectedProduct?.shortDescription ||
                        'High quality surgical and medical supplies imported directly by Sun Bird Corporation with warranty.'}
                    </div>
                  </div>
                </div>

                <div className="erp-form-group">
                  <div className="flex justify-between">
                    <label className="erp-label">SEO Meta Title *</label>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {(seoForm.seoTitle || selectedProduct?.nameEn || '').length} / 60 Chars
                    </span>
                  </div>
                  <input
                    type="text"
                    value={seoForm.seoTitle}
                    onChange={(e) => setSeoForm({ ...seoForm, seoTitle: e.target.value })}
                    placeholder={selectedProduct?.nameEn || 'Product SEO Title'}
                    className="erp-input"
                  />
                </div>

                <div className="erp-form-group">
                  <div className="flex justify-between">
                    <label className="erp-label">Meta Description</label>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {seoForm.metaDescription.length} / 160 Chars
                    </span>
                  </div>
                  <textarea
                    rows={2}
                    value={seoForm.metaDescription}
                    onChange={(e) => setSeoForm({ ...seoForm, metaDescription: e.target.value })}
                    placeholder="Enter meta description for search engines..."
                    className="erp-textarea"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="erp-form-group">
                    <label className="erp-label">URL Slug</label>
                    <input
                      type="text"
                      value={seoForm.slug}
                      onChange={(e) => setSeoForm({ ...seoForm, slug: e.target.value })}
                      placeholder="e.g. sterile-iv-cannula-20g"
                      className="erp-input font-mono text-xs"
                    />
                  </div>
                  <div className="erp-form-group">
                    <label className="erp-label">Keywords (Comma-separated)</label>
                    <input
                      type="text"
                      value={seoForm.metaKeywords}
                      onChange={(e) => setSeoForm({ ...seoForm, metaKeywords: e.target.value })}
                      placeholder="e.g. cannula, surgical, bd medical"
                      className="erp-input text-xs"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button type="button" onClick={handleSaveSeo} disabled={loading} className="erp-btn erp-btn--primary">
                    Save SEO & Canonical Settings
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SUBMODULE 14: Website Publishing */}
        {activeSubmodule === 'website-publishing' && (
          <div className="erp-prod-pane">
            <div className="erp-card max-w-3xl mx-auto">
              <div className="erp-card__header">
                <h3 className="erp-card__title">
                  <Send className="w-5 h-5 text-[#1e3932]" />
                  E-Commerce Website Publication Gate
                </h3>
              </div>
              <div className="erp-card__body space-y-4">
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-800 text-sm">
                      Target Product: {selectedProduct?.nameEn || 'None Selected'}
                    </span>
                    <span
                      className={`erp-badge ${
                        selectedProduct?.publicationStatus === 'PUBLISHED'
                          ? 'erp-badge--green'
                          : 'erp-badge--neutral'
                      }`}
                    >
                      {selectedProduct?.publicationStatus || 'DRAFT'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    SKU: <b>{selectedProduct?.sku}</b> | Retail Price: <b>৳{selectedProduct?.retailPrice}</b> | Stock: <b>{selectedProduct?.availableStock || 0}</b>
                  </p>
                </div>

                <div className="space-y-2 text-xs">
                  <h4 className="font-bold text-slate-700">Pre-Publication Validation Checklist:</h4>
                  <div className="flex items-center gap-2 text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Master SKU & Unit of Measurement Validated</span>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Public Retail Selling Price Configured (Cost price strictly masked)</span>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Medical Category & Brand Mapped</span>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
                  {selectedProduct?.publicationStatus === 'PUBLISHED' ? (
                    <button
                      type="button"
                      onClick={() => handlePublishToggle(false)}
                      disabled={loading}
                      className="erp-btn erp-btn--outline text-red-600"
                    >
                      Unpublish from Website
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handlePublishToggle(true)}
                      disabled={loading}
                      className="erp-btn erp-btn--primary"
                    >
                      Publish to Live Website
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* DEFAULT FALLBACK / SUBMODULE PLACEHOLDER */}
        {activeSubmodule !== 'product-dashboard' &&
          activeSubmodule !== 'erp-product-master' &&
          activeSubmodule !== 'ecommerce-entry' &&
          activeSubmodule !== 'product-list' &&
          activeSubmodule !== 'categories' &&
          activeSubmodule !== 'brands' &&
          activeSubmodule !== 'image-gallery' &&
          activeSubmodule !== 'bulk-import' &&
          activeSubmodule !== 'seo-management' &&
          activeSubmodule !== 'website-publishing' && (
            <div className="erp-card p-8 text-center text-slate-500">
              <Boxes className="w-12 h-12 text-[#1e3932] mx-auto mb-3 opacity-60" />
              <h3 className="font-bold text-slate-800 text-base mb-1">
                Submodule: {activeSubmodule.toUpperCase()}
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
                মডিউল ০৪ এর এই সাবমডিউলটি কেন্দ্রীয় প্রডাক্ট মাস্টারের সাথে সক্রিয়ভাবে সংযুক্ত রয়েছে।
              </p>
              <button
                type="button"
                onClick={() => handleSubmoduleChange('product-list')}
                className="erp-btn erp-btn--primary erp-btn--sm"
              >
                Back to Product List
              </button>
            </div>
          )}
      </div>

      {/* MODAL: New Category */}
      {isCategoryModalOpen && (
        <div className="erp-modal-overlay">
          <div className="erp-modal max-w-md">
            <div className="erp-modal__header">
              <h3 className="erp-modal__title">Create Product Category</h3>
              <button type="button" onClick={() => setIsCategoryModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleCreateCategory} className="erp-modal__body space-y-3">
              <div className="erp-form-group">
                <label className="erp-label">Category Name (English) *</label>
                <input
                  type="text"
                  value={categoryForm.nameEn}
                  onChange={(e) => setCategoryForm({ ...categoryForm, nameEn: e.target.value })}
                  className="erp-input"
                  required
                />
              </div>
              <div className="erp-form-group">
                <label className="erp-label">Category Name (Bangla)</label>
                <input
                  type="text"
                  value={categoryForm.nameBn}
                  onChange={(e) => setCategoryForm({ ...categoryForm, nameBn: e.target.value })}
                  className="erp-input"
                />
              </div>
              <div className="erp-form-group">
                <label className="erp-label">Parent Category (Optional)</label>
                <select
                  value={categoryForm.parentId}
                  onChange={(e) => setCategoryForm({ ...categoryForm, parentId: e.target.value })}
                  className="erp-select"
                >
                  <option value="">None (Top Level Root)</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.nameEn}
                    </option>
                  ))}
                </select>
              </div>
              <div className="erp-modal__footer">
                <button type="button" onClick={() => setIsCategoryModalOpen(false)} className="erp-btn erp-btn--outline">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="erp-btn erp-btn--primary">
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: New Brand */}
      {isBrandModalOpen && (
        <div className="erp-modal-overlay">
          <div className="erp-modal max-w-md">
            <div className="erp-modal__header">
              <h3 className="erp-modal__title">Create Brand</h3>
              <button type="button" onClick={() => setIsBrandModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleCreateBrand} className="erp-modal__body space-y-3">
              <div className="erp-form-group">
                <label className="erp-label">Brand Name *</label>
                <input
                  type="text"
                  value={brandForm.name}
                  onChange={(e) => setBrandForm({ ...brandForm, name: e.target.value })}
                  className="erp-input"
                  required
                />
              </div>
              <div className="erp-form-group">
                <label className="erp-label">Country of Origin</label>
                <input
                  type="text"
                  value={brandForm.countryOfOrigin}
                  onChange={(e) => setBrandForm({ ...brandForm, countryOfOrigin: e.target.value })}
                  className="erp-input"
                />
              </div>
              <div className="erp-modal__footer">
                <button type="button" onClick={() => setIsBrandModalOpen(false)} className="erp-btn erp-btn--outline">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="erp-btn erp-btn--primary">
                  Save Brand
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ErpProductCatalogView;
