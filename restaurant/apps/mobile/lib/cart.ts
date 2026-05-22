import { create } from 'zustand';

export interface CartItem {
  productId: string;
  name: string;
  unitCents: number;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  add: (item: Omit<CartItem, 'quantity'>, qty?: number) => void;
  remove: (productId: string) => void;
  setQty: (productId: string, qty: number) => void;
  clear: () => void;
  count: () => number;
  subtotalCents: () => number;
}

export const useCart = create<CartState>((set, get) => ({
  items: [],
  add: (item, qty = 1) =>
    set((s) => {
      const idx = s.items.findIndex((i) => i.productId === item.productId);
      if (idx >= 0) {
        const next = [...s.items];
        const ex = next[idx]!;
        next[idx] = { ...ex, quantity: ex.quantity + qty };
        return { items: next };
      }
      return { items: [...s.items, { ...item, quantity: qty }] };
    }),
  remove: (productId) =>
    set((s) => ({ items: s.items.filter((i) => i.productId !== productId) })),
  setQty: (productId, qty) =>
    set((s) => ({
      items:
        qty <= 0
          ? s.items.filter((i) => i.productId !== productId)
          : s.items.map((i) => (i.productId === productId ? { ...i, quantity: qty } : i)),
    })),
  clear: () => set({ items: [] }),
  count: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
  subtotalCents: () => get().items.reduce((sum, i) => sum + i.unitCents * i.quantity, 0),
}));
