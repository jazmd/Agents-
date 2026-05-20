'use client';

import { motion } from 'framer-motion';
import { easeOutExpo } from '@/lib/motion';

type Props = { title: string; caption: string; data: { day: string; minutes: number }[] };

export function ActivityChart({ title, caption, data }: Props) {
  const max = Math.max(...data.map((d) => d.minutes), 10);
  return (
    <section className="rounded-sm border border-line bg-surface p-6 md:p-8">
      <header className="flex items-baseline justify-between border-b border-line pb-5">
        <h3 className="font-display text-xl font-medium tracking-tight text-ink">{title}</h3>
        <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
          {caption}
        </span>
      </header>
      <ul className="mt-10 grid grid-cols-7 items-end gap-2 md:gap-3">
        {data.map((d, i) => {
          const h = (d.minutes / max) * 100;
          return (
            <li key={d.day} className="flex flex-col items-center gap-3">
              <div className="relative flex h-32 w-full items-end overflow-hidden bg-canvas">
                <motion.div
                  className="w-full bg-ink"
                  initial={{ height: 0 }}
                  animate={{ height: `${h}%` }}
                  transition={{ duration: 0.8, delay: 0.1 + i * 0.06, ease: easeOutExpo }}
                />
              </div>
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
                {d.day}
              </span>
              <span className="font-display text-base font-medium tracking-tight text-ink">
                {d.minutes}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
