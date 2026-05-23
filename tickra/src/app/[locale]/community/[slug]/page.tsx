import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight, Lock, MessageSquare, Pin } from 'lucide-react';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { AppShell } from '@/components/app/AppShell';
import { Container } from '@/components/ui/Container';
import { createSupabaseServerClient, hasSupabaseEnv } from '@/lib/supabase/server';
import { getIdentity } from '@/lib/demo/identity';
import { DEMO_THREADS, demoRepliesFor } from '@/lib/forum/demo';
import { ReplyForm } from '@/components/community/ReplyForm';
import type { Thread, Reply } from '@/lib/forum/types';

export const dynamic = 'force-dynamic';

type Props = { params: { locale: string; slug: string } };

export default async function ThreadPage({ params }: Props) {
  if (!isLocale(params.locale)) notFound();
  const dict = await getDictionary(params.locale);
  const t = dict.community;
  const locale = params.locale as Locale;

  let thread: Thread | null = null;
  let replies: Reply[] = [];
  let demoMode = false;

  if (hasSupabaseEnv()) {
    try {
      const supabase = createSupabaseServerClient();
      const { data: threadRow } = await supabase
        .from('forum_threads')
        .select('*, profiles ( full_name )')
        .eq('slug', params.slug)
        .maybeSingle();
      if (threadRow) {
        thread = {
          ...(threadRow as Thread & { profiles?: { full_name?: string } }),
          display_name: (threadRow as { profiles?: { full_name?: string } }).profiles?.full_name ?? 'Member',
        };
        const { data: replyRows } = await supabase
          .from('forum_replies')
          .select('*, profiles ( full_name )')
          .eq('thread_id', thread.id)
          .order('created_at', { ascending: true })
          .limit(200);
        replies = ((replyRows ?? []) as Array<Reply & { profiles?: { full_name?: string } }>).map((r) => ({
          ...r,
          display_name: r.profiles?.full_name ?? 'Member',
        }));
      }
    } catch {
      thread = null;
    }
  }

  if (!thread) {
    thread = DEMO_THREADS.find((th) => th.slug === params.slug) ?? null;
    if (thread) {
      replies = demoRepliesFor(thread.id);
      demoMode = true;
    }
  }

  if (!thread) notFound();

  const identity = await getIdentity();
  const date = new Date(thread.created_at).toLocaleString(locale === 'fr' ? 'fr-FR' : 'en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <AppShell dict={dict} locale={locale}>
      <article>
        <header className="border-b border-line">
          <Container as="div" className="py-16 md:py-20">
            <nav aria-label="Breadcrumb">
              <ol className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
                <li>
                  <Link href={`/${locale}/community`} className="hover:text-ink">
                    {t.eyebrow}
                  </Link>
                </li>
                <li aria-hidden>
                  <ChevronRight className="h-3 w-3" strokeWidth={1.5} />
                </li>
                <li>
                  <Link
                    href={`/${locale}/community?category=${thread.category}`}
                    className="hover:text-ink"
                  >
                    {t.categories[thread.category]}
                  </Link>
                </li>
              </ol>

              <div className="mt-8 flex flex-wrap items-center gap-2">
                {thread.pinned ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-line px-2 py-0.5 text-[11px] text-muted">
                    <Pin aria-hidden className="h-3 w-3" strokeWidth={1.6} /> {t.pinned}
                  </span>
                ) : null}
                {thread.locked ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-line px-2 py-0.5 text-[11px] text-muted">
                    <Lock aria-hidden className="h-3 w-3" strokeWidth={1.6} /> {t.locked}
                  </span>
                ) : null}
              </div>
              <h1 className="mt-4 font-display text-display-lg font-medium tracking-tight text-balance text-ink">
                {thread.title}
              </h1>
              <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.22em] text-subtle">
                {t.by} {thread.display_name} · {date}
              </p>
            </nav>
          </Container>
        </header>

        <section className="border-b border-line">
          <Container as="div" className="py-12 md:py-16">
            <div className="max-w-3xl whitespace-pre-wrap text-[16.5px] leading-relaxed text-ink">
              {thread.body}
            </div>
          </Container>
        </section>

        <section className="border-b border-line bg-elevated">
          <Container as="div" className="py-12 md:py-16">
            <h2 className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
              <MessageSquare aria-hidden className="h-3.5 w-3.5" strokeWidth={1.6} />
              {replies.length} {t.repliesLabel}
            </h2>

            {replies.length === 0 ? (
              <p className="mt-6 text-[15px] text-muted">{t.reply.empty}</p>
            ) : (
              <ul className="mt-6 space-y-4">
                {replies.map((r, i) => {
                  const rdate = new Date(r.created_at).toLocaleString(
                    locale === 'fr' ? 'fr-FR' : 'en-GB',
                    { dateStyle: 'medium', timeStyle: 'short' },
                  );
                  return (
                    <li
                      key={r.id}
                      id={i === replies.length - 1 ? 'latest' : undefined}
                      className="rounded-sm border border-line bg-surface p-5 md:p-6"
                    >
                      <header className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line pb-3">
                        <p className="font-display text-[15px] tracking-tight text-ink">
                          {r.display_name}
                        </p>
                        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-subtle">
                          {rdate}
                        </p>
                      </header>
                      <p className="mt-3 whitespace-pre-wrap text-[15px] leading-relaxed text-ink">
                        {r.body}
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}
          </Container>
        </section>

        <section className="border-b border-line">
          <Container as="div" className="py-12 md:py-16">
            {thread.locked ? (
              <p className="text-[15px] text-muted">{t.locked}.</p>
            ) : identity && !demoMode ? (
              <ReplyForm
                locale={locale}
                threadId={thread.id}
                slug={thread.slug}
                labels={t.reply}
              />
            ) : (
              <Link
                href={`/${locale}/signin?next=${encodeURIComponent(`/${locale}/community/${thread.slug}`)}`}
                className="inline-flex h-11 items-center gap-2 rounded-full border border-line px-5 text-[14px] font-medium tracking-tight text-ink hover:border-ink hover:bg-ink hover:text-canvas"
              >
                {t.signinToPost}
              </Link>
            )}
          </Container>
        </section>
      </article>
    </AppShell>
  );
}
