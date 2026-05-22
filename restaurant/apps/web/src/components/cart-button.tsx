'use client';

import { ShoppingBag } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { useCart } from '@/lib/cart-store';
import { useEffect, useState } from 'react';

export function CartButton({ label }: { label: string }) {
  const count = useCart((s) => s.count());
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <Link
      href="/cart"
      aria-label={label}
      className="relative inline-flex items-center gap-2 rounded-full border border-charcoal-100 bg-cream-50 px-4 py-2.5 text-sm font-semibold text-charcoal-900 transition hover:border-brand-500 hover:text-brand-500"
    >
      <ShoppingBag className="h-4 w-4" />
      <span className="hidden sm:inline">{label}</span>
      {mounted && count > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-brand-500 px-1.5 text-[10px] font-bold text-cream-50 shadow-glow animate-scale-in">
          {count}
        </span>
      )}
    </Link>
  );
}
