import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { stripe, planFromPriceId } from '@/lib/stripe';
import { createSupabaseServiceClient } from '@/lib/supabase/server';
import { sendSubscriptionConfirmedEmail } from '@/lib/email/send';
import { isLocale } from '@/lib/i18n/config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: 'webhook not configured' }, { status: 500 });

  const signature = req.headers.get('stripe-signature');
  if (!signature) return NextResponse.json({ error: 'missing signature' }, { status: 400 });

  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(body, signature, secret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'invalid signature';
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const admin = createSupabaseServiceClient();

  async function upsertSubscription(userId: string, fields: Record<string, unknown>) {
    await admin
      .from('subscriptions')
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq('user_id', userId);
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.client_reference_id || (session.metadata?.supabase_user_id as string | undefined);
      const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id;
      if (!userId) break;

      let plan: 'pro' | 'lifetime' | null = null;
      if (session.mode === 'payment') {
        await upsertSubscription(userId, {
          plan: 'lifetime',
          stripe_customer_id: customerId,
          status: 'active',
        });
        plan = 'lifetime';
      } else if (session.mode === 'subscription' && typeof session.subscription === 'string') {
        const sub = await stripe().subscriptions.retrieve(session.subscription);
        const priceId = sub.items.data[0]?.price.id;
        const resolved = planFromPriceId(priceId);
        await upsertSubscription(userId, {
          plan: resolved,
          stripe_customer_id: customerId,
          stripe_subscription_id: sub.id,
          status: sub.status,
          current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
          cancel_at_period_end: sub.cancel_at_period_end,
        });
        if (resolved === 'pro' || resolved === 'lifetime') plan = resolved;
      }

      // Best-effort confirmation email.
      const email = session.customer_details?.email || session.customer_email || null;
      if (email && plan) {
        const { data: profile } = await admin
          .from('profiles')
          .select('locale')
          .eq('id', userId)
          .single();
        const locale = isLocale(profile?.locale) ? profile.locale : 'en';
        try {
          await sendSubscriptionConfirmedEmail({ to: email, locale, plan });
        } catch {
          // swallow — webhook must always 200
        }
      }
      break;
    }

    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;
      const { data: row } = await admin
        .from('subscriptions')
        .select('user_id')
        .eq('stripe_customer_id', customerId)
        .single();
      if (!row) break;
      const priceId = sub.items.data[0]?.price.id;
      const isActive = sub.status === 'active' || sub.status === 'trialing';
      await upsertSubscription(row.user_id, {
        plan: isActive ? planFromPriceId(priceId) : 'free',
        stripe_subscription_id: sub.id,
        status: sub.status,
        current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
        cancel_at_period_end: sub.cancel_at_period_end,
      });
      break;
    }
  }

  return NextResponse.json({ received: true });
}
