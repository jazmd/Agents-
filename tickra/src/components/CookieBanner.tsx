'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, X } from 'lucide-react';
import { easeOutExpo } from '@/lib/motion';

const COOKIE = 'tickra-cookies-ack';

type Props = {
  locale: string;
  title: string;
  body: string;
  accept: string;
  learn: string;
  privacyHref: string;
};

export function CookieBanner({ locale, title, body, accept, learn, privacyHref }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const ack = document.cookie.split('; ').some((c) => c.startsWith(`${COOKIE}=1`));
    if (!ack) {
      const t = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(t);
    }
  }, []);

  function dismiss() {
    document.cookie = `${COOKIE}=1; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    setVisible(false);
  }

  return (
    <AnimatePresence>
      {visible ? (
        <motion.aside
          key="cookies"
          role="region"
          aria-label="Cookie notice"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.45, ease: easeOutExpo }}
          className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-3xl rounded-sm border border-ink bg-surface shadow-[0_1px_0_0_rgba(10,10,12,0.6)] md:inset-x-auto md:right-6 md:bottom-6 md:w-[520px]"
        >
          <div className="flex items-start gap-4 p-5 md:p-6">
            <Cookie aria-hidden className="mt-0.5 h-5 w-5 flex-shrink-0 text-ink" strokeWidth={1.6} />
            <div className="flex-1">
              <h2 className="font-display text-lg font-medium tracking-tight text-ink">{title}</h2>
              <p className="mt-2 text-[14px] leading-relaxed text-muted">{body}</p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={dismiss}
                  className="inline-flex h-10 items-center gap-2 rounded-full bg-ink px-4 text-[13.5px] font-medium tracking-tight text-canvas hover:bg-ink/90"
                >
                  {accept}
                </button>
                <Link
                  href={privacyHref}
                  className="text-[13px] text-muted underline-offset-2 hover:text-ink hover:underline"
                >
                  {learn}
                </Link>
              </div>
            </div>
            <button
              type="button"
              onClick={dismiss}
              aria-label="Dismiss"
              className="inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-muted hover:bg-elevated hover:text-ink"
            >
              <X aria-hidden className="h-3.5 w-3.5" strokeWidth={1.75} />
            </button>
          </div>
        </motion.aside>
      ) : null}
    </AnimatePresence>
  );
}
