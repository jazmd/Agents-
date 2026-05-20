import Link from 'next/link';
import { ArrowUpRight, Clock } from 'lucide-react';

type Props = {
  label: string;
  title: string;
  duration: string;
  cta: string;
  href: string;
};

export function LessonCard({ label, title, duration, cta, href }: Props) {
  return (
    <article className="relative flex flex-col justify-between rounded-sm border border-ink bg-ink p-6 text-canvas md:p-8">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-canvas/60">{label}</p>
        <h2 className="mt-6 font-display text-display-md font-medium tracking-tight text-balance">
          {title}
        </h2>
      </div>
      <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-canvas/20 pt-6">
        <span className="inline-flex items-center gap-2 font-mono text-[12px] tracking-[0.16em] text-canvas/70">
          <Clock aria-hidden className="h-3.5 w-3.5" strokeWidth={1.5} />
          {duration}
        </span>
        <Link
          href={href}
          className="inline-flex h-11 items-center gap-2 rounded-full border border-canvas/30 bg-transparent px-5 text-sm font-medium tracking-tight text-canvas transition-colors hover:border-canvas hover:bg-canvas hover:text-ink"
        >
          {cta}
          <ArrowUpRight aria-hidden className="h-4 w-4" strokeWidth={1.75} />
        </Link>
      </div>
    </article>
  );
}
