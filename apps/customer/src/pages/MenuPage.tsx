import { useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { fetchMenu } from '../api';
import useCartStore from '../store/cartStore';
import MenuItemCard from '../components/MenuItemCard';
import CartBar from '../components/CartBar';
import type { MenuResponse, MenuCategory } from '../types';
import { Search, X, UtensilsCrossed, Leaf } from 'lucide-react';

export default function MenuPage() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const tableId = searchParams.get('table');
  const navigate = useNavigate();

  const [menu, setMenu] = useState<MenuResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [vegOnly, setVegOnly] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { setRestaurant, setTable, restaurantSlug } = useCartStore();

  // Debounce search input
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setSearchQuery(searchInput), 150);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchInput]);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    fetchMenu(slug, tableId)
      .then((data: MenuResponse) => {
        setMenu(data);
        setRestaurant({ id: data.restaurant.id, slug: data.restaurant.slug, name: data.restaurant.name });
        setTable(data.table);
        if (data.categories.length > 0) setActiveCategory(data.categories[0].id);
      })
      .catch(() => setError('Could not load menu. Please try scanning the QR code again.'))
      .finally(() => setLoading(false));
  }, [slug, tableId, setRestaurant, setTable]);

  // If cart already has items for a different restaurant, reset
  useEffect(() => {
    if (restaurantSlug && slug && restaurantSlug !== slug) {
      useCartStore.getState().clearCart();
    }
  }, [slug, restaurantSlug]);

  const filteredCategories: MenuCategory[] = (menu?.categories ?? [])
    .map((cat) => ({
      ...cat,
      items: cat.items.filter((item) => {
        if (vegOnly && !item.isVegetarian && !item.isVegan) return false;
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          return item.name.toLowerCase().includes(q) || (item.description ?? '').toLowerCase().includes(q);
        }
        return true;
      }),
    }))
    .filter((cat) => cat.items.length > 0);

  const handleCheckout = () => {
    if (!slug) return;
    navigate(`/checkout/${slug}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-2 pb-16" aria-hidden="true">
        <div className="bg-white px-4 pt-8 pb-12 border-b border-border">
          <div className="max-w-lg mx-auto space-y-3">
            <div className="h-8 w-56 rounded-xl bg-gray-200 animate-pulse" />
            <div className="h-5 w-32 rounded bg-gray-200 animate-pulse" />
          </div>
        </div>
        <div className="max-w-lg mx-auto px-4 -mt-6 space-y-4">
          <div className="h-12 rounded-2xl bg-gray-200 animate-pulse" />
          <div className="h-11 w-32 rounded-full bg-gray-200 animate-pulse" />
          <div className="space-y-3">
            <div className="h-24 rounded-2xl bg-gray-200 animate-pulse" />
            <div className="h-24 rounded-2xl bg-gray-200 animate-pulse" />
            <div className="h-24 rounded-2xl bg-gray-200 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !menu) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center max-w-xs">
          <UtensilsCrossed className="w-12 h-12 text-gray-300 mx-auto mb-4" aria-hidden="true" />
          <p className="text-gray-700 font-medium">{error ?? 'Menu not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-2 pb-32">
      {/* Header */}
      <div className="bg-brand text-white px-4 pt-8 pb-16">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-3 mb-1">
            {menu.restaurant.logoUrl && (
              <img
                src={menu.restaurant.logoUrl}
                alt={`${menu.restaurant.name} logo`}
                className="w-10 h-10 rounded-full object-cover border-2 border-white/40"
              />
            )}
            <h1 className="text-xl font-bold">{menu.restaurant.name}</h1>
          </div>
          {menu.table && (
            <p className="text-white/80 text-base mt-1">
              Table {menu.table.table_number}
            </p>
          )}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-10">
        {/* Search bar */}
        <div className="relative mb-4">
          <label htmlFor="menu-search" className="sr-only">Search dishes</label>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" aria-hidden="true" />
          <input
            id="menu-search"
            type="search"
            placeholder="Search dishes…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full bg-white border border-border rounded-2xl pl-9 pr-9 py-3
                       text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-brand"
          />
          {searchInput && (
            <button
              onClick={() => setSearchInput('')}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-11 w-11 flex items-center justify-center text-muted hover:text-gray-700"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Veg filter */}
        <button
          onClick={() => setVegOnly((v) => !v)}
          className={`inline-flex items-center gap-1.5 text-base font-semibold px-4 min-h-11 rounded-full
                       border transition-colors mb-5 ${
            vegOnly
              ? 'bg-green-200 text-green-900 border-green-300'
              : 'bg-white text-green-800 border-green-300 hover:border-green-500'
          }`}
        >
          <Leaf className="w-3.5 h-3.5" aria-hidden="true" />
          Veg Only
        </button>

        {/* Category tabs */}
        {!searchQuery && (
          <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-hide">
            {menu.categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setActiveCategory(cat.id);
                  document.getElementById(`cat-${cat.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className={`flex-shrink-0 px-4 min-h-11 rounded-full text-base font-semibold
                             border transition-colors ${
                  activeCategory === cat.id
                    ? 'bg-brand text-white border-brand'
                    : 'bg-white text-gray-700 border-border hover:border-brand'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}

        {/* Menu */}
        {filteredCategories.length === 0 ? (
          <div className="text-center py-16 text-muted">
            <UtensilsCrossed className="w-10 h-10 mx-auto mb-3 text-gray-200" aria-hidden="true" />
            <p className="text-base">No items found</p>
          </div>
        ) : (
          filteredCategories.map((cat) => (
            <section key={cat.id} id={`cat-${cat.id}`} className="mb-8">
              <h2 className="text-base font-bold text-gray-900 mb-3">{cat.name}</h2>
              <div className="space-y-3">
                {cat.items.map((item) => (
                  <MenuItemCard key={item.id} item={item} />
                ))}
              </div>
            </section>
          ))
        )}
      </div>

      <CartBar onCheckout={handleCheckout} />
    </div>
  );
}
