'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface CartItem {
  productId: string;
  name: string;
  unitCents: number;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  add: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  remove: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  clear: () => void;
  count: () => number;
  subtotalCents: () => number;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (item, quantity = 1) =>
        set((s) => {
          const idx = s.items.findIndex((i) => i.productId === item.productId);
          if (idx >= 0) {
            const next = [...s.items];
            const existing = next[idx]!;
            next[idx] = { ...existing, quantity: existing.quantity + quantity };
            return { items: next };
          }
          return { items: [...s.items, { ...item, quantity }] };
        }),
      remove: (productId) =>
        set((s) => ({ items: s.items.filter((i) => i.productId !== productId) })),
      setQuantity: (productId, quantity) =>
        set((s) => ({
          items:
            quantity <= 0
              ? s.items.filter((i) => i.productId !== productId)
              : s.items.map((i) =>
                  i.productId === productId ? { ...i, quantity } : i,
                ),
        })),
      clear: () => set({ items: [] }),
      count: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
      subtotalCents: () =>
        get().items.reduce((sum, i) => sum + i.unitCents * i.quantity, 0),
    }),
    {
      name: 'bykebap-cart',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

export const DELIVERY_FEE_CENTS = 250;
export const FREE_DELIVERY_THRESHOLD_CENTS = 2000;

export function deliveryFor(subtotalCents: number, method: 'DELIVERY' | 'PICKUP'): number {
  if (method === 'PICKUP') return 0;
  return subtotalCents >= FREE_DELIVERY_THRESHOLD_CENTS ? 0 : DELIVERY_FEE_CENTS;
}
