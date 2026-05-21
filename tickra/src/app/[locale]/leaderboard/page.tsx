import { notFound } from 'next/navigation';
import { Trophy } from 'lucide-react';
import { isLocale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { AppShell } from '@/components/app/AppShell';
import { Container } from '@/components/ui/Container';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { createSupabaseServerClient, hasSupabaseEnv } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

type Row = {
  user_id: string;
  display_name: string;
  xp: number;
  level_index: number;
  streak_current: number;
  streak_best: number;
};

export default async function LeaderboardPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const dict = await getDictionary(params.locale);
  const t = dict.leaderboard;
  const locale = params.locale;

  let rows: Row[] = [];
  if (hasSupabaseEnv()) {
    try {
      const supabase = createSupabaseServerClient();
      const { data } = await supabase.from('leaderboard').select('*').limit(100);
      rows = (data ?? []) as Row[];
    } catch {
      rows = [];
    }
  }

  return (
    <AppShell dict={dict} locale={locale}>
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
        <Container as="div" className="py-12 md:py-16">
          {rows.length === 0 ? (
            <p className="text-pretty text-[16px] text-muted">{t.empty}</p>
          ) : (
            <div className="overflow-x-auto rounded-sm border border-line bg-surface">
              <table className="w-full text-left text-[14.5px]">
                <thead className="border-b border-line">
                  <tr className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
                    <th scope="col" className="px-4 py-3 w-16">{t.rank}</th>
                    <th scope="col" className="px-4 py-3">{t.name}</th>
                    <th scope="col" className="px-4 py-3 text-right">{t.level}</th>
                    <th scope="col" className="px-4 py-3 text-right">{t.xp}</th>
                    <th scope="col" className="px-4 py-3 text-right">{t.streakBest}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {rows.map((r, i) => (
                    <tr key={r.user_id} className="text-ink">
                      <td className="px-4 py-3 font-mono text-[12.5px] text-muted">
                        <span className="inline-flex items-center gap-2">
                          {i < 3 ? (
                            <Trophy className="h-3.5 w-3.5 text-ink" strokeWidth={1.6} aria-hidden />
                          ) : null}
                          {String(i + 1).padStart(3, '0')}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-display text-[15.5px] tracking-tight">
                        {r.display_name}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-[12.5px]">{r.level_index}</td>
                      <td className="px-4 py-3 text-right">{r.xp.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right font-mono text-[12.5px]">{r.streak_best}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Container>
      </section>
    </AppShell>
  );
}
