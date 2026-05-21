'use client';

import { useTransition } from 'react';
import { Loader2 } from 'lucide-react';
import { gradeReview } from '@/app/[locale]/lesson/actions';
import { cn } from '@/lib/cn';

type Labels = { again: string; hard: string; good: string; easy: string };
type Props = { slug: string; locale: string; labels: Labels };

const GRADES: { key: keyof Labels; value: number; tone: 'down' | 'neutral' | 'ink' | 'up' }[] = [
  { key: 'again', value: 1, tone: 'down' },
  { key: 'hard', value: 3, tone: 'neutral' },
  { key: 'good', value: 4, tone: 'ink' },
  { key: 'easy', value: 5, tone: 'up' },
];

export function GradeButtons({ slug, locale, labels }: Props) {
  const [pending, start] = useTransition();

  function submit(value: number) {
    if (pending) return;
    const fd = new FormData();
    fd.set('slug', slug);
    fd.set('locale', locale);
    fd.set('grade', String(value));
    start(async () => {
      await gradeReview(fd);
    });
  }

  return (
    <div className="flex w-full flex-wrap gap-2">
      {GRADES.map((g) => (
        <button
          key={g.key}
          type="button"
          onClick={() => submit(g.value)}
          disabled={pending}
          className={cn(
            'inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-full border px-3 text-[13px] font-medium tracking-tight transition-colors disabled:cursor-not-allowed disabled:opacity-60',
            g.tone === 'down' && 'border-down/40 text-down hover:border-down hover:bg-down hover:text-canvas',
            g.tone === 'neutral' && 'border-line text-muted hover:border-ink hover:text-ink',
            g.tone === 'ink' && 'border-ink bg-ink text-canvas hover:bg-ink/90',
            g.tone === 'up' && 'border-up/40 text-up hover:border-up hover:bg-up hover:text-canvas',
          )}
        >
          {pending ? <Loader2 aria-hidden className="h-3.5 w-3.5 animate-spin" strokeWidth={1.75} /> : null}
          {labels[g.key]}
        </button>
      ))}
    </div>
  );
}
