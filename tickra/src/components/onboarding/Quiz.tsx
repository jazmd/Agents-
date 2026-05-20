'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { easeOutExpo } from '@/lib/motion';
import { cn } from '@/lib/cn';
import { persistLevel } from '@/app/[locale]/onboarding/actions';
import type { Dictionary } from '@/lib/i18n/dictionaries';
import type { Locale } from '@/lib/i18n/config';

type Props = { dict: Dictionary; locale: Locale };

export function Quiz({ dict, locale }: Props) {
  const t = dict.onboarding;
  const questions = t.questions;
  const total = questions.length;

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<number[]>(() => Array(total).fill(-1));
  const [done, setDone] = useState(false);

  const current = questions[step];
  const isAnswered = answers[step] >= 0;
  const isLast = step === total - 1;

  const score = useMemo(
    () =>
      answers.reduce((sum, choiceIdx, qIdx) => {
        if (choiceIdx < 0) return sum;
        return sum + questions[qIdx].choices[choiceIdx].weight;
      }, 0),
    [answers, questions],
  );

  const max = useMemo(
    () => questions.reduce((s, q) => s + Math.max(...q.choices.map((c) => c.weight)), 0),
    [questions],
  );

  const ratio = score / max;
  const level: 'novice' | 'intermediate' | 'advanced' =
    ratio < 0.35 ? 'novice' : ratio < 0.75 ? 'intermediate' : 'advanced';
  const result = t.result[level];

  const [persistPending, startPersist] = useTransition();
  const [persisted, setPersisted] = useState(false);

  useEffect(() => {
    if (!done || persisted) return;
    startPersist(async () => {
      try {
        // best-effort; ignored when unauthenticated or env missing
        await persistLevel(level, locale);
      } finally {
        setPersisted(true);
      }
    });
  }, [done, level, locale, persisted]);

  function select(i: number) {
    setAnswers((prev) => prev.map((v, idx) => (idx === step ? i : v)));
  }

  function next() {
    if (!isAnswered) return;
    if (isLast) setDone(true);
    else setStep((s) => s + 1);
  }

  function back() {
    if (step === 0) return;
    setStep((s) => s - 1);
  }

  const progress = ((step + (done ? 1 : 0)) / total) * 100;

  return (
    <section className="border-b border-line">
      <Container as="div" className="grid grid-cols-12 gap-x-6 py-20 md:py-28">
        <div className="col-span-12 lg:col-span-3">
          <Eyebrow>{t.eyebrow}</Eyebrow>
          <h1 className="mt-6 font-display text-display-md font-medium tracking-tight text-balance text-ink">
            {t.title}
          </h1>
          <p className="mt-5 max-w-sm text-[15.5px] leading-relaxed text-muted">{t.subtitle}</p>
        </div>

        <div className="col-span-12 mt-14 lg:col-span-8 lg:col-start-5 lg:mt-0">
          <div className="mb-8 flex items-center justify-between">
            <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
              {done
                ? t.progress.replace('{current}', String(total)).replace('{total}', String(total))
                : t.progress
                    .replace('{current}', String(step + 1))
                    .replace('{total}', String(total))}
            </span>
            <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-subtle">
              {Math.round(progress)} %
            </span>
          </div>

          <div className="h-px w-full overflow-hidden bg-line">
            <motion.div
              className="h-full bg-ink"
              initial={false}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: easeOutExpo }}
            />
          </div>

          <div className="mt-12 min-h-[420px]">
            <AnimatePresence mode="wait">
              {done ? (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.5, ease: easeOutExpo }}
                >
                  <span className="inline-flex items-center gap-2 rounded-full border border-line px-3 py-1 font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
                    <Check aria-hidden className="h-3.5 w-3.5 text-ink" strokeWidth={2} />
                    Completed
                  </span>
                  <h2 className="mt-6 font-display text-display-md font-medium tracking-tight text-balance text-ink">
                    {result.label}.
                  </h2>
                  <p className="mt-6 max-w-xl text-[16.5px] leading-relaxed text-muted">
                    {result.body}
                  </p>
                  <div className="mt-12 rounded-sm border border-line bg-surface p-6 md:p-8">
                    <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
                      Recommended start
                    </span>
                    <p className="mt-3 font-display text-2xl font-medium tracking-tight text-ink">
                      {result.recommended}
                    </p>
                    <div className="mt-8 flex flex-wrap gap-3">
                      <Link
                        href={`/${locale}/dashboard`}
                        className="inline-flex h-11 items-center gap-2 rounded-full bg-ink px-5 text-sm font-medium tracking-tight text-canvas hover:bg-ink/90"
                      >
                        Open my dashboard
                        <ArrowRight aria-hidden className="h-4 w-4" strokeWidth={1.75} />
                      </Link>
                      <Link
                        href={`/${locale}/lesson/japanese-candles`}
                        className="inline-flex h-11 items-center gap-2 rounded-full border border-line px-5 text-sm font-medium tracking-tight text-ink hover:border-ink hover:bg-ink hover:text-canvas"
                      >
                        Start lesson 01
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key={`q-${step}`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.45, ease: easeOutExpo }}
                >
                  <h2 className="font-display text-display-md font-medium tracking-tight text-balance text-ink">
                    {current.q}
                  </h2>

                  <ul className="mt-10 space-y-3">
                    {current.choices.map((choice, i) => {
                      const selected = answers[step] === i;
                      return (
                        <li key={choice.label}>
                          <button
                            type="button"
                            onClick={() => select(i)}
                            aria-pressed={selected}
                            className={cn(
                              'group flex w-full items-center justify-between gap-6 rounded-sm border px-6 py-5 text-left transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-canvas',
                              selected
                                ? 'border-ink bg-ink text-canvas'
                                : 'border-line bg-surface text-ink hover:border-ink',
                            )}
                          >
                            <span className="text-[15.5px] leading-snug">{choice.label}</span>
                            <span
                              aria-hidden
                              className={cn(
                                'inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border transition-colors',
                                selected
                                  ? 'border-canvas bg-canvas text-ink'
                                  : 'border-line text-transparent group-hover:border-ink',
                              )}
                            >
                              <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {!done ? (
            <div className="mt-12 flex items-center justify-between border-t border-line pt-6">
              <button
                type="button"
                onClick={back}
                disabled={step === 0}
                className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-ink disabled:opacity-30 disabled:hover:text-muted"
              >
                <ArrowLeft aria-hidden className="h-4 w-4" strokeWidth={1.75} />
                {t.cta.back}
              </button>
              <button
                type="button"
                onClick={next}
                disabled={!isAnswered}
                className="inline-flex h-11 items-center gap-2 rounded-full bg-ink px-5 text-sm font-medium tracking-tight text-canvas transition-opacity hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-30"
              >
                {isLast ? t.cta.finish : t.cta.next}
                <ArrowRight aria-hidden className="h-4 w-4" strokeWidth={1.75} />
              </button>
            </div>
          ) : null}
        </div>
      </Container>
    </section>
  );
}
