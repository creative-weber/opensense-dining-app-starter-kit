import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  clearKdsSession,
  getKdsRestaurantId,
  getKdsStreamUrl,
  getKdsToken,
  kdsAuth,
  kdsPatchOrderStatus,
  setKdsSession,
} from './kds';

describe('kds api helpers', () => {
  afterEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it('stores and clears the KDS session', () => {
    setKdsSession('token-123', 'restaurant-456');

    expect(getKdsToken()).toBe('token-123');
    expect(getKdsRestaurantId()).toBe('restaurant-456');

    clearKdsSession();

    expect(getKdsToken()).toBeNull();
    expect(getKdsRestaurantId()).toBeNull();
  });

  it('builds the KDS stream URL with encoded token query', () => {
    const url = getKdsStreamUrl('abc-restaurant', 'header.payload.signature');

    expect(url).toBe('/api/kds/abc-restaurant/orders/stream?token=header.payload.signature');
  });

  it('authenticates KDS PIN and returns token payload', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({
        token: 'jwt',
        expiresIn: '8h',
        restaurantId: 'restaurant-id',
        restaurantSlug: 'indian-spices-8',
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    await expect(kdsAuth({ restaurantSlug: 'indian-spices-8', pin: '1234' })).resolves.toEqual({
      token: 'jwt',
      expiresIn: '8h',
      restaurantId: 'restaurant-id',
      restaurantSlug: 'indian-spices-8',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/kds/auth',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ pin: '1234', restaurantSlug: 'indian-spices-8' }),
      })
    );
  });

  it('maps auth failure responses to user-flow errors', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response(null, { status: 401 }));
    await expect(kdsAuth({ restaurantSlug: 'indian-spices-8', pin: '9999' })).rejects.toThrowError('INVALID_PIN');

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response(null, { status: 404 }));
    await expect(kdsAuth({ restaurantSlug: 'indian-spices-8', pin: '1234' })).rejects.toThrowError('RESTAURANT_NOT_FOUND');
  });

  it('treats 401 or 403 during status updates as an expired KDS session', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response(null, { status: 403 }));

    await expect(kdsPatchOrderStatus('r-1', 'o-1', 'preparing', 'kds-token')).rejects.toThrowError('KDS_SESSION_EXPIRED');
  });
});
