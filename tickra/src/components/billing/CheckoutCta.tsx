'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { Locale } from '@/lib/i18n/config';
import type { CheckoutPlan } from '@/lib/stripe';

type Props = {
  locale: Locale;
  plan: CheckoutPlan | null;
  fallbackHref: string;
  highlighted: boolean;
  label: string;
};

export function CheckoutCta({ locale, plan, fallbackHref, highlighted, label }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const base =
    'inline-flex h-12 w-full items-center justify-center gap-2 rounded-full px-5 text-[15px] font-medium tracking-tight transition-colors duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60';
  const variant = highlighted
    ? 'border border-canvas/30 text-canvas hover:border-canvas hover:bg-canvas hover:text-ink focus-visible:ring-canvas focus-visible:ring-offset-ink'
    : 'bg-ink text-canvas hover:bg-ink/90 focus-visible:ring-ink focus-visible:ring-offset-canvas';

  if (!plan) {
    return (
      <Link href={fallbackHref} className={cn(base, variant)}>
        {label}
      </Link>
    );
  }

  async function go() {
    if (pending) return;
    setError(null);
    setPending(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ plan, locale }),
      });
      if (res.status === 401) {
        router.push(`/${locale}/signin?next=${encodeURIComponent(`/${locale}/pricing`)}`);
        return;
      }
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || 'Could not start checkout.');
      }
    } catch {
      setError('Network error.');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-2">
      <button type="button" onClick={go} disabled={pending} className={cn(base, variant)}>
        {pending ? <Loader2 aria-hidden className="h-4 w-4 animate-spin" strokeWidth={1.75} /> : null}
        {label}
      </button>
      {error ? <p className="text-[12.5px] text-down">{error}</p> : null}
    </div>
  );
}
