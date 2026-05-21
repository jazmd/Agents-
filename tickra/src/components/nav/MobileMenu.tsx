'use client';

import { useEffect, useRef, useState } from 'react';
import { useFocusTrap } from '@/lib/useFocusTrap';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { LocaleSwitcher } from './LocaleSwitcher';
import { ThemeToggle } from './ThemeToggle';
import { easeOutExpo } from '@/lib/motion';
import type { Dictionary } from '@/lib/i18n/dictionaries';
import type { Locale } from '@/lib/i18n/config';

type Props = {
  dict: Dictionary;
  locale: Locale;
  links: { href: string; label: string }[];
  signedIn?: boolean;
};

export function MobileMenu({ dict, locale, links, signedIn }: Props) {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, open);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.style.overflow = open ? 'hidden' : '';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => {
      document.documentElement.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        aria-expanded={open}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-line text-ink transition-colors hover:bg-ink hover:text-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-canvas md:hidden"
      >
        <Menu aria-hidden className="h-4 w-4" strokeWidth={1.75} />
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            ref={dialogRef}
            key="menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: easeOutExpo }}
            className="fixed inset-0 z-50 bg-canvas md:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile navigation"
          >
            <div className="flex h-16 items-center justify-between border-b border-line px-6">
              <span className="text-[15px] font-semibold tracking-tight">Tickra</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-line text-ink hover:bg-ink hover:text-canvas"
              >
                <X aria-hidden className="h-4 w-4" strokeWidth={1.75} />
              </button>
            </div>

            <nav aria-label="Mobile primary" className="px-6 pt-10">
              <ul className="space-y-1">
                {links.map((l, i) => (
                  <motion.li
                    key={l.href}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.06 * i, ease: easeOutExpo }}
                  >
                    <Link
                      href={l.href}
                      onClick={() => setOpen(false)}
                      className="block border-b border-line py-5 font-display text-3xl font-medium tracking-tight text-ink"
                    >
                      {l.label}
                    </Link>
                  </motion.li>
                ))}
              </ul>

              <div className="mt-10 flex items-center justify-between">
                <LocaleSwitcher current={locale} label={dict.locale.switch} />
                <ThemeToggle labelLight={dict.theme.light} labelDark={dict.theme.dark} />
              </div>

              <div className="mt-10 flex flex-col gap-3">
                {signedIn ? (
                  <>
                    <Link
                      href={`/${locale}/dashboard`}
                      onClick={() => setOpen(false)}
                      className="inline-flex h-12 items-center justify-center rounded-full bg-ink px-6 text-[15px] font-medium tracking-tight text-canvas"
                    >
                      Open dashboard
                    </Link>
                    <form action={`/api/signout?locale=${locale}`} method="post">
                      <button
                        type="submit"
                        className="inline-flex h-12 w-full items-center justify-center rounded-full border border-line px-6 text-[15px] font-medium tracking-tight text-ink"
                      >
                        Sign out
                      </button>
                    </form>
                  </>
                ) : (
                  <>
                    <Link
                      href={`/${locale}/onboarding`}
                      onClick={() => setOpen(false)}
                      className="inline-flex h-12 items-center justify-center rounded-full bg-ink px-6 text-[15px] font-medium tracking-tight text-canvas"
                    >
                      {dict.nav.getStarted}
                    </Link>
                    <Link
                      href={`/${locale}/signin`}
                      onClick={() => setOpen(false)}
                      className="inline-flex h-12 items-center justify-center rounded-full border border-line px-6 text-[15px] font-medium tracking-tight text-ink"
                    >
                      {dict.nav.signIn}
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
