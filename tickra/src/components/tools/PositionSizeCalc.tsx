'use client';

import { useState } from 'react';
import { Calculator } from 'lucide-react';

type Labels = {
  title: string;
  body: string;
  account: string;
  accountUnit: string;
  riskPct: string;
  entry: string;
  stop: string;
  result: string;
  unitsLabel: string;
  risked: string;
};

export function PositionSizeCalc({ labels }: { labels: Labels }) {
  const [account, setAccount] = useState(10000);
  const [riskPct, setRiskPct] = useState(1);
  const [entry, setEntry] = useState(100);
  const [stop, setStop] = useState(98);

  const risked = (account * riskPct) / 100;
  const distance = Math.abs(entry - stop);
  const units = distance > 0 ? risked / distance : 0;

  return (
    <article className="flex flex-col rounded-sm border border-line bg-surface p-6 md:p-8">
      <header className="flex items-center gap-3 border-b border-line pb-4">
        <Calculator aria-hidden className="h-5 w-5 text-ink" strokeWidth={1.6} />
        <div>
          <h2 className="font-display text-xl font-medium tracking-tight text-ink">{labels.title}</h2>
        </div>
      </header>
      <p className="mt-4 text-[13.5px] leading-relaxed text-muted">{labels.body}</p>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <Field id="ps-account" label={labels.account} value={account} onChange={setAccount} suffix={labels.accountUnit} />
        <Field id="ps-risk" label={labels.riskPct} value={riskPct} onChange={setRiskPct} suffix="%" step={0.1} />
        <Field id="ps-entry" label={labels.entry} value={entry} onChange={setEntry} step={0.01} />
        <Field id="ps-stop" label={labels.stop} value={stop} onChange={setStop} step={0.01} />
      </div>

      <div className="mt-6 rounded-sm border border-ink bg-ink p-5 text-canvas">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-canvas/60">{labels.result}</p>
        <p className="mt-2 font-display text-3xl font-medium tracking-tight">
          {units.toLocaleString(undefined, { maximumFractionDigits: 2 })}{' '}
          <span className="text-[13px] text-canvas/60">{labels.unitsLabel}</span>
        </p>
        <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.22em] text-canvas/60">
          {labels.risked}: {labels.accountUnit}
          {risked.toLocaleString(undefined, { maximumFractionDigits: 2 })}
        </p>
      </div>
    </article>
  );
}

type FieldProps = {
  id: string;
  label: string;
  value: number;
  onChange: (n: number) => void;
  suffix?: string;
  step?: number;
};

function Field({ id, label, value, onChange, suffix, step = 1 }: FieldProps) {
  return (
    <label htmlFor={id} className="block">
      <span className="block font-mono text-[10px] uppercase tracking-[0.22em] text-muted">{label}</span>
      <span className="mt-2 flex items-center gap-2 rounded-sm border border-line bg-canvas px-3">
        <input
          id={id}
          type="number"
          inputMode="decimal"
          step={step}
          value={Number.isFinite(value) ? value : ''}
          onChange={(e) => onChange(Number(e.target.value))}
          className="h-11 w-full bg-transparent text-[15px] text-ink focus:outline-none"
        />
        {suffix ? <span className="font-mono text-[12px] text-subtle">{suffix}</span> : null}
      </span>
    </label>
  );
}
