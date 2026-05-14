import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import useCartStore from '../store/cartStore';
import { placeOrder } from '../api';
import { Minus, Plus, Trash2 } from 'lucide-react';

const SS_PHONE = 'od_phone';
const SS_NAME  = 'od_name';
const SS_ACTIVE_ORDER_IDS = 'od_active_order_ids';
const SS_CURRENT_ORDER_SLUG = 'od_current_order_slug';

export default function CheckoutPage() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const { restaurantId, restaurantName, tableId: cartTableId, tableNumber, items, addItem, removeItem, clearCart, getSubtotal } = useCartStore();
  const tableId = searchParams.get('table') ?? cartTableId;
  const tableQuery = tableId ? `?table=${encodeURIComponent(tableId)}` : '';
  const menuPath = slug ? `/menu/${slug}${tableQuery}` : '/';
  const subtotal = getSubtotal();

  const [name, setName]   = useState(() => sessionStorage.getItem(SS_NAME)  ?? '');
  const [phone, setPhone] = useState(() => sessionStorage.getItem(SS_PHONE) ?? '');
  const [notes, setNotes] = useState('');
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if cart is empty
  useEffect(() => {
    if (items.length === 0) navigate(menuPath, { replace: true });
  }, [items.length, navigate, menuPath]);

  const validatePhone = (v: string) => {
    if (!v.trim()) return 'Phone number is required';
    if (!/^\+?[0-9]{7,15}$/.test(v.trim())) return 'Enter a valid phone number';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const pErr = validatePhone(phone);
    if (pErr) { setPhoneError(pErr); return; }
    if (!name.trim() || !restaurantId) return;

    sessionStorage.setItem(SS_NAME, name.trim());
    sessionStorage.setItem(SS_PHONE, phone.trim());

    setLoading(true);
    setError(null);
    try {
      const { orderId } = await placeOrder({
        restaurantId,
        tableId: tableId ?? undefined,
        customerName: name.trim(),
        customerPhone: phone.trim(),
        notes: notes.trim() || undefined,
        items: items.map((i) => ({ menuItemId: i.id, quantity: i.quantity })),
      });
      const rawIds = sessionStorage.getItem(SS_ACTIVE_ORDER_IDS);
      let activeIds: string[] = [];
      if (rawIds) {
        try {
          activeIds = JSON.parse(rawIds) as string[];
        } catch {
          activeIds = [];
        }
      }
      if (!activeIds.includes(orderId)) activeIds.unshift(orderId);
      sessionStorage.setItem(SS_ACTIVE_ORDER_IDS, JSON.stringify(activeIds));
      if (slug) sessionStorage.setItem(SS_CURRENT_ORDER_SLUG, slug);
      clearCart();
      navigate(`/order/${orderId}${tableQuery}`, { replace: true });
    } catch (err: unknown) {
      const e = err as { data?: { message?: string } };
      setError(e.data?.message ?? 'Could not place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-2 pb-10">
      {/* Header */}
      <div className="bg-brand text-white px-4 pt-8 pb-6">
        <div className="max-w-lg mx-auto">
          <button onClick={() => navigate(menuPath)} className="text-white/80 text-base mb-2 hover:text-white min-h-11">
            ← Back to menu
          </button>
          <h1 className="text-xl font-bold">{restaurantName}</h1>
          {tableNumber && <p className="text-white/80 text-base">Table {tableNumber}</p>}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 mt-6 space-y-5">
        <button
          type="button"
          onClick={() => navigate(menuPath)}
          className="w-full min-h-11 rounded-xl border border-brand/30 bg-white px-4 py-2.5 text-base font-semibold text-brand hover:bg-brand/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        >
          + Add More Items
        </button>

        {/* Order summary */}
        <div className="bg-white rounded-2xl border border-border p-4">
          <h2 className="font-bold text-gray-900 mb-3">Your Order</h2>
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => removeItem(item.id)}
                    aria-label={`Remove ${item.name}`}
                    className="w-11 h-11 flex items-center justify-center rounded-full border border-gray-200
                               text-muted hover:border-red-300 hover:text-red-500 transition-colors"
                  >
                    {item.quantity === 1
                      ? <Trash2 className="w-4 h-4" aria-hidden="true" />
                      : <Minus className="w-4 h-4" aria-hidden="true" />}
                  </button>
                  <span className="w-6 text-center text-base font-bold">{item.quantity}</span>
                  <button
                    onClick={() => addItem(item)}
                    aria-label={`Add ${item.name}`}
                    className="w-11 h-11 flex items-center justify-center rounded-full bg-brand text-white
                               hover:bg-brand-dark transition-colors"
                  >
                    <Plus className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
                <span className="flex-1 text-base text-gray-800 line-clamp-1">{item.name}</span>
                <span className="text-base font-semibold text-gray-900">
                  ₹{(item.price * item.quantity).toFixed(0)}
                </span>
              </div>
            ))}
          </div>
          <div className="border-t border-border mt-4 pt-3 flex justify-between">
            <span className="font-semibold text-gray-900">Subtotal</span>
            <span className="font-bold text-gray-900">₹{subtotal.toFixed(0)}</span>
          </div>
          <p className="text-base text-muted mt-1">Pay at counter after your meal.</p>
        </div>

        {/* Customer details form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-border p-4 space-y-4">
          <h2 className="font-bold text-gray-900">Your Details</h2>

          <div>
            <label htmlFor="name" className="block text-base font-medium text-gray-600 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ravi Kumar"
              className="w-full border border-border rounded-xl px-3 py-2.5 text-base
                         focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-base font-medium text-gray-600 mb-1">
              Phone <span className="text-red-500">*</span>
            </label>
            <input
              id="phone"
              type="tel"
              required
              value={phone}
              onChange={(e) => { setPhone(e.target.value); setPhoneError(null); }}
              placeholder="e.g. 9876543210"
              className={`w-full border rounded-xl px-3 py-2.5 text-base
                          focus:outline-none focus:ring-2 focus:ring-brand ${
                phoneError ? 'border-red-400' : 'border-border'
              }`}
            />
            {phoneError && <p className="text-base text-red-600 mt-1">{phoneError}</p>}
          </div>

          <div>
            <label htmlFor="notes" className="block text-base font-medium text-gray-600 mb-1">
              Special instructions (optional)
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="e.g. Less spicy, extra sauce…"
              maxLength={500}
              className="w-full border border-border rounded-xl px-3 py-2.5 text-base resize-none
                         focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>

          {error && (
            <p className="text-base text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand hover:bg-brand-dark text-white font-bold
                       py-3.5 rounded-2xl transition-colors disabled:opacity-60
                       focus-visible:ring-2 focus-visible:ring-brand"
          >
            {loading ? 'Placing Order…' : `Place Order · ₹${subtotal.toFixed(0)}`}
          </button>
        </form>
      </div>
    </div>
  );
}
