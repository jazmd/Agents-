import Link from 'next/link';
import { LogOut, Settings } from 'lucide-react';
import type { Locale } from '@/lib/i18n/config';

type Props = {
  locale: Locale;
  email: string;
};

export function UserMenu({ locale, email }: Props) {
  const initial = email.charAt(0).toUpperCase();
  return (
    <form action={`/api/signout?locale=${locale}`} method="post" className="flex items-center gap-2">
      <Link
        href={`/${locale}/dashboard`}
        className="inline-flex h-9 items-center gap-2.5 rounded-full border border-line pl-1 pr-3 text-sm transition-colors hover:border-ink hover:bg-ink hover:text-canvas"
        aria-label={`Open ${email}'s dashboard`}
      >
        <span
          aria-hidden
          className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-ink text-[12px] font-medium text-canvas"
        >
          {initial}
        </span>
        <span className="hidden truncate font-mono text-[11px] uppercase tracking-[0.18em] sm:inline-block sm:max-w-[140px]">
          {email}
        </span>
      </Link>
      <Link
        href={`/${locale}/settings`}
        aria-label="Open settings"
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-line text-ink transition-colors hover:bg-ink hover:text-canvas"
      >
        <Settings aria-hidden className="h-4 w-4" strokeWidth={1.6} />
      </Link>
      <button
        type="submit"
        aria-label="Sign out"
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-line text-ink transition-colors hover:bg-ink hover:text-canvas"
      >
        <LogOut aria-hidden className="h-4 w-4" strokeWidth={1.6} />
      </button>
    </form>
  );
}
