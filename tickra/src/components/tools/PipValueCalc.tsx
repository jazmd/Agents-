'use client';

import { useState } from 'react';
import { CircleDollarSign } from 'lucide-react';

type Labels = { title: string; body: string; lot: string; pair: string; result: string };

const QUOTES = [
  { code: 'USD', symbol: '$', pip: 0.0001 },
  { code: 'EUR', symbol: '€', pip: 0.0001 },
  { code: 'GBP', symbol: '£', pip: 0.0001 },
  { code: 'JPY', symbol: '¥', pip: 0.01 },
  { code: 'CHF', symbol: 'CHF', pip: 0.0001 },
];

export function PipValueCalc({ labels }: { labels: Labels }) {
  const [lot, setLot] = useState(1);
  const [code, setCode] = useState('USD');
  const quote = QUOTES.find((q) => q.code === code) ?? QUOTES[0];

  // For a standard forex contract: pip value = lot × 100000 × pip size, expressed in the quote currency.
  const pipValue = lot * 100_000 * quote.pip;

  return (
    <article className="flex flex-col rounded-sm border border-line bg-surface p-6 md:p-8">
      <header className="flex items-center gap-3 border-b border-line pb-4">
        <CircleDollarSign aria-hidden className="h-5 w-5 text-ink" strokeWidth={1.6} />
        <h2 className="font-display text-xl font-medium tracking-tight text-ink">{labels.title}</h2>
      </header>
      <p className="mt-4 text-[13.5px] leading-relaxed text-muted">{labels.body}</p>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <label htmlFor="pip-lot" className="block">
          <span className="block font-mono text-[10px] uppercase tracking-[0.22em] text-muted">{labels.lot}</span>
          <span className="mt-2 flex items-center gap-2 rounded-sm border border-line bg-canvas px-3">
            <input
              id="pip-lot"
              type="number"
              step={0.01}
              min={0.01}
              value={Number.isFinite(lot) ? lot : ''}
              onChange={(e) => setLot(Number(e.target.value))}
              className="h-11 w-full bg-transparent text-[15px] text-ink focus:outline-none"
            />
          </span>
        </label>
        <label htmlFor="pip-pair" className="block">
          <span className="block font-mono text-[10px] uppercase tracking-[0.22em] text-muted">{labels.pair}</span>
          <select
            id="pip-pair"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="mt-2 h-11 w-full rounded-sm border border-line bg-canvas px-3 text-[15px] text-ink focus:border-ink focus:outline-none"
          >
            {QUOTES.map((q) => (
              <option key={q.code} value={q.code}>
                {q.code}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-6 rounded-sm border border-ink bg-ink p-5 text-canvas">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-canvas/60">{labels.result}</p>
        <p className="mt-2 font-display text-3xl font-medium tracking-tight">
          {quote.symbol} {pipValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
        </p>
      </div>
    </article>
  );
}
