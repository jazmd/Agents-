import { Heart } from 'lucide-react';
import { cn } from '@/lib/cn';

type Props = { current: number; max: number; label: string; emptyMessage: string };

export function LivesIndicator({ current, max, label, emptyMessage }: Props) {
  return (
    <div className="rounded-sm border border-line bg-surface p-6 md:p-8">
      <div className="flex items-baseline justify-between">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">{label}</p>
        <span className="font-mono text-[11px] tracking-[0.18em] text-subtle">
          {current} / {max}
        </span>
      </div>
      <ul className="mt-6 flex gap-2.5" aria-label={`${current} of ${max} lives remaining`}>
        {Array.from({ length: max }).map((_, i) => {
          const active = i < current;
          return (
            <li
              key={i}
              className={cn(
                'flex h-12 w-12 items-center justify-center rounded-sm border',
                active ? 'border-ink bg-ink text-canvas' : 'border-line bg-canvas text-line',
              )}
            >
              <Heart
                aria-hidden
                className="h-5 w-5"
                strokeWidth={active ? 1.5 : 1.25}
                fill={active ? 'currentColor' : 'none'}
              />
            </li>
          );
        })}
      </ul>
      {current === 0 ? (
        <p className="mt-5 text-[13.5px] leading-relaxed text-muted">{emptyMessage}</p>
      ) : null}
    </div>
  );
}
