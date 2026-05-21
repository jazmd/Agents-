'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { RefreshCw } from 'lucide-react';

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function LocaleError({ error, reset }: Props) {
  useEffect(() => {
    if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_SENTRY_DSN) {
      // Sentry is auto-imported via instrumentation; the global handler will pick this up.
      // eslint-disable-next-line no-console
      console.error('locale-error', error.digest, error.message);
    }
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          padding: 0,
          minHeight: '100vh',
          background: '#FAFAF7',
          color: '#0A0A0C',
          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
        }}
      >
        <main
          style={{
            maxWidth: 720,
            margin: '0 auto',
            padding: '160px 24px 96px',
          }}
        >
          <p
            style={{
              fontFamily: '"JetBrains Mono", ui-monospace, monospace',
              fontSize: 11,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: '#5C5C64',
              margin: 0,
            }}
          >
            Error 500
          </p>
          <h1
            style={{
              marginTop: 24,
              fontFamily: '"Fraunces", Georgia, serif',
              fontSize: 'clamp(2.5rem, 5vw, 4.25rem)',
              lineHeight: 1,
              letterSpacing: '-0.03em',
              fontWeight: 500,
              color: '#0A0A0C',
            }}
          >
            Something broke on our side.
          </h1>
          <p
            style={{
              marginTop: 24,
              maxWidth: 520,
              fontSize: 17,
              lineHeight: 1.6,
              color: '#5C5C64',
            }}
          >
            The error has been logged. Try again, or come back to the home page — your progress is safe.
          </p>
          {error.digest ? (
            <p style={{ marginTop: 16, fontFamily: '"JetBrains Mono", monospace', fontSize: 11, color: '#71717A' }}>
              ref: {error.digest}
            </p>
          ) : null}
          <div style={{ marginTop: 48, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => reset()}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                height: 48,
                padding: '0 24px',
                borderRadius: 999,
                background: '#0A0A0C',
                color: '#FAFAF7',
                border: 'none',
                fontSize: 15,
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              <RefreshCw width={16} height={16} strokeWidth={1.75} aria-hidden />
              Try again
            </button>
            <Link
              href="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                height: 48,
                padding: '0 24px',
                borderRadius: 999,
                border: '1px solid #E2E0DA',
                color: '#0A0A0C',
                textDecoration: 'none',
                fontSize: 15,
                fontWeight: 500,
              }}
            >
              Back to home
            </Link>
          </div>
        </main>
      </body>
    </html>
  );
}
