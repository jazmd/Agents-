'use client';

import { useTransition } from 'react';
import { signInWithProvider } from '@/app/[locale]/signin/actions';
import type { Locale } from '@/lib/i18n/config';

type Props = {
  locale: Locale;
  next?: string;
  googleLabel: string;
  appleLabel: string;
};

export function OAuthButtons({ locale, next, googleLabel, appleLabel }: Props) {
  const [pending, start] = useTransition();

  return (
    <div className="grid gap-2.5 sm:grid-cols-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => start(() => signInWithProvider('google', locale, next))}
        className="inline-flex h-12 items-center justify-center gap-2.5 rounded-sm border border-line text-[14px] font-medium text-ink transition-colors hover:border-ink hover:bg-elevated disabled:cursor-not-allowed disabled:opacity-50"
      >
        <GoogleGlyph />
        {googleLabel}
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => start(() => signInWithProvider('apple', locale, next))}
        className="inline-flex h-12 items-center justify-center gap-2.5 rounded-sm border border-line text-[14px] font-medium text-ink transition-colors hover:border-ink hover:bg-elevated disabled:cursor-not-allowed disabled:opacity-50"
      >
        <AppleGlyph />
        {appleLabel}
      </button>
    </div>
  );
}

function GoogleGlyph() {
  return (
    <svg aria-hidden viewBox="0 0 18 18" className="h-4 w-4">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.49h4.84a4.13 4.13 0 0 1-1.8 2.71v2.26h2.92c1.71-1.57 2.68-3.88 2.68-6.62z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.83.85-3.04.85a5.27 5.27 0 0 1-4.95-3.65H.96v2.34A9 9 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M4.05 10.76A5.41 5.41 0 0 1 3.77 9c0-.61.1-1.2.28-1.76V4.9H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.1l3.09-2.34z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.34l2.58-2.58A9 9 0 0 0 .96 4.9l3.09 2.34A5.27 5.27 0 0 1 9 3.58z" />
    </svg>
  );
}

function AppleGlyph() {
  return (
    <svg aria-hidden viewBox="0 0 18 18" className="h-4 w-4" fill="currentColor">
      <path d="M14.94 13.66c-.27.63-.4.91-.75 1.46-.49.77-1.18 1.74-2.04 1.75-.77 0-.97-.5-2.01-.5-1.05.01-1.27.51-2.04.5-.86-.01-1.51-.88-2-1.66-1.38-2.17-1.52-4.71-.67-6.07.6-.97 1.55-1.54 2.45-1.54.9 0 1.48.5 2.23.5.73 0 1.17-.5 2.22-.5.8 0 1.65.44 2.25 1.19-1.98 1.09-1.66 3.92.36 4.87zM11.4 4.66c.39-.5.69-1.21.58-1.93-.63.04-1.37.44-1.8.96-.39.47-.72 1.18-.6 1.88.69.02 1.4-.4 1.82-.91z" />
    </svg>
  );
}
