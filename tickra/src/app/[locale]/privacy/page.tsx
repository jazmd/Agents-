import { notFound } from 'next/navigation';
import { isLocale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { AppShell } from '@/components/app/AppShell';
import { LegalPage } from '@/components/legal/LegalPage';

export const dynamic = 'force-static';

export default async function PrivacyPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const dict = await getDictionary(params.locale);
  const t = dict.legal.privacy;

  return (
    <AppShell dict={dict} locale={params.locale}>
      <LegalPage
        locale={params.locale}
        eyebrow={t.eyebrow}
        title={t.title}
        updated={t.updated}
        sections={t.sections}
        backLabel={dict.legal.backToHome}
      />
    </AppShell>
  );
}
