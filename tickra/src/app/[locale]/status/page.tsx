import { notFound } from 'next/navigation';
import { Check, Minus } from 'lucide-react';
import { isLocale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { AppShell } from '@/components/app/AppShell';
import { Container } from '@/components/ui/Container';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { hasSupabaseEnv } from '@/lib/supabase/server';
import { hasEmailEnv } from '@/lib/email/client';
import { turnstileEnabled } from '@/lib/turnstile';

export const dynamic = 'force-dynamic';
export const revalidate = 30;

export default async function StatusPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const dict = await getDictionary(params.locale);
  const t = dict.status;

  const checks: { id: keyof typeof t.components; up: boolean }[] = [
    { id: 'web', up: true },
    { id: 'supabase', up: hasSupabaseEnv() },
    { id: 'email', up: hasEmailEnv() },
    { id: 'stripe', up: Boolean(process.env.STRIPE_SECRET_KEY) },
    { id: 'turnstile', up: turnstileEnabled() },
    { id: 'sentry', up: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN) },
  ];

  const build = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? 'dev';
  const region = process.env.VERCEL_REGION ?? 'local';
  const updated = new Date().toLocaleString(params.locale === 'fr' ? 'fr-FR' : 'en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

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
        <Container as="div" className="py-20 md:py-24">
          <ul className="divide-y divide-line border-y border-line">
            {checks.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-4 py-6">
                <div className="flex items-center gap-4">
                  <span
                    aria-hidden
                    className={`inline-flex h-9 w-9 items-center justify-center rounded-full ${
                      c.up ? 'bg-up/15 text-up' : 'border border-line text-subtle'
                    }`}
                  >
                    {c.up ? (
                      <Check className="h-4 w-4" strokeWidth={2.25} />
                    ) : (
                      <Minus className="h-4 w-4" strokeWidth={2.25} />
                    )}
                  </span>
                  <span className="font-display text-lg font-medium tracking-tight text-ink md:text-xl">
                    {t.components[c.id]}
                  </span>
                </div>
                <span
                  className={`font-mono text-[11px] uppercase tracking-[0.22em] ${
                    c.up ? 'text-ink' : 'text-subtle'
                  }`}
                >
                  {c.up ? t.operational : t.notConfigured}
                </span>
              </li>
            ))}
          </ul>

          <dl className="mt-12 grid grid-cols-1 gap-x-8 gap-y-3 font-mono text-[11px] uppercase tracking-[0.22em] text-muted sm:grid-cols-3">
            <div>
              <dt className="text-subtle">{t.buildLabel}</dt>
              <dd className="mt-1 text-ink">{build}</dd>
            </div>
            <div>
              <dt className="text-subtle">{t.regionLabel}</dt>
              <dd className="mt-1 text-ink">{region}</dd>
            </div>
            <div>
              <dt className="text-subtle">{t.updated}</dt>
              <dd className="mt-1 text-ink">{updated}</dd>
            </div>
          </dl>
        </Container>
      </section>
    </AppShell>
  );
}
