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
    id: 'indicators',
    order: 4,
    title: { en: 'Indicators', fr: 'Indicateurs' },
    summary: {
      en: 'Moving averages, RSI, MACD, Bollinger Bands — used with discipline.',
      fr: 'Moyennes mobiles, RSI, MACD, bandes de Bollinger — avec discipline.',
    },
  },
  {
    id: 'risk',
    order: 5,
    title: { en: 'Risk', fr: 'Risque' },
    summary: {
      en: 'Position sizing, stops, expectancy. The whole game.',
      fr: 'Taille de position, stops, espérance. Tout le métier.',
    },
  },
  {
    id: 'psychology',
    order: 6,
    title: { en: 'Psychology', fr: 'Psychologie' },
    summary: {
      en: 'FOMO, revenge, tilt, attention. The half of trading no one teaches.',
      fr: 'FOMO, revanche, tilt, attention. La moitié du trading que personne n’enseigne.',
    },
  },
  {
    id: 'assets',
    order: 7,
    title: { en: 'Asset classes', fr: 'Classes d’actifs' },
    summary: {
      en: 'Forex, stocks, indices, commodities, crypto — what each demands.',
      fr: 'Forex, actions, indices, matières premières, crypto — ce que chacune exige.',
    },
  },
  {
    id: 'strategy',
    order: 8,
    title: { en: 'Strategy', fr: 'Stratégie' },
    summary: {
      en: 'Mean reversion, momentum, breakouts. Building a system you can run.',
      fr: 'Mean reversion, momentum, breakouts. Construire un système que vous pouvez tenir.',
    },
  },
  {
    id: 'execution',
    order: 9,
    title: { en: 'Execution', fr: 'Exécution' },
    summary: {
      en: 'Order types, broker mechanics, journaling the decision.',
      fr: 'Types d’ordres, mécanique du broker, journaliser la décision.',
    },
  },
];
