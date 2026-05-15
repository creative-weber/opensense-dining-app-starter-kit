const API_BASE = '/api';

const KDS_TOKEN_KEY = 'od_kds_token';
const KDS_RESTAURANT_KEY = 'od_kds_restaurant_id';

export interface KdsAuthResponse {
  token: string;
  expiresIn: string;
  restaurantId: string;
  restaurantSlug: string;
}

export function getKdsToken(): string | null {
  return sessionStorage.getItem(KDS_TOKEN_KEY);
}

export function getKdsRestaurantId(): string | null {
  return sessionStorage.getItem(KDS_RESTAURANT_KEY);
}

export function setKdsSession(token: string, restaurantId: string): void {
  sessionStorage.setItem(KDS_TOKEN_KEY, token);
  sessionStorage.setItem(KDS_RESTAURANT_KEY, restaurantId);
}

export function clearKdsSession(): void {
  sessionStorage.removeItem(KDS_TOKEN_KEY);
  sessionStorage.removeItem(KDS_RESTAURANT_KEY);
}

export function getKdsStreamUrl(restaurantId: string, token: string): string {
  const query = encodeURIComponent(token);
  return `${API_BASE}/kds/${restaurantId}/orders/stream?token=${query}`;
}

export async function kdsAuth(params: { pin: string; restaurantId?: string; restaurantSlug?: string }): Promise<KdsAuthResponse> {
  const body: { pin: string; restaurantId?: string; restaurantSlug?: string } = { pin: params.pin };

  if (params.restaurantId) body.restaurantId = params.restaurantId;
  if (params.restaurantSlug) body.restaurantSlug = params.restaurantSlug;

  const response = await fetch(`${API_BASE}/kds/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (response.status === 401) {
    throw new Error('INVALID_PIN');
  }

  if (response.status === 404) {
    throw new Error('RESTAURANT_NOT_FOUND');
  }

  if (!response.ok) {
    throw new Error('AUTH_FAILED');
  }

  return response.json() as Promise<KdsAuthResponse>;
}

export async function kdsPatchOrderStatus(
  restaurantId: string,
  orderId: string,
  status: string,
  token: string
): Promise<void> {
  const response = await fetch(`${API_BASE}/kds/${restaurantId}/orders/${orderId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status }),
  });

  if (response.status === 401 || response.status === 403) {
    throw new Error('KDS_SESSION_EXPIRED');
  }

  if (!response.ok) {
    throw new Error('STATUS_UPDATE_FAILED');
  }
}
