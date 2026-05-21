'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';

type Props = {
  email: string;
  locale: string;
  title: string;
  body: string;
  confirmLabel: string;
  cta: string;
  cancel: string;
  doneMessage: string;
  failMessage: string;
};

export function DeleteAccount({
  email,
  locale,
  title,
  body,
  confirmLabel,
  cta,
  cancel,
  doneMessage,
  failMessage,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const armed = typed.toLowerCase().trim() === email.toLowerCase().trim();

  async function submit() {
    if (!armed || pending) return;
    setPending(true);
    setError(null);
    try {
      const res = await fetch('/api/account/delete', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: typed }),
      });
      if (!res.ok) {
        setError(failMessage);
        setPending(false);
        return;
      }
      setDone(true);
      setTimeout(() => router.replace(`/${locale}`), 1200);
    } catch {
      setError(failMessage);
      setPending(false);
    }
  }

  if (done) {
    return (
      <p className="text-[14px] text-ink">{doneMessage}</p>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-down/40 px-5 text-[14px] font-medium tracking-tight text-down transition-colors hover:border-down hover:bg-down hover:text-canvas"
      >
        <AlertTriangle aria-hidden className="h-4 w-4" strokeWidth={1.75} />
        {title}
      </button>
    );
  }

  return (
    <div className="rounded-sm border border-down/40 bg-down/5 p-6 md:p-8">
      <div className="flex items-start gap-3">
        <AlertTriangle aria-hidden className="mt-0.5 h-5 w-5 flex-shrink-0 text-down" strokeWidth={1.6} />
        <div>
          <h3 className="font-display text-xl font-medium tracking-tight text-ink">{title}</h3>
          <p className="mt-2 max-w-md text-[14.5px] leading-relaxed text-muted">{body}</p>
        </div>
      </div>

      <div className="mt-6">
        <label htmlFor="delete-confirm" className="mb-2 block font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
          {confirmLabel}
        </label>
        <input
          id="delete-confirm"
          type="email"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          placeholder={email}
          autoComplete="off"
          className="h-12 w-full rounded-sm border border-line bg-canvas px-4 text-[15px] text-ink placeholder:text-subtle focus:border-down focus:outline-none focus:ring-2 focus:ring-down/15"
        />
      </div>

      {error ? <p className="mt-4 text-[13px] text-down">{error}</p> : null}

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={submit}
          disabled={!armed || pending}
          className={cn(
            'inline-flex h-11 items-center justify-center gap-2 rounded-full bg-down px-5 text-[14px] font-medium tracking-tight text-canvas transition-opacity hover:bg-down/90 disabled:cursor-not-allowed disabled:opacity-40',
          )}
        >
          {pending ? <Loader2 aria-hidden className="h-4 w-4 animate-spin" strokeWidth={1.75} /> : null}
          {cta}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setTyped('');
            setError(null);
          }}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-line px-5 text-[14px] font-medium tracking-tight text-ink hover:border-ink"
        >
          {cancel}
        </button>
      </div>
    </div>
  );
}
