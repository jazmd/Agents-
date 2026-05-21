import { NextResponse } from 'next/server';
import { searchLessons } from '@/lib/lessons/search';
import { isLocale, defaultLocale } from '@/lib/i18n/config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get('q') ?? '';
  const localeParam = url.searchParams.get('locale') ?? '';
  const locale = isLocale(localeParam) ? localeParam : defaultLocale;
  const hits = searchLessons(q, locale, 20);
  return NextResponse.json(
    { q, locale, hits },
    { headers: { 'cache-control': 'no-store' } },
  );
}
