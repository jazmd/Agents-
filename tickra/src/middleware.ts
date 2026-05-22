import { NextRequest, NextResponse } from 'next/server';
import { defaultLocale, isLocale, locales, LOCALE_COOKIE } from '@/lib/i18n/config';
import { updateSession } from '@/lib/supabase/middleware';

const PUBLIC_FILE = /\.(.*)$/;
const PROTECTED_PATHS = ['dashboard'];

function pickLocale(req: NextRequest): string {
  const cookie = req.cookies.get(LOCALE_COOKIE)?.value;
  if (isLocale(cookie)) return cookie;

  const header = req.headers.get('accept-language') ?? '';
  const preferred = header
    .split(',')
    .map((p) => p.split(';')[0].trim().slice(0, 2).toLowerCase())
    .find((code) => (locales as readonly string[]).includes(code));

  return preferred ?? defaultLocale;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    PUBLIC_FILE.test(pathname)
  ) {
    return NextResponse.next();
  }

  const hasLocale = (locales as readonly string[]).some(
    (l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`),
  );

  if (!hasLocale) {
    const locale = pickLocale(req);
    const url = req.nextUrl.clone();
    url.pathname = `/${locale}${pathname === '/' ? '' : pathname}`;
    return NextResponse.redirect(url);
  }

  const response = await updateSession(req);

  const segments = pathname.split('/').filter(Boolean);
  const segmentAfterLocale = segments[1];
  if (segmentAfterLocale && PROTECTED_PATHS.includes(segmentAfterLocale)) {
    const hasSupabaseSession = req.cookies
      .getAll()
      .some((c) => c.name.startsWith('sb-') && c.name.endsWith('-auth-token'));
    const hasDemoSession = Boolean(req.cookies.get('tickra-demo-session')?.value);
    if (!hasSupabaseSession && !hasDemoSession) {
      const locale = segments[0];
      const url = req.nextUrl.clone();
      url.pathname = `/${locale}/signin`;
      url.searchParams.set('next', pathname);
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|api|favicon.ico|icon|apple-icon|manifest.webmanifest|robots.txt|sitemap.xml|.*\\..*).*)'],
};
