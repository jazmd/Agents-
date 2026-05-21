import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowUpRight, CalendarClock } from 'lucide-react';
import { isLocale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { AppShell } from '@/components/app/AppShell';
import { Container } from '@/components/ui/Container';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { createSupabaseServerClient, hasSupabaseEnv } from '@/lib/supabase/server';
import { lessonBySlug } from '@/lib/lessons/catalog';
import { GradeButtons } from '@/components/reviews/GradeButtons';

export const dynamic = 'force-dynamic';

type ReviewRow = {
  lesson_slug: string;
  next_due: string;
  interval_days: number;
};

export default async function ReviewsPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const dict = await getDictionary(params.locale);
  const t = dict.reviews;
  const locale = params.locale;

  if (!hasSupabaseEnv()) {
    redirect(`/${locale}/signin?next=${encodeURIComponent(`/${locale}/reviews`)}`);
  }

  const supabase = createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) {
    redirect(`/${locale}/signin?next=${encodeURIComponent(`/${locale}/reviews`)}`);
  }

  const today = new Date().toISOString().slice(0, 10);
  const { data: reviews } = await supabase
    .from('lesson_reviews')
    .select('lesson_slug, next_due, interval_days')
    .eq('user_id', user.id)
    .lte('next_due', today)
    .order('next_due', { ascending: true })
    .limit(50);

  const items = (reviews ?? []) as ReviewRow[];

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
        <Container as="div" className="py-16 md:py-20">
          {items.length === 0 ? (
            <p className="text-pretty text-[16px] text-muted">{t.empty}</p>
          ) : (
            <ul className="divide-y divide-line border-y border-line">
              {items.map((r) => {
                const lesson = lessonBySlug(r.lesson_slug);
                if (!lesson) return null;
                return (
                  <li key={r.lesson_slug} className="grid grid-cols-12 gap-x-4 gap-y-3 py-6 md:py-7">
                    <div className="col-span-12 md:col-span-7">
                      <h2 className="font-display text-lg font-medium tracking-tight text-ink md:text-xl">
                        {lesson.title[locale]}
                      </h2>
                      <p className="mt-1 inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
                        <CalendarClock className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
                        {lesson.eyebrow[locale]}
                      </p>
                    </div>
                    <div className="col-span-12 flex items-center md:col-span-5">
                      <GradeButtons
                        slug={r.lesson_slug}
                        locale={locale}
                        labels={t.grade}
                      />
                    </div>
                    <div className="col-span-12 -mt-2">
                      <Link
                        href={`/${locale}/lesson/${r.lesson_slug}`}
                        className="inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-ink"
                      >
                        {t.cta}
                        <ArrowUpRight aria-hidden className="h-3.5 w-3.5" strokeWidth={1.5} />
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Container>
      </section>
    </AppShell>
  );
}
