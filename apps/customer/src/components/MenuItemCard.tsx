import { useState } from 'react';
import type { MenuItem } from '../types';
import useCartStore from '../store/cartStore';
import { UtensilsCrossed, Plus, Minus } from 'lucide-react';

interface MenuItemCardProps {
  item: MenuItem;
}

export default function MenuItemCard({ item }: MenuItemCardProps) {
  const addItem = useCartStore((s) => s.addItem);
  const removeItem = useCartStore((s) => s.removeItem);
  const cartItems = useCartStore((s) => s.items);
  const [imgError, setImgError] = useState(false);

  const cartItem = cartItems.find((i) => i.id === item.id);
  const quantity = cartItem?.quantity ?? 0;

  return (
    <div className="bg-white border border-border rounded-2xl flex gap-3 p-3 shadow-sm">
      {/* Thumbnail */}
      {item.imageUrl && !imgError ? (
        <img
          src={item.imageUrl}
          alt={item.name}
          loading="lazy"
          onError={() => setImgError(true)}
          className="w-20 h-20 object-cover rounded-xl flex-shrink-0"
        />
      ) : (
        <div className="w-20 h-20 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <UtensilsCrossed className="w-7 h-7 text-gray-300" aria-hidden="true" />
        </div>
      )}

      {/* Details */}
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-1.5 mb-0.5">
            {/* Veg / Non-veg indicator dot */}
            <span
              aria-label={item.isVegan ? 'Vegan' : item.isVegetarian ? 'Vegetarian' : 'Non-vegetarian'}
              title={item.isVegan ? 'Vegan' : item.isVegetarian ? 'Vegetarian' : 'Non-vegetarian'}
              className={`inline-block w-3 h-3 rounded-sm border-2 flex-shrink-0 ${
                item.isVegan
                  ? 'border-violet-500 bg-violet-400'
                  : item.isVegetarian
                  ? 'border-green-500 bg-green-400'
                  : 'border-red-500 bg-red-400'
              }`}
            />
            <h3 className="text-base font-semibold text-gray-900 line-clamp-2 leading-snug">
              {item.name}
            </h3>
          </div>
          {item.description && (
            <p className="text-base text-muted line-clamp-2 mt-0.5">{item.description}</p>
          )}
        </div>

        {/* Price + Add/Remove */}
        <div className="flex items-center justify-between mt-2">
          <span className="text-base font-bold text-gray-900">₹{item.price.toFixed(0)}</span>
          {quantity === 0 ? (
            <button
              onClick={() => addItem(item)}
              className="flex items-center gap-1 bg-brand hover:bg-brand-dark text-white
                         text-base font-semibold px-4 min-h-11 rounded-xl transition-colors
                         tap-highlight-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              Add
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => removeItem(item.id)}
                aria-label={`Remove one ${item.name}`}
                className="w-11 h-11 flex items-center justify-center rounded-full
                           border border-brand text-brand hover:bg-brand hover:text-white
                           transition-colors tap-highlight-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                <Minus className="w-4 h-4" aria-hidden="true" />
              </button>
              <span className="text-base font-bold w-6 text-center">{quantity}</span>
              <button
                onClick={() => addItem(item)}
                aria-label={`Add one more ${item.name}`}
                className="w-11 h-11 flex items-center justify-center rounded-full
                           bg-brand text-white hover:bg-brand-dark
                           transition-colors tap-highlight-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                <Plus className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
