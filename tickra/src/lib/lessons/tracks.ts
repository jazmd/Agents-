import type { Track } from './types';

export const TRACKS: Track[] = [
  {
    id: 'foundations',
    order: 1,
    title: { en: 'Foundations', fr: 'Fondations' },
    summary: {
      en: 'What a chart is. What a candle says. How a session reads.',
      fr: 'Ce qu’est un graphique. Ce qu’une bougie dit. Comment une séance se lit.',
    },
  },
  {
    id: 'structure',
    order: 2,
    title: { en: 'Structure', fr: 'Structure' },
    summary: {
      en: 'Support, resistance, swings, and the grammar of price.',
      fr: 'Supports, résistances, swings, et la grammaire du prix.',
    },
  },
  {
    id: 'patterns',
    order: 3,
    title: { en: 'Patterns', fr: 'Figures' },
    summary: {
      en: 'Engulfings, pin bars, channels — and what they actually mean.',
      fr: 'Avalements, pin bars, canaux — et ce qu’ils signifient vraiment.',
    },
  },
  {
    id: 'risk',
    order: 4,
    title: { en: 'Risk', fr: 'Risque' },
    summary: {
      en: 'Position sizing, stops, expectancy. The whole game.',
      fr: 'Taille de position, stops, espérance. Tout le métier.',
    },
  },
  {
    id: 'execution',
    order: 5,
    title: { en: 'Execution', fr: 'Exécution' },
    summary: {
      en: 'Order types, broker mechanics, journaling the decision.',
      fr: 'Types d’ordres, mécanique du broker, journaliser la décision.',
    },
  },
];
