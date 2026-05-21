import { notFound } from 'next/navigation';
import { isLocale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { AppShell } from '@/components/app/AppShell';
import { Pricing } from '@/components/sections/Pricing';
import { Faq } from '@/components/sections/Faq';
import { CtaFinal } from '@/components/sections/CtaFinal';
import { jsonLdProps, productOfferLd } from '@/lib/jsonld';

export const dynamic = 'force-static';

export default async function PricingPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const dict = await getDictionary(params.locale);

  return (
    <AppShell dict={dict} locale={params.locale}>
      <script
        {...jsonLdProps(
          productOfferLd({
            locale: params.locale,
            name: 'Tickra Pro',
            price: '14.99',
            currency: 'EUR',
            recurrence: 'P1M',
          }),
        )}
      />
      <script
        {...jsonLdProps(
          productOfferLd({
            locale: params.locale,
            name: 'Tickra Lifetime',
            price: '199.00',
            currency: 'EUR',
            recurrence: null,
          }),
        )}
      />
      <Pricing dict={dict} locale={params.locale} />
      <Faq dict={dict} />
      <CtaFinal dict={dict} locale={params.locale} />
    </AppShell>
  );
}
