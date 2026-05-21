import { notFound } from 'next/navigation';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import { isLocale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { AppShell } from '@/components/app/AppShell';
import { Container } from '@/components/ui/Container';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { confirmPasswordReset } from '../actions';

export const dynamic = 'force-static';

type Props = { params: { locale: string }; searchParams: { error?: string } };

export default async function ResetConfirmPage({ params, searchParams }: Props) {
  if (!isLocale(params.locale)) notFound();
  const dict = await getDictionary(params.locale);
  const t = dict.reset.confirm;

  return (
    <AppShell dict={dict} locale={params.locale}>
      <section className="border-b border-line">
        <Container as="div" className="grid grid-cols-12 gap-x-6 py-20 md:py-28">
          <div className="col-span-12 lg:col-span-5">
            <Eyebrow>{t.eyebrow}</Eyebrow>
            <h1 className="mt-6 font-display text-display-lg font-medium tracking-tight text-balance text-ink">
              {t.title}
            </h1>
            <p className="mt-6 max-w-md text-pretty text-[16px] leading-relaxed text-muted">{t.body}</p>
          </div>

          <form
            action={confirmPasswordReset}
            className="col-span-12 mt-16 space-y-5 rounded-sm border border-line bg-surface p-6 md:col-span-6 md:col-start-7 md:mt-0 md:p-10"
          >
            <input type="hidden" name="locale" value={params.locale} />

            {searchParams.error ? (
              <div role="alert" className="flex items-start gap-3 rounded-sm border border-down bg-down/10 p-4 text-[13.5px] text-ink">
                <AlertTriangle aria-hidden className="mt-0.5 h-4 w-4 flex-shrink-0 text-down" strokeWidth={1.75} />
                <span>{decodeURIComponent(searchParams.error)}</span>
              </div>
            ) : null}

            <div>
              <label htmlFor="password" className="mb-2 block font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
                {t.passwordLabel}
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                className="h-12 w-full rounded-sm border border-line bg-canvas px-4 text-[15px] text-ink placeholder:text-subtle focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/15"
              />
            </div>

            <button
              type="submit"
              className="mt-2 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-ink text-[15px] font-medium tracking-tight text-canvas hover:bg-ink/90"
            >
              {t.cta}
              <ArrowRight aria-hidden className="h-4 w-4" strokeWidth={1.75} />
            </button>
          </form>
        </Container>
      </section>
    </AppShell>
  );
}
