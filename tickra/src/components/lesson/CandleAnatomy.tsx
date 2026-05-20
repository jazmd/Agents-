'use client';

import { motion } from 'framer-motion';
import { easeOutExpo } from '@/lib/motion';

type Labels = {
  high: string;
  low: string;
  open: string;
  close: string;
  body: string;
  wick: string;
};

export function CandleAnatomy({ labels }: { labels: Labels }) {
  const W = 720;
  const H = 380;
  const cx = W / 2 - 60;
  const open = 280;
  const close = 130;
  const high = 60;
  const low = 330;
  const bodyW = 64;

  const anim = (delay = 0) => ({
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.6, ease: easeOutExpo, delay },
  });

  return (
    <figure className="rounded-sm border border-line bg-surface p-6 md:p-10">
      <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" role="img" aria-label="Anatomy of a Japanese candle">
        <motion.line
          x1={cx} x2={cx} y1={high} y2={low}
          stroke="rgb(var(--up))" strokeWidth={1.5}
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
          transition={{ duration: 0.9, ease: easeOutExpo }}
        />

        <motion.rect
          x={cx - bodyW / 2} y={close}
          width={bodyW} height={open - close}
          fill="rgb(var(--up))"
          initial={{ opacity: 0, scaleY: 0 }} animate={{ opacity: 1, scaleY: 1 }}
          style={{ transformOrigin: `${cx}px ${(open + close) / 2}px` }}
          transition={{ duration: 0.7, delay: 0.5, ease: easeOutExpo }}
        />

        <motion.g {...anim(1.1)}>
          <line x1={cx + bodyW / 2 + 16} x2={cx + bodyW / 2 + 60} y1={high} y2={high} stroke="rgb(var(--ink))" strokeWidth={1} />
          <line x1={cx + bodyW / 2 + 60} x2={cx + bodyW / 2 + 60} y1={high} y2={high - 18} stroke="rgb(var(--ink))" strokeWidth={1} />
          <text x={cx + bodyW / 2 + 60} y={high - 26} fontFamily="var(--font-jetbrains)" fontSize={11} fill="rgb(var(--muted))" letterSpacing="0.16em">
            {labels.high.toUpperCase()} · {labels.wick.toUpperCase()}
          </text>
        </motion.g>

        <motion.g {...anim(1.25)}>
          <line x1={cx + bodyW / 2 + 16} x2={cx + bodyW / 2 + 110} y1={close} y2={close} stroke="rgb(var(--ink))" strokeWidth={1} />
          <text x={cx + bodyW / 2 + 118} y={close + 4} fontFamily="var(--font-jetbrains)" fontSize={11} fill="rgb(var(--muted))" letterSpacing="0.16em">
            {labels.close.toUpperCase()}
          </text>
        </motion.g>

        <motion.g {...anim(1.4)}>
          <line x1={cx + bodyW / 2 + 16} x2={cx + bodyW / 2 + 130} y1={(open + close) / 2} y2={(open + close) / 2} stroke="rgb(var(--ink))" strokeWidth={1} />
          <text x={cx + bodyW / 2 + 138} y={(open + close) / 2 + 4} fontFamily="var(--font-jetbrains)" fontSize={11} fill="rgb(var(--muted))" letterSpacing="0.16em">
            {labels.body.toUpperCase()}
          </text>
        </motion.g>

        <motion.g {...anim(1.55)}>
          <line x1={cx + bodyW / 2 + 16} x2={cx + bodyW / 2 + 110} y1={open} y2={open} stroke="rgb(var(--ink))" strokeWidth={1} />
          <text x={cx + bodyW / 2 + 118} y={open + 4} fontFamily="var(--font-jetbrains)" fontSize={11} fill="rgb(var(--muted))" letterSpacing="0.16em">
            {labels.open.toUpperCase()}
          </text>
        </motion.g>

        <motion.g {...anim(1.7)}>
          <line x1={cx + bodyW / 2 + 16} x2={cx + bodyW / 2 + 60} y1={low} y2={low} stroke="rgb(var(--ink))" strokeWidth={1} />
          <line x1={cx + bodyW / 2 + 60} x2={cx + bodyW / 2 + 60} y1={low} y2={low + 18} stroke="rgb(var(--ink))" strokeWidth={1} />
          <text x={cx + bodyW / 2 + 60} y={low + 32} fontFamily="var(--font-jetbrains)" fontSize={11} fill="rgb(var(--muted))" letterSpacing="0.16em">
            {labels.low.toUpperCase()}
          </text>
        </motion.g>
      </svg>
    </figure>
  );
}
