'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowDown, ArrowUp, Check } from 'lucide-react';
import { cn } from '@/lib/cn';
import { easeOutExpo } from '@/lib/motion';

type Props = {
  title: string;
  question: string;
  items: readonly string[]; // canonical order
  successMessage: string;
  retryMessage: string;
  onAnswer?: (correct: boolean) => void;
};

function shuffle<T>(arr: readonly T[]): T[] {
  const a = [...arr];
  let mutated = false;
  while (!mutated) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    mutated = a.some((v, i) => v !== arr[i]); // ensure not equal to canonical
  }
  return a;
}

export function OrderBlock({ title, question, items, successMessage, retryMessage, onAnswer }: Props) {
  const initial = useMemo(() => shuffle(items), [items]);
  const [current, setCurrent] = useState<string[]>(initial);
  const [submitted, setSubmitted] = useState(false);

  function move(idx: number, delta: -1 | 1) {
    if (submitted) return;
    const next = idx + delta;
    if (next < 0 || next >= current.length) return;
    const arr = [...current];
    [arr[idx], arr[next]] = [arr[next], arr[idx]];
    setCurrent(arr);
  }

  const ok = current.every((v, i) => v === items[i]);

  function submit() {
    setSubmitted(true);
    onAnswer?.(ok);
  }

  function reset() {
    setCurrent(shuffle(items));
    setSubmitted(false);
  }

  return (
    <section aria-labelledby="order-title" className="rounded-sm border border-line bg-surface p-6 md:p-10">
      <header className="border-b border-line pb-5">
        <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">{title}</span>
        <h3 id="order-title" className="mt-4 font-display text-2xl font-medium tracking-tight text-balance text-ink">
          {question}
        </h3>
      </header>

      <ol className="mt-8 space-y-2">
        {current.map((value, i) => {
          const correctSpot = submitted && value === items[i];
          const wrongSpot = submitted && value !== items[i];
          return (
            <li key={value}>
              <div
                className={cn(
                  'flex items-center gap-3 rounded-sm border px-4 py-3 text-[14.5px] transition-colors',
                  !submitted && 'border-line bg-canvas text-ink',
                  correctSpot && 'border-up bg-up/10 text-ink',
                  wrongSpot && 'border-down bg-down/10 text-ink',
                )}
              >
                <span
                  aria-hidden
                  className="inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-ink font-mono text-[11px] text-ink"
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="flex-1">{value}</span>
                {submitted && correctSpot ? (
                  <Check className="h-4 w-4 text-up" strokeWidth={2.25} aria-hidden />
                ) : null}
                {!submitted ? (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      aria-label="Move up"
                      onClick={() => move(i, -1)}
                      disabled={i === 0}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-line text-muted hover:border-ink hover:text-ink disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <ArrowUp className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
                    </button>
                    <button
                      type="button"
                      aria-label="Move down"
                      onClick={() => move(i, 1)}
                      disabled={i === current.length - 1}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-line text-muted hover:border-ink hover:text-ink disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <ArrowDown className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
                    </button>
                  </div>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
        <AnimatePresence mode="wait">
          {submitted ? (
            <motion.p
              key={ok ? 'ok' : 'no'}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: easeOutExpo }}
              className={cn('max-w-xl text-[14.5px] leading-relaxed', ok ? 'text-ink' : 'text-muted')}
            >
              {ok ? successMessage : retryMessage}
            </motion.p>
          ) : (
            <span key="hint" className="text-[13px] text-subtle">arrange the items</span>
          )}
        </AnimatePresence>

        {!submitted ? (
          <button
            type="button"
            onClick={submit}
            className="inline-flex h-11 items-center gap-2 rounded-full bg-ink px-5 text-sm font-medium tracking-tight text-canvas hover:bg-ink/90"
          >
            Submit
          </button>
        ) : !ok ? (
          <button
            type="button"
            onClick={reset}
            className="inline-flex h-11 items-center gap-2 rounded-full border border-line px-5 text-sm font-medium tracking-tight text-ink hover:border-ink"
          >
            Try again
          </button>
        ) : null}
      </div>
    </section>
  );
}
