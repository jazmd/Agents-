import type { Thread, Reply } from './types';

/**
 * Seeded threads shown in demo mode (no Supabase). Read-only; the New-thread
 * button redirects to /signin so anonymous visitors see the funnel.
 */

const NOW = new Date('2026-05-22T10:00:00Z').toISOString();
const days = (n: number) => new Date(Date.parse(NOW) - n * 86_400_000).toISOString();

export const DEMO_THREADS: Thread[] = [
  {
    id: 't-1', user_id: 'u-1', display_name: 'Mathieu L.',
    category: 'beginners', locale: 'en', slug: 'is-2-percent-risk-still-the-norm',
    title: 'Is 2% risk per trade still the norm in 2026?',
    body: 'I’ve been reading older books that recommend 2% per trade. With smaller accounts and tighter stops, is this still a sensible default or do you adjust?',
    pinned: false, locked: false, reply_count: 4,
    created_at: days(1), updated_at: days(1),
  },
  {
    id: 't-2', user_id: 'u-2', display_name: 'Asha N.',
    category: 'patterns', locale: 'en', slug: 'engulfing-without-context',
    title: 'Engulfing without context — share your filters.',
    body: 'I keep getting fooled by engulfings in chop. What filters do you add? HTF level only? Volume confirmation? Both?',
    pinned: false, locked: false, reply_count: 7,
    created_at: days(2), updated_at: days(1),
  },
  {
    id: 't-3', user_id: 'u-3', display_name: 'Pierre R.',
    category: 'risk', locale: 'fr', slug: 'taille-de-position-petite-compte',
    title: 'Comment dimensionner sur un petit compte (1 000 €) ?',
    body: 'Avec 1 % de risque sur 1 000 €, j’ai 10 € à mettre en jeu. Sur EUR/USD avec un stop à 20 pips, ça donne une position minuscule. Vous faites comment ?',
    pinned: false, locked: false, reply_count: 5,
    created_at: days(3), updated_at: days(2),
  },
  {
    id: 't-4', user_id: 'u-4', display_name: 'Jordan O.',
    category: 'strategies', locale: 'en', slug: 'momentum-vs-mean-reversion-regime',
    title: 'How do you decide between momentum and mean-reversion in the same session?',
    body: 'Both look valid at different times of day. Curious to hear how others split their time and which signals they use to pick the regime.',
    pinned: true, locked: false, reply_count: 12,
    created_at: days(5), updated_at: days(1),
  },
  {
    id: 't-5', user_id: 'u-5', display_name: 'Amélie D.',
    category: 'brokers', locale: 'fr', slug: 'broker-fr-recommandation',
    title: 'Quel broker régulé en France pour le forex en 2026 ?',
    body: 'Je cherche un broker régulé AMF avec des spreads décents sur EUR/USD. Pas IG (trop cher). Des retours sur Saxo, Trade Republic, ou autre ?',
    pinned: false, locked: false, reply_count: 9,
    created_at: days(6), updated_at: days(2),
  },
  {
    id: 't-6', user_id: 'u-6', display_name: 'Sam K.',
    category: 'general', locale: 'en', slug: 'how-i-journal',
    title: 'How I journal — three columns, no more.',
    body: 'Setup, thesis, emotion. That’s it. I tried longer formats and stopped doing them. Wanted to share in case it helps someone else.',
    pinned: false, locked: false, reply_count: 3,
    created_at: days(8), updated_at: days(7),
  },
];

export const DEMO_REPLIES: Record<string, Reply[]> = {
  't-1': [
    { id: 'r-1', thread_id: 't-1', user_id: 'u-7', display_name: 'Karim B.', body: 'I scaled down to 0.5% during a losing streak. Brought my drawdown from 18% to 5% over the next 30 trades.', created_at: days(1) },
    { id: 'r-2', thread_id: 't-1', user_id: 'u-8', display_name: 'Léa M.', body: '2% is fine if your expectancy is positive over 100+ trades. Below 100 trades it is just variance.', created_at: days(1) },
  ],
  't-3': [
    { id: 'r-3', thread_id: 't-3', user_id: 'u-9', display_name: 'Hugo T.', body: 'Micro-lots ou cents account. La taille du compte ne devrait pas changer la règle, juste l’instrument.', created_at: days(2) },
  ],
  't-4': [
    { id: 'r-4', thread_id: 't-4', user_id: 'u-10', display_name: 'Nora S.', body: 'I use ATR vs 20-day average. Above = momentum bias, below = mean reversion. Not a rule, a tilt.', created_at: days(1) },
  ],
};

export function demoThreadBySlug(slug: string) {
  return DEMO_THREADS.find((t) => t.slug === slug) ?? null;
}

export function demoRepliesFor(threadId: string): Reply[] {
  return DEMO_REPLIES[threadId] ?? [];
}
