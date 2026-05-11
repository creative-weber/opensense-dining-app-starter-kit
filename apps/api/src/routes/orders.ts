import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { query, getClient } from '../db';
import { broadcast } from '../services/sseManager';
import type { OrderRecord, OrderItemRecord } from '../types/shared';

const router = Router();

// POST /api/orders — place a new order (public)
router.post(
  '/',
  [
    body('restaurantId').isUUID(),
    body('tableId').optional({ nullable: true }).isUUID(),
    body('customerName').trim().notEmpty(),
    body('customerPhone').matches(/^\+?[0-9]{7,15}$/),
    body('items').isArray({ min: 1 }),
    body('items.*.menuItemId').isUUID(),
    body('items.*.quantity').isInt({ min: 1, max: 20 }),
    body('items.*.notes').optional().trim().isLength({ max: 200 }),
    body('notes').optional().trim().isLength({ max: 500 }),
  ],
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ error: 'VALIDATION_ERROR', details: errors.array() });
      return;
    }

    const { restaurantId, tableId, customerName, customerPhone, items, notes } = req.body as {
      restaurantId: string;
      tableId?: string;
      customerName: string;
      customerPhone: string;
      items: { menuItemId: string; quantity: number; notes?: string }[];
      notes?: string;
    };

    const client = await getClient();
    try {
      await client.query('BEGIN');

      // Verify restaurant exists
      const restResult = await client.query(
        `SELECT id FROM restaurants WHERE id = $1`,
        [restaurantId]
      );
      if (restResult.rows.length === 0) {
        await client.query('ROLLBACK');
        res.status(404).json({ error: 'RESTAURANT_NOT_FOUND' });
        return;
      }

      // Fetch & verify menu items
      const menuItemIds = items.map((i) => i.menuItemId);
      const menuResult = await client.query<{
        id: string;
        name: string;
        price: string;
        is_available: boolean;
      }>(
        `SELECT id, name, price, is_available FROM menu_items
         WHERE id = ANY($1) AND restaurant_id = $2`,
        [menuItemIds, restaurantId]
      );

      if (menuResult.rows.length !== menuItemIds.length) {
        await client.query('ROLLBACK');
        res.status(400).json({ error: 'MENU_ITEMS_NOT_FOUND' });
        return;
      }

      const unavailable = menuResult.rows.filter((r) => !r.is_available);
      if (unavailable.length > 0) {
        await client.query('ROLLBACK');
        res.status(400).json({
          error: 'ITEMS_UNAVAILABLE',
          message: `These items are currently unavailable: ${unavailable.map((i) => i.name).join(', ')}`,
        });
        return;
      }

      const itemMap = new Map(menuResult.rows.map((r) => [r.id, r]));
      let subtotal = 0;
      for (const item of items) {
        const menuItem = itemMap.get(item.menuItemId)!;
        subtotal += Number(menuItem.price) * item.quantity;
      }

      // Create order
      const orderResult = await client.query<{ id: string }>(
        `INSERT INTO orders (restaurant_id, table_id, customer_name, customer_phone, notes, subtotal)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [restaurantId, tableId ?? null, customerName, customerPhone, notes ?? null, subtotal.toFixed(2)]
      );
      const orderId = orderResult.rows[0].id;

      // Insert order items
      for (const item of items) {
        const menuItem = itemMap.get(item.menuItemId)!;
        await client.query(
          `INSERT INTO order_items (order_id, menu_item_id, name, price, quantity, notes)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [orderId, item.menuItemId, menuItem.name, menuItem.price, item.quantity, item.notes ?? null]
        );
      }

      await client.query('COMMIT');

      // Notify connected admin & KDS clients
      broadcast(restaurantId, 'order_new', {
        id: orderId,
        restaurantId,
        status: 'pending',
        subtotal,
        customerName,
        customerPhone,
        tableId: tableId ?? null,
        createdAt: new Date().toISOString(),
      });

      res.status(201).json({ orderId, subtotal });
    } catch (err) {
      await client.query('ROLLBACK');
      next(err);
    } finally {
      client.release();
    }
  }
);

// GET /api/orders/:orderId — get order status (public, for confirmation page)
router.get(
  '/:orderId',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { orderId } = req.params;
    try {
      const orderResult = await query<OrderRecord>(
        `SELECT o.id, o.restaurant_id, o.table_id, o.customer_name, o.customer_phone,
                o.status, o.notes, o.subtotal, o.created_at,
                t.table_number
         FROM orders o
         LEFT JOIN tables t ON t.id = o.table_id
         WHERE o.id = $1`,
        [orderId]
      );

      if (orderResult.rows.length === 0) {
        res.status(404).json({ error: 'ORDER_NOT_FOUND' });
        return;
      }

      const order = orderResult.rows[0];

      const itemsResult = await query<OrderItemRecord>(
        `SELECT id, name, price, quantity, notes FROM order_items WHERE order_id = $1`,
        [orderId]
      );

      res.json({
        id: order.id,
        status: order.status,
        customerName: order.customer_name,
        tableNumber: order.table_number ?? null,
        subtotal: Number(order.subtotal),
        createdAt: order.created_at,
        items: itemsResult.rows.map((i) => ({
          id: i.id,
          name: i.name,
          price: Number(i.price),
          quantity: i.quantity,
          notes: i.notes,
        })),
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
