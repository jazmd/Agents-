import { closeJournalEntry } from '@/app/[locale]/journal/actions';
import { cn } from '@/lib/cn';

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
};

type Labels = {
  outcome: Record<'open' | 'win' | 'loss' | 'breakeven', string>;
  emotions: Record<'calm' | 'fomo' | 'revenge' | 'tired' | 'other', string>;
};

export function JournalEntryCard({ entry, locale, labels }: { entry: Entry; locale: string; labels: Labels }) {
  const outcome = (entry.outcome ?? 'open') as 'open' | 'win' | 'loss' | 'breakeven';
  const date = new Date(entry.created_at).toLocaleString(locale === 'fr' ? 'fr-FR' : 'en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <article className="rounded-sm border border-line bg-surface p-6 md:p-8">
      <header className="flex flex-wrap items-baseline justify-between gap-3 border-b border-line pb-4">
        <div className="flex flex-wrap items-baseline gap-3">
          {entry.symbol ? (
            <span className="font-display text-xl font-medium tracking-tight text-ink">
              {entry.symbol}
            </span>
          ) : null}
          {entry.setup ? (
            <span className="text-[13.5px] text-muted">{entry.setup}</span>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'inline-flex items-center rounded-full px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em]',
              outcome === 'open' && 'border border-line text-muted',
              outcome === 'win' && 'border border-up bg-up/10 text-ink',
              outcome === 'loss' && 'border border-down bg-down/10 text-ink',
              outcome === 'breakeven' && 'border border-ink text-ink',
            )}
          >
            {labels.outcome[outcome]}
          </span>
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-subtle">
            {date}
          </span>
        </div>
      </header>

      <p className="mt-4 max-w-3xl text-[15.5px] leading-relaxed text-ink">{entry.thesis}</p>

      <dl className="mt-5 grid grid-cols-1 gap-x-8 gap-y-3 text-[13.5px] sm:grid-cols-3">
        {entry.invalidation ? (
          <div>
            <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-subtle">Invalidation</dt>
            <dd className="mt-1 text-ink">{entry.invalidation}</dd>
          </div>
        ) : null}
        {entry.target ? (
          <div>
            <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-subtle">Target</dt>
            <dd className="mt-1 text-ink">{entry.target}</dd>
          </div>
        ) : null}
        {entry.emotion ? (
          <div>
            <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-subtle">Emotion</dt>
            <dd className="mt-1 text-ink">{labels.emotions[entry.emotion as keyof Labels['emotions']]}</dd>
          </div>
        ) : null}
      </dl>

      {outcome === 'open' ? (
        <form action={closeJournalEntry} className="mt-6 flex flex-wrap items-center gap-2 border-t border-line pt-5">
          <input type="hidden" name="id" value={entry.id} />
          <input type="hidden" name="locale" value={locale} />
          <span className="mr-2 font-mono text-[11px] uppercase tracking-[0.2em] text-muted">Outcome</span>
          {(['win', 'loss', 'breakeven'] as const).map((o) => (
            <button
              key={o}
              type="submit"
              name="outcome"
              value={o}
              className={cn(
                'inline-flex h-9 items-center rounded-full border px-3 text-[12.5px] font-medium tracking-tight transition-colors',
                o === 'win' && 'border-up/40 text-up hover:bg-up hover:text-canvas',
                o === 'loss' && 'border-down/40 text-down hover:bg-down hover:text-canvas',
                o === 'breakeven' && 'border-line text-ink hover:border-ink hover:bg-ink hover:text-canvas',
              )}
            >
              {labels.outcome[o]}
            </button>
          ))}
        </form>
      ) : null}
    </article>
  );
}
