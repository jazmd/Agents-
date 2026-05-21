import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/auth/',
          '/monitoring/',
          '/*/admin',
          '/*/dashboard',
          '/*/settings',
          '/*/journal',
          '/*/reviews',
          '/*/refer',
          '/*/achievements',
          '/*/reset',
        ],
      },
    ],
    sitemap: 'https://tickra.com/sitemap.xml',
    host: 'https://tickra.com',
  };
}
