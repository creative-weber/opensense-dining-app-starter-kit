import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { LogOut, RefreshCw, ShieldCheck, Wifi, WifiOff } from 'lucide-react';
import {
  clearKdsSession,
  getKdsRestaurantId,
  getKdsStreamUrl,
  getKdsToken,
  kdsAuth,
  kdsPatchOrderStatus,
  setKdsSession,
} from '../api/kds';
import { toast } from '../utils/toast';

interface KdsOrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  notes: string | null;
}

interface KdsOrder {
  id: string;
  customer_name: string;
  customer_phone: string;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'served' | 'cancelled';
  subtotal: number;
  notes: string | null;
  created_at: string;
  table_number: string | null;
  items: KdsOrderItem[];
}

type StreamState = 'idle' | 'connecting' | 'live' | 'reconnecting' | 'offline';

const TERMINAL = new Set(['served', 'cancelled']);

const NEXT_STATUS: Record<string, { label: string; value: KdsOrder['status'] } | undefined> = {
  pending: { label: 'Mark Preparing', value: 'preparing' },
  confirmed: { label: 'Mark Preparing', value: 'preparing' },
  preparing: { label: 'Mark Ready', value: 'ready' },
  ready: { label: 'Mark Served', value: 'served' },
};

function sortByOldest(orders: KdsOrder[]): KdsOrder[] {
  return [...orders].sort((a, b) => {
    const first = new Date(a.created_at).getTime();
    const second = new Date(b.created_at).getTime();
    return first - second;
  });
}

function sanitizeOrder(raw: unknown): KdsOrder | null {
  if (!raw || typeof raw !== 'object') return null;
  const candidate = raw as Partial<KdsOrder>;

  if (!candidate.id || !candidate.status || !candidate.created_at) return null;

  return {
    id: candidate.id,
    customer_name: candidate.customer_name ?? 'Guest',
    customer_phone: candidate.customer_phone ?? '-',
    status: candidate.status,
    subtotal: Number(candidate.subtotal ?? 0),
    notes: candidate.notes ?? null,
    created_at: candidate.created_at,
    table_number: candidate.table_number ?? null,
    items: Array.isArray(candidate.items)
      ? candidate.items.map((item) => ({
          id: item.id,
          name: item.name,
          price: Number(item.price),
          quantity: Number(item.quantity),
          notes: item.notes ?? null,
        }))
      : [],
  };
}

function mergeOrder(previous: KdsOrder[], incoming: KdsOrder): KdsOrder[] {
  if (TERMINAL.has(incoming.status)) {
    return previous.filter((order) => order.id !== incoming.id);
  }

  const exists = previous.some((order) => order.id === incoming.id);
  if (!exists) {
    return sortByOldest([incoming, ...previous]);
  }

  return sortByOldest(previous.map((order) => (order.id === incoming.id ? { ...order, ...incoming } : order)));
}

function ageTone(createdAt: string): string {
  const ageInMinutes = (Date.now() - new Date(createdAt).getTime()) / 60_000;
  if (ageInMinutes >= 10) return 'bg-red-50 border-red-300';
  if (ageInMinutes >= 5) return 'bg-amber-50 border-amber-300';
  return 'bg-white border-gray-200';
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export default function KDSPage() {
  const { restaurantSlug } = useParams<{ restaurantSlug: string }>();
  const [searchParams] = useSearchParams();
  const restaurantIdFromUrl = (searchParams.get('rid') ?? '').trim();
  const validRestaurantIdFromUrl = isUuid(restaurantIdFromUrl) ? restaurantIdFromUrl : '';

  const [token, setToken] = useState<string | null>(() => getKdsToken());
  const [restaurantId, setRestaurantId] = useState(() => validRestaurantIdFromUrl || getKdsRestaurantId() || '');
  const [pin, setPin] = useState('');
  const [authenticating, setAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [orders, setOrders] = useState<KdsOrder[]>([]);
  const [streamState, setStreamState] = useState<StreamState>('idle');
  const [streamError, setStreamError] = useState<string | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [streamVersion, setStreamVersion] = useState(0);

  useEffect(() => {
    if (validRestaurantIdFromUrl) {
      setRestaurantId(validRestaurantIdFromUrl);
    }
  }, [validRestaurantIdFromUrl]);

  const canAuthenticate = pin.length >= 4 && pin.length <= 6 && (!!restaurantSlug || !!restaurantId);

  const clearSession = useCallback(() => {
    clearKdsSession();
    setToken(null);
    setOrders([]);
    setPin('');
    setAuthError(null);
    setStreamError(null);
    setStreamState('idle');
  }, []);

  const submitPin = useCallback(async () => {
    if (!canAuthenticate) {
      return;
    }

    setAuthenticating(true);
    setAuthError(null);

    try {
      const response = await kdsAuth(
        restaurantId
          ? { restaurantId, pin }
          : { restaurantSlug, pin }
      );
      setKdsSession(response.token, response.restaurantId);
      setRestaurantId(response.restaurantId);
      setToken(response.token);
      setPin('');
      toast.success('Kitchen display unlocked.');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'AUTH_FAILED';
      if (message === 'INVALID_PIN') {
        setAuthError('Incorrect PIN. Please try again.');
      } else if (message === 'RESTAURANT_NOT_FOUND') {
        setAuthError('Restaurant was not found for this URL. Open KDS from Settings and try again.');
      } else {
        setAuthError('Unable to sign in to Kitchen Display right now.');
      }
    } finally {
      setAuthenticating(false);
    }
  }, [canAuthenticate, pin, restaurantSlug, restaurantId]);

  useEffect(() => {
    if (!token || !restaurantId) {
      return;
    }

    let closed = false;
    let retries = 0;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let eventSource: EventSource | null = null;

    const connect = () => {
      if (closed) return;

      setStreamState(retries === 0 ? 'connecting' : 'reconnecting');
      eventSource = new EventSource(getKdsStreamUrl(restaurantId, token));

      eventSource.onopen = () => {
        retries = 0;
        setStreamState('live');
        setStreamError(null);
      };

      eventSource.addEventListener('snapshot', (event: MessageEvent) => {
        try {
          const payload = JSON.parse(event.data as string) as { orders?: unknown[] };
          const nextOrders = Array.isArray(payload.orders)
            ? payload.orders.map((raw) => sanitizeOrder(raw)).filter(Boolean) as KdsOrder[]
            : [];
          setOrders(sortByOldest(nextOrders.filter((order) => !TERMINAL.has(order.status))));
        } catch {
          setStreamError('Could not read live orders snapshot.');
        }
      });

      eventSource.addEventListener('order_new', (event: MessageEvent) => {
        try {
          const nextOrder = sanitizeOrder(JSON.parse(event.data as string));
          if (!nextOrder || TERMINAL.has(nextOrder.status)) return;
          setOrders((prev) => mergeOrder(prev, nextOrder));
        } catch {
          // Ignore malformed events
        }
      });

      eventSource.addEventListener('order_updated', (event: MessageEvent) => {
        try {
          const nextOrder = sanitizeOrder(JSON.parse(event.data as string));
          if (!nextOrder) return;
          setOrders((prev) => mergeOrder(prev, nextOrder));
        } catch {
          // Ignore malformed events
        }
      });

      eventSource.onerror = () => {
        eventSource?.close();

        if (closed) return;

        retries += 1;
        if (retries > 6) {
          setStreamState('offline');
          setStreamError('Live connection is offline. Tap Reconnect to try again.');
          return;
        }

        const delay = Math.min(1000 * (2 ** retries), 15000);
        retryTimer = setTimeout(() => {
          connect();
        }, delay);
      };
    };

    connect();

    return () => {
      closed = true;
      if (retryTimer) clearTimeout(retryTimer);
      eventSource?.close();
    };
  }, [restaurantId, token, streamVersion]);

  const onDigit = (digit: string) => {
    setAuthError(null);
    setPin((previous) => (previous.length < 6 ? previous + digit : previous));
  };

  const onDelete = () => {
    setAuthError(null);
    setPin((previous) => previous.slice(0, -1));
  };

  const statusChip = useMemo(() => {
    if (streamState === 'live') {
      return {
        text: 'Live',
        icon: <Wifi className="w-4 h-4" aria-hidden="true" />,
        className: 'bg-emerald-100 text-emerald-700',
      };
    }

    if (streamState === 'offline') {
      return {
        text: 'Offline',
        icon: <WifiOff className="w-4 h-4" aria-hidden="true" />,
        className: 'bg-red-100 text-red-700',
      };
    }

    if (streamState === 'reconnecting') {
      return {
        text: 'Reconnecting',
        icon: <RefreshCw className="w-4 h-4 animate-spin" aria-hidden="true" />,
        className: 'bg-amber-100 text-amber-700',
      };
    }

    return {
      text: 'Connecting',
      icon: <RefreshCw className="w-4 h-4 animate-spin" aria-hidden="true" />,
      className: 'bg-gray-100 text-gray-700',
    };
  }, [streamState]);

  const updateStatus = async (orderId: string, status: KdsOrder['status']) => {
    if (!token) return;

    setUpdatingOrderId(orderId);
    try {
      await kdsPatchOrderStatus(restaurantId, orderId, status, token);
      setOrders((prev) =>
        status === 'served' || status === 'cancelled'
          ? prev.filter((order) => order.id !== orderId)
          : prev.map((order) => (order.id === orderId ? { ...order, status } : order))
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'STATUS_UPDATE_FAILED';
      if (message === 'KDS_SESSION_EXPIRED') {
        toast.error('KDS session expired. Please sign in again.');
        clearSession();
        return;
      }

      toast.error('Could not update order status. Please try again.');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  if (!token) {
    return (
      <div className="min-h-[calc(100vh-3rem)] bg-slate-900 flex items-center justify-center p-4">
        <form
          className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-800 p-6 space-y-6"
          onSubmit={(event) => {
            event.preventDefault();
            void submitPin();
          }}
        >
          <header className="space-y-2">
            <h1 className="text-2xl font-bold text-white">Kitchen Display</h1>
            <p className="text-base text-slate-300">
              {restaurantSlug ? `Restaurant: ${restaurantSlug}` : 'Kitchen URL is missing a restaurant slug.'}
            </p>
          </header>

          <div className="space-y-2">
            <label htmlFor="kds-pin" className="text-base font-medium text-slate-200 block">
              Kitchen PIN (4-6 digits)
            </label>
            <input
              id="kds-pin"
              type="password"
              inputMode="numeric"
              value={pin}
              onChange={(event) => setPin(event.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Enter PIN"
              className="w-full min-h-11 rounded-xl border border-slate-600 bg-slate-900 px-3 py-2.5 text-base text-white"
            />
          </div>

          <div className="grid grid-cols-3 gap-2" role="group" aria-label="KDS PIN keypad">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].map((digit) => (
              <button
                key={digit}
                type="button"
                onClick={() => onDigit(digit)}
                className="min-h-11 rounded-xl bg-slate-700 hover:bg-slate-600 text-base font-semibold text-white"
              >
                {digit}
              </button>
            ))}
            <button
              type="button"
              onClick={onDelete}
              className="min-h-11 rounded-xl bg-slate-700 hover:bg-slate-600 text-base font-semibold text-white"
            >
              Delete
            </button>
            <button
              type="button"
              onClick={() => setPin('')}
              className="min-h-11 rounded-xl bg-slate-700 hover:bg-slate-600 text-base font-semibold text-white"
            >
              Clear
            </button>
          </div>

          {authError && <p role="alert" className="text-base text-red-300">{authError}</p>}

          {!restaurantSlug && (
            <p role="alert" className="text-base text-red-300">Kitchen URL is missing restaurant slug. Please use the link from Settings.</p>
          )}

          <button
            type="submit"
            disabled={!canAuthenticate || authenticating}
            className="w-full min-h-11 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-base font-semibold text-white"
          >
            {authenticating ? 'Signing in...' : 'Unlock Kitchen Display'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kitchen Display</h1>
          <p className="text-base text-muted">
            {restaurantSlug ? `/${restaurantSlug}` : 'Live kitchen order board'}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-base font-medium ${statusChip.className}`}>
            {statusChip.icon}
            {statusChip.text}
          </span>
          <button
            type="button"
            onClick={() => {
              if (!token) return;
              setStreamState('reconnecting');
              setStreamError(null);
              setStreamVersion((version) => version + 1);
            }}
            className="inline-flex items-center gap-2 min-h-11 rounded-xl border border-gray-300 bg-white px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50"
          >
            <RefreshCw className="w-4 h-4" aria-hidden="true" />
            Reconnect
          </button>
          <button
            type="button"
            onClick={clearSession}
            className="inline-flex items-center gap-2 min-h-11 rounded-xl border border-gray-300 bg-white px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50"
          >
            <LogOut className="w-4 h-4" aria-hidden="true" />
            Sign out
          </button>
        </div>
      </header>

      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-blue-700 mt-0.5" aria-hidden="true" />
        <div>
          <p className="text-base font-semibold text-blue-900">KDS session is scoped to kitchen actions</p>
          <p className="text-base text-blue-800">This screen can only read kitchen orders and update kitchen statuses.</p>
        </div>
      </div>

      {streamError && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-base text-red-700">
          {streamError}
        </p>
      )}

      {(streamState === 'connecting' || streamState === 'reconnecting') && orders.length === 0 && (
        <div className="space-y-3" aria-hidden="true">
          <div className="h-28 rounded-2xl bg-gray-200 animate-pulse" />
          <div className="h-28 rounded-2xl bg-gray-200 animate-pulse" />
          <div className="h-28 rounded-2xl bg-gray-200 animate-pulse" />
        </div>
      )}

      {orders.length === 0 && streamState === 'live' && (
        <p className="text-base text-muted">No active orders right now.</p>
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {orders.map((order) => {
          const nextStatus = NEXT_STATUS[order.status];

          return (
            <article
              key={order.id}
              className={`rounded-2xl border p-4 space-y-3 ${ageTone(order.created_at)}`}
              aria-label={`Order ${order.id}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-base font-semibold text-gray-900">
                    {order.table_number ? `Table ${order.table_number}` : 'Takeaway'}
                  </h2>
                  <p className="text-base text-gray-700">{order.customer_name}</p>
                  <p className="text-base text-muted">{order.customer_phone}</p>
                </div>
                <div className="text-right">
                  <p className="text-base font-semibold text-gray-900">₹{Number(order.subtotal).toFixed(0)}</p>
                  <p className="text-base text-muted">
                    {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>

              {order.items.length > 0 && (
                <ul className="space-y-1 rounded-xl border border-gray-200 bg-white/80 px-3 py-2">
                  {order.items.map((item) => (
                    <li key={item.id} className="text-base text-gray-800 flex items-start justify-between gap-2">
                      <span>{item.quantity}x {item.name}</span>
                      <span className="font-medium text-gray-900">₹{Number(item.price).toFixed(0)}</span>
                    </li>
                  ))}
                </ul>
              )}

              {order.notes && (
                <p className="rounded-xl border border-gray-200 bg-white/80 px-3 py-2 text-base text-gray-700">
                  Note: {order.notes}
                </p>
              )}

              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-base font-medium text-gray-700 capitalize">
                  {order.status}
                </span>

                {nextStatus ? (
                  <button
                    type="button"
                    disabled={updatingOrderId === order.id}
                    onClick={() => void updateStatus(order.id, nextStatus.value)}
                    className="min-h-11 rounded-xl bg-blue-600 px-4 py-2 text-base font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {updatingOrderId === order.id ? 'Updating...' : nextStatus.label}
                  </button>
                ) : (
                  <span className="text-base text-muted">No further actions</span>
                )}
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
