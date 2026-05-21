'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { createJournalEntry } from '@/app/[locale]/journal/actions';

type Labels = {
  new: string;
  fields: {
    symbol: string;
    symbolPlaceholder: string;
    setup: string;
    setupPlaceholder: string;
    thesis: string;
    thesisPlaceholder: string;
    invalidation: string;
    invalidationPlaceholder: string;
    target: string;
    targetPlaceholder: string;
    emotion: string;
    submit: string;
    cancel: string;
  };
  emotions: Record<'calm' | 'fomo' | 'revenge' | 'tired' | 'other', string>;
};

export function JournalForm({ locale, labels }: { locale: string; labels: Labels }) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-12 items-center gap-2 rounded-full bg-ink px-5 text-[15px] font-medium tracking-tight text-canvas hover:bg-ink/90"
      >
        <Plus aria-hidden className="h-4 w-4" strokeWidth={1.75} />
        {labels.new}
      </button>
    );
  }

  return (
    <form
      action={createJournalEntry}
      className="space-y-5 rounded-sm border border-line bg-surface p-6 md:p-10"
      aria-label={labels.new}
    >
      <input type="hidden" name="locale" value={locale} />

      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="symbol" name="symbol" label={labels.fields.symbol} placeholder={labels.fields.symbolPlaceholder} />
        <Field id="setup" name="setup" label={labels.fields.setup} placeholder={labels.fields.setupPlaceholder} />
      </div>

      <div>
        <label htmlFor="thesis" className="mb-2 block font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
          {labels.fields.thesis}
        </label>
        <textarea
          id="thesis"
          name="thesis"
          required
          rows={3}
          placeholder={labels.fields.thesisPlaceholder}
          className="block w-full resize-none rounded-sm border border-line bg-canvas px-4 py-3 text-[15px] text-ink placeholder:text-subtle focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/15"
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="invalidation" name="invalidation" label={labels.fields.invalidation} placeholder={labels.fields.invalidationPlaceholder} />
        <Field id="target" name="target" label={labels.fields.target} placeholder={labels.fields.targetPlaceholder} />
      </div>

      <div>
        <label htmlFor="emotion" className="mb-2 block font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
          {labels.fields.emotion}
        </label>
        <select
          id="emotion"
          name="emotion"
          defaultValue="calm"
          className="h-12 w-full rounded-sm border border-line bg-canvas px-4 text-[15px] text-ink focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/15"
        >
          {(['calm', 'fomo', 'revenge', 'tired', 'other'] as const).map((k) => (
            <option key={k} value={k}>
              {labels.emotions[k]}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          className="inline-flex h-12 items-center gap-2 rounded-full bg-ink px-6 text-[15px] font-medium tracking-tight text-canvas hover:bg-ink/90"
        >
          {labels.fields.submit}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="inline-flex h-12 items-center gap-2 rounded-full border border-line px-5 text-[14px] font-medium tracking-tight text-ink hover:border-ink"
        >
          <X aria-hidden className="h-4 w-4" strokeWidth={1.6} />
          {labels.fields.cancel}
        </button>
      </div>
    </form>
  );
}

type FieldProps = { id: string; name: string; label: string; placeholder?: string };

function Field({ id, name, label, placeholder }: FieldProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type="text"
        placeholder={placeholder}
        className="h-12 w-full rounded-sm border border-line bg-canvas px-4 text-[15px] text-ink placeholder:text-subtle focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/15"
      />
    </div>
  );
}
