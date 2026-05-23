import { notFound } from 'next/navigation';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { AppShell } from '@/components/app/AppShell';
import { Container } from '@/components/ui/Container';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { GlossaryClient } from '@/components/glossary/GlossaryClient';
import { GLOSSARY } from '@/lib/glossary';

export const dynamic = 'force-static';

export default async function GlossaryPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const dict = await getDictionary(params.locale);
  const t = dict.glossary;
  const locale = params.locale as Locale;

  const entries = GLOSSARY.map((g) => ({
    slug: g.slug,
    term: g.term[locale],
    definition: g.definition[locale],
    category: g.category,
    categoryLabel: t.categories[g.category],
  })).sort((a, b) => a.term.localeCompare(b.term));

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
          <GlossaryClient entries={entries} placeholder={t.placeholder} emptyMessage={t.empty} />
        </Container>
      </section>
    </AppShell>
  );
}
