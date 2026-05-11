import { useEffect, useRef } from 'react';
import { toast } from '../utils/toast';
import type { Order } from '../types';

type OrderEventType = 'order_new' | 'order_updated';

/**
 * Subscribes to the admin SSE order stream.
 * Calls `onEvent` whenever an `order_new` or `order_updated` event arrives.
 * The token is read from localStorage (same key used by the Axios client).
 */
export function useOrderStream(
  onEvent: (type: OrderEventType, order: Order) => void
): void {
  // Keep a stable ref so the effect doesn't re-subscribe on every render
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    const token = localStorage.getItem('od_token');
    if (!token) return;

    const es = new EventSource(`/api/admin/orders/stream?token=${encodeURIComponent(token)}`);

    const handle = (type: OrderEventType) => (e: MessageEvent) => {
      try {
        const order = JSON.parse(e.data as string) as Order;
        onEventRef.current(type, order);
      } catch {
        // malformed event — ignore
      }
    };

    es.addEventListener('order_new',     handle('order_new'));
    es.addEventListener('order_updated', handle('order_updated'));
    
    es.onerror = () => {
      console.error('[useOrderStream] SSE connection error', {
        timestamp: new Date().toISOString(),
        readyState: es.readyState,
      });
      es.close();
      toast.error('Live order updates disconnected. Please refresh the page.');
    };

    return () => es.close();
  }, []); // connect once per mount
}
