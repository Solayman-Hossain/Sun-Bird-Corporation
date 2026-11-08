import { apiClient, getPublicProducts } from '../lib/api';
import { Product } from '../types';
import { INITIAL_PRODUCTS } from '../lib/initialProducts';

export const productService = {
  async getAll(params?: { category?: string; query?: string; filter?: string }): Promise<Product[]> {
    try {
      const products = await getPublicProducts();
      if (!products || products.length === 0) return INITIAL_PRODUCTS;
      return products;
    } catch {
      return INITIAL_PRODUCTS;
    }
  },

  async getBySku(sku: string): Promise<Product | null> {
    try {
      const res = await apiClient<{ success: boolean; data: Product }>(`/products/${encodeURIComponent(sku)}`);
      if (res?.success && res.data) return res.data;
      return INITIAL_PRODUCTS.find((p) => p.sku === sku) || null;
    } catch {
      return INITIAL_PRODUCTS.find((p) => p.sku === sku) || null;
    }
  },

  async getFeatured(): Promise<Product[]> {
    const all = await this.getAll();
    return all.filter((p) => p.isFeatured).slice(0, 4);
  },

  async getNewArrivals(): Promise<Product[]> {
    const all = await this.getAll();
    return all.filter((p) => p.isNewArrival).slice(0, 4);
  },

  async getBestSellers(): Promise<Product[]> {
    const all = await this.getAll();
    return all.filter((p) => p.isBestSeller).slice(0, 4);
  },
};

export default productService;

