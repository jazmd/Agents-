import { notFound } from 'next/navigation';
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

export const dynamic = 'force-static';

const STATE = {
  streakCurrent: 12,
  streakBest: 41,
  xp: 2340,
  level: 3,
  nextThreshold: 3000,
  lives: 2,
  maxLives: 3,
};

const ACTIVITY = [
  { day: 'Mon', minutes: 8 },
  { day: 'Tue', minutes: 12 },
  { day: 'Wed', minutes: 0 },
  { day: 'Thu', minutes: 14 },
  { day: 'Fri', minutes: 10 },
  { day: 'Sat', minutes: 6 },
  { day: 'Sun', minutes: 11 },
];

const ACTIVITY_FR = [
  { day: 'Lun', minutes: 8 },
  { day: 'Mar', minutes: 12 },
  { day: 'Mer', minutes: 0 },
  { day: 'Jeu', minutes: 14 },
  { day: 'Ven', minutes: 10 },
  { day: 'Sam', minutes: 6 },
  { day: 'Dim', minutes: 11 },
];

const MAP_EN = [
  { id: 1, title: 'What a candle says', status: 'done' as const },
  { id: 2, title: 'Bullish & bearish bodies', status: 'done' as const },
  { id: 3, title: 'Wicks, the rejected extremes', status: 'done' as const },
  { id: 4, title: 'Reading a Japanese candle', status: 'current' as const },
  { id: 5, title: 'From candle to session', status: 'locked' as const },
  { id: 6, title: 'Pin bars and engulfings', status: 'locked' as const },
];

const MAP_FR = [
  { id: 1, title: 'Ce qu’une bougie dit', status: 'done' as const },
  { id: 2, title: 'Corps haussiers et baissiers', status: 'done' as const },
  { id: 3, title: 'Mèches, les extrêmes rejetés', status: 'done' as const },
  { id: 4, title: 'Lire une bougie japonaise', status: 'current' as const },
  { id: 5, title: 'De la bougie à la séance', status: 'locked' as const },
  { id: 6, title: 'Pin bars et avalements', status: 'locked' as const },
];

export default async function DashboardPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const dict = await getDictionary(params.locale);
  const t = dict.dashboard;
  const activity = params.locale === 'fr' ? ACTIVITY_FR : ACTIVITY;
  const map = params.locale === 'fr' ? MAP_FR : MAP_EN;

  return (
    <AppShell dict={dict} locale={params.locale}>
      <section className="border-b border-line">
        <Container as="div" className="py-20 md:py-24">
          <Eyebrow>{t.eyebrow}</Eyebrow>
          <h1 className="mt-6 font-display text-display-lg font-medium tracking-tight text-balance text-ink">
            {t.greeting}
          </h1>
          <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-muted">{t.subtitle}</p>

          <div className="mt-16 grid grid-cols-12 gap-4">
            <div className="col-span-12 lg:col-span-5">
              <StreakRing
                current={STATE.streakCurrent}
                best={STATE.streakBest}
                label={t.streak.label}
                unit={t.streak.unit}
                bestLabel={t.streak.best}
              />
            </div>

            <div className="col-span-12 grid gap-4 lg:col-span-7">
              <XpBar
                xp={STATE.xp}
                level={STATE.level}
                nextThreshold={STATE.nextThreshold}
                label={t.xp.label}
                toNextTemplate={t.xp.toNext}
                levelTemplate={t.level}
              />
              <LivesIndicator
                current={STATE.lives}
                max={STATE.maxLives}
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
              <ActivityChart
                title={t.activity.title}
                caption={t.activity.caption}
                data={activity}
              />
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
