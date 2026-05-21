'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowUpRight, Command, Search, X } from 'lucide-react';
import { useFocusTrap } from '@/lib/useFocusTrap';

type Hit = {
  slug: string;
  trackTitle: string;
  title: string;
  excerpt: string;
};

type Labels = {
  placeholder: string;
  empty: string;
  hint: string;
};

export function CommandPalette({ locale, labels }: { locale: string; labels: Labels }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<Hit[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, open);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((s) => !s);
      } else if (e.key === 'Escape' && open) {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 30);
    else {
      setQuery('');
      setHits([]);
      setActiveIndex(0);
    }
  }, [open]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setHits([]);
      return;
    }
    const handle = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&locale=${locale}`);
        const data = (await res.json()) as { hits: Hit[] };
        setHits(data.hits.slice(0, 8));
        setActiveIndex(0);
      } catch {
        setHits([]);
      }
    }, 140);
    return () => clearTimeout(handle);
  }, [query, locale]);

  function go(slug: string) {
    router.push(`/${locale}/lesson/${slug}`);
    setOpen(false);
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(hits.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(0, i - 1));
    } else if (e.key === 'Enter' && hits[activeIndex]) {
      e.preventDefault();
      go(hits[activeIndex].slug);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open search"
        className="inline-flex h-9 items-center gap-2 rounded-full border border-line px-3 text-[12px] text-muted transition-colors hover:border-ink hover:text-ink"
      >
        <Search aria-hidden className="h-3.5 w-3.5" strokeWidth={1.6} />
        <span className="hidden sm:inline">{labels.hint}</span>
        <kbd className="hidden font-mono text-[10px] uppercase tracking-[0.15em] text-subtle sm:inline">⌘K</kbd>
      </button>
    );
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Search"
      className="fixed inset-0 z-50 flex items-start justify-center bg-ink/40 px-4 pt-24 backdrop-blur-sm"
      onClick={() => setOpen(false)}
    >
      <div
        ref={dialogRef}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl overflow-hidden rounded-sm border border-ink bg-canvas shadow-[0_2px_0_0_rgba(10,10,12,0.6)]"
      >
        <header className="flex items-center gap-3 border-b border-line px-4 py-3">
          <Search aria-hidden className="h-4 w-4 text-muted" strokeWidth={1.6} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKey}
            placeholder={labels.placeholder}
            className="h-10 flex-1 bg-transparent text-[16px] text-ink placeholder:text-subtle focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close"
            className="inline-flex h-7 w-7 items-center justify-center rounded-full text-muted hover:bg-elevated hover:text-ink"
          >
            <X aria-hidden className="h-3.5 w-3.5" strokeWidth={1.75} />
          </button>
        </header>

        <div className="max-h-[420px] overflow-y-auto">
          {hits.length === 0 ? (
            <p className="px-5 py-10 text-center text-[14px] text-muted">{labels.empty}</p>
          ) : (
            <ul>
              {hits.map((hit, i) => (
                <li key={hit.slug}>
                  <Link
                    href={`/${locale}/lesson/${hit.slug}`}
                    onClick={() => setOpen(false)}
                    onMouseEnter={() => setActiveIndex(i)}
                    className={`flex items-start gap-3 px-4 py-3 ${
                      i === activeIndex ? 'bg-elevated' : ''
                    }`}
                  >
                    <div className="flex-1">
                      <p className="font-display text-[15.5px] tracking-tight text-ink">{hit.title}</p>
                      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
                        {hit.trackTitle}
                      </p>
                    </div>
                    <ArrowUpRight aria-hidden className="mt-0.5 h-4 w-4 text-muted" strokeWidth={1.5} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <footer className="flex items-center justify-between border-t border-line px-4 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-subtle">
          <span className="inline-flex items-center gap-1.5">
            <Command aria-hidden className="h-3 w-3" strokeWidth={1.6} /> K
          </span>
          <span>↑ ↓ · enter</span>
        </footer>
      </div>
    </div>
  );
}
