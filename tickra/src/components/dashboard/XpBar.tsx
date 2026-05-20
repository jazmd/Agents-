'use client';

import { motion } from 'framer-motion';
import { easeOutExpo } from '@/lib/motion';

type Props = {
  xp: number;
  level: number;
  nextThreshold: number;
  label: string;
  toNextTemplate: string;
  levelTemplate: string;
};

export function XpBar({ xp, level, nextThreshold, label, toNextTemplate, levelTemplate }: Props) {
  const remaining = Math.max(0, nextThreshold - xp);
  const progress = Math.min((xp / nextThreshold) * 100, 100);
  const nextLevel = levelTemplate.replace('{n}', String(level + 1));

  return (
    <div className="rounded-sm border border-line bg-surface p-6 md:p-8">
      <div className="flex items-baseline justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">{label}</p>
          <p className="mt-3 font-display text-3xl font-medium tracking-tight text-ink">
            {xp.toLocaleString()} <span className="text-muted">XP</span>
          </p>
        </div>
        <span className="rounded-full border border-line bg-canvas px-3 py-1 font-mono text-[11px] uppercase tracking-[0.18em] text-ink">
          {levelTemplate.replace('{n}', String(level))}
        </span>
      </div>

      <div className="mt-8 h-2 w-full overflow-hidden rounded-full bg-line">
        <motion.div
          className="h-full bg-ink"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1.2, ease: easeOutExpo, delay: 0.1 }}
        />
      </div>

      <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
        {toNextTemplate.replace('{n}', remaining.toLocaleString()).replace('{level}', nextLevel)}
      </p>
    </div>
  );
}
