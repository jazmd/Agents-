import type { ReactNode } from 'react';
import { Navbar } from '@/components/nav/Navbar';
import { Footer } from '@/components/sections/Footer';
import type { Dictionary } from '@/lib/i18n/dictionaries';
import type { Locale } from '@/lib/i18n/config';

type Props = {
  dict: Dictionary;
  locale: Locale;
  children: ReactNode;
};

export function AppShell({ dict, locale, children }: Props) {
  return (
    <>
      <Navbar dict={dict} locale={locale} />
      <main id="main" className="min-h-[60vh]">
        {children}
      </main>
      <Footer dict={dict} locale={locale} />
    </>
  );
}
