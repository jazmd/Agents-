import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArrowUpRight, ChevronRight, Lock } from 'lucide-react';
import { isLocale, locales, type Locale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { AppShell } from '@/components/app/AppShell';
import { Container } from '@/components/ui/Container';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { TRACKS } from '@/lib/lessons/tracks';
import { lessonsByTrack } from '@/lib/lessons/catalog';
import { getSubscription, isProEntitlement } from '@/lib/supabase/queries';
import { cn } from '@/lib/cn';

export const dynamic = 'force-dynamic';

export function generateStaticParams() {
  return locales.flatMap((locale) => TRACKS.map((t) => ({ locale, track: t.id })));
}

export async function generateMetadata({
  params,
}: {
  params: { locale: string; track: string };
}): Promise<Metadata> {
  if (!isLocale(params.locale)) return {};
  const track = TRACKS.find((t) => t.id === params.track);
  if (!track) return {};
  const title = track.title[params.locale];
  const description = track.summary[params.locale];
  const url = `/${params.locale}/curriculum/${params.track}`;
  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: {
        en: `/en/curriculum/${params.track}`,
        fr: `/fr/curriculum/${params.track}`,
      },
    },
    openGraph: { title, description, url, type: 'website' },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default async function TrackPage({
  params,
}: {
  params: { locale: string; track: string };
}) {
  if (!isLocale(params.locale)) notFound();
  const track = TRACKS.find((tk) => tk.id === params.track);
  if (!track) notFound();

  const dict = await getDictionary(params.locale);
  const t = dict.curriculum;
  const locale = params.locale as Locale;
  const lessons = lessonsByTrack(track.id);
  const totalMinutes = lessons.reduce((sum, l) => sum + l.duration, 0);

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
        <Container as="div" className="py-16 md:py-20">
          <nav aria-label="Breadcrumb">
            <ol className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
              <li>
                <Link href={`/${locale}/curriculum`} className="hover:text-ink">
                  {t.eyebrow}
                </Link>
              </li>
              <li aria-hidden>
                <ChevronRight className="h-3 w-3" strokeWidth={1.5} />
              </li>
              <li className="text-ink">{track.title[locale]}</li>
            </ol>

            <div className="mt-10 grid grid-cols-12 gap-x-6 gap-y-8">
              <div className="col-span-12 lg:col-span-7">
                <Eyebrow>
                  {t.trackLabel} · {String(track.order).padStart(2, '0')}
                </Eyebrow>
                <h1 className="mt-6 font-display text-display-xl font-medium tracking-tight text-balance text-ink">
                  {track.title[locale]}
                </h1>
                <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
                  {lessons.length} {t.lessonsLabel} · {totalMinutes} {t.minutesLabel}
                </p>
              </div>
              <p className="col-span-12 max-w-xl text-pretty text-[17px] leading-relaxed text-muted lg:col-span-5 lg:col-start-8 lg:mt-2">
                {track.summary[locale]}
              </p>
            </div>
          </nav>
        </Container>
      </section>

      <section className="border-b border-line bg-elevated">
        <Container as="div" className="py-16 md:py-20">
          <ol className="divide-y divide-line border-y border-line">
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
                      <h2 className="font-display text-lg font-medium tracking-tight text-ink md:text-xl">
                        {lesson.title[locale]}
                      </h2>
                      <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.18em] text-subtle">
                        {lesson.duration} {t.minutesLabel} ·{' '}
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
        </Container>
      </section>
    </AppShell>
  );
}
