'use client';

import { useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { LogOut } from 'lucide-react';
import { useRouter } from '@/i18n/routing';
import { logoutAction } from '@/lib/actions/auth';

export function LogoutButton() {
  const t = useTranslations('nav');
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      onClick={() =>
        startTransition(async () => {
          await logoutAction();
          router.push('/');
          router.refresh();
        })
      }
      disabled={pending}
      className="btn-outline"
    >
      <LogOut className="h-4 w-4" />
      {t('logout')}
    </button>
  );
}
