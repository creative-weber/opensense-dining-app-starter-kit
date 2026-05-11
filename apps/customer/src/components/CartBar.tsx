import useCartStore from '../store/cartStore';
import { ShoppingCart } from 'lucide-react';

interface CartBarProps {
  onCheckout: () => void;
}

export default function CartBar({ onCheckout }: CartBarProps) {
  const subtotal = useCartStore((s) => s.getSubtotal());
  const totalItems = useCartStore((s) => s.getTotalItems());

  if (totalItems === 0) return null;

  return (
    <div
      role="region"
      aria-label="Cart"
      className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white border-t border-border"
    >
      <button
        onClick={onCheckout}
        className="max-w-lg mx-auto flex items-center justify-between
                   bg-brand hover:bg-brand-dark active:bg-brand-dark
                   text-white rounded-2xl px-5 py-4 w-full shadow-lg
                   transition-colors tap-highlight-none
                   focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
      >
        <span className="flex items-center gap-1.5 bg-white/20 rounded-lg px-2.5 py-1 text-base font-semibold">
          <ShoppingCart className="w-4 h-4" aria-hidden="true" />
          {totalItems} {totalItems === 1 ? 'item' : 'items'}
        </span>
        <span className="font-semibold text-base">View Cart</span>
        <span className="font-semibold">₹{subtotal.toFixed(0)}</span>
      </button>
    </div>
  );
}
