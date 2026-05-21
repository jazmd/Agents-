import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { isLocale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { AppShell } from '@/components/app/AppShell';
import { Container } from '@/components/ui/Container';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { createSupabaseServerClient, hasSupabaseEnv } from '@/lib/supabase/server';
import { BillingPortalButton } from '@/components/billing/BillingPortalButton';
import { DeleteAccount } from '@/components/settings/DeleteAccount';
import { updateProfile } from './actions';
import type { Profile, Subscription } from '@/lib/supabase/types';

export const dynamic = 'force-dynamic';

const PLAN_COPY = {
  free: { en: 'Free', fr: 'Gratuit' },
  pro: { en: 'Pro', fr: 'Pro' },
  lifetime: { en: 'Lifetime', fr: 'À vie' },
} as const;

type Props = { params: { locale: string }; searchParams: { saved?: string } };

export default async function SettingsPage({ params, searchParams }: Props) {
  if (!isLocale(params.locale)) notFound();
  const dict = await getDictionary(params.locale);
  const t = dict.settings;

  if (!hasSupabaseEnv()) {
    redirect(`/${params.locale}/signin?next=${encodeURIComponent(`/${params.locale}/settings`)}`);
  }

  const supabase = createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) {
    redirect(`/${params.locale}/signin?next=${encodeURIComponent(`/${params.locale}/settings`)}`);
  }

  const [{ data: profileRow }, { data: subRow }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('subscriptions').select('*').eq('user_id', user.id).single(),
  ]);
  const profile = profileRow as Profile | null;
  const subscription = subRow as Subscription | null;

  const plan = (subscription?.plan ?? 'free') as keyof typeof PLAN_COPY;
  const planLabel = PLAN_COPY[plan][params.locale === 'fr' ? 'fr' : 'en'];

  const renewal =
    subscription?.current_period_end
      ? new Date(subscription.current_period_end).toLocaleDateString(
          params.locale === 'fr' ? 'fr-FR' : 'en-GB',
          { day: '2-digit', month: 'long', year: 'numeric' },
        )
      : null;

  return (
    <AppShell dict={dict} locale={params.locale}>
      <section className="border-b border-line">
        <Container as="div" className="py-20 md:py-24">
          <Eyebrow>{t.eyebrow}</Eyebrow>
          <h1 className="mt-6 font-display text-display-lg font-medium tracking-tight text-balance text-ink">
            {t.title}
          </h1>

          <div className="mt-16 grid grid-cols-12 gap-x-6 gap-y-12">
            {/* Profile */}
            <section className="col-span-12 lg:col-span-4">
              <h2 className="font-display text-2xl font-medium tracking-tight text-ink">
                {t.sections.profile.title}
              </h2>
              <p className="mt-3 max-w-sm text-[14.5px] leading-relaxed text-muted">
                {t.sections.profile.body}
              </p>
            </section>

            <form
              action={updateProfile}
              className="col-span-12 space-y-5 rounded-sm border border-line bg-surface p-6 md:p-10 lg:col-span-7 lg:col-start-6"
              aria-label={t.sections.profile.title}
            >
              <input type="hidden" name="current_locale" value={params.locale} />

              {searchParams.saved === '1' ? (
                <div className="flex items-center gap-2 rounded-sm border border-up bg-up/10 p-3 text-[13.5px] text-ink">
                  <Check aria-hidden className="h-4 w-4 text-up" strokeWidth={2} />
                  {t.sections.profile.saved}
                </div>
              ) : null}

              <Field
                label={t.sections.profile.fullName}
                id="full_name"
                name="full_name"
                defaultValue={profile?.full_name ?? ''}
                autoComplete="name"
              />
              <Field
                label={t.sections.profile.email}
                id="email"
                name="email"
                defaultValue={user.email ?? ''}
                disabled
              />

              <div>
                <label
                  htmlFor="locale"
                  className="mb-2 block font-mono text-[11px] uppercase tracking-[0.22em] text-muted"
                >
                  {t.sections.profile.locale}
                </label>
                <select
                  id="locale"
                  name="locale"
                  defaultValue={profile?.locale ?? params.locale}
                  className="h-12 w-full rounded-sm border border-line bg-canvas px-4 text-[15px] text-ink focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/15"
                >
                  <option value="en">English</option>
                  <option value="fr">Français</option>
                </select>
              </div>

              <button
                type="submit"
                className="mt-2 inline-flex h-12 items-center justify-center rounded-full bg-ink px-6 text-[15px] font-medium tracking-tight text-canvas hover:bg-ink/90"
              >
                {t.sections.profile.save}
              </button>
            </form>

            {/* Subscription */}
            <section className="col-span-12 mt-10 lg:col-span-4 lg:mt-0">
              <h2 className="font-display text-2xl font-medium tracking-tight text-ink">
                {t.sections.subscription.title}
              </h2>
              <p className="mt-3 max-w-sm text-[14.5px] leading-relaxed text-muted">
                {t.sections.subscription.body}
              </p>
            </section>

            <div className="col-span-12 lg:col-span-7 lg:col-start-6">
              <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-sm border border-line bg-line">
                <div className="bg-surface p-6">
                  <dt className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
                    {t.sections.subscription.plan}
                  </dt>
                  <dd className="mt-3 font-display text-2xl font-medium tracking-tight text-ink">
                    {planLabel}
                  </dd>
                </div>
                <div className="bg-surface p-6">
                  <dt className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
                    {subscription?.cancel_at_period_end
                      ? t.sections.subscription.cancelled
                      : t.sections.subscription.renewal}
                  </dt>
                  <dd className="mt-3 text-[15px] text-ink">{renewal ?? '—'}</dd>
                </div>
              </dl>

              {subscription?.cancel_at_period_end ? (
                <p className="mt-4 text-[13.5px] text-muted">{t.sections.subscription.cancelNote}</p>
              ) : null}

              <div className="mt-6 flex flex-wrap gap-3">
                {subscription?.stripe_customer_id ? (
                  <BillingPortalButton locale={params.locale} label={t.sections.subscription.manage} />
                ) : (
                  <Link
                    href={`/${params.locale}/pricing`}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-ink px-5 text-[14px] font-medium tracking-tight text-canvas hover:bg-ink/90"
                  >
                    {t.sections.subscription.upgrade}
                  </Link>
                )}
              </div>
            </div>

            {/* Danger / sign-out */}
            <section className="col-span-12 mt-10 lg:col-span-4 lg:mt-0">
              <h2 className="font-display text-2xl font-medium tracking-tight text-ink">
                {t.sections.danger.title}
              </h2>
              <p className="mt-3 max-w-sm text-[14.5px] leading-relaxed text-muted">
                {t.sections.danger.body}
              </p>
            </section>

            <div className="col-span-12 space-y-6 lg:col-span-7 lg:col-start-6">
              <form action={`/api/signout?locale=${params.locale}`} method="post">
                <button
                  type="submit"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-line px-5 text-[14px] font-medium tracking-tight text-ink hover:border-ink hover:bg-ink hover:text-canvas"
                >
                  {t.sections.danger.signOut}
                </button>
              </form>

              <div className="border-t border-line pt-6">
                <DeleteAccount
                  email={user.email ?? ''}
                  locale={params.locale}
                  title={dict.deleteAccount.title}
                  body={dict.deleteAccount.body}
                  confirmLabel={dict.deleteAccount.confirm}
                  cta={dict.deleteAccount.cta}
                  cancel={dict.deleteAccount.cancel}
                  doneMessage={dict.deleteAccount.done}
                  failMessage={dict.deleteAccount.fail}
                />
              </div>
            </div>
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
  defaultValue?: string;
  autoComplete?: string;
  disabled?: boolean;
};

function Field({ label, id, name, defaultValue, autoComplete, disabled }: FieldProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
        {label}
      </label>
      <input
        id={id}
        name={name}
        defaultValue={defaultValue}
        autoComplete={autoComplete}
        disabled={disabled}
        className="h-12 w-full rounded-sm border border-line bg-canvas px-4 text-[15px] text-ink placeholder:text-subtle focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/15 disabled:cursor-not-allowed disabled:opacity-70"
      />
    </div>
  );
}
