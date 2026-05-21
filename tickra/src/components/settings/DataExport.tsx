'use client';

import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';

type Props = {
  cta: string;
  pendingLabel: string;
  failedLabel: string;
};

export function DataExport({ cta, pendingLabel, failedLabel }: Props) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    if (pending) return;
    setError(null);
    setPending(true);
    try {
      const res = await fetch('/api/account/export');
      if (!res.ok) {
        setError(failedLabel);
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const stamp = new Date().toISOString().slice(0, 10);
      a.download = `tickra-export-${stamp}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      setError(failedLabel);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={run}
        disabled={pending}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-line px-5 text-[14px] font-medium tracking-tight text-ink transition-colors hover:border-ink hover:bg-ink hover:text-canvas disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? (
          <Loader2 aria-hidden className="h-4 w-4 animate-spin" strokeWidth={1.75} />
        ) : (
          <Download aria-hidden className="h-4 w-4" strokeWidth={1.6} />
        )}
        {pending ? pendingLabel : cta}
      </button>
      {error ? <p className="text-[12.5px] text-down">{error}</p> : null}
    </div>
  );
}
