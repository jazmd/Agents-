'use client';

import { useState, useTransition } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { saveLessonNote } from '@/app/[locale]/lesson/bookmark-actions';

type Props = {
  slug: string;
  locale: string;
  initialBody: string;
  label: string;
  placeholder: string;
  saveLabel: string;
  savedLabel: string;
};

export function Notes({ slug, locale, initialBody, label, placeholder, saveLabel, savedLabel }: Props) {
  const [body, setBody] = useState(initialBody);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [pending, start] = useTransition();

  function submit() {
    const fd = new FormData();
    fd.set('slug', slug);
    fd.set('locale', locale);
    fd.set('body', body);
    start(async () => {
      const res = await saveLessonNote(fd);
      if (res?.ok) setSavedAt(Date.now());
    });
  }

  const justSaved = savedAt !== null && Date.now() - savedAt < 4000;

  return (
    <section aria-labelledby="notes-title" className="rounded-sm border border-line bg-surface p-6 md:p-8">
      <label htmlFor="lesson-notes" className="block">
        <span id="notes-title" className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
          {label}
        </span>
      </label>
      <textarea
        id="lesson-notes"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={5}
        placeholder={placeholder}
        className="mt-4 block w-full resize-none rounded-sm border border-line bg-canvas px-4 py-3 text-[14.5px] text-ink placeholder:text-subtle focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/15"
      />
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={submit}
          disabled={pending}
          className="inline-flex h-10 items-center gap-2 rounded-full bg-ink px-4 text-[13.5px] font-medium tracking-tight text-canvas hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? <Loader2 aria-hidden className="h-3.5 w-3.5 animate-spin" strokeWidth={1.75} /> : null}
          {saveLabel}
        </button>
        {justSaved ? (
          <span className="inline-flex items-center gap-1.5 text-[12.5px] text-up">
            <Check aria-hidden className="h-3.5 w-3.5" strokeWidth={2} />
            {savedLabel}
          </span>
        ) : null}
      </div>
    </section>
  );
}
