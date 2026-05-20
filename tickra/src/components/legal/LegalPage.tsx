import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { Eyebrow } from '@/components/ui/Eyebrow';
import type { Locale } from '@/lib/i18n/config';

type Section = { heading: string; body: string };

type Props = {
  locale: Locale;
  eyebrow: string;
  title: string;
  updated: string;
  sections: readonly Section[];
  backLabel: string;
};

export function LegalPage({ locale, eyebrow, title, updated, sections, backLabel }: Props) {
  return (
    <article className="border-b border-line">
      <Container as="div" className="grid grid-cols-12 gap-x-6 py-20 md:py-28">
        <header className="col-span-12 lg:col-span-4">
          <Link
            href={`/${locale}`}
            className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-muted hover:text-ink"
          >
            <ArrowLeft aria-hidden className="h-3.5 w-3.5" strokeWidth={1.75} />
            {backLabel}
          </Link>
          <div className="mt-12 lg:sticky lg:top-24">
            <Eyebrow>{eyebrow}</Eyebrow>
            <h1 className="mt-6 font-display text-display-lg font-medium tracking-tight text-balance text-ink">
              {title}
            </h1>
            <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.22em] text-subtle">
              {updated}
            </p>
          </div>
        </header>

        <div className="col-span-12 mt-16 lg:col-span-7 lg:col-start-6 lg:mt-0">
          <div className="divide-y divide-line border-y border-line">
            {sections.map((s, i) => (
              <section key={s.heading} className="py-10 first:pt-0 md:py-12">
                <div className="flex items-baseline gap-4">
                  <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <h2 className="font-display text-xl font-medium tracking-tight text-ink md:text-2xl">
                    {s.heading}
                  </h2>
                </div>
                <p className="mt-5 max-w-2xl text-pretty text-[15.5px] leading-relaxed text-muted">
                  {s.body}
                </p>
              </section>
            ))}
          </div>
        </div>
      </Container>
    </article>
  );
}
