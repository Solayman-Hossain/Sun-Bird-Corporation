import { apiClient } from '../lib/api';
import {
  ErpProductMasterItem,
  ProductCategoryItem,
  ProductBrandItem,
  ProductAttributeItem,
  ProductCatalogDashboardMetrics,
  BulkImportResult,
} from '../types';

export const productCatalogService = {
  // 1. Dashboard
  async getDashboard(params?: { organizationId?: string }): Promise<ProductCatalogDashboardMetrics> {
    const query = new URLSearchParams();
    if (params?.organizationId) query.append('organizationId', params.organizationId);
    const res = await apiClient<{ success: boolean; data: ProductCatalogDashboardMetrics }>(
      `/erp/product-catalog/dashboard?${query.toString()}`
    );
    return res.data;
  },

  // 2. Seeder
  async seedDefaults(): Promise<any> {
    const res = await apiClient<{ success: boolean; message: string; data: any }>(
      '/erp/product-catalog/seed-defaults',
      { method: 'POST' }
    );
    return res.data;
  },

  // 3. Products Master
  async listProducts(params: {
    category?: string;
    brand?: string;
    status?: string;
    publicationStatus?: string;
    search?: string;
    inStockOnly?: boolean;
    page?: number;
    limit?: number;
    sort?: string;
  } = {}): Promise<{ items: ErpProductMasterItem[]; total: number; page: number; limit: number; totalPages: number }> {
    const query = new URLSearchParams();
    if (params.category && params.category !== 'ALL') query.append('category', params.category);
    if (params.brand && params.brand !== 'ALL') query.append('brand', params.brand);
    if (params.status && params.status !== 'ALL') query.append('status', params.status);
    if (params.publicationStatus && params.publicationStatus !== 'ALL') query.append('publicationStatus', params.publicationStatus);
    if (params.search) query.append('search', params.search);
    if (params.inStockOnly) query.append('inStockOnly', 'true');
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());
    if (params.sort) query.append('sort', params.sort);

    const res = await apiClient<{
      success: boolean;
      items: ErpProductMasterItem[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(`/erp/product-catalog/products?${query.toString()}`);

    return {
      items: res.items || [],
      total: res.total || 0,
      page: res.page || 1,
      limit: res.limit || 20,
      totalPages: res.totalPages || 1,
    };
  },

  async getProduct(id: string): Promise<ErpProductMasterItem> {
    const res = await apiClient<{ success: boolean; data: ErpProductMasterItem }>(
      `/erp/product-catalog/products/${encodeURIComponent(id)}`
    );
    return res.data;
  },

  async createProduct(dto: Partial<ErpProductMasterItem>): Promise<ErpProductMasterItem> {
    const res = await apiClient<{ success: boolean; message: string; data: ErpProductMasterItem }>(
      '/erp/product-catalog/products',
      {
        method: 'POST',
        body: JSON.stringify(dto),
      }
    );
    return res.data;
  },

  async updateProduct(id: string, dto: Partial<ErpProductMasterItem>): Promise<ErpProductMasterItem> {
    const res = await apiClient<{ success: boolean; message: string; data: ErpProductMasterItem }>(
      `/erp/product-catalog/products/${encodeURIComponent(id)}`,
      {
        method: 'PUT',
        body: JSON.stringify(dto),
      }
    );
    return res.data;
  },

  // 4. Extensions
  async updateCatalog(id: string, catalog: any): Promise<ErpProductMasterItem> {
    const res = await apiClient<{ success: boolean; message: string; data: ErpProductMasterItem }>(
      `/erp/product-catalog/products/${encodeURIComponent(id)}/catalog`,
      {
        method: 'PUT',
        body: JSON.stringify(catalog),
      }
    );
    return res.data;
  },

  async updateGallery(id: string, images: any[]): Promise<ErpProductMasterItem> {
    const res = await apiClient<{ success: boolean; message: string; data: ErpProductMasterItem }>(
      `/erp/product-catalog/products/${encodeURIComponent(id)}/gallery`,
      {
        method: 'PUT',
        body: JSON.stringify({ images }),
      }
    );
    return res.data;
  },

  async updatePricing(id: string, pricing: any): Promise<ErpProductMasterItem> {
    const res = await apiClient<{ success: boolean; message: string; data: ErpProductMasterItem }>(
      `/erp/product-catalog/products/${encodeURIComponent(id)}/pricing`,
      {
        method: 'PUT',
        body: JSON.stringify(pricing),
      }
    );
    return res.data;
  },

  async updateSeo(id: string, seo: any): Promise<ErpProductMasterItem> {
    const res = await apiClient<{ success: boolean; message: string; data: ErpProductMasterItem }>(
      `/erp/product-catalog/products/${encodeURIComponent(id)}/seo`,
      {
        method: 'PUT',
        body: JSON.stringify(seo),
      }
    );
    return res.data;
  },

  async updateVariants(id: string, variants: any[]): Promise<ErpProductMasterItem> {
    const res = await apiClient<{ success: boolean; message: string; data: ErpProductMasterItem }>(
      `/erp/product-catalog/products/${encodeURIComponent(id)}/variants`,
      {
        method: 'PUT',
        body: JSON.stringify({ variants }),
      }
    );
    return res.data;
  },

  async publishProduct(id: string, requireApproval = false, organizationId?: string): Promise<any> {
    const res = await apiClient<{ success: boolean; message: string; data: any }>(
      `/erp/product-catalog/products/${encodeURIComponent(id)}/publish`,
      {
        method: 'POST',
        body: JSON.stringify({ requireApproval, organizationId }),
      }
    );
    return res.data;
  },

  async unpublishProduct(id: string): Promise<ErpProductMasterItem> {
    const res = await apiClient<{ success: boolean; message: string; data: ErpProductMasterItem }>(
      `/erp/product-catalog/products/${encodeURIComponent(id)}/unpublish`,
      {
        method: 'POST',
      }
    );
    return res.data;
  },

  async bulkPublish(productIds: string[], action: 'PUBLISH' | 'UNPUBLISH'): Promise<{ affected: number }> {
    const res = await apiClient<{ success: boolean; data: { affected: number } }>(
      '/erp/product-catalog/products/bulk-publish',
      {
        method: 'POST',
        body: JSON.stringify({ productIds, action }),
      }
    );
    return res.data;
  },

  async importProducts(records: any[], updateExisting = false): Promise<BulkImportResult> {
    const res = await apiClient<{ success: boolean; message: string; data: BulkImportResult }>(
      '/erp/product-catalog/import',
      {
        method: 'POST',
        body: JSON.stringify({ records, updateExisting }),
      }
    );
    return res.data;
  },

  async exportProducts(params: { category?: string; brand?: string; status?: string } = {}): Promise<any[]> {
    const query = new URLSearchParams();
    if (params.category) query.append('category', params.category);
    if (params.brand) query.append('brand', params.brand);
    if (params.status) query.append('status', params.status);
    const res = await apiClient<{ success: boolean; count: number; data: any[] }>(
      `/erp/product-catalog/export?${query.toString()}`
    );
    return res.data;
  },

  // 5. Categories
  async listCategories(params?: { isActive?: boolean }): Promise<ProductCategoryItem[]> {
    const query = new URLSearchParams();
    if (params?.isActive !== undefined) query.append('isActive', params.isActive.toString());
    const res = await apiClient<{ success: boolean; data: ProductCategoryItem[] }>(
      `/erp/product-catalog/categories?${query.toString()}`
    );
    return res.data;
  },

  async getCategoryTree(): Promise<ProductCategoryItem[]> {
    const res = await apiClient<{ success: boolean; data: ProductCategoryItem[] }>(
      '/erp/product-catalog/categories/tree'
    );
    return res.data;
  },

  async createCategory(dto: Partial<ProductCategoryItem>): Promise<ProductCategoryItem> {
    const res = await apiClient<{ success: boolean; data: ProductCategoryItem }>(
      '/erp/product-catalog/categories',
      {
        method: 'POST',
        body: JSON.stringify(dto),
      }
    );
    return res.data;
  },

  async updateCategory(id: string, dto: Partial<ProductCategoryItem>): Promise<ProductCategoryItem> {
    const res = await apiClient<{ success: boolean; data: ProductCategoryItem }>(
      `/erp/product-catalog/categories/${encodeURIComponent(id)}`,
      {
        method: 'PUT',
        body: JSON.stringify(dto),
      }
    );
    return res.data;
  },

  async deleteCategory(id: string): Promise<boolean> {
    await apiClient(`/erp/product-catalog/categories/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    return true;
  },

  // 6. Brands
  async listBrands(params?: { isActive?: boolean }): Promise<ProductBrandItem[]> {
    const query = new URLSearchParams();
    if (params?.isActive !== undefined) query.append('isActive', params.isActive.toString());
    const res = await apiClient<{ success: boolean; data: ProductBrandItem[] }>(
      `/erp/product-catalog/brands?${query.toString()}`
    );
    return res.data;
  },

  async createBrand(dto: Partial<ProductBrandItem>): Promise<ProductBrandItem> {
    const res = await apiClient<{ success: boolean; data: ProductBrandItem }>(
      '/erp/product-catalog/brands',
      {
        method: 'POST',
        body: JSON.stringify(dto),
      }
    );
    return res.data;
  },

  async updateBrand(id: string, dto: Partial<ProductBrandItem>): Promise<ProductBrandItem> {
    const res = await apiClient<{ success: boolean; data: ProductBrandItem }>(
      `/erp/product-catalog/brands/${encodeURIComponent(id)}`,
      {
        method: 'PUT',
        body: JSON.stringify(dto),
      }
    );
    return res.data;
  },

  async deleteBrand(id: string): Promise<boolean> {
    await apiClient(`/erp/product-catalog/brands/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    return true;
  },

  // 7. Attributes
  async listAttributes(): Promise<ProductAttributeItem[]> {
    const res = await apiClient<{ success: boolean; data: ProductAttributeItem[] }>(
      '/erp/product-catalog/attributes'
    );
    return res.data;
  },

  async createAttribute(dto: { name: string; code?: string; values: string[] }): Promise<ProductAttributeItem> {
    const res = await apiClient<{ success: boolean; data: ProductAttributeItem }>(
      '/erp/product-catalog/attributes',
      {
        method: 'POST',
        body: JSON.stringify(dto),
      }
    );
    return res.data;
  },
};

export default productCatalogService;
