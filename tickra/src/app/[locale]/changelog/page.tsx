import { notFound } from 'next/navigation';
import { isLocale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { AppShell } from '@/components/app/AppShell';
import { Container } from '@/components/ui/Container';
import { Eyebrow } from '@/components/ui/Eyebrow';

export const dynamic = 'force-static';

export default async function ChangelogPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const dict = await getDictionary(params.locale);
  const t = dict.changelog;

  return (
    <AppShell dict={dict} locale={params.locale}>
      <section className="border-b border-line">
        <Container as="div" className="grid grid-cols-12 gap-x-6 gap-y-10 py-20 md:py-28">
          <div className="col-span-12 lg:col-span-5">
            <Eyebrow>{t.eyebrow}</Eyebrow>
            <h1 className="mt-6 font-display text-display-lg font-medium tracking-tight text-balance text-ink">
              {t.title}
            </h1>
          </div>
          <p className="col-span-12 max-w-xl text-pretty text-[16.5px] leading-relaxed text-muted lg:col-span-5 lg:col-start-8 lg:mt-16">
            {t.body}
          </p>
        </Container>
      </section>

      <section className="border-b border-line">
        <Container as="div" className="py-12 md:py-16">
          <ol className="divide-y divide-line border-y border-line">
            {t.versions.map((v) => (
              <li key={v.version} className="grid grid-cols-12 gap-x-6 gap-y-6 py-12">
                <div className="col-span-12 md:col-span-3">
                  <span className="font-mono text-[12px] uppercase tracking-[0.18em] text-ink">
                    v{v.version}
                  </span>
                  <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.22em] text-subtle">
                    {v.date}
                  </p>
                </div>

                <div className="col-span-12 md:col-span-9">
                  <h2 className="font-display text-2xl font-medium tracking-tight text-balance text-ink md:text-3xl">
                    {v.title}
                  </h2>
                  <ul className="mt-6 max-w-2xl space-y-3.5 text-[15.5px] leading-relaxed text-muted">
                    {v.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span
                          aria-hidden
                          className="mt-2 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-ink"
                        />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </li>
            ))}
          </ol>
        </Container>
      </section>
    </AppShell>
  );
}
