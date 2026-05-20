import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { isLocale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { AppShell } from '@/components/app/AppShell';
import { Container } from '@/components/ui/Container';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { CandleAnatomy } from '@/components/lesson/CandleAnatomy';
import { LessonQuiz } from '@/components/lesson/LessonQuiz';
import { TradingViewEmbed } from '@/components/lesson/TradingViewEmbed';
import { Paywall } from '@/components/lesson/Paywall';
import { getSubscription, isProEntitlement } from '@/lib/supabase/queries';

export const dynamic = 'force-dynamic';

const SLUGS = ['japanese-candles'] as const;
type Slug = (typeof SLUGS)[number];

export default async function LessonPage({
  params,
}: {
  params: { locale: string; slug: string };
}) {
  if (!isLocale(params.locale)) notFound();
  if (!SLUGS.includes(params.slug as Slug)) notFound();

  const dict = await getDictionary(params.locale);
  const t = dict.lesson;

  let entitled = false;
  try {
    const sub = await getSubscription();
    entitled = isProEntitlement(sub);
  } catch {
    entitled = false;
  }

  return (
    <AppShell dict={dict} locale={params.locale}>
      <article>
        <header className="border-b border-line">
          <Container as="div" className="py-16 md:py-20">
            <nav aria-label="Breadcrumb">
              <ol className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
                <li>
                  <Link href={`/${params.locale}/dashboard`} className="hover:text-ink">
                    {t.breadcrumb.split('/')[0].trim()}
                  </Link>
                </li>
                <li aria-hidden>
                  <ChevronRight className="h-3 w-3" strokeWidth={1.5} />
                </li>
                <li className="text-ink">{t.breadcrumb.split('/')[1].trim()}</li>
              </ol>
            </nav>

            <div className="mt-10 grid grid-cols-12 gap-x-6 gap-y-8">
              <div className="col-span-12 lg:col-span-8">
                <Eyebrow>{t.eyebrow}</Eyebrow>
                <h1 className="mt-6 font-display text-display-lg font-medium tracking-tight text-balance text-ink">
                  {t.title}
                </h1>
              </div>
              <p className="col-span-12 max-w-2xl text-pretty text-[17px] leading-relaxed text-muted lg:col-span-4 lg:col-start-9 lg:mt-2">
                {t.intro}
              </p>
            </div>
          </Container>
        </header>

        <section aria-labelledby="anatomy-title" className="border-b border-line bg-elevated">
          <Container as="div" className="py-20 md:py-28">
            <div className="mb-12 grid grid-cols-12 gap-x-6 gap-y-6">
              <div className="col-span-12 lg:col-span-5">
                <Eyebrow>01</Eyebrow>
                <h2
                  id="anatomy-title"
                  className="mt-6 font-display text-display-md font-medium tracking-tight text-balance text-ink"
                >
                  {t.anatomy.title}
                </h2>
              </div>
              <p className="col-span-12 max-w-xl text-pretty text-[15.5px] leading-relaxed text-muted lg:col-span-6 lg:col-start-7 lg:mt-10">
                {t.anatomy.caption}
              </p>
            </div>
            <CandleAnatomy labels={t.anatomy.labels} />
          </Container>
        </section>

        {entitled ? (
          <>
            <section aria-labelledby="practice-title" className="border-b border-line">
              <Container as="div" className="py-20 md:py-28">
                <div className="mb-10 grid grid-cols-12 gap-x-6 gap-y-6">
                  <div className="col-span-12 lg:col-span-5">
                    <Eyebrow>02</Eyebrow>
                    <h2
                      id="practice-title"
                      className="mt-6 font-display text-display-md font-medium tracking-tight text-balance text-ink"
                    >
                      {t.practice.title}
                    </h2>
                  </div>
                  <p className="col-span-12 max-w-xl text-pretty text-[15.5px] leading-relaxed text-muted lg:col-span-6 lg:col-start-7 lg:mt-10">
                    {t.practice.body}
                  </p>
                </div>
                <TradingViewEmbed locale={params.locale === 'fr' ? 'fr' : 'en'} />
              </Container>
            </section>

            <section className="border-b border-line bg-elevated">
              <Container as="div" className="py-20 md:py-28">
                <div className="mb-10">
                  <Eyebrow>03</Eyebrow>
                </div>
                <LessonQuiz
                  title={t.quiz.title}
                  question={t.quiz.question}
                  choices={t.quiz.choices}
                  correct={t.quiz.correct}
                  successMessage={t.quiz.success}
                  retryMessage={t.quiz.retry}
                />
              </Container>
            </section>
          </>
        ) : (
          <section className="border-b border-line">
            <Container as="div" className="py-20 md:py-28">
              <Paywall
                locale={params.locale}
                eyebrow={t.paywall.eyebrow}
                title={t.paywall.title}
                body={t.paywall.body}
                primary={t.paywall.primary}
                secondary={t.paywall.secondary}
              />
            </Container>
          </section>
        )}
      </article>
    </AppShell>
  );
}
