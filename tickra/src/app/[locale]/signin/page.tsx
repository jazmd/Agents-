import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { isLocale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { AppShell } from '@/components/app/AppShell';
import { Container } from '@/components/ui/Container';
import { Eyebrow } from '@/components/ui/Eyebrow';

export const dynamic = 'force-static';

export default async function SignInPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const dict = await getDictionary(params.locale);
  const t = dict.signIn;

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

            <p className="mt-10 max-w-sm text-[13.5px] leading-relaxed text-subtle">{t.notice}</p>
          </div>

          <div className="col-span-12 mt-16 lg:col-span-6 lg:col-start-7 lg:mt-0">
            <form
              method="post"
              action="#"
              className="space-y-5 rounded-sm border border-line bg-surface p-6 md:p-10"
              aria-label={t.title}
            >
              <FormField label={t.emailLabel} id="email" type="email" placeholder={t.emailPlaceholder} autoComplete="email" required />
              <FormField
                label={t.passwordLabel}
                id="password"
                type="password"
                autoComplete="current-password"
                required
                trailing={
                  <Link
                    href={`/${params.locale}/signin/reset`}
                    className="text-[12.5px] text-muted hover:text-ink"
                  >
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
                <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
                  {t.or}
                </span>
                <span className="h-px flex-1 bg-line" aria-hidden />
              </div>

              <div className="grid gap-2.5 sm:grid-cols-2">
                <OAuthButton label={t.google} icon={<GoogleGlyph />} />
                <OAuthButton label={t.apple} icon={<AppleGlyph />} />
              </div>
            </form>

            <p className="mt-8 flex flex-wrap items-center justify-between gap-2 text-[14px] text-muted">
              <span>{t.newHere}</span>
              <Link
                href={`/${params.locale}/onboarding`}
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
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
  trailing?: React.ReactNode;
};

function FormField({ label, id, type = 'text', placeholder, autoComplete, required, trailing }: FieldProps) {
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
        name={id}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
        className="h-12 w-full rounded-sm border border-line bg-canvas px-4 text-[15px] text-ink placeholder:text-subtle focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/15"
      />
    </div>
  );
}

function OAuthButton({ label, icon }: { label: string; icon: React.ReactNode }) {
  return (
    <button
      type="button"
      className="inline-flex h-12 items-center justify-center gap-2.5 rounded-sm border border-line text-[14px] font-medium text-ink transition-colors hover:border-ink hover:bg-elevated"
    >
      {icon}
      {label}
    </button>
  );
}

function GoogleGlyph() {
  return (
    <svg aria-hidden viewBox="0 0 18 18" className="h-4 w-4">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.49h4.84a4.13 4.13 0 0 1-1.8 2.71v2.26h2.92c1.71-1.57 2.68-3.88 2.68-6.62z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.83.85-3.04.85a5.27 5.27 0 0 1-4.95-3.65H.96v2.34A9 9 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M4.05 10.76A5.41 5.41 0 0 1 3.77 9c0-.61.1-1.2.28-1.76V4.9H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.1l3.09-2.34z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.34l2.58-2.58A9 9 0 0 0 .96 4.9l3.09 2.34A5.27 5.27 0 0 1 9 3.58z" />
    </svg>
  );
}

function AppleGlyph() {
  return (
    <svg aria-hidden viewBox="0 0 18 18" className="h-4 w-4" fill="currentColor">
      <path d="M14.94 13.66c-.27.63-.4.91-.75 1.46-.49.77-1.18 1.74-2.04 1.75-.77 0-.97-.5-2.01-.5-1.05.01-1.27.51-2.04.5-.86-.01-1.51-.88-2-1.66-1.38-2.17-1.52-4.71-.67-6.07.6-.97 1.55-1.54 2.45-1.54.9 0 1.48.5 2.23.5.73 0 1.17-.5 2.22-.5.8 0 1.65.44 2.25 1.19-1.98 1.09-1.66 3.92.36 4.87zM11.4 4.66c.39-.5.69-1.21.58-1.93-.63.04-1.37.44-1.8.96-.39.47-.72 1.18-.6 1.88.69.02 1.4-.4 1.82-.91z" />
    </svg>
  );
}
