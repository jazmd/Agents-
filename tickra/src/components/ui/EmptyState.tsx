import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

type Props = {
  icon: LucideIcon;
  title: string;
  body: string;
  cta?: ReactNode;
};

export function EmptyState({ icon: Icon, title, body, cta }: Props) {
  return (
    <div className="flex flex-col items-start gap-5 rounded-sm border border-dashed border-line bg-surface px-8 py-12 md:px-12 md:py-16">
      <span
        aria-hidden
        className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-line text-ink"
      >
        <Icon className="h-5 w-5" strokeWidth={1.5} />
      </span>
      <div className="max-w-md">
        <h3 className="font-display text-2xl font-medium tracking-tight text-balance text-ink">{title}</h3>
        <p className="mt-3 text-pretty text-[15.5px] leading-relaxed text-muted">{body}</p>
      </div>
      {cta ? <div>{cta}</div> : null}
    </div>
  );
}
