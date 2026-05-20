'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import type { Locale } from '@/lib/i18n/config';

type Props = { locale: Locale; label: string };

export function BillingPortalButton({ locale, label }: Props) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function open() {
    if (pending) return;
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/billing/portal?locale=${locale}`, { method: 'POST' });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || 'Could not open billing portal.');
      }
    } catch {
      setError('Network error.');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={open}
        disabled={pending}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-ink px-5 text-[14px] font-medium tracking-tight text-canvas transition-opacity hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? <Loader2 aria-hidden className="h-4 w-4 animate-spin" strokeWidth={1.75} /> : null}
        {label}
      </button>
      {error ? <p className="text-[12.5px] text-down">{error}</p> : null}
    </div>
  );
}
