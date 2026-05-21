import { notFound, redirect } from 'next/navigation';
import { isLocale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { AppShell } from '@/components/app/AppShell';
import { Container } from '@/components/ui/Container';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { isAdmin } from '@/lib/admin';

export const dynamic = 'force-dynamic';

type Overview = {
  profiles_count: number;
  paying_count: number;
  active_pro: number;
  lifetime_count: number;
  lessons_completed: number;
  active_today: number;
  minutes_last_7d: number;
};

export default async function AdminPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const dict = await getDictionary(params.locale);
  const locale = params.locale;

  const { admin, email } = await isAdmin();
  if (!admin) {
    redirect(`/${locale}/signin?next=${encodeURIComponent(`/${locale}/admin`)}`);
  }

  const supabase = createSupabaseServerClient();
  const { data } = await supabase.from('admin_overview').select('*').maybeSingle();
  const ov = (data ?? {
    profiles_count: 0,
    paying_count: 0,
    active_pro: 0,
    lifetime_count: 0,
    lessons_completed: 0,
    active_today: 0,
    minutes_last_7d: 0,
  }) as Overview;

  const conversion =
    ov.profiles_count > 0 ? Math.round((ov.paying_count / ov.profiles_count) * 100) : 0;

  const stats = [
    { label: locale === 'fr' ? 'Apprenants' : 'Learners', value: ov.profiles_count.toLocaleString() },
    { label: locale === 'fr' ? 'Payants' : 'Paying', value: ov.paying_count.toLocaleString() },
    { label: locale === 'fr' ? 'Pro actifs' : 'Active Pro', value: ov.active_pro.toLocaleString() },
    { label: locale === 'fr' ? 'À vie' : 'Lifetime', value: ov.lifetime_count.toLocaleString() },
    { label: locale === 'fr' ? 'Conversion' : 'Conversion', value: `${conversion}%` },
    { label: locale === 'fr' ? 'Actifs aujourd’hui' : 'Active today', value: ov.active_today.toLocaleString() },
    { label: locale === 'fr' ? 'Minutes (7j)' : 'Minutes (7d)', value: ov.minutes_last_7d.toLocaleString() },
    { label: locale === 'fr' ? 'Leçons terminées' : 'Lessons completed', value: ov.lessons_completed.toLocaleString() },
  ];

  return (
    <AppShell dict={dict} locale={locale}>
      <section className="border-b border-line">
        <Container as="div" className="grid grid-cols-12 gap-x-6 gap-y-10 py-20 md:py-24">
          <div className="col-span-12 lg:col-span-7">
            <Eyebrow>{locale === 'fr' ? 'Tableau de bord interne' : 'Operator dashboard'}</Eyebrow>
            <h1 className="mt-8 font-display text-display-xl font-medium tracking-tight text-balance text-ink">
              {locale === 'fr' ? 'Les chiffres réels.' : 'The real numbers.'}
            </h1>
            <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.22em] text-muted">{email}</p>
          </div>
          <p className="col-span-12 max-w-xl text-pretty text-[16px] leading-relaxed text-muted lg:col-span-5 lg:col-start-8 lg:mt-32">
            {locale === 'fr'
              ? 'Lecture seule. Pas de PII. Mis à jour à chaque visite.'
              : 'Read-only snapshot. No PII. Refreshed on every visit.'}
          </p>
        </Container>
      </section>

      <section className="border-b border-line bg-elevated">
        <Container as="div" className="py-16 md:py-20">
          <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-sm border border-line bg-line sm:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="flex flex-col bg-surface p-6">
                <dt className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
                  {s.label}
                </dt>
                <dd className="mt-4 font-display text-3xl font-medium tracking-tight text-ink md:text-4xl">
                  {s.value}
                </dd>
              </div>
            ))}
          </dl>
        </Container>
      </section>
    </AppShell>
  );
}
