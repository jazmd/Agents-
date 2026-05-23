'use client';

import { useEffect, useRef, useState } from 'react';
import { useTheme } from '@/lib/theme/ThemeProvider';

type Props = { locale: 'en' | 'fr' };

/**
 * TradingView economic calendar widget. Re-mounts on theme + locale change
 * so the colour scheme stays consistent with the rest of the site.
 */
export function EconomicCalendar({ locale }: Props) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted || !hostRef.current) return;
    const host = hostRef.current;
    host.innerHTML = '';
    const container = document.createElement('div');
    container.className = 'tradingview-widget-container__widget';
    host.appendChild(container);

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-events.js';
    script.async = true;
    script.type = 'text/javascript';
    script.innerHTML = JSON.stringify({
      colorTheme: theme,
      isTransparent: true,
      width: '100%',
      height: 640,
      locale,
      importanceFilter: '-1,0,1',
      countryFilter: 'us,eu,fr,de,gb,jp,ca,au,nz,ch,cn',
    });
    host.appendChild(script);

    return () => {
      host.innerHTML = '';
    };
  }, [mounted, theme, locale]);

  return (
    <div className="overflow-hidden rounded-sm border border-line bg-surface">
      <div className="tradingview-widget-container" ref={hostRef} style={{ minHeight: 640 }}>
        {!mounted ? (
          <div className="flex h-[640px] items-center justify-center font-mono text-[11px] uppercase tracking-[0.22em] text-subtle">
            Loading calendar…
          </div>
        ) : null}
      </div>
    </div>
  );
}
