'use client';

import { useState } from 'react';
import { AlertTriangle, Check, Loader2, MailWarning } from 'lucide-react';

type Props = {
  email: string;
  title: string;
  body: string;
  cta: string;
  pendingLabel: string;
  sentLabel: string;
  failedLabel: string;
};

export function VerifyBanner({ email, title, body, cta, pendingLabel, sentLabel, failedLabel }: Props) {
  const [state, setState] = useState<'idle' | 'pending' | 'sent' | 'failed'>('idle');

  async function send() {
    if (state === 'pending') return;
    setState('pending');
    try {
      const res = await fetch('/api/account/resend-verification', { method: 'POST' });
      setState(res.ok ? 'sent' : 'failed');
    } catch {
      setState('failed');
    }
  }

  return (
    <aside
      role="status"
      className="flex flex-col gap-3 rounded-sm border border-down/40 bg-down/5 p-5 md:flex-row md:items-center md:justify-between md:p-6"
    >
      <div className="flex items-start gap-3">
        <MailWarning aria-hidden className="mt-0.5 h-5 w-5 flex-shrink-0 text-down" strokeWidth={1.6} />
        <div>
          <p className="font-display text-lg font-medium tracking-tight text-ink">{title}</p>
          <p className="mt-1 text-[14px] leading-relaxed text-muted">
            {body} <span className="font-mono text-[12px]">{email}</span>
          </p>
        </div>
      </div>
      <div className="flex flex-shrink-0 items-center gap-3">
        <button
          type="button"
          onClick={send}
          disabled={state === 'pending' || state === 'sent'}
          className="inline-flex h-10 items-center gap-2 rounded-full bg-ink px-4 text-[13.5px] font-medium tracking-tight text-canvas transition-opacity hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {state === 'pending' ? (
            <Loader2 aria-hidden className="h-3.5 w-3.5 animate-spin" strokeWidth={1.75} />
          ) : state === 'sent' ? (
            <Check aria-hidden className="h-3.5 w-3.5" strokeWidth={2} />
          ) : null}
          {state === 'pending'
            ? pendingLabel
            : state === 'sent'
              ? sentLabel
              : state === 'failed'
                ? failedLabel
                : cta}
        </button>
        {state === 'failed' ? (
          <AlertTriangle aria-hidden className="h-4 w-4 text-down" strokeWidth={1.75} />
        ) : null}
      </div>
    </aside>
  );
}
