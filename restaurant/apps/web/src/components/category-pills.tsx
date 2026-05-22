'use client';

import { useLocale } from 'next-intl';
import { useEffect, useState } from 'react';
import type { Category } from '@bykebap/menu';
import type { AppLocale } from '@bykebap/i18n';
import { cn } from '@/lib/cn';

export function CategoryPills({ categories }: { categories: Category[] }) {
  const locale = useLocale() as AppLocale;
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const sections = categories
      .map((c) => document.getElementById(`cat-${c.id}`))
      .filter((el): el is HTMLElement => !!el);

    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActive(visible.target.id.replace('cat-', ''));
      },
      { rootMargin: '-30% 0px -55% 0px' },
    );

    sections.forEach((s) => obs.observe(s));
    return () => obs.disconnect();
  }, [categories]);

  function scrollTo(id: string) {
    const el = document.getElementById(`cat-${id}`);
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  }

  return (
    <div className="sticky top-16 z-30 -mx-4 border-b border-charcoal-100/40 bg-cream-100/95 px-4 backdrop-blur md:top-20">
      <nav className="container-page flex gap-2 overflow-x-auto py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => scrollTo(cat.id)}
            className={cn(
              'inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition',
              active === cat.id
                ? 'border-brand-500 bg-brand-500 text-cream-50 shadow-glow'
                : 'border-charcoal-100 bg-cream-50 text-charcoal-700 hover:border-brand-300',
            )}
          >
            <span aria-hidden>{cat.icon}</span>
            <span>{cat.name[locale] ?? cat.name.de}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
