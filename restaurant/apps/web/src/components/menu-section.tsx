'use client';

import { useLocale } from 'next-intl';
import type { Category, Product } from '@bykebap/menu';
import type { AppLocale } from '@bykebap/i18n';
import { ProductCard } from './product-card';

export function MenuSection({
  category,
  products,
}: {
  category: Category;
  products: Product[];
}) {
  const locale = useLocale() as AppLocale;
  return (
    <section id={`cat-${category.id}`} className="scroll-mt-32 py-10">
      <header className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-brand-500">
            <span aria-hidden className="mr-1.5">{category.icon}</span>
            {category.name[locale] ?? category.name.de}
          </p>
          <h2 className="font-display text-3xl font-bold text-charcoal-900 md:text-4xl">
            {category.name[locale] ?? category.name.de}
          </h2>
          <p className="mt-1 max-w-xl text-sm text-charcoal-500">
            {category.tagline[locale] ?? category.tagline.de}
          </p>
        </div>
        <span className="hidden text-xs font-semibold uppercase tracking-wider text-charcoal-300 sm:inline">
          {products.length} {products.length === 1 ? 'item' : 'items'}
        </span>
      </header>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}
