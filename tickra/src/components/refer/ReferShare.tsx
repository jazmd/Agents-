'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

type Props = { label: string; value: string; copyLabel: string; copiedLabel: string };

export function ReferShare({ label, value, copyLabel, copiedLabel }: Props) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    if (typeof navigator === 'undefined' || !navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore
    }
  }

  return (
    <div className="rounded-sm border border-line bg-surface p-6 md:p-8">
      <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">{label}</p>
      <div className="mt-4 flex items-center gap-3">
        <code className="flex-1 truncate rounded-sm bg-canvas px-3 py-2 font-mono text-[13.5px] text-ink">
          {value}
        </code>
        <button
          type="button"
          onClick={copy}
          aria-label={copyLabel}
          className="inline-flex h-9 items-center gap-2 rounded-full border border-line px-3 text-[12px] font-medium tracking-tight text-ink transition-colors hover:border-ink hover:bg-ink hover:text-canvas"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
              {copiedLabel}
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" strokeWidth={1.6} aria-hidden />
              {copyLabel}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
