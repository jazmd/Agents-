'use client';

import { useState, useTransition } from 'react';
import { Bookmark, BookmarkCheck } from 'lucide-react';
import { toggleBookmark } from '@/app/[locale]/lesson/bookmark-actions';
import { cn } from '@/lib/cn';

type Props = {
  slug: string;
  locale: string;
  initialSaved: boolean;
  addLabel: string;
  addedLabel: string;
};

export function BookmarkToggle({ slug, locale, initialSaved, addLabel, addedLabel }: Props) {
  const [saved, setSaved] = useState(initialSaved);
  const [, start] = useTransition();

  function submit() {
    const next = !saved;
    setSaved(next); // optimistic
    const fd = new FormData();
    fd.set('slug', slug);
    fd.set('locale', locale);
    start(async () => {
      const res = await toggleBookmark(fd);
      if (res && 'saved' in res) setSaved(res.saved as boolean);
    });
  }

  return (
    <button
      type="button"
      onClick={submit}
      aria-pressed={saved}
      className={cn(
        'inline-flex h-9 items-center gap-2 rounded-full border px-3 text-[12px] font-medium tracking-tight transition-colors',
        saved
          ? 'border-ink bg-ink text-canvas'
          : 'border-line text-muted hover:border-ink hover:text-ink',
      )}
    >
      {saved ? (
        <BookmarkCheck className="h-3.5 w-3.5" strokeWidth={1.6} aria-hidden />
      ) : (
        <Bookmark className="h-3.5 w-3.5" strokeWidth={1.6} aria-hidden />
      )}
      {saved ? addedLabel : addLabel}
    </button>
  );
}
