'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { easeOutExpo } from '@/lib/motion';

type Pair = { term: string; definition: string };
type Props = {
  title: string;
  question: string;
  pairs: readonly Pair[];
  successMessage: string;
  retryMessage: string;
  onAnswer?: (correct: boolean) => void;
};

function shuffle<T>(arr: readonly T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function MatchBlock({ title, question, pairs, successMessage, retryMessage, onAnswer }: Props) {
  const terms = useMemo(() => pairs.map((p, i) => ({ ...p, idx: i })), [pairs]);
  const defs = useMemo(() => shuffle(terms), [terms]);

  const [selectedTerm, setSelectedTerm] = useState<number | null>(null);
  // map: definition idx -> matched term idx
  const [matches, setMatches] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);

  function pickDef(defIdx: number, termIdx: number) {
    setMatches((m) => {
      const next = { ...m };
      // remove any prior assignment for this term
      for (const k of Object.keys(next)) {
        if (next[Number(k)] === termIdx) delete next[Number(k)];
      }
      next[defIdx] = termIdx;
      return next;
    });
    setSelectedTerm(null);
  }

  function isCorrect(): boolean {
    if (Object.keys(matches).length !== pairs.length) return false;
    return defs.every((d, defIdx) => matches[defIdx] === d.idx);
  }

  function submit() {
    setSubmitted(true);
    onAnswer?.(isCorrect());
  }

  function reset() {
    setMatches({});
    setSelectedTerm(null);
    setSubmitted(false);
  }

  const allMatched = Object.keys(matches).length === pairs.length;
  const ok = isCorrect();

  return (
    <section aria-labelledby="match-title" className="rounded-sm border border-line bg-surface p-6 md:p-10">
      <header className="border-b border-line pb-5">
        <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">{title}</span>
        <h3 id="match-title" className="mt-4 font-display text-2xl font-medium tracking-tight text-balance text-ink">
          {question}
        </h3>
      </header>

      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.22em] text-muted">Terms</p>
          <ul className="space-y-2">
            {terms.map((t) => {
              const usedBy = Object.entries(matches).find(([, v]) => v === t.idx);
              const used = Boolean(usedBy);
              const active = selectedTerm === t.idx;
              return (
                <li key={t.idx}>
                  <button
                    type="button"
                    onClick={() => !submitted && setSelectedTerm(active ? null : t.idx)}
                    disabled={submitted || used}
                    className={cn(
                      'flex w-full items-center justify-between gap-3 rounded-sm border px-4 py-3 text-left text-[14px] transition-colors disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-canvas',
                      active && 'border-ink bg-ink text-canvas',
                      !active && !used && 'border-line text-ink hover:border-ink',
                      used && !submitted && 'border-line text-subtle opacity-50',
                    )}
                  >
                    <span>{t.term}</span>
                    {used ? <Check className="h-3.5 w-3.5 text-subtle" strokeWidth={2} aria-hidden /> : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div>
          <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.22em] text-muted">Definitions</p>
          <ul className="space-y-2">
            {defs.map((d, defIdx) => {
              const matchedTermIdx = matches[defIdx];
              const matchedTerm = matchedTermIdx !== undefined ? terms[matchedTermIdx] : null;
              const correctHere = submitted && matchedTermIdx === d.idx;
              const wrongHere = submitted && matchedTermIdx !== undefined && matchedTermIdx !== d.idx;
              return (
                <li key={defIdx}>
                  <button
                    type="button"
                    onClick={() => {
                      if (submitted) return;
                      if (selectedTerm !== null) pickDef(defIdx, selectedTerm);
                    }}
                    disabled={submitted || selectedTerm === null}
                    className={cn(
                      'flex w-full flex-col items-start gap-1 rounded-sm border px-4 py-3 text-left text-[14px] transition-colors disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-canvas',
                      !submitted && 'border-line text-ink hover:border-ink',
                      correctHere && 'border-up bg-up/10',
                      wrongHere && 'border-down bg-down/10',
                    )}
                  >
                    <span>{d.definition}</span>
                    {matchedTerm ? (
                      <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
                        → {matchedTerm.term}
                      </span>
                    ) : (
                      <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-subtle">
                        pick a term first
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6">
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
            <span key="hint" className="text-[13px] text-subtle">
              {Object.keys(matches).length} / {pairs.length}
            </span>
          )}
        </AnimatePresence>

        {!submitted ? (
          <button
            type="button"
            onClick={submit}
            disabled={!allMatched}
            className="inline-flex h-11 items-center gap-2 rounded-full bg-ink px-5 text-sm font-medium tracking-tight text-canvas hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-30"
          >
            Submit
          </button>
        ) : !ok ? (
          <button
            type="button"
            onClick={reset}
            className="inline-flex h-11 items-center gap-2 rounded-full border border-line px-5 text-sm font-medium tracking-tight text-ink hover:border-ink"
          >
            <X className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
            Try again
          </button>
        ) : null}
      </div>
    </section>
  );
}
