import { notFound, redirect } from 'next/navigation';
import { Award, Download, Lock } from 'lucide-react';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { AppShell } from '@/components/app/AppShell';
import { Container } from '@/components/ui/Container';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { TRACKS } from '@/lib/lessons/tracks';
import { lessonsByTrack } from '@/lib/lessons/catalog';
import { getIdentity } from '@/lib/demo/identity';
import { createSupabaseServerClient, hasSupabaseEnv } from '@/lib/supabase/server';
import { cn } from '@/lib/cn';

export const dynamic = 'force-dynamic';

export default async function CertificatesPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const dict = await getDictionary(params.locale);
  const t = dict.certificate;
  const locale = params.locale as Locale;

  const identity = await getIdentity();
  if (!identity) {
    redirect(`/${locale}/signin?next=${encodeURIComponent(`/${locale}/certificates`)}`);
  }

  // For each track, compute eligibility.
  const completedByTrack: Record<string, { done: number; total: number }> = {};

  if (hasSupabaseEnv() && identity.source === 'supabase') {
    try {
      const sb = createSupabaseServerClient();
      const { data: userData } = await sb.auth.getUser();
      if (userData.user) {
        const { data } = await sb
          .from('lesson_progress')
          .select('lesson_slug')
          .eq('user_id', userData.user.id)
          .eq('status', 'done');
        const done = new Set((data ?? []).map((r) => r.lesson_slug as string));
        for (const track of TRACKS) {
          const lessons = lessonsByTrack(track.id);
          completedByTrack[track.id] = {
            done: lessons.filter((l) => done.has(l.slug)).length,
            total: lessons.length,
          };
        }
      }
    } catch {
      // fall through to demo
    }
  }
  if (Object.keys(completedByTrack).length === 0) {
    for (const track of TRACKS) {
      const lessons = lessonsByTrack(track.id);
      completedByTrack[track.id] = {
        done: identity.plan === 'free' ? 0 : lessons.length,
        total: lessons.length,
      };
    }
  }

  return (
    <AppShell dict={dict} locale={locale}>
      <section className="border-b border-line">
        <Container as="div" className="grid grid-cols-12 gap-x-6 gap-y-10 py-20 md:py-28">
          <div className="col-span-12 lg:col-span-7">
            <Eyebrow>{t.eyebrow}</Eyebrow>
            <h1 className="mt-8 font-display text-display-xl font-medium tracking-tight text-balance text-ink">
              {t.title}
            </h1>
          </div>
          <p className="col-span-12 max-w-xl text-pretty text-[16.5px] leading-relaxed text-muted lg:col-span-5 lg:col-start-8 lg:mt-32">
            {t.body}
          </p>
        </Container>
      </section>

      <section className="border-b border-line bg-elevated">
        <Container as="div" className="py-12 md:py-16">
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {TRACKS.map((track) => {
              const stats = completedByTrack[track.id] ?? { done: 0, total: 0 };
              const eligible = stats.total > 0 && stats.done >= stats.total;
              return (
                <li
                  key={track.id}
                  className={cn(
                    'flex flex-col gap-4 rounded-sm border p-6',
                    eligible ? 'border-ink bg-surface' : 'border-line bg-canvas',
                  )}
                >
                  <div className="flex items-center gap-3">
                    {eligible ? (
                      <Award aria-hidden className="h-5 w-5 text-ink" strokeWidth={1.6} />
                    ) : (
                      <Lock aria-hidden className="h-5 w-5 text-subtle" strokeWidth={1.6} />
                    )}
                    <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
                      {stats.done} / {stats.total}
                    </span>
                  </div>
                  <h2 className="font-display text-2xl font-medium tracking-tight text-ink">
                    {track.title[locale]}
                  </h2>
                  <p className="text-[14px] leading-relaxed text-muted">{track.summary[locale]}</p>
                  {eligible ? (
                    <a
                      href={`/api/certificate/${track.id}?locale=${locale}`}
                      className="mt-auto inline-flex h-11 items-center justify-center gap-2 rounded-full bg-ink px-4 text-[14px] font-medium tracking-tight text-canvas hover:bg-ink/90"
                    >
                      <Download aria-hidden className="h-4 w-4" strokeWidth={1.6} />
                      {t.download}
                    </a>
                  ) : (
                    <p className="mt-auto text-[13px] text-subtle">{t.notEligible}</p>
                  )}
                </li>
              );
            })}
          </ul>
        </Container>
      </section>
    </AppShell>
  );
}
