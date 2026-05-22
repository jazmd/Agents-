import { notFound, redirect } from 'next/navigation';
import { Award, Lock } from 'lucide-react';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { AppShell } from '@/components/app/AppShell';
import { Container } from '@/components/ui/Container';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { createSupabaseServerClient, hasSupabaseEnv } from '@/lib/supabase/server';
import { BADGES } from '@/lib/achievements';
import { cn } from '@/lib/cn';
import { getIdentity } from '@/lib/demo/identity';

export const dynamic = 'force-dynamic';

export default async function AchievementsPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const dict = await getDictionary(params.locale);
  const t = dict.achievements;
  const locale = params.locale as Locale;

  const identity = await getIdentity();
  if (!identity) {
    redirect(`/${locale}/signin?next=${encodeURIComponent(`/${locale}/achievements`)}`);
  }

  let rows: { badge_id: string; unlocked_at: string }[] = [];
  if (hasSupabaseEnv() && identity.source === 'supabase') {
    const supabase = createSupabaseServerClient();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (user) {
      const { data } = await supabase
        .from('achievements')
        .select('badge_id, unlocked_at')
        .eq('user_id', user.id);
      rows = (data ?? []) as { badge_id: string; unlocked_at: string }[];
    }
  } else if (identity.source === 'demo') {
    // Demo: unlock first-candle by default, plus thousand-xp / level-three for paid plans.
    const now = new Date().toISOString();
    rows.push({ badge_id: 'first-candle', unlocked_at: now });
    if (identity.plan === 'pro' || identity.plan === 'lifetime') {
      rows.push({ badge_id: 'thousand-xp', unlocked_at: now });
      rows.push({ badge_id: 'level-three', unlocked_at: now });
    }
  }

  const unlocked = new Map<string, string>(rows.map((r) => [r.badge_id, r.unlocked_at]));

  const unlockedCount = unlocked.size;
  const total = BADGES.length;

  return (
    <AppShell dict={dict} locale={locale}>
      <section className="border-b border-line">
        <Container as="div" className="grid grid-cols-12 gap-x-6 gap-y-10 py-20 md:py-28">
          <div className="col-span-12 lg:col-span-7">
            <Eyebrow>{t.eyebrow}</Eyebrow>
            <h1 className="mt-8 font-display text-display-xl font-medium tracking-tight text-balance text-ink">
              {t.title}
            </h1>
            <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
              {t.progress.replace('{n}', String(unlockedCount)).replace('{total}', String(total))}
            </p>
          </div>
          <p className="col-span-12 max-w-xl text-pretty text-[16.5px] leading-relaxed text-muted lg:col-span-5 lg:col-start-8 lg:mt-32">
            {t.body}
          </p>
        </Container>
      </section>

      <section className="border-b border-line bg-elevated">
        <Container as="div" className="py-16 md:py-20">
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {BADGES.map((badge) => {
              const date = unlocked.get(badge.id);
              const isUnlocked = Boolean(date);
              return (
                <li
                  key={badge.id}
                  className={cn(
                    'flex flex-col gap-3 rounded-sm border p-6',
                    isUnlocked ? 'border-ink bg-surface' : 'border-line bg-canvas',
                  )}
                >
                  <div className="flex items-center gap-3">
                    {isUnlocked ? (
                      <Award aria-hidden className="h-5 w-5 text-ink" strokeWidth={1.6} />
                    ) : (
                      <Lock aria-hidden className="h-5 w-5 text-subtle" strokeWidth={1.6} />
                    )}
                    <span
                      className={cn(
                        'font-mono text-[10px] uppercase tracking-[0.22em]',
                        isUnlocked ? 'text-ink' : 'text-subtle',
                      )}
                    >
                      {isUnlocked ? t.unlocked : t.locked}
                    </span>
                  </div>
                  <h3
                    className={cn(
                      'font-display text-xl font-medium tracking-tight',
                      isUnlocked ? 'text-ink' : 'text-muted',
                    )}
                  >
                    {badge.title[locale]}
                  </h3>
                  <p className={cn('text-[14px] leading-relaxed', isUnlocked ? 'text-muted' : 'text-subtle')}>
                    {badge.body[locale]}
                  </p>
                  {date ? (
                    <span className="mt-auto font-mono text-[10px] uppercase tracking-[0.2em] text-subtle">
                      {new Date(date).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-GB', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </span>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </Container>
      </section>
    </AppShell>
  );
}
