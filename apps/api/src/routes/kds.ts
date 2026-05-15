import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import { query } from '../db';
import { addKdsClient, broadcast } from '../services/sseManager';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET ?? 'change-me-in-production';
const KDS_SCOPE = 'kds';
const KDS_TOKEN_EXPIRY = '8h';

interface KdsTokenPayload extends jwt.JwtPayload {
  scope: 'kds';
  restaurantId: string;
}

interface KdsAuthedRequest extends Request {
  kdsRestaurantId?: string;
}

function readToken(req: Request): string {
  const authHeader = req.headers.authorization ?? '';
  const queryToken = typeof req.query.token === 'string' ? req.query.token : '';
  if (authHeader.startsWith('Bearer ')) return authHeader.slice(7);
  return queryToken;
}

function requireKdsAuth(req: Request, res: Response, next: NextFunction): void {
  const rawToken = readToken(req);

  if (!rawToken) {
    res.status(401).json({ error: 'KDS_AUTH_REQUIRED' });
    return;
  }

  try {
    const decoded = jwt.verify(rawToken, JWT_SECRET) as KdsTokenPayload;

    if (decoded.scope !== KDS_SCOPE || typeof decoded.restaurantId !== 'string') {
      res.status(403).json({ error: 'KDS_SCOPE_REQUIRED' });
      return;
    }

    (req as KdsAuthedRequest).kdsRestaurantId = decoded.restaurantId;
    next();
  } catch {
    res.status(401).json({ error: 'KDS_TOKEN_INVALID' });
  }
}

// POST /api/kds/auth — PIN auth to issue KDS-scoped token
router.post(
  '/auth',
  [
    body('restaurantId').optional().isUUID().withMessage('restaurantId must be a valid UUID'),
    body('restaurantSlug').optional().isString().trim().matches(/^[a-z0-9-]{3,120}$/).withMessage('restaurantSlug is invalid'),
    body('pin').isString().trim().matches(/^\d{4,6}$/).withMessage('pin must be 4 to 6 digits'),
    body().custom((value: { restaurantId?: string; restaurantSlug?: string }) => {
      if (!value?.restaurantId && !value?.restaurantSlug) {
        throw new Error('restaurantId or restaurantSlug is required');
      }
      return true;
    }),
  ],
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ error: 'VALIDATION_ERROR', details: errors.array() });
      return;
    }

    const { restaurantId, restaurantSlug, pin } = req.body as {
      restaurantId?: string;
      restaurantSlug?: string;
      pin: string;
    };

    try {
      const result = await query<{ id: string; slug: string; kds_pin: string | null }>(
        restaurantId
          ? 'SELECT id, slug, kds_pin FROM restaurants WHERE id = $1'
          : 'SELECT id, slug, kds_pin FROM restaurants WHERE slug = $1',
        [restaurantId ?? restaurantSlug ?? '']
      );

      if (result.rows.length === 0) {
        res.status(404).json({ error: 'RESTAURANT_NOT_FOUND' });
        return;
      }

      const restaurant = result.rows[0];
      if (!restaurant.kds_pin || restaurant.kds_pin !== pin) {
        res.status(401).json({ error: 'INVALID_PIN' });
        return;
      }

      const token = jwt.sign(
        {
          scope: KDS_SCOPE,
          restaurantId: restaurant.id,
          restaurantSlug: restaurant.slug,
        } as KdsTokenPayload,
        JWT_SECRET,
        { expiresIn: KDS_TOKEN_EXPIRY }
      );

      res.json({ token, expiresIn: KDS_TOKEN_EXPIRY, restaurantId: restaurant.id, restaurantSlug: restaurant.slug });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/kds/:restaurantId/orders/stream — scoped KDS stream with initial snapshot
router.get(
  '/:restaurantId/orders/stream',
  requireKdsAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { restaurantId } = req.params;
    const kdsRestaurantId = (req as KdsAuthedRequest).kdsRestaurantId;

    if (!kdsRestaurantId || kdsRestaurantId !== restaurantId) {
      res.status(403).json({ error: 'FORBIDDEN' });
      return;
    }

    try {
      const ordersResult = await query(
        `SELECT o.id, o.customer_name, o.customer_phone, o.status, o.subtotal,
                o.notes, o.created_at, t.table_number,
                COALESCE(
                  json_agg(
                    json_build_object(
                      'id', oi.id,
                      'name', oi.name,
                      'price', oi.price,
                      'quantity', oi.quantity,
                      'notes', oi.notes
                    )
                    ORDER BY oi.created_at ASC
                  ) FILTER (WHERE oi.id IS NOT NULL),
                  '[]'::json
                ) AS items
         FROM orders o
         LEFT JOIN tables t ON t.id = o.table_id
         LEFT JOIN order_items oi ON oi.order_id = o.id
         WHERE o.restaurant_id = $1
           AND o.status NOT IN ('served', 'cancelled')
         GROUP BY
           o.id, o.customer_name, o.customer_phone, o.status,
           o.subtotal, o.notes, o.created_at, t.table_number
         ORDER BY o.created_at ASC`,
        [restaurantId]
      );

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders();

      const remove = addKdsClient(restaurantId, res);

      res.write(`event: snapshot\ndata: ${JSON.stringify({ orders: ordersResult.rows })}\n\n`);

      const ping = setInterval(() => {
        try { res.write(': ping\n\n'); } catch { clearInterval(ping); remove(); }
      }, 25_000);

      req.on('close', () => { clearInterval(ping); remove(); });
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /api/kds/:restaurantId/orders/:orderId/status — KDS-only order status updates
router.patch(
  '/:restaurantId/orders/:orderId/status',
  requireKdsAuth,
  [body('status').isIn(['confirmed', 'preparing', 'ready', 'served', 'cancelled'])],
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ error: 'VALIDATION_ERROR', details: errors.array() });
      return;
    }

    const { restaurantId, orderId } = req.params;
    const kdsRestaurantId = (req as KdsAuthedRequest).kdsRestaurantId;

    if (!kdsRestaurantId || kdsRestaurantId !== restaurantId) {
      res.status(403).json({ error: 'FORBIDDEN' });
      return;
    }

    const { status } = req.body as { status: string };

    try {
      const result = await query<{ id: string; status: string }>(
        `UPDATE orders SET status = $1
         WHERE id = $2 AND restaurant_id = $3
         RETURNING id, status`,
        [status, orderId, restaurantId]
      );

      if (result.rows.length === 0) {
        res.status(404).json({ error: 'ORDER_NOT_FOUND' });
        return;
      }

      broadcast(restaurantId, 'order_updated', result.rows[0]);
      res.json(result.rows[0]);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
