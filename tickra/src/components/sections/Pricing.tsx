'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { CheckoutCta } from '@/components/billing/CheckoutCta';
import { fadeUp } from '@/lib/motion';
import { cn } from '@/lib/cn';
import type { Dictionary } from '@/lib/i18n/dictionaries';
import type { Locale } from '@/lib/i18n/config';
import type { CheckoutPlan } from '@/lib/stripe';

type Cadence = 'monthly' | 'yearly';

const PLAN_MAP: Record<string, Record<Cadence, CheckoutPlan | null>> = {
  free: { monthly: null, yearly: null },
  pro: { monthly: 'pro_monthly', yearly: 'pro_yearly' },
  lifetime: { monthly: 'lifetime', yearly: 'lifetime' },
};

// 17% off the yearly equivalent. Pro: 14.99 × 12 = 179.88 → 149.
const YEARLY_PRICE_EUR: Record<string, { price: string; perMonth: string }> = {
  pro: { price: '149 €', perMonth: '12,42 € / mo' },
};

export function Pricing({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const t = dict.pricing;
  const b = dict.billing;
  const [cadence, setCadence] = useState<Cadence>('monthly');

  return (
    <section id="pricing" aria-labelledby="pricing-title" className="border-b border-line">
      <Container as="div" className="py-24 md:py-32">
        <div id="pricing-title">
          <SectionHeader eyebrow={t.eyebrow} title={t.title} body={t.body} align="between" />
        </div>

        <div className="mt-14 flex justify-center">
          <div
            role="tablist"
            aria-label="Billing cadence"
            className="inline-flex items-center rounded-full border border-line bg-surface p-1"
          >
            {(['monthly', 'yearly'] as const).map((c) => {
              const active = cadence === c;
              return (
                <button
                  key={c}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setCadence(c)}
                  className={cn(
                    'inline-flex h-9 items-center gap-2 rounded-full px-4 text-[13px] font-medium tracking-tight transition-colors',
                    active ? 'bg-ink text-canvas' : 'text-muted hover:text-ink',
                  )}
                >
                  {c === 'monthly' ? b.monthly : b.yearly}
                  {c === 'yearly' ? (
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.18em]',
                        active ? 'bg-canvas text-ink' : 'bg-ink/10 text-ink',
                      )}
                    >
                      {b.save}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-3 lg:grid-cols-3">
          {t.plans.map((plan, i) => {
            const highlighted = 'highlighted' in plan && plan.highlighted;
            const checkoutPlan = PLAN_MAP[plan.id]?.[cadence] ?? null;

            // Override Pro price on yearly toggle
            let displayPrice: string = plan.price;
            let displayCadence: string = plan.cadence;
            let footnote: string | null = null;
            if (plan.id === 'pro' && cadence === 'yearly') {
              displayPrice = YEARLY_PRICE_EUR.pro.price;
              displayCadence = b.perYear;
              footnote = `≈ ${YEARLY_PRICE_EUR.pro.perMonth} · ${b.billedYearly}`;
            }

            return (
              <motion.article
                key={plan.id}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-60px' }}
                variants={fadeUp}
                custom={i}
                className={cn(
                  'relative flex flex-col rounded-sm border p-8 md:p-10',
                  highlighted ? 'border-ink bg-ink text-canvas' : 'border-line bg-surface text-ink',
                )}
              >
                {highlighted ? (
                  <span className="absolute -top-3 left-8 inline-flex items-center gap-2 rounded-full bg-canvas px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-ink ring-1 ring-ink">
                    Most chosen
                  </span>
                ) : null}

                <header>
                  <h3 className="font-display text-2xl font-medium tracking-tight">{plan.name}</h3>
                  <p className={cn('mt-2 text-[14px]', highlighted ? 'text-canvas/70' : 'text-muted')}>
                    {plan.tagline}
                  </p>
                </header>

                <div className="mt-8 flex items-baseline gap-2">
                  <span className="font-display text-5xl font-medium tracking-tighter">{displayPrice}</span>
                  <span
                    className={cn(
                      'font-mono text-[12px] uppercase tracking-[0.18em]',
                      highlighted ? 'text-canvas/60' : 'text-muted',
                    )}
                  >
                    {displayCadence}
                  </span>
                </div>
                {footnote ? (
                  <p
                    className={cn(
                      'mt-2 font-mono text-[11px] tracking-[0.16em]',
                      highlighted ? 'text-canvas/60' : 'text-subtle',
                    )}
                  >
                    {footnote}
                  </p>
                ) : null}

                <ul
                  className={cn(
                    'mt-10 space-y-3.5 border-t pt-8 text-[14.5px]',
                    highlighted ? 'border-canvas/20' : 'border-line',
                  )}
                >
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-3">
                      <Check
                        aria-hidden
                        className={cn('mt-0.5 h-4 w-4 flex-shrink-0', highlighted ? 'text-canvas' : 'text-ink')}
                        strokeWidth={1.75}
                      />
                      <span className={highlighted ? 'text-canvas/90' : 'text-muted'}>{f}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-10 pt-2">
                  <CheckoutCta
                    locale={locale}
                    plan={checkoutPlan}
                    fallbackHref={`/${locale}/onboarding?plan=${plan.id}`}
                    highlighted={highlighted}
                    label={plan.cta}
                  />
                </div>
              </motion.article>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
