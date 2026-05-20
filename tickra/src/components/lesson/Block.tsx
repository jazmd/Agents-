import { Info, AlertTriangle } from 'lucide-react';
import { CandleAnatomy } from './CandleAnatomy';
import { TradingViewEmbed } from './TradingViewEmbed';
import { LessonQuiz } from './LessonQuiz';
import type { Block, Locale } from '@/lib/lessons/types';
import type { Dictionary } from '@/lib/i18n/dictionaries';
import { cn } from '@/lib/cn';

type Props = {
  block: Block;
  locale: Locale;
  dict: Dictionary;
  slug: string;
};

export function BlockRenderer({ block, locale, dict, slug }: Props) {
  switch (block.kind) {
    case 'lede':
      return (
        <p className="font-display text-2xl font-medium leading-snug tracking-tight text-balance text-ink md:text-3xl">
          {block.text[locale]}
        </p>
      );
    case 'paragraph':
      return (
        <p className="max-w-3xl text-pretty text-[16.5px] leading-relaxed text-muted md:text-[17px]">
          {block.text[locale]}
        </p>
      );
    case 'heading':
      return (
        <h3 className="font-display text-2xl font-medium tracking-tight text-balance text-ink md:text-3xl">
          {block.text[locale]}
        </h3>
      );
    case 'list':
      return block.ordered ? (
        <ol className="max-w-3xl space-y-3.5 text-[15.5px] leading-relaxed text-muted">
          {block.items[locale].map((item, i) => (
            <li key={i} className="flex items-start gap-4">
              <span
                aria-hidden
                className="mt-0.5 inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border border-ink font-mono text-[10px] tracking-[0.1em] text-ink"
              >
                {String(i + 1).padStart(2, '0')}
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ol>
      ) : (
        <ul className="max-w-3xl space-y-3 text-[15.5px] leading-relaxed text-muted">
          {block.items[locale].map((item, i) => (
            <li key={i} className="flex items-start gap-3">
              <span aria-hidden className="mt-2.5 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-ink" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      );
    case 'callout': {
      const Icon = block.tone === 'warn' ? AlertTriangle : Info;
      return (
        <aside
          role="note"
          className={cn(
            'flex max-w-3xl items-start gap-4 rounded-sm border p-5 md:p-6',
            block.tone === 'warn'
              ? 'border-down/40 bg-down/5'
              : 'border-line bg-elevated',
          )}
        >
          <Icon
            aria-hidden
            className={cn('mt-0.5 h-5 w-5 flex-shrink-0', block.tone === 'warn' ? 'text-down' : 'text-ink')}
            strokeWidth={1.6}
          />
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
              {block.title[locale]}
            </p>
            <p className="mt-2 text-[15.5px] leading-relaxed text-ink">{block.text[locale]}</p>
          </div>
        </aside>
      );
    }
    case 'anatomy':
      return <CandleAnatomy labels={dict.lesson.anatomy.labels} />;
    case 'chart':
      return <TradingViewEmbed locale={locale} />;
    case 'quiz':
      return (
        <LessonQuiz
          title={dict.lesson.quiz.title}
          question={block.question[locale]}
          choices={block.choices[locale]}
          correct={block.correct}
          successMessage={block.success[locale]}
          retryMessage={block.retry[locale]}
          locale={locale}
          slug={slug}
        />
      );
  }
}

BlockRenderer.displayName = 'BlockRenderer';
