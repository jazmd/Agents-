import Link from 'next/link';
import { ArrowUpRight, Lock } from 'lucide-react';
import type { Locale } from '@/lib/i18n/config';

type Props = {
  locale: Locale;
  eyebrow: string;
  title: string;
  body: string;
  primary: string;
  secondary: string;
};

export function Paywall({ locale, eyebrow, title, body, primary, secondary }: Props) {
  return (
    <section
      aria-labelledby="paywall-title"
      className="relative overflow-hidden rounded-sm border border-ink bg-ink text-canvas"
    >
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px bg-canvas/20"
      />
      <div className="relative grid grid-cols-12 gap-x-6 gap-y-8 p-8 md:p-12">
        <div className="col-span-12 md:col-span-7">
          <span className="inline-flex items-center gap-2 rounded-full border border-canvas/30 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.2em] text-canvas/80">
            <Lock aria-hidden className="h-3.5 w-3.5" strokeWidth={1.75} />
            {eyebrow}
          </span>
          <h2
            id="paywall-title"
            className="mt-6 font-display text-display-md font-medium tracking-tight text-balance"
          >
            {title}
          </h2>
          <p className="mt-5 max-w-lg text-[15.5px] leading-relaxed text-canvas/75">{body}</p>
        </div>

        <div className="col-span-12 flex flex-col justify-end gap-3 md:col-span-4 md:col-start-9">
          <Link
            href={`/${locale}/pricing`}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-canvas px-6 text-[15px] font-medium tracking-tight text-ink transition-colors hover:bg-canvas/90"
          >
            {primary}
            <ArrowUpRight aria-hidden className="h-4 w-4" strokeWidth={1.75} />
          </Link>
          <Link
            href={`/${locale}/pricing`}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-canvas/30 px-6 text-[15px] font-medium tracking-tight text-canvas transition-colors hover:border-canvas hover:bg-canvas/10"
          >
            {secondary}
          </Link>
        </div>
      </div>
    </section>
  );
}
