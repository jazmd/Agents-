/**
 * SM-2 spaced repetition algorithm (SuperMemo 2 by Piotr Wozniak).
 * Grade in [0..5] — 0..2 means "failed", 3..5 means "passed".
 */

export type Sm2State = {
  ease: number; // ease factor, ≥1.30
  intervalDays: number; // current interval in days
  repetitions: number; // successful repetition count
};

export type Sm2Result = Sm2State & {
  nextDueAt: Date;
};

export function nextSm2(prev: Sm2State, grade: number, now: Date = new Date()): Sm2Result {
  const g = Math.max(0, Math.min(5, Math.round(grade)));
  let { ease, intervalDays, repetitions } = prev;

  if (g < 3) {
    // failure → restart the schedule
    repetitions = 0;
    intervalDays = 1;
  } else {
    repetitions += 1;
    if (repetitions === 1) intervalDays = 1;
    else if (repetitions === 2) intervalDays = 6;
    else intervalDays = Math.round(intervalDays * ease);
  }

  // update ease factor (clamped at 1.30)
  ease = Math.max(1.3, ease + (0.1 - (5 - g) * (0.08 + (5 - g) * 0.02)));

  const nextDueAt = new Date(now);
  nextDueAt.setDate(nextDueAt.getDate() + intervalDays);

  return { ease, intervalDays, repetitions, nextDueAt };
}

export const DEFAULT_SM2: Sm2State = {
  ease: 2.5,
  intervalDays: 1,
  repetitions: 0,
};
