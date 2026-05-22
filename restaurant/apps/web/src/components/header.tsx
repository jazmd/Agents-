import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Flame, User } from 'lucide-react';
import { CartButton } from './cart-button';
import { LanguageSwitcher } from './language-switcher';
import { getSession } from '@/lib/auth';

export async function Header() {
  const session = await getSession();
  return <HeaderShell hasSession={!!session} isAdmin={session?.role === 'ADMIN'} />;
}

function HeaderShell({ hasSession, isAdmin }: { hasSession: boolean; isAdmin: boolean }) {
  return (
    <header className="sticky top-0 z-40 border-b border-charcoal-100/60 bg-cream-100/90 backdrop-blur-md">
      <div className="container-page flex h-16 items-center justify-between gap-4 md:h-20">
        <Link href="/" className="group flex items-center gap-2.5">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-brand-500 text-cream-50 shadow-glow transition group-hover:scale-105">
            <Flame className="h-5 w-5" />
          </span>
          <div className="flex flex-col leading-tight">
            <span className="font-display text-lg font-bold tracking-tight">By Kebap</span>
            <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-charcoal-500">
              Authentic Döner
            </span>
          </div>
        </Link>

        <NavLinks isAdmin={isAdmin} hasSession={hasSession} />

        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <AccountLink hasSession={hasSession} />
          <CartLabel />
        </div>
      </div>
    </header>
  );
}

function NavLinks({ isAdmin, hasSession }: { isAdmin: boolean; hasSession: boolean }) {
  const t = useTranslations('nav');
  return (
    <nav className="hidden items-center gap-7 text-sm font-medium text-charcoal-700 md:flex">
      <Link href="/" className="transition hover:text-brand-500">
        {t('home')}
      </Link>
      <Link href="/menu" className="transition hover:text-brand-500">
        {t('menu')}
      </Link>
      {hasSession && (
        <Link href="/account" className="transition hover:text-brand-500">
          {t('account')}
        </Link>
      )}
      {isAdmin && (
        <Link href="/admin" className="transition hover:text-brand-500">
          {t('admin')}
        </Link>
      )}
    </nav>
  );
}

function AccountLink({ hasSession }: { hasSession: boolean }) {
  const t = useTranslations('nav');
  return (
    <Link
      href={hasSession ? '/account' : '/account/login'}
      aria-label={hasSession ? t('account') : t('login')}
      className="hidden items-center gap-2 rounded-full border border-charcoal-100 bg-cream-50 px-3 py-2.5 text-sm font-semibold text-charcoal-900 transition hover:border-brand-500 sm:inline-flex"
    >
      <User className="h-4 w-4" />
      <span className="hidden md:inline">{hasSession ? t('account') : t('login')}</span>
    </Link>
  );
}

function CartLabel() {
  const t = useTranslations('nav');
  return <CartButton label={t('cart')} />;
}
