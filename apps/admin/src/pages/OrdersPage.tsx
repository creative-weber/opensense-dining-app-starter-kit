import { useEffect, useState, useCallback } from 'react';
import api from '../api';
import { handleApiError } from '../utils/errorHandler';
import type { Order } from '../types';
import { RefreshCw } from 'lucide-react';
import { useOrderStream } from '../hooks/useOrderStream';

const STATUS_OPTIONS = ['confirmed', 'preparing', 'ready', 'served', 'cancelled'] as const;
const STATUS_LABELS: Record<string, string> = {
  pending:   'Pending',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  ready:     'Ready',
  served:    'Served',
  cancelled: 'Cancelled',
};
const STATUS_COLORS: Record<string, string> = {
  pending:   'bg-slate-100 text-slate-700',
  confirmed: 'bg-blue-100 text-blue-800',
  preparing: 'bg-indigo-100 text-indigo-800',
  ready:     'bg-emerald-100 text-emerald-800',
  served:    'bg-gray-100 text-gray-600',
  cancelled: 'bg-red-100 text-red-700',
};
const FILTER_TABS = ['all', 'pending', 'confirmed', 'preparing', 'ready', 'served', 'cancelled'];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [updating, setUpdating] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    const url = filter === 'all' ? '/admin/orders' : `/admin/orders?status=${filter}`;
    try {
      const { data } = await api.get<Order[]>(url);
      setOrders(data);
    } catch (err: unknown) {
      handleApiError(err, { operation: 'fetch orders', page: 'OrdersPage' });
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { void loadOrders(); }, [loadOrders]);

  // Live order updates via SSE
  useOrderStream(useCallback((type, order) => {
    if (type === 'order_new') {
      // If an older API instance emits partial order data, reload to fetch full item details.
      if (!order.items || !order.customer_name || !order.customer_phone || !order.created_at) {
        void loadOrders();
        return;
      }
      setOrders((prev) => {
        // Only prepend if the current filter matches or is 'all'
        if (filter !== 'all' && filter !== order.status) return prev;
        // Avoid duplicates
        if (prev.some((o) => o.id === order.id)) return prev;
        return [order, ...prev];
      });
    } else {
      setOrders((prev) => prev.map((o) => o.id === order.id ? { ...o, ...order } : o));
    }
  }, [filter, loadOrders]));

  const handleStatusChange = async (orderId: string, status: string) => {
    setUpdating(orderId);
    try {
      await api.patch(`/admin/orders/${orderId}/status`, { status });
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status } : o));
    } catch (err: unknown) {
      handleApiError(err, { operation: 'update order status', page: 'OrdersPage' });
    } finally {
      setUpdating(null);
    }
  };

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <button onClick={() => void loadOrders()}
          className="flex items-center gap-1.5 text-base text-muted hover:text-brand transition-colors px-3 py-2.5 rounded-xl hover:bg-brand/5">
          <RefreshCw className="w-4 h-4" aria-hidden="true" /> Refresh
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTER_TABS.map((tab) => (
          <button key={tab} onClick={() => setFilter(tab)}
            className={`flex-shrink-0 px-4 min-h-11 rounded-full text-base font-semibold border transition-colors capitalize ${
              filter === tab
                ? 'bg-brand text-white border-brand'
                : 'bg-white text-gray-600 border-border hover:border-brand'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {loading && (
        <div className="space-y-3" aria-hidden="true">
          <div className="h-28 rounded-2xl bg-gray-200 animate-pulse" />
          <div className="h-28 rounded-2xl bg-gray-200 animate-pulse" />
        </div>
      )}
      {!loading && orders.length === 0 && (
        <p className="text-base text-muted">No orders found.</p>
      )}

      <div className="space-y-3">
        {orders.map((order) => (
          <div key={order.id} className="bg-white rounded-2xl border border-border p-4">
            <div className="flex items-start justify-between gap-2 mb-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-gray-900">#{order.id.slice(0, 8).toUpperCase()}</span>
                  {order.table_number && (
                    <span className="text-base font-medium bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
                      Table {order.table_number}
                    </span>
                  )}
                  <span className={`text-base font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-700'}`}>
                    {STATUS_LABELS[order.status] ?? order.status}
                  </span>
                </div>
                <p className="text-base text-muted mt-0.5">
                  {order.customer_name} · {order.customer_phone} · {formatTime(order.created_at)}
                </p>
              </div>
              <span className="font-bold text-gray-900 flex-shrink-0">₹{Number(order.subtotal).toFixed(0)}</span>
            </div>

            {order.items && order.items.length > 0 && (
              <div className="mb-3 rounded-lg bg-gray-50 border border-gray-200 px-3 py-2">
                <p className="text-base font-medium text-gray-800 mb-1">Items</p>
                <ul className="space-y-1">
                  {order.items.map((item, idx) => (
                    <li
                      key={item.id ?? `${order.id}-${item.name}-${idx}`}
                      className="text-base text-gray-700 flex items-start justify-between gap-3"
                    >
                      <span className="min-w-0">{item.quantity}x {item.name}</span>
                      <span className="font-medium text-gray-900">₹{Number(item.price).toFixed(0)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {order.notes && (
              <p className="text-base text-muted italic mb-3 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5">
                Note: {order.notes}
              </p>
            )}

            {/* Status action buttons */}
            {!['served', 'cancelled'].includes(order.status) && (
              <div className="flex gap-2 flex-wrap">
                {STATUS_OPTIONS.map((s) => (
                  <button key={s}
                    onClick={() => void handleStatusChange(order.id, s)}
                    disabled={updating === order.id || order.status === s}
                    className={`text-base font-semibold px-4 min-h-11 rounded-lg border transition-colors
                                disabled:opacity-40 capitalize ${
                      order.status === s
                        ? 'bg-brand text-white border-brand'
                        : 'bg-white text-gray-600 border-border hover:border-brand hover:text-brand'
                    }`}
                  >
                    {updating === order.id ? '…' : STATUS_LABELS[s]}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
