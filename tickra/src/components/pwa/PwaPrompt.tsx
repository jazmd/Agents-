'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X } from 'lucide-react';
import { easeOutExpo } from '@/lib/motion';

type Labels = {
  title: string;
  body: string;
  install: string;
  later: string;
};

const ACK_COOKIE = 'tickra-pwa-ack';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

export function PwaPrompt({ labels }: { labels: Labels }) {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Register the service worker once on mount.
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js').catch(() => undefined);

    const ack = document.cookie.split('; ').some((c) => c.startsWith(`${ACK_COOKIE}=1`));
    if (ack) return;

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      // Wait a beat to avoid stacking with the cookie banner.
      setTimeout(() => setOpen(true), 2400);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  function dismiss() {
    document.cookie = `${ACK_COOKIE}=1; path=/; max-age=${60 * 60 * 24 * 90}; samesite=lax`;
    setOpen(false);
  }

  async function install() {
    if (!deferred) return dismiss();
    await deferred.prompt();
    await deferred.userChoice;
    dismiss();
  }

  return (
    <AnimatePresence>
      {open && deferred ? (
        <motion.aside
          key="pwa"
          role="region"
          aria-label="Install Tickra"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 18 }}
          transition={{ duration: 0.4, ease: easeOutExpo }}
          className="fixed inset-x-4 bottom-4 z-40 mx-auto max-w-md rounded-sm border border-ink bg-surface shadow-[0_1px_0_0_rgba(10,10,12,0.6)] md:inset-x-auto md:right-6 md:bottom-24 md:w-[420px]"
        >
          <div className="flex items-start gap-3 p-5">
            <Download aria-hidden className="mt-0.5 h-5 w-5 flex-shrink-0 text-ink" strokeWidth={1.6} />
            <div className="flex-1">
              <h2 className="font-display text-lg font-medium tracking-tight text-ink">{labels.title}</h2>
              <p className="mt-2 text-[14px] leading-relaxed text-muted">{labels.body}</p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={install}
                  className="inline-flex h-9 items-center gap-2 rounded-full bg-ink px-4 text-[13px] font-medium tracking-tight text-canvas hover:bg-ink/90"
                >
                  {labels.install}
                </button>
                <button
                  type="button"
                  onClick={dismiss}
                  className="inline-flex h-9 items-center gap-2 rounded-full border border-line px-3 text-[13px] text-muted hover:border-ink hover:text-ink"
                >
                  {labels.later}
                </button>
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
