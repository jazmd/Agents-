import { Check, Lock } from 'lucide-react';
import { cn } from '@/lib/cn';

type Status = 'done' | 'current' | 'locked';
type Node = { id: number; title: string; status: Status };

type Props = {
  title: string;
  legend: { done: string; current: string; locked: string };
  nodes: Node[];
};

export function LevelMap({ title, legend, nodes }: Props) {
  return (
    <section className="rounded-sm border border-line bg-surface p-6 md:p-8">
      <header className="flex flex-wrap items-baseline justify-between gap-4 border-b border-line pb-5">
        <h3 className="font-display text-xl font-medium tracking-tight text-ink">{title}</h3>
        <ul className="flex flex-wrap items-center gap-4 font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
          <li className="inline-flex items-center gap-2">
            <span aria-hidden className="block h-2.5 w-2.5 rounded-full bg-ink" />
            {legend.done}
          </li>
          <li className="inline-flex items-center gap-2">
            <span aria-hidden className="block h-2.5 w-2.5 rounded-full border border-ink bg-canvas" />
            {legend.current}
          </li>
          <li className="inline-flex items-center gap-2">
            <span aria-hidden className="block h-2.5 w-2.5 rounded-full border border-line bg-canvas" />
            {legend.locked}
          </li>
        </ul>
      </header>

      <ol className="mt-8 space-y-px overflow-hidden rounded-sm bg-line">
        {nodes.map((n) => (
          <li
            key={n.id}
            className={cn(
              'flex items-center justify-between gap-6 bg-surface px-5 py-4 transition-colors',
              n.status === 'current' && 'bg-elevated',
            )}
          >
            <div className="flex items-center gap-4">
              <span
                aria-hidden
                className={cn(
                  'inline-flex h-8 w-8 items-center justify-center rounded-full font-mono text-[11px] tracking-[0.1em]',
                  n.status === 'done' && 'bg-ink text-canvas',
                  n.status === 'current' && 'border border-ink text-ink',
                  n.status === 'locked' && 'border border-line text-subtle',
                )}
              >
                {n.status === 'done' ? (
                  <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                ) : n.status === 'locked' ? (
                  <Lock className="h-3.5 w-3.5" strokeWidth={1.6} />
                ) : (
                  String(n.id).padStart(2, '0')
                )}
              </span>
              <span
                className={cn(
                  'text-[14.5px]',
                  n.status === 'locked' ? 'text-muted' : 'text-ink',
                )}
              >
                {n.title}
              </span>
            </div>
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
              {n.status === 'done' ? legend.done : n.status === 'current' ? legend.current : legend.locked}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
