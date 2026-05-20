import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { defaultLocale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { AppShell } from '@/components/app/AppShell';
import { Container } from '@/components/ui/Container';
import { Eyebrow } from '@/components/ui/Eyebrow';

export default async function LocaleNotFound() {
  const locale = defaultLocale;
  const dict = await getDictionary(locale);
  const t = dict.notFound;

  return (
    <AppShell dict={dict} locale={locale}>
      <section className="border-b border-line">
        <Container as="div" className="grid grid-cols-12 gap-x-6 py-28 md:py-40">
          <div className="col-span-12 lg:col-span-7">
            <Eyebrow>{t.eyebrow}</Eyebrow>
            <h1 className="mt-8 font-display text-display-xl font-medium tracking-tight text-balance text-ink">
              {t.title}
            </h1>
            <p className="mt-8 max-w-xl text-pretty text-[17px] leading-relaxed text-muted">
              {t.body}
            </p>
            <div className="mt-12 flex flex-wrap gap-3">
              <Link
                href={`/${locale}`}
                className="inline-flex h-12 items-center gap-2 rounded-full bg-ink px-6 text-[15px] font-medium tracking-tight text-canvas hover:bg-ink/90"
              >
                {t.primary}
                <ArrowRight aria-hidden className="h-4 w-4" strokeWidth={1.75} />
              </Link>
              <Link
                href={`/${locale}/dashboard`}
                className="inline-flex h-12 items-center gap-2 rounded-full border border-line px-6 text-[15px] font-medium tracking-tight text-ink hover:border-ink hover:bg-ink hover:text-canvas"
              >
                {t.secondary}
              </Link>
            </div>
          </div>

          <div className="col-span-12 mt-16 flex items-end lg:col-span-4 lg:col-start-9 lg:mt-0">
            <span
              aria-hidden
              className="font-display text-[180px] font-medium leading-none tracking-tightest text-line md:text-[220px]"
            >
              404
            </span>
          </div>
        </Container>
      </section>
    </AppShell>
  );
}
