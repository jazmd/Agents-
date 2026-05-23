import { NextResponse } from 'next/server';
import { isLocale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { TRACKS } from '@/lib/lessons/tracks';
import { lessonsByTrack } from '@/lib/lessons/catalog';
import { getIdentity } from '@/lib/demo/identity';
import { hasSupabaseEnv, createSupabaseServerClient } from '@/lib/supabase/server';
import { buildCertificate } from '@/lib/pdf/certificate';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: { track: string } }) {
  const url = new URL(req.url);
  const localeRaw = url.searchParams.get('locale') ?? 'en';
  const locale = isLocale(localeRaw) ? localeRaw : 'en';
  const dict = await getDictionary(locale);
  const c = dict.certificate;

  const track = TRACKS.find((t) => t.id === params.track);
  if (!track) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const identity = await getIdentity();
  if (!identity) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  const trackLessons = lessonsByTrack(track.id);
  const requiredSlugs = new Set(trackLessons.map((l) => l.slug));

  let completed = 0;
  if (hasSupabaseEnv() && identity.source === 'supabase') {
    try {
      const sb = createSupabaseServerClient();
      const { data: userData } = await sb.auth.getUser();
      if (userData.user) {
        const { data } = await sb
          .from('lesson_progress')
          .select('lesson_slug')
          .eq('user_id', userData.user.id)
          .eq('status', 'done')
          .in('lesson_slug', [...requiredSlugs]);
        completed = (data ?? []).length;
      }
    } catch {
      completed = 0;
    }
  } else {
    // Demo mode: pretend the user has completed the track when their plan covers it.
    completed = identity.plan === 'free' ? Math.min(requiredSlugs.size, 1) : requiredSlugs.size;
  }

  if (completed < requiredSlugs.size) {
    return NextResponse.json(
      { error: 'not_eligible', completed, required: requiredSlugs.size },
      { status: 403 },
    );
  }

  const verifyId = `TKR-${track.id.toUpperCase()}-${identity.email.split('@')[0].slice(0, 6).toUpperCase()}-${new Date().getFullYear()}`;
  const issuedOn = new Date().toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const pdf = buildCertificate({
    recipientName: identity.fullName || identity.email,
    trackName: track.title[locale],
    statement: c.statement.replace('{track}', track.title[locale]).replace('{n}', String(requiredSlugs.size)),
    issuedOnLabel: c.issuedOn,
    issuedOnValue: issuedOn,
    verifyByLabel: c.verifyBy,
    verifyId,
    brand: 'TICKRA',
    tagline: 'tickra.com · educational only',
  });

  return new NextResponse(pdf, {
    status: 200,
    headers: {
      'content-type': 'application/pdf',
      'content-disposition': `attachment; filename="tickra-${track.id}-certificate.pdf"`,
      'cache-control': 'no-store',
    },
  });
}
