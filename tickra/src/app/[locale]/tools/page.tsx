import { notFound } from 'next/navigation';
import { isLocale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { AppShell } from '@/components/app/AppShell';
import { Container } from '@/components/ui/Container';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { PositionSizeCalc } from '@/components/tools/PositionSizeCalc';
import { RiskRewardCalc } from '@/components/tools/RiskRewardCalc';
import { PipValueCalc } from '@/components/tools/PipValueCalc';

export const dynamic = 'force-static';

export default async function ToolsPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const dict = await getDictionary(params.locale);
  const t = dict.tools;

  return (
    <AppShell dict={dict} locale={params.locale}>
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
        <Container as="div" className="grid grid-cols-1 gap-4 py-16 md:py-20 lg:grid-cols-3">
          <PositionSizeCalc labels={t.position} />
          <RiskRewardCalc labels={t.rr} />
          <PipValueCalc labels={t.pip} />
        </Container>
      </section>
    </AppShell>
  );
}
