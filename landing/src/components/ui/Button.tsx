import Link from 'next/link';
import { type AnchorHTMLAttributes, type ReactNode } from 'react';

type Variant = 'primary' | 'ghost';

type Props = {
  href: string;
  variant?: Variant;
  children: ReactNode;
  className?: string;
} & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'children' | 'className'>;

const base =
  'inline-flex items-center justify-center gap-2 h-11 px-5 text-sm font-medium tracking-tight rounded-full transition-colors duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-paper';

const variants: Record<Variant, string> = {
  primary: 'bg-ink text-paper-pure hover:bg-ink-soft',
  ghost: 'text-ink border border-ink-line hover:border-ink hover:bg-ink hover:text-paper-pure',
};

export function Button({ href, variant = 'primary', children, className = '', ...rest }: Props) {
  return (
    <Link href={href} className={`${base} ${variants[variant]} ${className}`} {...rest}>
      {children}
    </Link>
  );
}
