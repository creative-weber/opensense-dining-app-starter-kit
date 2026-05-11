const API_BASE = import.meta.env.VITE_API_URL ?? '/api';

export async function fetchMenu(slug: string, tableId?: string | null) {
  const url = tableId
    ? `${API_BASE}/menu/${slug}?table=${tableId}`
    : `${API_BASE}/menu/${slug}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to load menu');
  return res.json();
}

export async function placeOrder(body: {
  restaurantId: string;
  tableId?: string | null;
  customerName: string;
  customerPhone: string;
  items: { menuItemId: string; quantity: number; notes?: string }[];
  notes?: string;
}) {
  const res = await fetch(`${API_BASE}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw Object.assign(new Error('Order failed'), { data });
  }
  return res.json() as Promise<{ orderId: string; subtotal: number }>;
}

export async function fetchOrder(orderId: string) {
  const res = await fetch(`${API_BASE}/orders/${orderId}`);
  if (!res.ok) throw new Error('Failed to load order');
  return res.json();
}
