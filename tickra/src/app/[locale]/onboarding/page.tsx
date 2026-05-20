import { notFound } from 'next/navigation';
import { isLocale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { AppShell } from '@/components/app/AppShell';
import { Quiz } from '@/components/onboarding/Quiz';

export const dynamic = 'force-static';

export default async function OnboardingPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const dict = await getDictionary(params.locale);

  return (
    <AppShell dict={dict} locale={params.locale}>
      <Quiz dict={dict} locale={params.locale} />
    </AppShell>
  );
}
