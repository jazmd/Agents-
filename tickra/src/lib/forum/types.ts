import type { Locale } from '../i18n/config';

export type ForumCategory = 'general' | 'patterns' | 'risk' | 'brokers' | 'strategies' | 'beginners';

export const FORUM_CATEGORIES: ForumCategory[] = [
  'general',
  'beginners',
  'patterns',
  'risk',
  'strategies',
  'brokers',
];

export type Thread = {
  id: string;
  user_id: string;
  display_name: string;
  category: ForumCategory;
  locale: Locale;
  slug: string;
  title: string;
  body: string;
  pinned: boolean;
  locked: boolean;
  reply_count: number;
  created_at: string;
  updated_at: string;
};

export type Reply = {
  id: string;
  thread_id: string;
  user_id: string;
  display_name: string;
  body: string;
  created_at: string;
};

export function slugify(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 80);
}
