import { notFound, redirect } from 'next/navigation';
import { isLocale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { AppShell } from '@/components/app/AppShell';
import { Container } from '@/components/ui/Container';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { createSupabaseServerClient, hasSupabaseEnv } from '@/lib/supabase/server';
import { JournalForm } from '@/components/journal/JournalForm';
import { JournalEntryCard } from '@/components/journal/JournalEntryCard';

export const dynamic = 'force-dynamic';

type Entry = {
  id: string;
  symbol: string | null;
  setup: string | null;
  thesis: string;
  invalidation: string | null;
  target: string | null;
  emotion: string | null;
  outcome: 'open' | 'win' | 'loss' | 'breakeven' | null;
  created_at: string;
  closed_at: string | null;
};

export default async function JournalPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const dict = await getDictionary(params.locale);
  const t = dict.journal;
  const locale = params.locale;

  if (!hasSupabaseEnv()) {
    redirect(`/${locale}/signin?next=${encodeURIComponent(`/${locale}/journal`)}`);
  }

  const supabase = createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) {
    redirect(`/${locale}/signin?next=${encodeURIComponent(`/${locale}/journal`)}`);
  }

  const { data: rows } = await supabase
    .from('journal_entries')
    .select('id, symbol, setup, thesis, invalidation, target, emotion, outcome, created_at, closed_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  const entries = (rows ?? []) as Entry[];

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
        <Container as="div" className="py-16 md:py-20">
          <JournalForm locale={locale} labels={t} />
        </Container>
      </section>

      <section className="border-b border-line">
        <Container as="div" className="py-16 md:py-20">
          {entries.length === 0 ? (
            <p className="text-pretty text-[16px] text-muted">{t.empty}</p>
          ) : (
            <ul className="space-y-4">
              {entries.map((e) => (
                <li key={e.id}>
                  <JournalEntryCard entry={e} locale={locale} labels={t} />
                </li>
              ))}
            </ul>
          )}
        </Container>
      </section>
    </AppShell>
  );
}
