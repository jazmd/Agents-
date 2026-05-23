import { notFound, redirect } from 'next/navigation';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { AppShell } from '@/components/app/AppShell';
import { Container } from '@/components/ui/Container';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { createSupabaseServerClient, hasSupabaseEnv } from '@/lib/supabase/server';
import { getIdentity } from '@/lib/demo/identity';
import { demoAccountToView, readDemoPaper } from '@/lib/paper/demo';
import {
  INSTRUMENTS,
  computePnl,
  formatPrice,
  markPrice,
  type PaperAccount,
  type PaperPosition,
  type Symbol,
} from '@/lib/paper/types';
import { openPosition, closePosition } from './actions';
import { cn } from '@/lib/cn';

export const dynamic = 'force-dynamic';

export default async function PortfolioPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const dict = await getDictionary(params.locale);
  const t = dict.portfolio;
  const locale = params.locale as Locale;

  const identity = await getIdentity();
  if (!identity) {
    redirect(`/${locale}/signin?next=${encodeURIComponent(`/${locale}/portfolio`)}`);
  }

  let account: PaperAccount;
  let positions: PaperPosition[];
  const demoMode = identity.source === 'demo' || !hasSupabaseEnv();

  if (demoMode) {
    const state = readDemoPaper();
    account = demoAccountToView(state);
    positions = state.positions.map((p) => ({ ...p, user_id: 'demo' })) as PaperPosition[];
  } else {
    const supabase = createSupabaseServerClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      redirect(`/${locale}/signin`);
    }
    const userId = userData.user.id;
    const [{ data: accRow }, { data: posRows }] = await Promise.all([
      supabase.from('paper_accounts').select('*').eq('user_id', userId).maybeSingle(),
      supabase
        .from('paper_positions')
        .select('*')
        .eq('user_id', userId)
        .order('status', { ascending: true })
        .order('opened_at', { ascending: false })
        .limit(50),
    ]);
    account =
      (accRow as PaperAccount | null) ?? {
        user_id: userId,
        starting_balance: 10000,
        balance: 10000,
        realised_pnl: 0,
        updated_at: new Date().toISOString(),
      };
    positions = ((posRows ?? []) as PaperPosition[]).map((p) => ({
      ...p,
      entry_price: Number(p.entry_price),
      exit_price: p.exit_price === null ? null : Number(p.exit_price),
      pnl: Number(p.pnl ?? 0),
      qty: Number(p.qty),
    }));
  }

  const open = positions.filter((p) => p.status === 'open');
  const closed = positions.filter((p) => p.status === 'closed');

  function pnlFor(p: PaperPosition) {
    const mark = markPrice(p.symbol);
    return { mark, value: computePnl(p, mark) };
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
          {demoMode ? (
            <p className="col-span-12 font-mono text-[11px] uppercase tracking-[0.22em] text-subtle">
              {t.demoBanner}
            </p>
          ) : null}
        </Container>
      </section>

      <section className="border-b border-line bg-elevated">
        <Container as="div" className="py-12 md:py-16">
          <dl className="grid grid-cols-3 gap-px overflow-hidden rounded-sm border border-line bg-line">
            {[
              { label: t.starting, value: `€${account.starting_balance.toLocaleString()}` },
              { label: t.balance, value: `€${account.balance.toLocaleString()}` },
              { label: t.realised, value: `${account.realised_pnl >= 0 ? '+' : ''}€${account.realised_pnl.toLocaleString()}` },
            ].map((s) => (
              <div key={s.label} className="bg-surface p-6">
                <dt className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">{s.label}</dt>
                <dd className="mt-3 font-display text-3xl font-medium tracking-tight text-ink md:text-4xl">
                  {s.value}
                </dd>
              </div>
            ))}
          </dl>

          <form
            action={openPosition}
            className="mt-10 grid grid-cols-1 gap-4 rounded-sm border border-line bg-surface p-6 md:grid-cols-5 md:p-8"
          >
            <input type="hidden" name="locale" value={locale} />
            <div className="md:col-span-2">
              <label htmlFor="symbol" className="mb-2 block font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
                {t.instrument}
              </label>
              <select
                id="symbol"
                name="symbol"
                defaultValue="EUR/USD"
                className="h-12 w-full rounded-sm border border-line bg-canvas px-4 text-[15px] text-ink focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/15"
              >
                {INSTRUMENTS.map((i) => (
                  <option key={i.symbol} value={i.symbol}>
                    {i.name[locale]} — {formatPrice(i.symbol, markPrice(i.symbol))}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="side" className="mb-2 block font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
                {t.side}
              </label>
              <select
                id="side"
                name="side"
                defaultValue="long"
                className="h-12 w-full rounded-sm border border-line bg-canvas px-4 text-[15px] text-ink focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/15"
              >
                <option value="long">{t.long}</option>
                <option value="short">{t.short}</option>
              </select>
            </div>
            <div>
              <label htmlFor="qty" className="mb-2 block font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
                {t.qty}
              </label>
              <input
                id="qty"
                name="qty"
                type="number"
                step="0.01"
                min="0.01"
                defaultValue={1}
                required
                className="h-12 w-full rounded-sm border border-line bg-canvas px-4 text-[15px] text-ink focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/15"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-ink px-5 text-[14px] font-medium tracking-tight text-canvas hover:bg-ink/90"
              >
                {t.submit}
              </button>
            </div>
          </form>
        </Container>
      </section>

      <section className="border-b border-line">
        <Container as="div" className="py-12 md:py-16">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
            {t.openPositions} · {open.length}
          </h2>
          {open.length === 0 ? (
            <p className="mt-4 text-[15px] text-muted">{t.noOpen}</p>
          ) : (
            <div className="mt-4 overflow-x-auto rounded-sm border border-line bg-surface">
              <table className="w-full min-w-[760px] text-left text-[14px]">
                <thead className="border-b border-line bg-elevated font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
                  <tr>
                    <th className="px-4 py-3">{t.columns.symbol}</th>
                    <th className="px-4 py-3">{t.columns.side}</th>
                    <th className="px-4 py-3 text-right">{t.columns.qty}</th>
                    <th className="px-4 py-3 text-right">{t.columns.entry}</th>
                    <th className="px-4 py-3 text-right">{t.columns.mark}</th>
                    <th className="px-4 py-3 text-right">{t.columns.pnl}</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {open.map((p) => {
                    const { mark, value } = pnlFor(p);
                    const positive = value >= 0;
                    return (
                      <tr key={p.id} className="text-ink">
                        <td className="px-4 py-3 font-display text-[15px] tracking-tight">{p.symbol}</td>
                        <td className="px-4 py-3 font-mono text-[12px] uppercase tracking-[0.16em]">
                          {p.side === 'long' ? (
                            <span className="inline-flex items-center gap-1 text-ink">
                              <ArrowUpRight aria-hidden className="h-3.5 w-3.5" strokeWidth={1.75} /> {t.long}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-ink">
                              <ArrowDownRight aria-hidden className="h-3.5 w-3.5" strokeWidth={1.75} /> {t.short}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-[12.5px]">{p.qty}</td>
                        <td className="px-4 py-3 text-right font-mono text-[12.5px]">{formatPrice(p.symbol, p.entry_price)}</td>
                        <td className="px-4 py-3 text-right font-mono text-[12.5px]">{formatPrice(p.symbol, mark)}</td>
                        <td
                          className={cn(
                            'px-4 py-3 text-right font-mono text-[12.5px]',
                            positive ? 'text-up' : 'text-down',
                          )}
                        >
                          {positive ? '+' : ''}€{value.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <form action={closePosition}>
                            <input type="hidden" name="locale" value={locale} />
                            <input type="hidden" name="id" value={p.id} />
                            <button
                              type="submit"
                              className="inline-flex h-9 items-center justify-center gap-1 rounded-full border border-line px-3 text-[12px] font-medium tracking-tight text-ink hover:border-ink hover:bg-ink hover:text-canvas"
                            >
                              {t.close}
                            </button>
                          </form>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <h2 className="mt-16 font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
            {t.history} · {closed.length}
          </h2>
          {closed.length === 0 ? (
            <p className="mt-4 text-[15px] text-muted">{t.noClosed}</p>
          ) : (
            <div className="mt-4 overflow-x-auto rounded-sm border border-line bg-surface">
              <table className="w-full min-w-[760px] text-left text-[14px]">
                <thead className="border-b border-line bg-elevated font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
                  <tr>
                    <th className="px-4 py-3">{t.columns.symbol}</th>
                    <th className="px-4 py-3">{t.columns.side}</th>
                    <th className="px-4 py-3 text-right">{t.columns.qty}</th>
                    <th className="px-4 py-3 text-right">{t.columns.entry}</th>
                    <th className="px-4 py-3 text-right">{t.closedColumns.exit}</th>
                    <th className="px-4 py-3 text-right">{t.columns.pnl}</th>
                    <th className="px-4 py-3 text-right">{t.closedColumns.closed}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {closed.map((p) => {
                    const positive = p.pnl >= 0;
                    return (
                      <tr key={p.id} className="text-ink">
                        <td className="px-4 py-3 font-display text-[15px] tracking-tight">{p.symbol}</td>
                        <td className="px-4 py-3 font-mono text-[12px] uppercase tracking-[0.16em]">
                          {p.side === 'long' ? t.long : t.short}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-[12.5px]">{p.qty}</td>
                        <td className="px-4 py-3 text-right font-mono text-[12.5px]">{formatPrice(p.symbol, p.entry_price)}</td>
                        <td className="px-4 py-3 text-right font-mono text-[12.5px]">
                          {p.exit_price === null ? '—' : formatPrice(p.symbol, p.exit_price)}
                        </td>
                        <td
                          className={cn(
                            'px-4 py-3 text-right font-mono text-[12.5px]',
                            positive ? 'text-up' : 'text-down',
                          )}
                        >
                          {positive ? '+' : ''}€{p.pnl.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-[11px] text-muted">
                          {p.closed_at
                            ? new Date(p.closed_at).toLocaleString(locale === 'fr' ? 'fr-FR' : 'en-GB', {
                                dateStyle: 'short',
                                timeStyle: 'short',
                              })
                            : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Container>
      </section>
    </AppShell>
  );
}
