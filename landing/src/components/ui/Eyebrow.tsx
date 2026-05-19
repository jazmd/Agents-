import type { ReactNode } from 'react';

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-muted">
      <span aria-hidden className="inline-block h-px w-6 bg-ink" />
      {children}
    </span>
  );
}
