import { notFound } from 'next/navigation';
import { isLocale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { AppShell } from '@/components/app/AppShell';
import { Pricing } from '@/components/sections/Pricing';
import { Faq } from '@/components/sections/Faq';
import { CtaFinal } from '@/components/sections/CtaFinal';

export const dynamic = 'force-static';

export default async function PricingPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const dict = await getDictionary(params.locale);

  return (
    <AppShell dict={dict} locale={params.locale}>
      <Pricing dict={dict} locale={params.locale} />
      <Faq dict={dict} />
      <CtaFinal dict={dict} locale={params.locale} />
    </AppShell>
  );
}
