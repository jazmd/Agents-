'use client';

import { useState } from 'react';
import { Scale } from 'lucide-react';

type Labels = { title: string; body: string; ratio: string; breakeven: string };

export function RiskRewardCalc({ labels }: { labels: Labels }) {
  const [n, setN] = useState(3);
  const breakeven = n > 0 ? 100 / (1 + n) : 0;

  return (
    <article className="flex flex-col rounded-sm border border-line bg-surface p-6 md:p-8">
      <header className="flex items-center gap-3 border-b border-line pb-4">
        <Scale aria-hidden className="h-5 w-5 text-ink" strokeWidth={1.6} />
        <h2 className="font-display text-xl font-medium tracking-tight text-ink">{labels.title}</h2>
      </header>
      <p className="mt-4 text-[13.5px] leading-relaxed text-muted">{labels.body}</p>

      <div className="mt-6">
        <label htmlFor="rr-n" className="block font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
          {labels.ratio}
        </label>
        <div className="mt-2 flex items-center gap-3 rounded-sm border border-line bg-canvas px-3">
          <span className="font-mono text-[13px] text-subtle">1 :</span>
          <input
            id="rr-n"
            type="number"
            step={0.5}
            min={0.5}
            value={Number.isFinite(n) ? n : ''}
            onChange={(e) => setN(Number(e.target.value))}
            className="h-11 w-full bg-transparent text-[15px] text-ink focus:outline-none"
          />
        </div>
      </div>

      <div className="mt-6 rounded-sm border border-ink bg-ink p-5 text-canvas">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-canvas/60">{labels.breakeven}</p>
        <p className="mt-2 font-display text-4xl font-medium tracking-tight">
          {breakeven.toFixed(1)}
          <span className="text-[18px] text-canvas/60"> %</span>
        </p>
      </div>
    </article>
  );
}
