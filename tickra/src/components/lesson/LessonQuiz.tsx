'use client';

import { useState, useTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Sparkles } from 'lucide-react';
import { easeOutExpo } from '@/lib/motion';
import { cn } from '@/lib/cn';
import { completeLesson, loseLife } from '@/app/[locale]/lesson/actions';
import type { Locale } from '@/lib/i18n/config';

type Props = {
  title: string;
  question: string;
  choices: readonly string[];
  correct: number;
  successMessage: string;
  retryMessage: string;
  locale: Locale;
  slug: string;
};

export function LessonQuiz({
  title,
  question,
  choices,
  correct,
  successMessage,
  retryMessage,
  locale,
  slug,
}: Props) {
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [pending, startTransition] = useTransition();
  const [reward, setReward] = useState<{ xp: number; streak: number; level: number } | null>(null);

  const isCorrect = selected === correct;

  function submit() {
    if (selected === null) return;
    setSubmitted(true);

    if (selected === correct) {
      const fd = new FormData();
      fd.set('slug', slug);
      fd.set('locale', locale);
      fd.set('score', '100');
      fd.set('minutes', '8');
      startTransition(async () => {
        const res = await completeLesson(fd);
        if (res && (res as { ok: boolean }).ok) {
          const r = res as { ok: true; xpAwarded: number; streak: number; level: number };
          setReward({ xp: r.xpAwarded, streak: r.streak, level: r.level });
        }
      });
    } else {
      startTransition(async () => {
        await loseLife();
      });
    }
  }

  function reset() {
    setSelected(null);
    setSubmitted(false);
    setReward(null);
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
            <motion.div
              key={isCorrect ? 'ok' : 'no'}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: easeOutExpo }}
              className="max-w-xl"
            >
              <p
                className={cn(
                  'text-[14.5px] leading-relaxed',
                  isCorrect ? 'text-ink' : 'text-muted',
                )}
              >
                {isCorrect ? successMessage : retryMessage}
              </p>
              {reward ? (
                <p className="mt-3 inline-flex items-center gap-2 rounded-full border border-ink bg-canvas px-3 py-1 font-mono text-[11px] uppercase tracking-[0.18em] text-ink">
                  <Sparkles aria-hidden className="h-3.5 w-3.5" strokeWidth={1.75} />
                  +{reward.xp} XP · streak {reward.streak} · level {reward.level}
                </p>
              ) : null}
            </motion.div>
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
            disabled={selected === null || pending}
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
