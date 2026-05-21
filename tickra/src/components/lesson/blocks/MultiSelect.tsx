'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { easeOutExpo } from '@/lib/motion';

type Props = {
  title: string;
  question: string;
  choices: readonly string[];
  correct: number[];
  successMessage: string;
  retryMessage: string;
  onAnswer?: (correct: boolean) => void;
};

export function MultiSelectBlock({
  title,
  question,
  choices,
  correct,
  successMessage,
  retryMessage,
  onAnswer,
}: Props) {
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [submitted, setSubmitted] = useState(false);

  const correctSet = new Set(correct);
  const isAllCorrect =
    selected.size === correct.length &&
    [...selected].every((s) => correctSet.has(s));

  function toggle(i: number) {
    if (submitted) return;
    const next = new Set(selected);
    if (next.has(i)) next.delete(i);
    else next.add(i);
    setSelected(next);
  }

  function submit() {
    if (selected.size === 0) return;
    setSubmitted(true);
    onAnswer?.(isAllCorrect);
  }

  function reset() {
    setSelected(new Set());
    setSubmitted(false);
  }

  return (
    <section aria-labelledby="multi-title" className="rounded-sm border border-line bg-surface p-6 md:p-10">
      <header className="border-b border-line pb-5">
        <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">{title}</span>
        <h3 id="multi-title" className="mt-4 font-display text-2xl font-medium tracking-tight text-balance text-ink">
          {question}
        </h3>
      </header>

      <ul className="mt-8 grid gap-2">
        {choices.map((c, i) => {
          const isSel = selected.has(i);
          const showRight = submitted && correctSet.has(i);
          const showWrong = submitted && isSel && !correctSet.has(i);
          return (
            <li key={c}>
              <button
                type="button"
                onClick={() => toggle(i)}
                disabled={submitted}
                aria-pressed={isSel}
                className={cn(
                  'flex w-full items-center justify-between gap-4 rounded-sm border px-5 py-4 text-left text-[14.5px] transition-colors disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-canvas',
                  !submitted && isSel && 'border-ink bg-ink text-canvas',
                  !submitted && !isSel && 'border-line text-ink hover:border-ink',
                  showRight && 'border-up bg-up/10 text-ink',
                  showWrong && 'border-down bg-down/10 text-ink',
                  submitted && !isSel && !showRight && 'border-line text-muted',
                )}
              >
                <span className="flex items-center gap-3">
                  <span
                    aria-hidden
                    className={cn(
                      'inline-flex h-5 w-5 items-center justify-center rounded-sm border',
                      !submitted && isSel && 'border-canvas bg-canvas text-ink',
                      !submitted && !isSel && 'border-line text-transparent',
                      showRight && 'border-up bg-up text-canvas',
                      showWrong && 'border-down text-down',
                    )}
                  >
                    <Check className="h-3 w-3" strokeWidth={2.5} />
                  </span>
                  {c}
                </span>
                {showRight ? <Check className="h-4 w-4 text-up" strokeWidth={2.25} aria-hidden /> : null}
                {showWrong ? <X className="h-4 w-4 text-down" strokeWidth={2.25} aria-hidden /> : null}
              </button>
            </li>
          );
        })}
      </ul>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
        <AnimatePresence mode="wait">
          {submitted ? (
            <motion.p
              key={isAllCorrect ? 'ok' : 'no'}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: easeOutExpo }}
              className={cn('max-w-xl text-[14.5px] leading-relaxed', isAllCorrect ? 'text-ink' : 'text-muted')}
            >
              {isAllCorrect ? successMessage : retryMessage}
            </motion.p>
          ) : (
            <span key="hint" className="text-[13px] text-subtle">
              {selected.size === 0 ? '—' : `${selected.size} selected`}
            </span>
          )}
        </AnimatePresence>

        {!submitted ? (
          <button
            type="button"
            onClick={submit}
            disabled={selected.size === 0}
            className="inline-flex h-11 items-center gap-2 rounded-full bg-ink px-5 text-sm font-medium tracking-tight text-canvas hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-30"
          >
            Submit
          </button>
        ) : !isAllCorrect ? (
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
