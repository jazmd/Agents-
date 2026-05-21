import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AlertTriangle, ArrowLeft, ArrowRight, MailCheck } from 'lucide-react';
import { isLocale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { AppShell } from '@/components/app/AppShell';
import { Container } from '@/components/ui/Container';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { Turnstile } from '@/components/auth/Turnstile';
import { requestPasswordReset } from './actions';

export const dynamic = 'force-static';

type Props = { params: { locale: string }; searchParams: { sent?: string; error?: string } };

export default async function ResetRequestPage({ params, searchParams }: Props) {
  if (!isLocale(params.locale)) notFound();
  const dict = await getDictionary(params.locale);
  const t = dict.reset.request;
  const sent = searchParams.sent === '1';
  const error = searchParams.error;

  return (
    <AppShell dict={dict} locale={params.locale}>
      <section className="border-b border-line">
        <Container as="div" className="grid grid-cols-12 gap-x-6 py-20 md:py-28">
          <div className="col-span-12 lg:col-span-5">
            <Eyebrow>{t.eyebrow}</Eyebrow>
            <h1 className="mt-6 font-display text-display-lg font-medium tracking-tight text-balance text-ink">
              {sent ? t.sent.title : t.title}
            </h1>
            <p className="mt-6 max-w-md text-pretty text-[16px] leading-relaxed text-muted">
              {sent ? t.sent.body : t.body}
            </p>
            <Link
              href={`/${params.locale}/signin`}
              className="mt-10 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-muted hover:text-ink"
            >
              <ArrowLeft aria-hidden className="h-3.5 w-3.5" strokeWidth={1.75} />
              {t.back}
            </Link>
          </div>

          <div className="col-span-12 mt-16 lg:col-span-6 lg:col-start-7 lg:mt-0">
            {sent ? (
              <div className="rounded-sm border border-line bg-surface p-8 md:p-10">
                <MailCheck aria-hidden className="h-6 w-6 text-ink" strokeWidth={1.5} />
                <h2 className="mt-6 font-display text-2xl font-medium tracking-tight text-ink">
                  {t.sent.title}
                </h2>
                <p className="mt-4 max-w-md text-[15px] leading-relaxed text-muted">{t.sent.body}</p>
              </div>
            ) : (
              <form action={requestPasswordReset} className="space-y-5 rounded-sm border border-line bg-surface p-6 md:p-10">
                <input type="hidden" name="locale" value={params.locale} />

                {error ? (
                  <div role="alert" className="flex items-start gap-3 rounded-sm border border-down bg-down/10 p-4 text-[13.5px] text-ink">
                    <AlertTriangle aria-hidden className="mt-0.5 h-4 w-4 flex-shrink-0 text-down" strokeWidth={1.75} />
                    <span>{error === 'rate_limit' ? 'Too many requests. Wait a few minutes.' : decodeURIComponent(error)}</span>
                  </div>
                ) : null}

                <div>
                  <label htmlFor="email" className="mb-2 block font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
                    {t.emailLabel}
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder={t.emailPlaceholder}
                    autoComplete="email"
                    required
                    className="h-12 w-full rounded-sm border border-line bg-canvas px-4 text-[15px] text-ink placeholder:text-subtle focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/15"
                  />
                </div>

                <Turnstile action="reset" />

                <button
                  type="submit"
                  className="mt-2 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-ink text-[15px] font-medium tracking-tight text-canvas hover:bg-ink/90"
                >
                  {t.cta}
                  <ArrowRight aria-hidden className="h-4 w-4" strokeWidth={1.75} />
                </button>
              </form>
            )}
          </div>
        </Container>
      </section>
    </AppShell>
  );
}
