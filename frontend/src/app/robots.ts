import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://sunbirdcorp.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/products/', '/track', '/rma'],
        disallow: ['/admin', '/erp', '/account/', '/api/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

