import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { fetchOrder } from '../api';
import type { OrderResponse } from '../types';
import { CheckCircle2, Clock, ChefHat, UtensilsCrossed, XCircle } from 'lucide-react';

interface StatusInfo {
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  cardCls: string;
  iconCls: string;
}

const STATUS_MAP: Record<string, StatusInfo> = {
  pending:   { label: 'Order Received',   Icon: Clock,         cardCls: 'bg-slate-50 border-slate-200',   iconCls: 'text-slate-500' },
  confirmed: { label: 'Order Confirmed',  Icon: CheckCircle2,  cardCls: 'bg-blue-50 border-blue-200',     iconCls: 'text-blue-500' },
  preparing: { label: 'Being Prepared',   Icon: ChefHat,       cardCls: 'bg-blue-50 border-blue-200',     iconCls: 'text-blue-500' },
  ready:     { label: 'Ready to Serve',   Icon: CheckCircle2,  cardCls: 'bg-emerald-50 border-emerald-200', iconCls: 'text-emerald-500' },
  served:    { label: 'Served — Enjoy!',  Icon: UtensilsCrossed, cardCls: 'bg-gray-50 border-gray-200',  iconCls: 'text-gray-400' },
  cancelled: { label: 'Cancelled',        Icon: XCircle,       cardCls: 'bg-red-50 border-red-200',       iconCls: 'text-red-500' },
};

const POLL_INTERVAL_MS = 10_000;
const TERMINAL = new Set(['served', 'cancelled']);

export default function OrderStatusPage() {
  const navigate = useNavigate();
  const { orderId } = useParams<{ orderId: string }>();
  const [searchParams] = useSearchParams();
  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) return;

    const load = () =>
      fetchOrder(orderId)
        .then((data: OrderResponse) => setOrder(data))
        .catch(() => setError('Could not load order details.'))
        .finally(() => setLoading(false));

    load();

    // Poll for status updates until order reaches a terminal state
    const interval = setInterval(() => {
      if (order && TERMINAL.has(order.status)) {
        clearInterval(interval);
        return;
      }
      fetchOrder(orderId)
        .then((data: OrderResponse) => setOrder(data))
        .catch(() => { /* ignore polling errors */ });
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-2 pb-10" aria-hidden="true">
        <div className="bg-white border-b border-border px-4 pt-10 pb-10 text-center">
          <div className="mx-auto h-14 w-14 rounded-full bg-gray-200 animate-pulse" />
          <div className="mx-auto mt-3 h-8 w-56 rounded-xl bg-gray-200 animate-pulse" />
          <div className="mx-auto mt-2 h-5 w-24 rounded bg-gray-200 animate-pulse" />
        </div>
        <div className="max-w-lg mx-auto px-4 -mt-6 space-y-4">
          <div className="h-24 rounded-2xl bg-gray-200 animate-pulse" />
          <div className="h-48 rounded-2xl bg-gray-200 animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <p className="text-gray-600 text-center">{error ?? 'Order not found.'}</p>
      </div>
    );
  }

  const info = STATUS_MAP[order.status] ?? STATUS_MAP['pending'];
  const { Icon } = info;
  const tableParam = searchParams.get('table');
  const tableQuery = tableParam ? `?table=${encodeURIComponent(tableParam)}` : '';
  const menuSlug = sessionStorage.getItem('od_current_order_slug');
  const menuPath = menuSlug ? `/menu/${menuSlug}${tableQuery}` : '/';

  return (
    <div className="min-h-screen bg-surface-2 pb-10">
      {/* Header */}
      <div className="bg-brand text-white px-4 pt-10 pb-16 text-center">
        <Icon className={`w-14 h-14 mx-auto mb-3 text-white/90`} aria-hidden="true" />
        <h1 className="text-2xl font-extrabold">{info.label}</h1>
        {order.tableNumber && (
          <p className="text-white/80 text-base mt-1">Table {order.tableNumber}</p>
        )}
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-8 space-y-4">
        {/* Status card */}
        <div className={`rounded-2xl border p-4 ${info.cardCls}`}>
          <div className="flex items-center gap-2 mb-1">
            <Icon className={`w-5 h-5 ${info.iconCls}`} aria-hidden="true" />
            <span className="font-bold text-gray-900">{info.label}</span>
          </div>
          <p className="text-base text-muted">
            {!TERMINAL.has(order.status) && 'We\'ll keep updating this page automatically.'}
            {order.status === 'served' && 'Thank you for dining with us!'}
            {order.status === 'cancelled' && 'Please speak to a staff member if you have questions.'}
          </p>
        </div>

        {/* Order items */}
        <div className="bg-white rounded-2xl border border-border p-4">
          <h2 className="font-bold text-gray-900 mb-3">Order Summary</h2>
          <div className="space-y-2">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between text-base">
                <span className="text-gray-700">
                  {item.quantity}× {item.name}
                </span>
                <span className="font-semibold text-gray-900">
                  ₹{(item.price * item.quantity).toFixed(0)}
                </span>
              </div>
            ))}
          </div>
          <div className="border-t border-border mt-3 pt-3 flex justify-between font-bold text-gray-900">
            <span>Total</span>
            <span>₹{order.subtotal.toFixed(0)}</span>
          </div>
          <p className="text-base text-muted mt-1">Pay at counter · Order #{order.id.slice(0, 8).toUpperCase()}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => navigate(`/orders${tableQuery}`)}
            className="w-full min-h-11 rounded-xl border border-brand/30 bg-white px-4 py-2.5 text-base font-semibold text-brand hover:bg-brand/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            Back To Orders
          </button>
          <button
            type="button"
            onClick={() => navigate(menuPath)}
            className="w-full min-h-11 rounded-xl bg-brand px-4 py-2.5 text-base font-semibold text-white hover:bg-brand-dark transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            Back To Menu
          </button>
        </div>

        <p className="text-center text-base text-muted">Hi {order.customerName}, your order has been received.</p>
      </div>
    </div>
  );
}
