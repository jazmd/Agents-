import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, ArrowUpRight, AlertTriangle } from 'lucide-react';
import { isLocale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { AppShell } from '@/components/app/AppShell';
import { Container } from '@/components/ui/Container';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { OAuthButtons } from '@/components/auth/OAuthButtons';
import { signInWithPassword } from './actions';

type Props = { params: { locale: string }; searchParams: { error?: string; next?: string } };

export default async function SignInPage({ params, searchParams }: Props) {
  if (!isLocale(params.locale)) notFound();
  const dict = await getDictionary(params.locale);
  const t = dict.signIn;
  const error = searchParams.error;
  const next = searchParams.next;

  return (
    <AppShell dict={dict} locale={params.locale}>
      <section className="border-b border-line">
        <Container as="div" className="grid grid-cols-12 gap-x-6 py-20 md:py-28">
          <div className="col-span-12 lg:col-span-5">
            <Eyebrow>{t.eyebrow}</Eyebrow>
            <h1 className="mt-6 font-display text-display-lg font-medium tracking-tight text-balance text-ink">
              {t.title}
            </h1>
            <p className="mt-6 max-w-md text-pretty text-[16px] leading-relaxed text-muted">
              {t.subtitle}
            </p>
            <p className="mt-10 max-w-sm text-[13.5px] leading-relaxed text-muted">{t.notice}</p>
          </div>

          <div className="col-span-12 mt-16 lg:col-span-6 lg:col-start-7 lg:mt-0">
            <form
              action={signInWithPassword}
              className="space-y-5 rounded-sm border border-line bg-surface p-6 md:p-10"
              aria-label={t.title}
            >
              <input type="hidden" name="locale" value={params.locale} />
              {next ? <input type="hidden" name="next" value={next} /> : null}

              {error ? (
                <div
                  role="alert"
                  className="flex items-start gap-3 rounded-sm border border-down bg-down/10 p-4 text-[13.5px] text-ink"
                >
                  <AlertTriangle aria-hidden className="mt-0.5 h-4 w-4 flex-shrink-0 text-down" strokeWidth={1.75} />
                  <span>{decodeURIComponent(error)}</span>
                </div>
              ) : null}

              <Field label={t.emailLabel} id="email" name="email" type="email" placeholder={t.emailPlaceholder} autoComplete="email" required />
              <Field
                label={t.passwordLabel}
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                trailing={
                  <Link href={`/${params.locale}/signin/reset`} className="text-[12.5px] text-muted hover:text-ink">
                    {t.forgotten}
                  </Link>
                }
              />

              <button
                type="submit"
                className="mt-2 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-ink text-[15px] font-medium tracking-tight text-canvas transition-opacity hover:bg-ink/90"
              >
                {t.cta}
                <ArrowRight aria-hidden className="h-4 w-4" strokeWidth={1.75} />
              </button>

              <div className="flex items-center gap-4 py-2">
                <span className="h-px flex-1 bg-line" aria-hidden />
                <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">{t.or}</span>
                <span className="h-px flex-1 bg-line" aria-hidden />
              </div>

              <OAuthButtons
                locale={params.locale}
                next={next}
                googleLabel={t.google}
                appleLabel={t.apple}
              />
            </form>

            <p className="mt-8 flex flex-wrap items-center justify-between gap-2 text-[14px] text-muted">
              <span>{t.newHere}</span>
              <Link
                href={`/${params.locale}/signup`}
                className="inline-flex items-center gap-1.5 text-ink hover:text-muted"
              >
                {t.create}
                <ArrowUpRight aria-hidden className="h-4 w-4" strokeWidth={1.75} />
              </Link>
            </p>
          </div>
        </Container>
      </section>
    </AppShell>
  );
}

type FieldProps = {
  label: string;
  id: string;
  name: string;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
  trailing?: React.ReactNode;
};

function Field({ label, id, name, type = 'text', placeholder, autoComplete, required, trailing }: FieldProps) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <label htmlFor={id} className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
          {label}
        </label>
        {trailing}
      </div>
      <input
        id={id}
        name={name}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
        className="h-12 w-full rounded-sm border border-line bg-canvas px-4 text-[15px] text-ink placeholder:text-subtle focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/15"
      />
    </div>
  );
}
