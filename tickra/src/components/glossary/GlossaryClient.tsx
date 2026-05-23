'use client';

import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';

type Entry = {
  slug: string;
  term: string;
  definition: string;
  category: string;
  categoryLabel: string;
};

type Props = { entries: Entry[]; placeholder: string; emptyMessage: string };

export function GlossaryClient({ entries, placeholder, emptyMessage }: Props) {
  const [q, setQ] = useState('');

  const groups = useMemo(() => {
    const filtered = q.trim()
      ? entries.filter((e) => {
          const needle = q.toLowerCase();
          return e.term.toLowerCase().includes(needle) || e.definition.toLowerCase().includes(needle);
        })
      : entries;
    const map = new Map<string, Entry[]>();
    for (const entry of filtered) {
      const letter = entry.term.charAt(0).toUpperCase();
      const bucket = map.get(letter) ?? [];
      bucket.push(entry);
      map.set(letter, bucket);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [entries, q]);

  return (
    <div>
      <label className="relative block max-w-xl">
        <Search aria-hidden className="pointer-events-none absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" strokeWidth={1.6} />
        <input
          type="search"
          placeholder={placeholder}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="h-12 w-full rounded-full border border-line bg-canvas pl-12 pr-4 text-[15px] text-ink placeholder:text-subtle focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/15"
        />
      </label>

      {groups.length === 0 ? (
        <p className="mt-10 text-[15px] text-muted">{emptyMessage}</p>
      ) : (
        <div className="mt-10 space-y-12">
          {groups.map(([letter, items]) => (
            <section key={letter} id={`letter-${letter}`}>
              <h2 className="font-display text-3xl font-medium tracking-tight text-ink">{letter}</h2>
              <dl className="mt-6 divide-y divide-line border-y border-line">
                {items.map((e) => (
                  <div key={e.slug} className="grid grid-cols-12 gap-x-6 gap-y-2 py-5 md:py-6" id={`term-${e.slug}`}>
                    <dt className="col-span-12 md:col-span-4">
                      <span className="font-display text-lg font-medium tracking-tight text-ink md:text-xl">
                        {e.term}
                      </span>
                      <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.22em] text-subtle">
                        {e.categoryLabel}
                      </p>
                    </dt>
                    <dd className="col-span-12 max-w-2xl text-pretty text-[15px] leading-relaxed text-muted md:col-span-8">
                      {e.definition}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
