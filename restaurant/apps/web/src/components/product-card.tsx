'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Plus, Flame, Leaf, Sparkles, Check } from 'lucide-react';
import type { Product } from '@bykebap/menu';
import { formatPrice } from '@bykebap/menu';
import type { AppLocale } from '@bykebap/i18n';
import { useCart } from '@/lib/cart-store';
import { cn } from '@/lib/cn';

export function ProductCard({ product }: { product: Product }) {
  const locale = useLocale() as AppLocale;
  const t = useTranslations('menu');
  const add = useCart((s) => s.add);
  const [justAdded, setJustAdded] = useState(false);

  function handleAdd() {
    add({
      productId: product.id,
      name: product.name[locale] ?? product.name.de,
      unitCents: product.priceCents,
    });
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1400);
  }

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-charcoal-100/40 bg-cream-50 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-soft">
      {/* Decorative top */}
      <div className="relative h-32 overflow-hidden bg-gradient-to-br from-brand-50 via-cream-200 to-accent-100">
        <div className="absolute inset-0 bg-grain opacity-30 mix-blend-multiply" />
        <div className="absolute right-3 top-3 flex flex-col gap-1.5">
          {product.popular && (
            <span className="chip bg-accent-400/90 text-charcoal-900 shadow-card">
              <Sparkles className="h-3 w-3" /> {t('badge.popular')}
            </span>
          )}
          {product.spicy && (
            <span className="chip bg-brand-500/90 text-cream-50 shadow-card">
              <Flame className="h-3 w-3" /> {t('badge.spicy')}
            </span>
          )}
          {product.vegan && (
            <span className="chip bg-emerald-500/90 text-cream-50 shadow-card">
              <Leaf className="h-3 w-3" /> {t('badge.vegan')}
            </span>
          )}
          {!product.vegan && product.vegetarian && (
            <span className="chip bg-emerald-400/90 text-charcoal-900 shadow-card">
              <Leaf className="h-3 w-3" /> {t('badge.vegetarian')}
            </span>
          )}
        </div>
        <div
          className="absolute inset-0 grid place-items-center text-[5rem] opacity-90 transition-transform duration-500 group-hover:scale-110"
          aria-hidden
        >
          {emojiFor(product)}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div>
          <h3 className="font-display text-lg font-bold leading-snug text-charcoal-900">
            {product.name[locale] ?? product.name.de}
          </h3>
          <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-charcoal-500">
            {product.description[locale] ?? product.description.de}
          </p>
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 pt-2">
          <span className="font-display text-xl font-bold text-charcoal-900 tabular-nums">
            {formatPrice(product.priceCents, locale)}
          </span>
          <button
            type="button"
            onClick={handleAdd}
            aria-label={t('addToCart')}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-all',
              justAdded
                ? 'bg-emerald-500 text-cream-50 shadow-card'
                : 'bg-charcoal-900 text-cream-50 hover:bg-brand-500 hover:shadow-glow active:scale-95',
            )}
          >
            {justAdded ? (
              <>
                <Check className="h-4 w-4" />
                {t('added')}
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                {t('addToCart')}
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  );
}

function emojiFor(product: Product): string {
  switch (product.categoryId) {
    case 'doener':
      return '🥙';
    case 'duerum':
      return '🌯';
    case 'lahmacun':
      return '🫓';
    case 'pide':
      return '🛶';
    case 'pizza':
      return '🍕';
    case 'burger':
      return '🍔';
    case 'beilagen':
      return product.id.includes('wings') ? '🍗' : '🍟';
    case 'salate':
      return '🥗';
    case 'suesses':
      return '🍰';
    case 'getraenke':
      if (product.id === 'drink-cay' || product.id === 'drink-kahve') return '☕';
      if (product.id === 'drink-ayran') return '🥛';
      if (product.id === 'drink-wasser') return '💧';
      return '🥤';
    default:
      return '🍽️';
  }
}
