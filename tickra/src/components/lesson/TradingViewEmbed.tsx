'use client';

import { useEffect, useState } from 'react';
import { useTheme } from '@/lib/theme/ThemeProvider';

type Props = {
  symbol?: string;
  interval?: string;
  locale: 'en' | 'fr';
  height?: number;
};

export function TradingViewEmbed({
  symbol = 'FX:EURUSD',
  interval = '60',
  locale,
  height = 520,
}: Props) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const params = new URLSearchParams({
    symbol,
    interval,
    theme,
    style: '1',
    locale,
    hide_top_toolbar: '0',
    hide_legend: '0',
    save_image: '0',
    timezone: 'Etc/UTC',
    withdateranges: '1',
    studies: '[]',
    allow_symbol_change: '0',
  });

  const src = `https://s.tradingview.com/widgetembed/?${params.toString()}`;

  return (
    <div
      className="overflow-hidden rounded-sm border border-line bg-surface"
      style={{ height }}
    >
      {mounted ? (
        <iframe
          key={theme}
          src={src}
          title={`${symbol} chart`}
          loading="lazy"
          allow="clipboard-write"
          referrerPolicy="no-referrer-when-downgrade"
          className="block h-full w-full"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center font-mono text-[11px] uppercase tracking-[0.22em] text-subtle">
          Loading chart…
        </div>
      )}
    </div>
  );
}
