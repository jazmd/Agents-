import { notFound, redirect } from 'next/navigation';
import { isLocale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { AppShell } from '@/components/app/AppShell';
import { Container } from '@/components/ui/Container';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { StreakRing } from '@/components/dashboard/StreakRing';
import { XpBar } from '@/components/dashboard/XpBar';
import { LivesIndicator } from '@/components/dashboard/LivesIndicator';
import { LessonCard } from '@/components/dashboard/LessonCard';
import { LevelMap } from '@/components/dashboard/LevelMap';
import { ActivityChart } from '@/components/dashboard/ActivityChart';
import { VerifyBanner } from '@/components/dashboard/VerifyBanner';
import { getDashboardData, getAuthedUser } from '@/lib/supabase/queries';

export const dynamic = 'force-dynamic';

const ACTIVITY_LABELS_EN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const ACTIVITY_LABELS_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

const DEMO_ACTIVITY = [8, 12, 0, 14, 10, 6, 11];
const DEMO_MAP_EN = [
  { id: 1, title: 'What a candle says', status: 'done' as const },
  { id: 2, title: 'Bullish & bearish bodies', status: 'done' as const },
  { id: 3, title: 'Wicks, the rejected extremes', status: 'done' as const },
  { id: 4, title: 'Reading a Japanese candle', status: 'current' as const },
  { id: 5, title: 'From candle to session', status: 'locked' as const },
  { id: 6, title: 'Pin bars and engulfings', status: 'locked' as const },
];
const DEMO_MAP_FR = [
  { id: 1, title: 'Ce qu’une bougie dit', status: 'done' as const },
  { id: 2, title: 'Corps haussiers et baissiers', status: 'done' as const },
  { id: 3, title: 'Mèches, les extrêmes rejetés', status: 'done' as const },
  { id: 4, title: 'Lire une bougie japonaise', status: 'current' as const },
  { id: 5, title: 'De la bougie à la séance', status: 'locked' as const },
  { id: 6, title: 'Pin bars et avalements', status: 'locked' as const },
];

function buildActivityForLocale(locale: 'en' | 'fr', minutes: number[]) {
  const labels = locale === 'fr' ? ACTIVITY_LABELS_FR : ACTIVITY_LABELS_EN;
  return labels.map((day, i) => ({ day, minutes: minutes[i] ?? 0 }));
}

export default async function DashboardPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const dict = await getDictionary(params.locale);
  const t = dict.dashboard;

  let user;
  let data;
  try {
    user = await getAuthedUser();
    if (!user) {
      redirect(`/${params.locale}/signin?next=${encodeURIComponent(`/${params.locale}/dashboard`)}`);
    }
    data = await getDashboardData();
  } catch {
    user = null;
    data = null;
  }

  // Derive view-model: use DB data when present, fall back to demo state when env is unset
  const state = data?.state ?? {
    user_id: 'demo',
    xp: 2340,
    level_index: 3,
    streak_current: 12,
    streak_best: 41,
    lives: 2,
    lives_refilled_at: null,
    freeze_tokens: 1,
    last_active_day: null,
    updated_at: '',
  };
  const fullName = data?.profile.full_name || (user?.email ?? '').split('@')[0];

  const today = new Date();
  const last7 = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    return d.toISOString().slice(0, 10);
  });
  const minutesByDay = new Map((data?.activity ?? []).map((a) => [a.day, a.minutes]));
  const minutes = data ? last7.map((d) => minutesByDay.get(d) ?? 0) : DEMO_ACTIVITY;
  const activity = buildActivityForLocale(params.locale === 'fr' ? 'fr' : 'en', minutes);

  const doneSlugs = new Set((data?.progress ?? []).filter((p) => p.status === 'done').map((p) => p.lesson_slug));
  const map = (params.locale === 'fr' ? DEMO_MAP_FR : DEMO_MAP_EN).map((node, i) => {
    if (!data) return node;
    const slug = node.title; // until lesson slugs are wired
    const done = doneSlugs.has(slug);
    const isCurrent = !done && i === doneSlugs.size;
    return {
      ...node,
      status: (done ? 'done' : isCurrent ? 'current' : 'locked') as 'done' | 'current' | 'locked',
    };
  });

  const xpThreshold = Math.max(state.xp + 1, (state.level_index + 1) * 1000);

  return (
    <AppShell dict={dict} locale={params.locale}>
      <section className="border-b border-line">
        <Container as="div" className="py-20 md:py-24">
          {user && !user.email_confirmed_at && user.email ? (
            <div className="mb-8">
              <VerifyBanner
                email={user.email}
                title={dict.verify.title}
                body={dict.verify.body}
                cta={dict.verify.cta}
                pendingLabel={dict.verify.pending}
                sentLabel={dict.verify.sent}
                failedLabel={dict.verify.failed}
              />
            </div>
          ) : null}
          <Eyebrow>{t.eyebrow}</Eyebrow>
          <h1 className="mt-6 font-display text-display-lg font-medium tracking-tight text-balance text-ink">
            {fullName ? `${t.greeting.replace(/\.$/, '')}, ${fullName}.` : t.greeting}
          </h1>
          <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-muted">{t.subtitle}</p>

          <div className="mt-16 grid grid-cols-12 gap-4">
            <div className="col-span-12 lg:col-span-5">
              <StreakRing
                current={state.streak_current}
                best={state.streak_best}
                label={t.streak.label}
                unit={t.streak.unit}
                bestLabel={t.streak.best}
              />
            </div>

            <div className="col-span-12 grid gap-4 lg:col-span-7">
              <XpBar
                xp={state.xp}
                level={state.level_index}
                nextThreshold={xpThreshold}
                label={t.xp.label}
                toNextTemplate={t.xp.toNext}
                levelTemplate={t.level}
              />
              <LivesIndicator
                current={state.lives}
                max={3}
                label={t.lives.label}
                emptyMessage={t.lives.empty}
              />
            </div>

            <div className="col-span-12 lg:col-span-7">
              <LessonCard
                label={t.next.label}
                title={dict.lesson.title}
                duration={t.next.duration}
                cta={t.next.cta}
                href={`/${params.locale}/lesson/japanese-candles`}
              />
            </div>

            <div className="col-span-12 lg:col-span-5">
              <ActivityChart title={t.activity.title} caption={t.activity.caption} data={activity} />
            </div>

            <div className="col-span-12">
              <LevelMap title={t.map.title} legend={t.map.legend} nodes={map} />
            </div>
          </div>
        </Container>
      </section>
    </AppShell>
  );
}
