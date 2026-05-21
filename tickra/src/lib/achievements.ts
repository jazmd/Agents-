import type { Locale } from './i18n/config';

export type Badge = {
  id: string;
  title: Record<Locale, string>;
  body: Record<Locale, string>;
  // Predicate is evaluated server-side. Inputs are the user_state row.
  unlock: (state: { xp: number; streak_current: number; streak_best: number; level_index: number }, ctx: { lessonsCompleted: number }) => boolean;
};

export const BADGES: Badge[] = [
  {
    id: 'first-candle',
    title: { en: 'First candle', fr: 'Première bougie' },
    body: { en: 'Completed your first lesson.', fr: 'Première leçon terminée.' },
    unlock: (_s, c) => c.lessonsCompleted >= 1,
  },
  {
    id: 'three-day-streak',
    title: { en: 'Three-day streak', fr: 'Streak de trois jours' },
    body: { en: 'Practiced three days in a row.', fr: 'Trois jours consécutifs.' },
    unlock: (s) => s.streak_current >= 3 || s.streak_best >= 3,
  },
  {
    id: 'two-weeks-streak',
    title: { en: 'Two-week streak', fr: 'Streak de deux semaines' },
    body: { en: 'Fourteen days, no skips.', fr: 'Quatorze jours, sans pause.' },
    unlock: (s) => s.streak_current >= 14 || s.streak_best >= 14,
  },
  {
    id: 'level-three',
    title: { en: 'Level 03', fr: 'Niveau 03' },
    body: { en: 'Reached level three.', fr: 'Niveau trois atteint.' },
    unlock: (s) => s.level_index >= 3,
  },
  {
    id: 'level-five',
    title: { en: 'Level 05', fr: 'Niveau 05' },
    body: { en: 'Reached level five.', fr: 'Niveau cinq atteint.' },
    unlock: (s) => s.level_index >= 5,
  },
  {
    id: 'foundations-graduate',
    title: { en: 'Foundations graduate', fr: 'Diplôme Fondations' },
    body: { en: 'Completed the Foundations track.', fr: 'Piste Fondations terminée.' },
    unlock: (_s, c) => c.lessonsCompleted >= 6,
  },
  {
    id: 'risk-master',
    title: { en: 'Risk master', fr: 'Maître du risque' },
    body: { en: 'Completed the Risk track.', fr: 'Piste Risque terminée.' },
    unlock: (_s, c) => c.lessonsCompleted >= 15,
  },
  {
    id: 'thousand-xp',
    title: { en: '1,000 XP', fr: '1 000 XP' },
    body: { en: 'Earned your first 1,000 XP.', fr: 'Premiers 1 000 XP gagnés.' },
    unlock: (s) => s.xp >= 1000,
  },
  {
    id: 'five-thousand-xp',
    title: { en: '5,000 XP', fr: '5 000 XP' },
    body: { en: 'Earned five thousand experience points.', fr: 'Cinq mille points d’expérience gagnés.' },
    unlock: (s) => s.xp >= 5000,
  },
];

export function badgesUnlockedBy(
  state: { xp: number; streak_current: number; streak_best: number; level_index: number },
  ctx: { lessonsCompleted: number },
): string[] {
  return BADGES.filter((b) => b.unlock(state, ctx)).map((b) => b.id);
}
