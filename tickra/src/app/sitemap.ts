import type { MetadataRoute } from 'next';
import { locales } from '@/lib/i18n/config';
import { LESSONS } from '@/lib/lessons/catalog';
import { TRACKS } from '@/lib/lessons/tracks';

const SITE = 'https://tickra.com';
const STATIC_PATHS = [
  '',
  'curriculum',
  'pricing',
  'editorial',
  'about',
  'contact',
  'changelog',
  'status',
  'leaderboard',
  'terms',
  'privacy',
  'risk',
  'imprint',
  'glossary',
  'tools',
  'calendar',
  'community',
  'portfolio',
  'certificates',
  'tutor',
  'signin',
  'signup',
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of locales) {
    for (const path of STATIC_PATHS) {
      entries.push({
        url: `${SITE}/${locale}${path ? `/${path}` : ''}`,
        lastModified: now,
        changeFrequency: path === '' ? 'weekly' : 'monthly',
        priority: path === '' ? 1 : path === 'pricing' || path === 'curriculum' ? 0.9 : 0.7,
        alternates: {
          languages: {
            en: `${SITE}/en${path ? `/${path}` : ''}`,
            fr: `${SITE}/fr${path ? `/${path}` : ''}`,
          },
        },
      });
    }
    for (const track of TRACKS) {
      entries.push({
        url: `${SITE}/${locale}/curriculum/${track.id}`,
        lastModified: now,
        changeFrequency: 'monthly',
        priority: 0.85,
        alternates: {
          languages: {
            en: `${SITE}/en/curriculum/${track.id}`,
            fr: `${SITE}/fr/curriculum/${track.id}`,
          },
        },
      });
    }
    for (const lesson of LESSONS) {
      entries.push({
        url: `${SITE}/${locale}/lesson/${lesson.slug}`,
        lastModified: now,
        changeFrequency: 'monthly',
        priority: lesson.paywalled ? 0.6 : 0.8,
        alternates: {
          languages: {
            en: `${SITE}/en/lesson/${lesson.slug}`,
            fr: `${SITE}/fr/lesson/${lesson.slug}`,
          },
        },
      });
    }
  }

  return entries;
}
