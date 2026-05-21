'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, KeyRound, Loader2, ShieldCheck } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { easeOutExpo } from '@/lib/motion';
import { cn } from '@/lib/cn';

type Labels = {
  title: string;
  body: string;
  statusOff: string;
  statusOn: string;
  enable: string;
  disable: string;
  qrLabel: string;
  codeLabel: string;
  verify: string;
  cancel: string;
  enabled: string;
  disabled: string;
  invalidCode: string;
  failed: string;
};

type EnrollPayload = {
  factorId: string;
  qr: string;
  secret: string;
};

export function Mfa({ labels }: { labels: Labels }) {
  const supabase = createSupabaseBrowserClient();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [enroll, setEnroll] = useState<EnrollPayload | null>(null);
  const [code, setCode] = useState('');
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase.auth.mfa.listFactors();
        if (!cancelled) {
          const verified = (data?.totp ?? []).some((f) => f.status === 'verified');
          setEnabled(verified);
        }
      } catch {
        if (!cancelled) setEnabled(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  async function startEnroll() {
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const { data, error: err } = await supabase.auth.mfa.enroll({ factorType: 'totp' });
      if (err || !data) throw err ?? new Error('enroll_failed');
      setEnroll({
        factorId: data.id,
        qr: data.totp.qr_code,
        secret: data.totp.secret,
      });
    } catch {
      setError(labels.failed);
    } finally {
      setBusy(false);
    }
  }

  async function cancelEnroll() {
    if (!enroll) return;
    setBusy(true);
    try {
      await supabase.auth.mfa.unenroll({ factorId: enroll.factorId });
    } finally {
      setEnroll(null);
      setCode('');
      setBusy(false);
    }
  }

  async function verify() {
    if (!enroll || code.length !== 6) return;
    setBusy(true);
    setError(null);
    try {
      const { data: ch, error: chErr } = await supabase.auth.mfa.challenge({ factorId: enroll.factorId });
      if (chErr || !ch) throw chErr ?? new Error('challenge_failed');
      const { error: vErr } = await supabase.auth.mfa.verify({
        factorId: enroll.factorId,
        challengeId: ch.id,
        code,
      });
      if (vErr) throw vErr;
      setEnabled(true);
      setEnroll(null);
      setCode('');
      setSuccess(labels.enabled);
    } catch {
      setError(labels.invalidCode);
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    setError(null);
    try {
      const { data } = await supabase.auth.mfa.listFactors();
      for (const f of data?.totp ?? []) {
        await supabase.auth.mfa.unenroll({ factorId: f.id });
      }
      setEnabled(false);
      setSuccess(labels.disabled);
    } catch {
      setError(labels.failed);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-labelledby="mfa-title" className="rounded-sm border border-line bg-surface p-6 md:p-8">
      <header className="flex items-start gap-3">
        <ShieldCheck aria-hidden className="mt-0.5 h-5 w-5 flex-shrink-0 text-ink" strokeWidth={1.6} />
        <div className="flex-1">
          <h2 id="mfa-title" className="font-display text-xl font-medium tracking-tight text-ink">
            {labels.title}
          </h2>
          <p className="mt-2 max-w-md text-[14.5px] leading-relaxed text-muted">{labels.body}</p>
        </div>
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em]',
            enabled
              ? 'border border-up bg-up/10 text-ink'
              : 'border border-line text-muted',
          )}
        >
          {enabled ? labels.statusOn : labels.statusOff}
        </span>
      </header>

      <AnimatePresence mode="wait">
        {enroll ? (
          <motion.div
            key="enrolling"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: easeOutExpo }}
            className="mt-6 border-t border-line pt-6"
          >
            <p className="text-[14px] text-muted">{labels.qrLabel}</p>
            <div className="mt-5 flex flex-col items-start gap-5 sm:flex-row sm:items-center">
              <div
                aria-hidden
                className="rounded-sm border border-line bg-canvas p-3"
                dangerouslySetInnerHTML={{ __html: enroll.qr }}
              />
              <div className="text-[12.5px] text-subtle">
                <p className="font-mono uppercase tracking-[0.2em]">Secret</p>
                <code className="mt-1 block break-all rounded-sm bg-canvas px-2 py-1 text-[11.5px] text-ink">
                  {enroll.secret}
                </code>
              </div>
            </div>

            <div className="mt-6">
              <label htmlFor="mfa-code" className="mb-2 block font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
                {labels.codeLabel}
              </label>
              <input
                id="mfa-code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="000000"
                className="h-12 w-40 rounded-sm border border-line bg-canvas px-4 font-mono text-[18px] tracking-[0.4em] text-ink focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/15"
              />
            </div>

            {error ? <p className="mt-4 text-[12.5px] text-down">{error}</p> : null}

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={verify}
                disabled={busy || code.length !== 6}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-ink px-5 text-[14px] font-medium tracking-tight text-canvas hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {busy ? <Loader2 aria-hidden className="h-4 w-4 animate-spin" strokeWidth={1.75} /> : null}
                {labels.verify}
              </button>
              <button
                type="button"
                onClick={cancelEnroll}
                disabled={busy}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-line px-5 text-[14px] font-medium tracking-tight text-ink hover:border-ink"
              >
                {labels.cancel}
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: easeOutExpo }}
            className="mt-6 flex flex-wrap items-center gap-3"
          >
            {enabled ? (
              <button
                type="button"
                onClick={disable}
                disabled={busy}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-down/40 px-5 text-[14px] font-medium tracking-tight text-down hover:border-down hover:bg-down hover:text-canvas disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy ? <Loader2 aria-hidden className="h-4 w-4 animate-spin" strokeWidth={1.75} /> : <AlertTriangle aria-hidden className="h-4 w-4" strokeWidth={1.6} />}
                {labels.disable}
              </button>
            ) : (
              <button
                type="button"
                onClick={startEnroll}
                disabled={busy || enabled === null}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-ink px-5 text-[14px] font-medium tracking-tight text-canvas hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy ? <Loader2 aria-hidden className="h-4 w-4 animate-spin" strokeWidth={1.75} /> : <KeyRound aria-hidden className="h-4 w-4" strokeWidth={1.6} />}
                {labels.enable}
              </button>
            )}
            {success ? <p className="text-[13px] text-ink">{success}</p> : null}
            {error ? <p className="text-[13px] text-down">{error}</p> : null}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
