'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { easeOutExpo } from '@/lib/motion';
import { cn } from '@/lib/cn';

type Props = {
  title: string;
  question: string;
  choices: readonly string[];
  correct: number;
  successMessage: string;
  retryMessage: string;
};

export function LessonQuiz({ title, question, choices, correct, successMessage, retryMessage }: Props) {
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const isCorrect = selected === correct;

  function submit() {
    if (selected === null) return;
    setSubmitted(true);
  }

  function reset() {
    setSelected(null);
    setSubmitted(false);
  }

  return (
    <section aria-labelledby="quiz-title" className="rounded-sm border border-line bg-surface p-6 md:p-10">
      <header className="border-b border-line pb-5">
        <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">{title}</span>
        <h3 id="quiz-title" className="mt-4 font-display text-2xl font-medium tracking-tight text-balance text-ink">
          {question}
        </h3>
      </header>

      <ul className="mt-8 grid gap-2 sm:grid-cols-2">
        {choices.map((c, i) => {
          const isSel = selected === i;
          const showRight = submitted && i === correct;
          const showWrong = submitted && isSel && !isCorrect;
          return (
            <li key={c}>
              <button
                type="button"
                onClick={() => !submitted && setSelected(i)}
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
                <span>{c}</span>
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
              key={isCorrect ? 'ok' : 'no'}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: easeOutExpo }}
              className={cn(
                'max-w-xl text-[14.5px] leading-relaxed',
                isCorrect ? 'text-ink' : 'text-muted',
              )}
            >
              {isCorrect ? successMessage : retryMessage}
            </motion.p>
          ) : (
            <span key="hint" className="text-[13px] text-subtle">
              {selected === null ? '—' : ''}
            </span>
          )}
        </AnimatePresence>

        {!submitted ? (
          <button
            type="button"
            onClick={submit}
            disabled={selected === null}
            className="inline-flex h-11 items-center gap-2 rounded-full bg-ink px-5 text-sm font-medium tracking-tight text-canvas transition-opacity hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-30"
          >
            Submit
          </button>
        ) : !isCorrect ? (
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
