import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { MenuItem, CartItem } from '../types';

interface CartStore {
  restaurantId: string | null;
  restaurantSlug: string | null;
  restaurantName: string;
  tableId: string | null;
  tableNumber: string | null;
  items: CartItem[];

  setRestaurant: (data: { id: string; slug: string; name: string }) => void;
  setTable: (table: { id: string; table_number: string } | null) => void;
  addItem: (item: MenuItem) => void;
  removeItem: (itemId: string) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getSubtotal: () => number;
}

const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      restaurantId: null,
      restaurantSlug: null,
      restaurantName: '',
      tableId: null,
      tableNumber: null,
      items: [],

      setRestaurant: (data) =>
        set({ restaurantId: data.id, restaurantSlug: data.slug, restaurantName: data.name }),

      setTable: (table) =>
        set({ tableId: table?.id ?? null, tableNumber: table?.table_number ?? null }),

      addItem: (item) => {
        const { items } = get();
        const existing = items.find((i) => i.id === item.id);
        if (existing) {
          set({ items: items.map((i) => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i) });
        } else {
          set({ items: [...items, { ...item, quantity: 1 }] });
        }
      },

      removeItem: (itemId) => {
        const { items } = get();
        const existing = items.find((i) => i.id === itemId);
        if (!existing) return;
        if (existing.quantity > 1) {
          set({ items: items.map((i) => i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i) });
        } else {
          set({ items: items.filter((i) => i.id !== itemId) });
        }
      },

      clearCart: () => set({ items: [], tableId: null, tableNumber: null }),

      getTotalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
      getSubtotal: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    }),
    {
      name: 'opendining-cart',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);

export default useCartStore;
