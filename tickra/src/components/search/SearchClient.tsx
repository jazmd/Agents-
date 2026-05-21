'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowUpRight, Loader2, Search } from 'lucide-react';

type Hit = {
  slug: string;
  trackId: string;
  title: string;
  trackTitle: string;
  excerpt: string;
  score: number;
};

type Props = {
  locale: string;
  placeholder: string;
  promptEmpty: string;
  emptyMessage: string;
  resultLabel: string;
  resultsLabel: string;
};

export function SearchClient({
  locale,
  placeholder,
  promptEmpty,
  emptyMessage,
  resultLabel,
  resultsLabel,
}: Props) {
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<Hit[] | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setHits(null);
      return;
    }
    setPending(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&locale=${locale}`);
        const data = (await res.json()) as { hits: Hit[] };
        setHits(data.hits);
      } catch {
        setHits([]);
      } finally {
        setPending(false);
      }
    }, 180);
    return () => clearTimeout(t);
  }, [query, locale]);

  return (
    <div>
      <label className="relative block">
        <Search
          aria-hidden
          className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted"
          strokeWidth={1.6}
        />
        <input
          type="search"
          autoFocus
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-14 w-full rounded-full border border-line bg-canvas pl-14 pr-14 text-[17px] text-ink placeholder:text-subtle focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/15"
        />
        {pending ? (
          <Loader2
            aria-hidden
            className="absolute right-5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted"
            strokeWidth={1.6}
          />
        ) : null}
      </label>

      <div className="mt-8">
        {hits === null ? (
          <p className="text-[14px] text-muted">{promptEmpty}</p>
        ) : hits.length === 0 ? (
          <p className="text-[14px] text-muted">{emptyMessage}</p>
        ) : (
          <>
            <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
              {hits.length} {hits.length === 1 ? resultLabel : resultsLabel}
            </p>
            <ul className="divide-y divide-line border-y border-line">
              {hits.map((hit) => (
                <li key={hit.slug}>
                  <Link
                    href={`/${locale}/lesson/${hit.slug}`}
                    className="group flex flex-col gap-2 py-5"
                  >
                    <div className="flex items-baseline justify-between gap-4">
                      <h3 className="font-display text-lg font-medium tracking-tight text-ink md:text-xl">
                        {hit.title}
                      </h3>
                      <ArrowUpRight
                        aria-hidden
                        className="h-4 w-4 flex-shrink-0 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-ink"
                        strokeWidth={1.5}
                      />
                    </div>
                    <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
                      {hit.trackTitle}
                    </p>
                    <p className="max-w-3xl text-[14px] text-muted">{hit.excerpt}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
