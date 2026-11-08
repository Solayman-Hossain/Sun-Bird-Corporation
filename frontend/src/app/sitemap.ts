import { MetadataRoute } from 'next';
import { INITIAL_PRODUCTS } from '../lib/initialProducts';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://sunbirdcorp.com';
  const lastModified = new Date();

  // Static Storefront Routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/track`,
      lastModified,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/rma`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/account`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/login`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  // Dynamic Product Pages
  const productRoutes: MetadataRoute.Sitemap = INITIAL_PRODUCTS.map((prod) => ({
    url: `${baseUrl}/products/${prod.sku}`,
    lastModified,
    changeFrequency: 'weekly',
    priority: 0.9,
  }));

  return [...staticRoutes, ...productRoutes];
}

