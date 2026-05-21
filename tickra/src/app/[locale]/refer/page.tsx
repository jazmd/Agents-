import { notFound, redirect } from 'next/navigation';
import { isLocale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { AppShell } from '@/components/app/AppShell';
import { Container } from '@/components/ui/Container';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { createSupabaseServerClient, hasSupabaseEnv } from '@/lib/supabase/server';
import { ensureReferralCode } from './actions';
import { ReferShare } from '@/components/refer/ReferShare';

export const dynamic = 'force-dynamic';

export default async function ReferPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const dict = await getDictionary(params.locale);
  const t = dict.refer;
  const locale = params.locale;

  if (!hasSupabaseEnv()) {
    redirect(`/${locale}/signin?next=${encodeURIComponent(`/${locale}/refer`)}`);
  }

  const supabase = createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    redirect(`/${locale}/signin?next=${encodeURIComponent(`/${locale}/refer`)}`);
  }

  const result = await ensureReferralCode(locale);
  const code = result.ok ? result.code : '—';
  const uses = result.ok ? result.uses : 0;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://tickra.com';
  const link = `${siteUrl}/${locale}/signup?ref=${code}`;

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
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <ReferShare label={t.yourCode} value={code} copyLabel={t.copy} copiedLabel={t.copied} />
            <ReferShare label={t.yourLink} value={link} copyLabel={t.copy} copiedLabel={t.copied} />
          </div>
          <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
            {uses} {t.uses}
          </p>
        </Container>
      </section>

      <section className="border-b border-line">
        <Container as="div" className="py-16 md:py-20">
          <h2 className="font-display text-2xl font-medium tracking-tight text-ink md:text-3xl">
            {t.howItWorks}
          </h2>
          <ol className="mt-8 max-w-2xl space-y-4">
            {t.steps.map((step, i) => (
              <li key={i} className="flex items-start gap-4">
                <span
                  aria-hidden
                  className="mt-0.5 inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-ink font-mono text-[11px] text-ink"
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="text-[15.5px] leading-relaxed text-muted">{step}</span>
              </li>
            ))}
          </ol>
        </Container>
      </section>
    </AppShell>
  );
}
