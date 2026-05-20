import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { isLocale, locales } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { AppShell } from '@/components/app/AppShell';
import { Container } from '@/components/ui/Container';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { Paywall } from '@/components/lesson/Paywall';
import { BlockRenderer } from '@/components/lesson/Block';
import { LESSONS, lessonBySlug } from '@/lib/lessons/catalog';
import { getSubscription, isProEntitlement } from '@/lib/supabase/queries';

export const dynamic = 'force-dynamic';

export function generateStaticParams() {
  return locales.flatMap((locale) => LESSONS.map((l) => ({ locale, slug: l.slug })));
}

export default async function LessonPage({
  params,
}: {
  params: { locale: string; slug: string };
}) {
  if (!isLocale(params.locale)) notFound();
  const lesson = lessonBySlug(params.slug);
  if (!lesson) notFound();

  const dict = await getDictionary(params.locale);
  const locale = params.locale;

  let entitled = !lesson.paywalled;
  if (lesson.paywalled) {
    try {
      const sub = await getSubscription();
      entitled = isProEntitlement(sub);
    } catch {
      entitled = false;
    }
  }

  return (
    <AppShell dict={dict} locale={locale}>
      <article>
        <header className="border-b border-line">
          <Container as="div" className="py-16 md:py-20">
            <nav aria-label="Breadcrumb">
              <ol className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
                <li>
                  <Link href={`/${locale}/curriculum`} className="hover:text-ink">
                    {lesson.breadcrumb[locale].split('/')[0].trim()}
                  </Link>
                </li>
                <li aria-hidden>
                  <ChevronRight className="h-3 w-3" strokeWidth={1.5} />
                </li>
                <li className="text-ink">{lesson.breadcrumb[locale].split('/')[1].trim()}</li>
              </ol>
            </nav>

            <div className="mt-10 grid grid-cols-12 gap-x-6 gap-y-8">
              <div className="col-span-12 lg:col-span-8">
                <Eyebrow>{lesson.eyebrow[locale]}</Eyebrow>
                <h1 className="mt-6 font-display text-display-lg font-medium tracking-tight text-balance text-ink">
                  {lesson.title[locale]}
                </h1>
              </div>
              <p className="col-span-12 max-w-2xl text-pretty text-[17px] leading-relaxed text-muted lg:col-span-4 lg:col-start-9 lg:mt-2">
                {lesson.intro[locale]}
              </p>
            </div>
          </Container>
        </header>

        {entitled ? (
          lesson.blocks.map((block, i) => {
            const tone = i % 2 === 0 ? 'border-b border-line' : 'border-b border-line bg-elevated';
            return (
              <section key={i} className={tone}>
                <Container as="div" className="py-16 md:py-24">
                  <BlockRenderer block={block} locale={locale} dict={dict} slug={lesson.slug} index={i} />
                </Container>
              </section>
            );
          })
        ) : (
          <>
            {/* free preview: first non-quiz block only */}
            {lesson.blocks
              .filter((b) => b.kind !== 'quiz' && b.kind !== 'chart')
              .slice(0, 1)
              .map((block, i) => (
                <section key={i} className="border-b border-line">
                  <Container as="div" className="py-16 md:py-24">
                    <BlockRenderer block={block} locale={locale} dict={dict} slug={lesson.slug} index={i} />
                  </Container>
                </section>
              ))}
            <section className="border-b border-line">
              <Container as="div" className="py-20 md:py-28">
                <Paywall
                  locale={locale}
                  eyebrow={dict.lesson.paywall.eyebrow}
                  title={dict.lesson.paywall.title}
                  body={dict.lesson.paywall.body}
                  primary={dict.lesson.paywall.primary}
                  secondary={dict.lesson.paywall.secondary}
                />
              </Container>
            </section>
          </>
        )}
      </article>
    </AppShell>
  );
}
