import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { fetchOrder } from '../api';
import type { OrderResponse } from '../types';
import { CheckCircle2, ChefHat, Clock, UtensilsCrossed, XCircle } from 'lucide-react';

interface StatusInfo {
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  cardCls: string;
  iconCls: string;
}

const SS_ACTIVE_ORDER_IDS = 'od_active_order_ids';
const SS_CURRENT_ORDER_SLUG = 'od_current_order_slug';

const STATUS_MAP: Record<string, StatusInfo> = {
  pending: { label: 'Order Received', Icon: Clock, cardCls: 'bg-slate-50 border-slate-200', iconCls: 'text-slate-500' },
  confirmed: { label: 'Order Confirmed', Icon: CheckCircle2, cardCls: 'bg-blue-50 border-blue-200', iconCls: 'text-blue-500' },
  preparing: { label: 'Being Prepared', Icon: ChefHat, cardCls: 'bg-blue-50 border-blue-200', iconCls: 'text-blue-500' },
  ready: { label: 'Ready to Serve', Icon: CheckCircle2, cardCls: 'bg-emerald-50 border-emerald-200', iconCls: 'text-emerald-500' },
  served: { label: 'Served', Icon: UtensilsCrossed, cardCls: 'bg-gray-50 border-gray-200', iconCls: 'text-gray-400' },
  cancelled: { label: 'Cancelled', Icon: XCircle, cardCls: 'bg-red-50 border-red-200', iconCls: 'text-red-500' },
};

const TERMINAL = new Set(['served', 'cancelled', 'delivered']);
const POLL_INTERVAL_MS = 10_000;

export default function ActiveOrdersPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const tableParam = searchParams.get('table');
  const tableQuery = tableParam ? `?table=${encodeURIComponent(tableParam)}` : '';
  const menuSlug = sessionStorage.getItem(SS_CURRENT_ORDER_SLUG);
  const menuPath = menuSlug ? `/menu/${menuSlug}${tableQuery}` : '/';

  useEffect(() => {
    let cancelled = false;

    const loadActiveOrders = async () => {
      const rawIds = sessionStorage.getItem(SS_ACTIVE_ORDER_IDS);
      let ids: string[] = [];
      if (rawIds) {
        try {
          ids = JSON.parse(rawIds) as string[];
        } catch {
          ids = [];
        }
      }

      if (ids.length === 0) {
        if (!cancelled) {
          setOrders([]);
          setLoading(false);
        }
        return;
      }

      const results = await Promise.all(
        ids.map(async (id) => {
          try {
            return await fetchOrder(id);
          } catch {
            return null;
          }
        })
      );

      const activeOrders = results
        .filter((o): o is OrderResponse => Boolean(o) && !TERMINAL.has((o as OrderResponse).status))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      sessionStorage.setItem(SS_ACTIVE_ORDER_IDS, JSON.stringify(activeOrders.map((o) => o.id)));

      if (!cancelled) {
        setOrders(activeOrders);
        setLoading(false);
      }
    };

    void loadActiveOrders();
    const interval = setInterval(() => {
      void loadActiveOrders();
    }, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-2 pb-10" aria-hidden="true">
        <div className="bg-white border-b border-border px-4 pt-10 pb-10 text-center">
          <div className="mx-auto h-8 w-48 rounded-xl bg-gray-200 animate-pulse" />
          <div className="mx-auto mt-2 h-5 w-28 rounded bg-gray-200 animate-pulse" />
        </div>
        <div className="max-w-lg mx-auto px-4 mt-6 space-y-4">
          <div className="h-24 rounded-2xl bg-gray-200 animate-pulse" />
          <div className="h-24 rounded-2xl bg-gray-200 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-2 pb-10">
      <div className="bg-brand text-white px-4 pt-10 pb-8">
        <div className="max-w-lg mx-auto">
          <h1 className="text-2xl font-extrabold">Your Active Orders</h1>
          <p className="text-white/80 text-base mt-1">
            {orders.length} active order{orders.length === 1 ? '' : 's'}
          </p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-4 space-y-4">
        {orders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-border p-5 text-center">
            <p className="text-base text-gray-700 font-semibold">No active orders right now.</p>
            <p className="text-base text-muted mt-1">Place a new order from the menu.</p>
          </div>
        ) : (
          orders.map((order) => {
            const info = STATUS_MAP[order.status] ?? STATUS_MAP.pending;
            const { Icon } = info;
            return (
              <div key={order.id} className="bg-white rounded-2xl border border-border p-4 space-y-3">
                <div className={`rounded-xl border p-3 ${info.cardCls}`}>
                  <div className="flex items-center gap-2">
                    <Icon className={`w-5 h-5 ${info.iconCls}`} aria-hidden="true" />
                    <span className="font-bold text-gray-900">{info.label}</span>
                  </div>
                  <p className="text-base text-muted mt-1">
                    Order #{order.id.slice(0, 8).toUpperCase()} · ₹{order.subtotal.toFixed(0)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate(`/order/${order.id}${tableQuery}`)}
                  className="w-full min-h-11 rounded-xl border border-brand/30 bg-white px-4 py-2.5 text-base font-semibold text-brand hover:bg-brand/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                >
                  View Order Details
                </button>
              </div>
            );
          })
        )}

        <button
          type="button"
          onClick={() => navigate(menuPath)}
          className="w-full min-h-11 rounded-xl bg-brand px-4 py-2.5 text-base font-semibold text-white hover:bg-brand-dark transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        >
          Back To Menu
        </button>
      </div>
    </div>
  );
}
