'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { isLocale, LOCALE_COOKIE } from '@/lib/i18n/config';

export async function updateProfile(formData: FormData) {
  const fullName = String(formData.get('full_name') || '').trim();
  const localeChoice = String(formData.get('locale') || '');
  const currentLocale = String(formData.get('current_locale') || 'en');

  const supabase = createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) redirect(`/${currentLocale}/signin`);

  const updates: { full_name?: string; locale?: 'en' | 'fr'; updated_at: string } = {
    updated_at: new Date().toISOString(),
  };
  if (fullName) updates.full_name = fullName;
  if (isLocale(localeChoice)) {
    updates.locale = localeChoice;
    cookies().set(LOCALE_COOKIE, localeChoice, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
    });
  }

  await supabase.from('profiles').update(updates).eq('id', user.id);

  const nextLocale = isLocale(localeChoice) ? localeChoice : currentLocale;
  revalidatePath(`/${nextLocale}`, 'layout');
  redirect(`/${nextLocale}/settings?saved=1`);
}
