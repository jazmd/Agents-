'use client';

import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';
import { easeOutExpo } from '@/lib/motion';

type Props = { current: number; best: number; unit: string; bestLabel: string; label: string };

export function StreakRing({ current, best, unit, bestLabel, label }: Props) {
  const size = 168;
  const stroke = 6;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const ratio = Math.min(current / 60, 1);

  return (
    <div className="relative flex flex-col items-start gap-6 rounded-sm border border-line bg-surface p-6 md:flex-row md:items-center md:p-8">
      <div className="relative" style={{ width: size, height: size }}>
        <svg viewBox={`0 0 ${size} ${size}`} className="block">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="rgb(var(--line))"
            strokeWidth={stroke}
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="rgb(var(--ink))"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            initial={{ strokeDashoffset: c }}
            animate={{ strokeDashoffset: c * (1 - ratio) }}
            transition={{ duration: 1.4, ease: easeOutExpo }}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <Flame aria-hidden className="h-4 w-4 text-ink" strokeWidth={1.6} />
          <span className="mt-1 font-display text-5xl font-medium tracking-tighter text-ink">
            {current}
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
            {unit}
          </span>
        </div>
      </div>
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">{label}</p>
        <p className="mt-2 font-display text-xl font-medium tracking-tight text-ink">
          {bestLabel.replace('{n}', String(best))}
        </p>
      </div>
    </div>
  );
}
