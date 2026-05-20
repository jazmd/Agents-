export type Locale = 'en' | 'fr';

export type TrackId =
  | 'foundations'
  | 'structure'
  | 'patterns'
  | 'risk'
  | 'execution';

export type Track = {
  id: TrackId;
  order: number;
  title: Record<Locale, string>;
  summary: Record<Locale, string>;
};

export type Block =
  | { kind: 'lede'; text: Record<Locale, string> }
  | { kind: 'paragraph'; text: Record<Locale, string> }
  | { kind: 'heading'; text: Record<Locale, string> }
  | { kind: 'list'; items: Record<Locale, string[]>; ordered?: boolean }
  | { kind: 'callout'; tone: 'info' | 'warn'; title: Record<Locale, string>; text: Record<Locale, string> }
  | { kind: 'anatomy' } // renders CandleAnatomy with dict labels
  | { kind: 'chart' } // renders TradingViewEmbed
  | {
      kind: 'quiz';
      question: Record<Locale, string>;
      choices: Record<Locale, string[]>;
      correct: number;
      success: Record<Locale, string>;
      retry: Record<Locale, string>;
    };

export type Lesson = {
  slug: string;
  track: TrackId;
  order: number;
  duration: number; // minutes
  paywalled: boolean; // false → first lessons free
  title: Record<Locale, string>;
  intro: Record<Locale, string>;
  breadcrumb: Record<Locale, string>;
  eyebrow: Record<Locale, string>;
  blocks: Block[];
};
