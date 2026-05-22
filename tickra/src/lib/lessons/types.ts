export type Locale = 'en' | 'fr';

export type TrackId =
  | 'foundations'
  | 'structure'
  | 'patterns'
  | 'risk'
  | 'execution'
  | 'indicators'
  | 'psychology'
  | 'assets'
  | 'strategy';

export type LessonLevel = 'novice' | 'intermediate' | 'advanced';
export type LessonTier = 'free' | 'pro' | 'max';

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
  | { kind: 'anatomy' }
  | { kind: 'chart' }
  | {
      kind: 'quiz';
      question: Record<Locale, string>;
      choices: Record<Locale, string[]>;
      correct: number;
      success: Record<Locale, string>;
      retry: Record<Locale, string>;
    }
  | {
      kind: 'multi';
      question: Record<Locale, string>;
      choices: Record<Locale, string[]>;
      correct: number[];
      success: Record<Locale, string>;
      retry: Record<Locale, string>;
    }
  | {
      kind: 'match';
      question: Record<Locale, string>;
      pairs: Record<Locale, { term: string; definition: string }[]>;
      success: Record<Locale, string>;
      retry: Record<Locale, string>;
    }
  | {
      kind: 'order';
      question: Record<Locale, string>;
      items: Record<Locale, string[]>;
      success: Record<Locale, string>;
      retry: Record<Locale, string>;
    };

export type Lesson = {
  slug: string;
  track: TrackId;
  order: number;
  duration: number;
  /** @deprecated kept for backwards-compat; tier is the source of truth */
  paywalled: boolean;
  level: LessonLevel;
  tier: LessonTier;
  title: Record<Locale, string>;
  intro: Record<Locale, string>;
  breadcrumb: Record<Locale, string>;
  eyebrow: Record<Locale, string>;
  blocks: Block[];
};

export type InteractiveKind = 'quiz' | 'multi' | 'match' | 'order';
export const INTERACTIVE_KINDS: ReadonlyArray<InteractiveKind> = ['quiz', 'multi', 'match', 'order'];

export function isInteractive(b: Block): b is Extract<Block, { kind: InteractiveKind }> {
  return (INTERACTIVE_KINDS as readonly string[]).includes(b.kind);
}

export function lessonInteractiveCount(blocks: Block[]): number {
  return blocks.filter(isInteractive).length;
}
