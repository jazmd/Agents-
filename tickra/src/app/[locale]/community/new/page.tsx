import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { AppShell } from '@/components/app/AppShell';
import { Container } from '@/components/ui/Container';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { FORUM_CATEGORIES } from '@/lib/forum/types';
import { getIdentity } from '@/lib/demo/identity';
import { hasSupabaseEnv } from '@/lib/supabase/server';
import { createThread } from '../actions';

export const dynamic = 'force-dynamic';

type Props = { params: { locale: string }; searchParams: { error?: string } };

export default async function NewThreadPage({ params, searchParams }: Props) {
  if (!isLocale(params.locale)) notFound();
  const dict = await getDictionary(params.locale);
  const t = dict.community;
  const locale = params.locale as Locale;

  const identity = await getIdentity();
  if (!identity || !hasSupabaseEnv()) {
    redirect(`/${locale}/signin?next=${encodeURIComponent(`/${locale}/community/new`)}`);
  }

  const errorKey = searchParams.error;
  const errorText =
    errorKey === 'rate_limit' ? t.new.rateLimit : errorKey === 'invalid' ? t.new.invalid : null;

  return (
    <AppShell dict={dict} locale={locale}>
      <section className="border-b border-line">
        <Container as="div" className="grid grid-cols-12 gap-x-6 py-20 md:py-28">
          <div className="col-span-12 lg:col-span-5">
            <Link
              href={`/${locale}/community`}
              className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-muted hover:text-ink"
            >
              <ArrowLeft aria-hidden className="h-3.5 w-3.5" strokeWidth={1.75} />
              {t.eyebrow}
            </Link>
            <Eyebrow>{t.eyebrow}</Eyebrow>
            <h1 className="mt-6 font-display text-display-lg font-medium tracking-tight text-balance text-ink">
              {t.new.title}
            </h1>
            <p className="mt-4 max-w-md text-pretty text-[15.5px] leading-relaxed text-muted">
              {t.new.body}
            </p>
          </div>

          <form
            action={createThread}
            className="col-span-12 mt-12 space-y-5 rounded-sm border border-line bg-surface p-6 md:col-span-6 md:col-start-7 md:mt-0 md:p-10"
          >
            <input type="hidden" name="locale" value={locale} />

            {errorText ? (
              <div role="alert" className="flex items-start gap-3 rounded-sm border border-down bg-down/10 p-4 text-[13.5px] text-ink">
                <AlertTriangle aria-hidden className="mt-0.5 h-4 w-4 flex-shrink-0 text-down" strokeWidth={1.75} />
                <span>{errorText}</span>
              </div>
            ) : null}

            <div>
              <label htmlFor="category" className="mb-2 block font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
                {t.new.category}
              </label>
              <select
                id="category"
                name="category"
                defaultValue="general"
                className="h-12 w-full rounded-sm border border-line bg-canvas px-4 text-[15px] text-ink focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/15"
              >
                {FORUM_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {t.categories[c]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="title" className="mb-2 block font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
                {t.new.threadTitle}
              </label>
              <input
                id="title"
                name="title"
                type="text"
                minLength={4}
                maxLength={140}
                required
                placeholder={t.new.placeholderTitle}
                className="h-12 w-full rounded-sm border border-line bg-canvas px-4 text-[15px] text-ink placeholder:text-subtle focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/15"
              />
            </div>

            <div>
              <label htmlFor="body" className="mb-2 block font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
                {t.new.threadBody}
              </label>
              <textarea
                id="body"
                name="body"
                rows={8}
                minLength={8}
                maxLength={4000}
                required
                placeholder={t.new.placeholderBody}
                className="block w-full resize-none rounded-sm border border-line bg-canvas px-4 py-3 text-[15px] text-ink placeholder:text-subtle focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/15"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                className="inline-flex h-12 items-center gap-2 rounded-full bg-ink px-6 text-[15px] font-medium tracking-tight text-canvas hover:bg-ink/90"
              >
                {t.new.submit}
              </button>
              <Link
                href={`/${locale}/community`}
                className="inline-flex h-12 items-center gap-2 rounded-full border border-line px-5 text-[14px] font-medium tracking-tight text-ink hover:border-ink"
              >
                {t.new.cancel}
              </Link>
            </div>
          </form>
        </Container>
      </section>
    </AppShell>
  );
}
