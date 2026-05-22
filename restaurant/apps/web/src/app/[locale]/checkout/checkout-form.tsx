'use client';

import { useState, useTransition } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Truck, Store, CreditCard, Banknote, CheckCircle2 } from 'lucide-react';
import { Link, useRouter } from '@/i18n/routing';
import { useCart, deliveryFor } from '@/lib/cart-store';
import { formatEUR } from '@/lib/format';
import { placeOrder } from '@/lib/actions/orders';
import { cn } from '@/lib/cn';

type Method = 'DELIVERY' | 'PICKUP';
type Pay = 'CASH' | 'CARD';

export function CheckoutForm({
  defaultName,
  defaultEmail,
  defaultPhone,
}: {
  defaultName: string;
  defaultEmail: string;
  defaultPhone: string;
}) {
  const t = useTranslations('checkout');
  const tC = useTranslations('cart');
  const locale = useLocale();
  const router = useRouter();
  const items = useCart((s) => s.items);
  const subtotalCents = useCart((s) => s.subtotalCents());
  const clearCart = useCart((s) => s.clear);

  const [method, setMethod] = useState<Method>('DELIVERY');
  const [pay, setPay] = useState<Pay>('CASH');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const localeForMoney =
    locale === 'de' ? 'de-DE' : locale === 'ru' ? 'ru-RU' : locale === 'tr' ? 'tr-TR' : 'en-DE';
  const deliveryCents = deliveryFor(subtotalCents, method);
  const totalCents = subtotalCents + deliveryCents;

  if (items.length === 0 && !success) {
    return (
      <div className="container-page py-20 text-center">
        <p className="text-charcoal-500">{tC('empty')}</p>
        <Link href="/menu" className="btn-primary mt-6 inline-flex">
          {tC('emptyCta')}
        </Link>
      </div>
    );
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const f = e.currentTarget;
    const fd = new FormData(f);
    const input = {
      method,
      paymentMethod: pay,
      customerName: String(fd.get('name') || ''),
      customerPhone: String(fd.get('phone') || ''),
      customerEmail: String(fd.get('email') || ''),
      street: String(fd.get('street') || ''),
      zip: String(fd.get('zip') || ''),
      city: String(fd.get('city') || ''),
      note: String(fd.get('note') || ''),
      items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
    };

    startTransition(async () => {
      const r = await placeOrder(input);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      setSuccess(r.publicId);
      clearCart();
    });
  }

  if (success) {
    return (
      <div className="container-page py-20">
        <div className="mx-auto max-w-md rounded-3xl border border-emerald-200 bg-emerald-50 p-10 text-center shadow-card animate-scale-in">
          <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-600" strokeWidth={1.5} />
          <h1 className="mt-5 font-display text-3xl font-bold text-emerald-900">
            {t('success')}
          </h1>
          <p className="mt-3 text-sm text-emerald-800">{t('successText')}</p>
          <div className="mt-6 inline-flex flex-col items-center gap-1 rounded-2xl bg-cream-50 px-6 py-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-charcoal-500">
              Bestell-Nr.
            </span>
            <span className="font-display text-xl font-bold tabular-nums">{success}</span>
          </div>
          <div className="mt-8 flex justify-center gap-3">
            <Link href="/menu" className="btn-outline">
              {tC('emptyCta')}
            </Link>
            <button
              type="button"
              onClick={() => router.push('/account')}
              className="btn-primary"
            >
              Konto
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-page py-12 md:py-16">
      <h1 className="font-display text-4xl font-bold text-charcoal-900 md:text-5xl">{t('title')}</h1>

      <form onSubmit={onSubmit} className="mt-10 grid gap-8 lg:grid-cols-[1fr_400px]">
        <div className="space-y-8">
          {/* Method */}
          <section className="rounded-3xl border border-charcoal-100/60 bg-cream-50 p-6 shadow-card">
            <h2 className="mb-4 font-display text-xl font-bold">{t('deliveryMethod')}</h2>
            <div className="grid grid-cols-2 gap-3">
              <MethodCard
                active={method === 'DELIVERY'}
                onSelect={() => setMethod('DELIVERY')}
                icon={<Truck className="h-5 w-5" />}
                title={t('delivery')}
                note={t('deliveryNote')}
              />
              <MethodCard
                active={method === 'PICKUP'}
                onSelect={() => setMethod('PICKUP')}
                icon={<Store className="h-5 w-5" />}
                title={t('pickup')}
                note={t('pickupNote')}
              />
            </div>
          </section>

          {/* Contact */}
          <section className="rounded-3xl border border-charcoal-100/60 bg-cream-50 p-6 shadow-card">
            <h2 className="mb-4 font-display text-xl font-bold">{t('contact')}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t('name')} name="name" required defaultValue={defaultName} />
              <Field label={t('phone')} name="phone" type="tel" required defaultValue={defaultPhone} />
              <div className="sm:col-span-2">
                <Field label={t('email')} name="email" type="email" defaultValue={defaultEmail} />
              </div>
            </div>
          </section>

          {/* Address (only DELIVERY) */}
          {method === 'DELIVERY' && (
            <section className="rounded-3xl border border-charcoal-100/60 bg-cream-50 p-6 shadow-card animate-fade-in">
              <h2 className="mb-4 font-display text-xl font-bold">{t('address')}</h2>
              <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
                <Field label={t('street')} name="street" required />
                <Field label={t('zip')} name="zip" required />
                <div className="sm:col-span-2">
                  <Field label={t('city')} name="city" required defaultValue="Paderborn" />
                </div>
              </div>
              <label className="mt-4 block">
                <span className="label">{t('note')}</span>
                <textarea
                  name="note"
                  rows={3}
                  className="field"
                  placeholder={t('notePlaceholder')}
                />
              </label>
            </section>
          )}

          {/* Payment */}
          <section className="rounded-3xl border border-charcoal-100/60 bg-cream-50 p-6 shadow-card">
            <h2 className="mb-4 font-display text-xl font-bold">{t('payment')}</h2>
            <div className="grid grid-cols-2 gap-3">
              <MethodCard
                active={pay === 'CASH'}
                onSelect={() => setPay('CASH')}
                icon={<Banknote className="h-5 w-5" />}
                title={t('paymentCash')}
              />
              <MethodCard
                active={pay === 'CARD'}
                onSelect={() => setPay('CARD')}
                icon={<CreditCard className="h-5 w-5" />}
                title={t('paymentCard')}
              />
            </div>
          </section>
        </div>

        {/* Summary */}
        <aside className="self-start rounded-3xl border border-charcoal-100/60 bg-cream-50 p-6 shadow-card lg:sticky lg:top-24">
          <h2 className="mb-4 font-display text-xl font-bold">{tC('title')}</h2>
          <ul className="space-y-2 text-sm">
            {items.map((i) => (
              <li key={i.productId} className="flex justify-between gap-3">
                <span className="min-w-0 truncate text-charcoal-700">
                  {i.quantity} × {i.name}
                </span>
                <span className="font-semibold tabular-nums">
                  {formatEUR(i.unitCents * i.quantity, localeForMoney)}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-4 space-y-2 border-t border-charcoal-100 pt-4 text-sm">
            <div className="flex justify-between">
              <span className="text-charcoal-500">{tC('subtotal')}</span>
              <span className="font-semibold tabular-nums">{formatEUR(subtotalCents, localeForMoney)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-charcoal-500">{tC('delivery')}</span>
              <span className="font-semibold tabular-nums">
                {deliveryCents === 0 ? '— 0 €' : formatEUR(deliveryCents, localeForMoney)}
              </span>
            </div>
            <div className="flex items-end justify-between gap-3 border-t border-charcoal-100 pt-3">
              <span className="text-charcoal-700">{tC('total')}</span>
              <span className="font-display text-2xl font-bold tabular-nums">
                {formatEUR(totalCents, localeForMoney)}
              </span>
            </div>
          </div>

          {error && (
            <p className="mt-4 rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-700">{error}</p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="btn-primary mt-6 w-full disabled:opacity-60"
          >
            {pending ? '…' : t('submit')}
          </button>
        </aside>
      </form>
    </div>
  );
}

function Field({
  label,
  name,
  type = 'text',
  required = false,
  defaultValue,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  defaultValue?: string;
}) {
  return (
    <label className="block">
      <span className="label">
        {label} {required && <span className="text-brand-500">*</span>}
      </span>
      <input
        type={type}
        name={name}
        required={required}
        defaultValue={defaultValue}
        className="field"
      />
    </label>
  );
}

function MethodCard({
  active,
  onSelect,
  icon,
  title,
  note,
}: {
  active: boolean;
  onSelect: () => void;
  icon: React.ReactNode;
  title: string;
  note?: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'flex flex-col items-start gap-2 rounded-2xl border-2 p-4 text-left transition',
        active
          ? 'border-brand-500 bg-brand-50 shadow-glow'
          : 'border-charcoal-100 bg-cream-50 hover:border-charcoal-300',
      )}
    >
      <div
        className={cn(
          'grid h-10 w-10 place-items-center rounded-xl',
          active ? 'bg-brand-500 text-cream-50' : 'bg-cream-200 text-charcoal-700',
        )}
      >
        {icon}
      </div>
      <div className="font-display text-base font-bold text-charcoal-900">{title}</div>
      {note && <div className="text-xs text-charcoal-500">{note}</div>}
    </button>
  );
}
