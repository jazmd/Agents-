import { notFound } from 'next/navigation';
import { isLocale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { AppShell } from '@/components/app/AppShell';
import { Container } from '@/components/ui/Container';
import { Eyebrow } from '@/components/ui/Eyebrow';

export const dynamic = 'force-static';

export default async function AboutPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const dict = await getDictionary(params.locale);
  const t = dict.about;

  return (
    <AppShell dict={dict} locale={params.locale}>
      <section className="border-b border-line">
        <Container as="div" className="grid grid-cols-12 gap-x-6 gap-y-10 py-24 md:py-32">
          <div className="col-span-12 lg:col-span-7">
            <Eyebrow>{t.eyebrow}</Eyebrow>
            <h1 className="mt-8 font-display text-display-xl font-medium tracking-tight text-balance text-ink">
              {t.title}
            </h1>
          </div>
          <p className="col-span-12 max-w-2xl text-pretty text-[17px] leading-relaxed text-muted lg:col-span-5 lg:col-start-8 lg:mt-32">
            {t.body}
          </p>
        </Container>
      </section>

      <section aria-labelledby="principles-title" className="border-b border-line bg-elevated">
        <Container as="div" className="py-24 md:py-32">
          <h2
            id="principles-title"
            className="font-display text-display-md font-medium tracking-tight text-balance text-ink"
          >
            {t.principles.title}
          </h2>

          <ol className="mt-16 grid grid-cols-1 gap-px overflow-hidden rounded-sm border border-line bg-line md:grid-cols-2 lg:grid-cols-5">
            {t.principles.items.map((p, i) => (
              <li key={p.heading} className="flex flex-col bg-canvas p-8">
                <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 className="mt-10 font-display text-xl font-medium tracking-tight text-ink">
                  {p.heading}
                </h3>
                <p className="mt-3 text-[14px] leading-relaxed text-muted">{p.body}</p>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      <section className="border-b border-line">
        <Container as="div" className="grid grid-cols-12 gap-x-6 gap-y-10 py-24 md:py-32">
          <h2 className="col-span-12 font-display text-display-md font-medium tracking-tight text-balance text-ink lg:col-span-6">
            {t.team.title}
          </h2>
          <p className="col-span-12 max-w-xl text-pretty text-[16.5px] leading-relaxed text-muted lg:col-span-5 lg:col-start-8 lg:mt-6">
            {t.team.body}
          </p>
        </Container>
      </section>
    </AppShell>
  );
}
