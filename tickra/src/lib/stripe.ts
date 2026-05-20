import 'server-only';
import Stripe from 'stripe';

let cached: Stripe | null = null;

export function stripe(): Stripe {
  if (cached) return cached;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY is not set');
  cached = new Stripe(key, { apiVersion: '2024-11-20.acacia' });
  return cached;
}

export type CheckoutPlan = 'pro_monthly' | 'pro_yearly' | 'lifetime';

export function priceIdFor(plan: CheckoutPlan): string {
  const map: Record<CheckoutPlan, string | undefined> = {
    pro_monthly: process.env.STRIPE_PRICE_PRO_MONTHLY,
    pro_yearly: process.env.STRIPE_PRICE_PRO_YEARLY,
    lifetime: process.env.STRIPE_PRICE_LIFETIME,
  };
  const id = map[plan];
  if (!id) throw new Error(`Missing Stripe price id for plan ${plan}`);
  return id;
}

export function planFromPriceId(priceId: string | undefined | null): 'pro' | 'lifetime' | 'free' {
  if (!priceId) return 'free';
  if (priceId === process.env.STRIPE_PRICE_LIFETIME) return 'lifetime';
  if (
    priceId === process.env.STRIPE_PRICE_PRO_MONTHLY ||
    priceId === process.env.STRIPE_PRICE_PRO_YEARLY
  ) {
    return 'pro';
  }
  return 'free';
}
