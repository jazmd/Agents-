'use client';

import Script from 'next/script';
import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        opts: {
          sitekey: string;
          theme?: 'light' | 'dark' | 'auto';
          action?: string;
          callback?: (token: string) => void;
          'error-callback'?: () => void;
        },
      ) => string;
      reset: (widgetId?: string) => void;
    };
  }
}

type Props = {
  action: string;
  className?: string;
  inputName?: string;
};

/**
 * Renders a Turnstile widget that writes its token into a hidden form input.
 * Renders nothing when NEXT_PUBLIC_TURNSTILE_SITE_KEY is not configured.
 */
export function Turnstile({ action, className, inputName = 'cf-turnstile-response' }: Props) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const hostRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!siteKey || !hostRef.current) return;
    let cancelled = false;

    function mount() {
      if (cancelled || !hostRef.current || !window.turnstile) return;
      widgetIdRef.current = window.turnstile.render(hostRef.current, {
        sitekey: siteKey!,
        action,
        callback: (token) => {
          if (inputRef.current) inputRef.current.value = token;
        },
        'error-callback': () => {
          if (inputRef.current) inputRef.current.value = '';
        },
      });
    }

    if (window.turnstile) mount();
    else window.addEventListener('turnstileReady', mount, { once: true });

    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.reset(widgetIdRef.current);
      }
    };
  }, [siteKey, action]);

  if (!siteKey) return null;

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?onload=__tickraTurnstileOnload"
        strategy="afterInteractive"
        onLoad={() => window.dispatchEvent(new Event('turnstileReady'))}
      />
      <Script id="turnstile-bootstrap" strategy="afterInteractive">
        {`window.__tickraTurnstileOnload = function() { window.dispatchEvent(new Event('turnstileReady')); }`}
      </Script>
      <div className={className}>
        <div ref={hostRef} />
        <input ref={inputRef} type="hidden" name={inputName} defaultValue="" />
      </div>
    </>
  );
}
