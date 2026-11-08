import { apiClient } from '../api/client';
import { Product } from '../types';

export interface ListingFilterParams {
  category?: string;
  query?: string;
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
  dgdaApprovedOnly?: boolean;
  page?: number;
  limit?: number;
  sort?: 'price_asc' | 'price_desc' | 'rating' | 'newest';
}

export interface ListingResponse {
  items: Product[];
  total: number;
  page: number;
  totalPages: number;
  facets: {
    categories: Array<{ name: string; count: number }>;
    brands: Array<{ name: string; count: number }>;
  };
}

export const listingService = {
  async getListings(params: ListingFilterParams = {}): Promise<ListingResponse> {
    const searchParams = new URLSearchParams();
    if (params.category) searchParams.set('category', params.category);
    if (params.query) searchParams.set('q', params.query);
    if (params.minPrice) searchParams.set('minPrice', params.minPrice.toString());
    if (params.maxPrice) searchParams.set('maxPrice', params.maxPrice.toString());
    if (params.inStockOnly) searchParams.set('inStock', 'true');
    if (params.dgdaApprovedOnly) searchParams.set('dgda', 'true');
    if (params.page) searchParams.set('page', params.page.toString());
    if (params.limit) searchParams.set('limit', params.limit.toString());
    if (params.sort) searchParams.set('sort', params.sort);

    const queryString = searchParams.toString();
    const endpoint = queryString ? `/products?${queryString}` : '/products';
    return apiClient.get<ListingResponse>(endpoint);
  },

  async getFeaturedListings(): Promise<Product[]> {
    return apiClient.get<Product[]>('/products/featured');
  },

  async getTrendingEquipment(): Promise<Product[]> {
    return apiClient.get<Product[]>('/products/trending');
  }
};

