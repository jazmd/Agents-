'use client';

import { useEffect, useState } from 'react';

export function ReadingProgress() {
  const [pct, setPct] = useState(0);

  useEffect(() => {
    let ticking = false;
    function update() {
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      const top = window.scrollY || doc.scrollTop;
      const next = max > 0 ? Math.min(100, Math.max(0, (top / max) * 100)) : 0;
      setPct(next);
      ticking = false;
    }
    function onScroll() {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    }
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Reading progress"
      className="fixed inset-x-0 top-16 z-30 h-[2px] bg-line/60"
    >
      <div
        className="h-full bg-ink transition-[width] duration-75 ease-linear"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
