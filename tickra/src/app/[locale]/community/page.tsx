import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowUpRight, MessageSquare, Pin, Lock, Plus } from 'lucide-react';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { AppShell } from '@/components/app/AppShell';
import { Container } from '@/components/ui/Container';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { createSupabaseServerClient, hasSupabaseEnv } from '@/lib/supabase/server';
import { getIdentity } from '@/lib/demo/identity';
import { DEMO_THREADS } from '@/lib/forum/demo';
import { FORUM_CATEGORIES, type Thread, type ForumCategory } from '@/lib/forum/types';
import { cn } from '@/lib/cn';

export const dynamic = 'force-dynamic';

type Props = { params: { locale: string }; searchParams: { category?: string } };

export default async function CommunityPage({ params, searchParams }: Props) {
  if (!isLocale(params.locale)) notFound();
  const dict = await getDictionary(params.locale);
  const t = dict.community;
  const locale = params.locale as Locale;
  const activeCategory = (FORUM_CATEGORIES as string[]).includes(searchParams.category ?? '')
    ? (searchParams.category as ForumCategory)
    : null;

  const identity = await getIdentity();

  // Pull threads from Supabase if configured; otherwise serve seeded demo data.
  let threads: Thread[];
  let demoMode = false;
  if (hasSupabaseEnv()) {
    try {
      const supabase = createSupabaseServerClient();
      let query = supabase
        .from('forum_threads')
        .select('*, profiles ( full_name )')
        .order('pinned', { ascending: false })
        .order('updated_at', { ascending: false })
        .eq('locale', locale)
        .limit(50);
      if (activeCategory) query = query.eq('category', activeCategory);
      const { data } = await query;
      threads = ((data ?? []) as Array<Thread & { profiles?: { full_name?: string } }>).map((row) => ({
        ...row,
        display_name: row.profiles?.full_name ?? 'Member',
      }));
    } catch {
      threads = DEMO_THREADS;
      demoMode = true;
    }
  } else {
    threads = DEMO_THREADS;
    demoMode = true;
  }

  if (activeCategory && demoMode) {
    threads = threads.filter((th) => th.category === activeCategory);
  }
  // Demo mode also filters by locale for realism
  if (demoMode) {
    threads = threads.filter((th) => th.locale === locale);
    if (threads.length === 0) {
      threads = DEMO_THREADS.filter((th) => (activeCategory ? th.category === activeCategory : true));
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
          <div className="col-span-12 lg:col-span-5 lg:col-start-8 lg:mt-32">
            <p className="max-w-xl text-pretty text-[16.5px] leading-relaxed text-muted">{t.body}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              {identity ? (
                <Link
                  href={`/${locale}/community/new`}
                  className="inline-flex h-11 items-center gap-2 rounded-full bg-ink px-5 text-[14px] font-medium tracking-tight text-canvas hover:bg-ink/90"
                >
                  <Plus aria-hidden className="h-4 w-4" strokeWidth={1.75} />
                  {t.newThread}
                </Link>
              ) : (
                <Link
                  href={`/${locale}/signin?next=${encodeURIComponent(`/${locale}/community/new`)}`}
                  className="inline-flex h-11 items-center gap-2 rounded-full border border-line px-5 text-[14px] font-medium tracking-tight text-ink hover:border-ink hover:bg-ink hover:text-canvas"
                >
                  {t.signinToPost}
                </Link>
              )}
            </div>
            {demoMode ? (
              <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.22em] text-subtle">
                {t.demoNotice}
              </p>
            ) : null}
          </div>
        </Container>
      </section>

      <section className="border-b border-line bg-elevated">
        <Container as="div" className="py-10">
          <ul className="flex flex-wrap gap-2">
            <li>
              <Link
                href={`/${locale}/community`}
                className={cn(
                  'inline-flex h-9 items-center rounded-full border px-3 font-mono text-[11px] uppercase tracking-[0.18em] transition-colors',
                  !activeCategory
                    ? 'border-ink bg-ink text-canvas'
                    : 'border-line text-muted hover:border-ink hover:text-ink',
                )}
              >
                All
              </Link>
            </li>
            {FORUM_CATEGORIES.map((c) => {
              const active = activeCategory === c;
              return (
                <li key={c}>
                  <Link
                    href={`/${locale}/community?category=${c}`}
                    className={cn(
                      'inline-flex h-9 items-center rounded-full border px-3 font-mono text-[11px] uppercase tracking-[0.18em] transition-colors',
                      active
                        ? 'border-ink bg-ink text-canvas'
                        : 'border-line text-muted hover:border-ink hover:text-ink',
                    )}
                  >
                    {t.categories[c]}
                  </Link>
                </li>
              );
            })}
          </ul>
        </Container>
      </section>

      <section className="border-b border-line">
        <Container as="div" className="py-12 md:py-16">
          {threads.length === 0 ? (
            <p className="text-pretty text-[16px] text-muted">{t.emptyCategory}</p>
          ) : (
            <ul className="divide-y divide-line border-y border-line">
              {threads.map((th) => {
                const date = new Date(th.updated_at).toLocaleDateString(
                  locale === 'fr' ? 'fr-FR' : 'en-GB',
                  { day: '2-digit', month: 'short' },
                );
                return (
                  <li key={th.id}>
                    <Link
                      href={`/${locale}/community/${th.slug}`}
                      className="group grid grid-cols-12 items-baseline gap-x-4 gap-y-2 py-6"
                    >
                      <div className="col-span-12 md:col-span-9">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full border border-line px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
                            {t.categories[th.category]}
                          </span>
                          {th.pinned ? (
                            <span className="inline-flex items-center gap-1 text-[11px] text-muted">
                              <Pin aria-hidden className="h-3 w-3" strokeWidth={1.6} /> {t.pinned}
                            </span>
                          ) : null}
                          {th.locked ? (
                            <span className="inline-flex items-center gap-1 text-[11px] text-muted">
                              <Lock aria-hidden className="h-3 w-3" strokeWidth={1.6} /> {t.locked}
                            </span>
                          ) : null}
                        </div>
                        <h2 className="mt-2 font-display text-xl font-medium tracking-tight text-ink md:text-2xl">
                          {th.title}
                        </h2>
                        <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.18em] text-subtle">
                          {t.by} {th.display_name} · {date}
                        </p>
                      </div>
                      <div className="col-span-12 flex items-center justify-end gap-3 md:col-span-3">
                        <span className="inline-flex items-center gap-1.5 font-mono text-[12px] text-muted">
                          <MessageSquare aria-hidden className="h-3.5 w-3.5" strokeWidth={1.6} />
                          {th.reply_count} {t.repliesLabel}
                        </span>
                        <ArrowUpRight
                          aria-hidden
                          className="h-4 w-4 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-ink"
                          strokeWidth={1.5}
                        />
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Container>
      </section>
    </AppShell>
  );
}
