import { NextResponse } from 'next/server';
import { stripe, priceIdFor, type CheckoutPlan } from '@/lib/stripe';
import { createSupabaseServerClient, createSupabaseServiceClient } from '@/lib/supabase/server';

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
}

export async function POST(request: Request) {
  const { plan, locale = 'en' } = (await request.json().catch(() => ({}))) as {
    plan?: CheckoutPlan;
    locale?: string;
  };

  if (!plan) return NextResponse.json({ error: 'missing plan' }, { status: 400 });

  const supabase = createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  }

  const admin = createSupabaseServiceClient();
  const { data: sub } = await admin
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .single();

  let customerId = sub?.stripe_customer_id ?? undefined;
  if (!customerId) {
    const customer = await stripe().customers.create({
      email: user.email ?? undefined,
      metadata: { supabase_user_id: user.id },
    });
    customerId = customer.id;
    await admin
      .from('subscriptions')
      .update({ stripe_customer_id: customerId })
      .eq('user_id', user.id);
  }

  const isOneTime = plan === 'lifetime';

  const session = await stripe().checkout.sessions.create({
    mode: isOneTime ? 'payment' : 'subscription',
    customer: customerId,
    line_items: [{ price: priceIdFor(plan), quantity: 1 }],
    allow_promotion_codes: true,
    success_url: `${siteUrl()}/${locale}/dashboard?checkout=success`,
    cancel_url: `${siteUrl()}/${locale}/pricing?checkout=cancelled`,
    metadata: { supabase_user_id: user.id, plan },
    client_reference_id: user.id,
  });

  return NextResponse.json({ url: session.url });
}
