'use client';

import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { useCart, deliveryFor, FREE_DELIVERY_THRESHOLD_CENTS } from '@/lib/cart-store';
import { formatEUR } from '@/lib/format';

export function CartView() {
  const t = useTranslations('cart');
  const locale = useLocale();
  const items = useCart((s) => s.items);
  const remove = useCart((s) => s.remove);
  const setQuantity = useCart((s) => s.setQuantity);
  const subtotalCents = useCart((s) => s.subtotalCents());
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const localeForMoney = locale === 'de' ? 'de-DE' : locale === 'ru' ? 'ru-RU' : locale === 'tr' ? 'tr-TR' : 'en-DE';
  const deliveryCents = deliveryFor(subtotalCents, 'DELIVERY');
  const totalCents = subtotalCents + deliveryCents;
  const remainingForFree = Math.max(0, FREE_DELIVERY_THRESHOLD_CENTS - subtotalCents);

  if (mounted && items.length === 0) {
    return (
      <div className="container-page py-20">
        <div className="mx-auto max-w-md rounded-3xl border border-charcoal-100 bg-cream-50 p-10 text-center shadow-card">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-cream-200 text-charcoal-300">
            <ShoppingBag className="h-8 w-8" />
          </div>
          <h1 className="mt-6 font-display text-3xl font-bold text-charcoal-900">
            {t('title')}
          </h1>
          <p className="mt-2 text-sm text-charcoal-500">{t('empty')}</p>
          <Link href="/menu" className="btn-primary mt-8">
            {t('emptyCta')} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-page py-12 md:py-16">
      <h1 className="font-display text-4xl font-bold text-charcoal-900 md:text-5xl">{t('title')}</h1>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_400px]">
        <ul className="space-y-3">
          {items.map((item) => (
            <li
              key={item.productId}
              className="flex items-center gap-4 rounded-2xl border border-charcoal-100/60 bg-cream-50 p-4 shadow-card"
            >
              <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-cream-200 text-2xl">
                🥙
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-display text-lg font-bold text-charcoal-900">{item.name}</div>
                <div className="mt-0.5 text-sm text-charcoal-500 tabular-nums">
                  {formatEUR(item.unitCents, localeForMoney)} × {item.quantity}
                </div>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-cream-200 p-1">
                <button
                  type="button"
                  onClick={() => setQuantity(item.productId, item.quantity - 1)}
                  className="grid h-8 w-8 place-items-center rounded-full bg-cream-50 text-charcoal-700 transition hover:bg-brand-500 hover:text-cream-50"
                  aria-label="−"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="min-w-[2ch] text-center font-semibold tabular-nums">
                  {item.quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity(item.productId, item.quantity + 1)}
                  className="grid h-8 w-8 place-items-center rounded-full bg-cream-50 text-charcoal-700 transition hover:bg-brand-500 hover:text-cream-50"
                  aria-label="+"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="hidden w-24 text-right font-display text-lg font-bold tabular-nums sm:block">
                {formatEUR(item.unitCents * item.quantity, localeForMoney)}
              </div>
              <button
                type="button"
                onClick={() => remove(item.productId)}
                aria-label={t('remove')}
                className="grid h-9 w-9 place-items-center rounded-full text-charcoal-300 transition hover:bg-brand-50 hover:text-brand-600"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>

        <aside className="self-start rounded-3xl border border-charcoal-100/60 bg-cream-50 p-6 shadow-card lg:sticky lg:top-24">
          {remainingForFree > 0 ? (
            <div className="mb-5 rounded-2xl bg-accent-50 p-4 text-sm text-accent-700">
              <span className="font-semibold">
                {formatEUR(remainingForFree, localeForMoney)}
              </span>{' '}
              bis zur kostenlosen Lieferung.
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-accent-200">
                <div
                  className="h-full bg-accent-500 transition-all duration-500"
                  style={{
                    width: `${Math.min(100, (subtotalCents / FREE_DELIVERY_THRESHOLD_CENTS) * 100)}%`,
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="mb-5 rounded-2xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
              ✓ {t('freeFrom')}
            </div>
          )}

          <dl className="space-y-2 text-sm">
            <Row label={t('subtotal')} value={formatEUR(subtotalCents, localeForMoney)} />
            <Row
              label={t('delivery')}
              value={
                deliveryCents === 0 ? (
                  <span className="text-emerald-600">{t('freeFrom')}</span>
                ) : (
                  formatEUR(deliveryCents, localeForMoney)
                )
              }
            />
            <div className="my-3 border-t border-charcoal-100" />
            <Row
              label={<span className="text-base">{t('total')}</span>}
              value={
                <span className="font-display text-2xl font-bold tabular-nums">
                  {formatEUR(totalCents, localeForMoney)}
                </span>
              }
            />
          </dl>

          <Link href="/checkout" className="btn-primary mt-6 w-full">
            {t('checkout')} <ArrowRight className="h-4 w-4" />
          </Link>
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: React.ReactNode; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-charcoal-500">{label}</dt>
      <dd className="font-semibold text-charcoal-900 tabular-nums">{value}</dd>
    </div>
  );
}
