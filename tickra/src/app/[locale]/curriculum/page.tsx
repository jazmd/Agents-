import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowUpRight, Lock } from 'lucide-react';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { AppShell } from '@/components/app/AppShell';
import { Container } from '@/components/ui/Container';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { TRACKS } from '@/lib/lessons/tracks';
import { lessonsByTrack } from '@/lib/lessons/catalog';
import { getSubscription, isProEntitlement } from '@/lib/supabase/queries';
import { cn } from '@/lib/cn';

export const dynamic = 'force-dynamic';

export default async function CurriculumPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const dict = await getDictionary(params.locale);
  const t = dict.curriculum;
  const locale = params.locale as Locale;

  let entitled = false;
  try {
    const sub = await getSubscription();
    entitled = isProEntitlement(sub);
  } catch {
    entitled = false;
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

      {TRACKS.map((track, trackIndex) => {
        const lessons = lessonsByTrack(track.id);
        const totalMinutes = lessons.reduce((sum, l) => sum + l.duration, 0);
        return (
          <section
            key={track.id}
            aria-labelledby={`track-${track.id}-title`}
            className={cn(
              'border-b border-line',
              trackIndex % 2 === 1 && 'bg-elevated',
            )}
          >
            <Container as="div" className="py-20 md:py-24">
              <div className="grid grid-cols-12 gap-x-6 gap-y-10">
                <div className="col-span-12 lg:col-span-4">
                  <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
                    {t.trackLabel} · {String(track.order).padStart(2, '0')}
                  </span>
                  <h2
                    id={`track-${track.id}-title`}
                    className="mt-6 font-display text-display-md font-medium tracking-tight text-balance text-ink"
                  >
                    {track.title[locale]}
                  </h2>
                  <p className="mt-5 max-w-sm text-pretty text-[15px] leading-relaxed text-muted">
                    {track.summary[locale]}
                  </p>
                  <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.22em] text-subtle">
                    {lessons.length} {t.lessonsLabel} · {totalMinutes} {t.minutesLabel}
                  </p>
                </div>

                <ol className="col-span-12 divide-y divide-line border-y border-line lg:col-span-7 lg:col-start-6">
                  {lessons.map((lesson) => {
                    const isLocked = lesson.paywalled && !entitled;
                    return (
                      <li key={lesson.slug}>
                        <Link
                          href={`/${locale}/lesson/${lesson.slug}`}
                          className="group grid grid-cols-12 items-center gap-x-4 gap-y-2 py-6 md:py-7"
                        >
                          <span
                            aria-hidden
                            className="col-span-2 font-mono text-[12px] tracking-[0.12em] text-muted md:col-span-1"
                          >
                            {String(lesson.order).padStart(2, '0')}
                          </span>

                          <div className="col-span-10 md:col-span-8">
                            <h3 className="font-display text-lg font-medium tracking-tight text-ink md:text-xl">
                              {lesson.title[locale]}
                            </h3>
                            <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.18em] text-subtle">
                              {lesson.duration} {t.minutesLabel}
                              {' · '}
                              {isLocked ? t.locked : lesson.paywalled ? t.pro : t.free}
                            </p>
                          </div>

                          <div className="col-span-12 flex items-center justify-end md:col-span-3">
                            <span
                              className={cn(
                                'inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-[11px] uppercase tracking-[0.18em] transition-colors',
                                isLocked
                                  ? 'border-line text-subtle'
                                  : 'border-line text-ink group-hover:border-ink group-hover:bg-ink group-hover:text-canvas',
                              )}
                            >
                              {isLocked ? (
                                <Lock aria-hidden className="h-3.5 w-3.5" strokeWidth={1.6} />
                              ) : (
                                <ArrowUpRight aria-hidden className="h-3.5 w-3.5" strokeWidth={1.6} />
                              )}
                              {isLocked ? t.locked : t.openLesson}
                            </span>
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ol>
              </div>
            </Container>
          </section>
        );
      })}
    </AppShell>
  );
}
