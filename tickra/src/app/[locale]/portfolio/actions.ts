'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient, hasSupabaseEnv } from '@/lib/supabase/server';
import { INSTRUMENTS, markPrice, computePnl, type Symbol } from '@/lib/paper/types';
import { demoClosePosition, demoOpenPosition } from '@/lib/paper/demo';

function isSymbol(v: string): v is Symbol {
  return INSTRUMENTS.some((i) => i.symbol === v);
}

export async function openPosition(formData: FormData) {
  const locale = String(formData.get('locale') || 'en');
  const symbol = String(formData.get('symbol') || '');
  const side = String(formData.get('side') || 'long') as 'long' | 'short';
  const qty = Math.max(0, Number(formData.get('qty') || 0));

  if (!isSymbol(symbol) || (side !== 'long' && side !== 'short') || !(qty > 0)) {
    redirect(`/${locale}/portfolio?error=invalid`);
  }

  if (!hasSupabaseEnv()) {
    demoOpenPosition(symbol, side, qty);
    revalidatePath(`/${locale}/portfolio`);
    redirect(`/${locale}/portfolio`);
  }

  const supabase = createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) redirect(`/${locale}/signin?next=${encodeURIComponent(`/${locale}/portfolio`)}`);

  const entry = markPrice(symbol);
  await supabase.from('paper_positions').insert({
    user_id: user.id,
    symbol,
    side,
    qty,
    entry_price: entry,
  });
  revalidatePath(`/${locale}/portfolio`);
  redirect(`/${locale}/portfolio`);
}

export async function closePosition(formData: FormData) {
  const locale = String(formData.get('locale') || 'en');
  const id = String(formData.get('id') || '');
  if (!id) redirect(`/${locale}/portfolio`);

  if (!hasSupabaseEnv()) {
    demoClosePosition(id);
    revalidatePath(`/${locale}/portfolio`);
    redirect(`/${locale}/portfolio`);
  }

  const supabase = createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) redirect(`/${locale}/signin`);

  const { data: pos } = await supabase
    .from('paper_positions')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .eq('status', 'open')
    .maybeSingle();
  if (!pos) {
    redirect(`/${locale}/portfolio`);
  }

  const exit = markPrice(pos.symbol as Symbol);
  const pnl = computePnl({ ...pos, exit_price: exit } as never, exit);

  await supabase
    .from('paper_positions')
    .update({ exit_price: exit, status: 'closed', closed_at: new Date().toISOString(), pnl })
    .eq('id', id)
    .eq('user_id', user.id);

  const { data: acc } = await supabase
    .from('paper_accounts')
    .select('balance, realised_pnl')
    .eq('user_id', user.id)
    .maybeSingle();
  const balance = Number(acc?.balance ?? 10000) + pnl;
  const realised = Number(acc?.realised_pnl ?? 0) + pnl;
  await supabase
    .from('paper_accounts')
    .upsert({ user_id: user.id, balance, realised_pnl: realised, updated_at: new Date().toISOString() });

  revalidatePath(`/${locale}/portfolio`);
  redirect(`/${locale}/portfolio`);
}
