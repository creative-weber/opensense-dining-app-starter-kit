import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { query } from '../db';
import { requireAuth } from '../middleware/auth';
import { addAdminClient, broadcast } from '../services/sseManager';
import type { MenuCategoryRow, MenuItemRow, OrderRecord, RestaurantRow } from '../types/shared';

const router = Router();
router.use(requireAuth);

// ── Restaurant profile ───────────────────────────────────────────────────────

// GET /api/admin/restaurant
router.get('/restaurant', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await query<RestaurantRow>(
      `SELECT id, name, slug, logo_url, address, phone, brand_color, kds_pin,
              open_hours, daily_summary_enabled
       FROM restaurants WHERE id = $1`,
      [req.auth!.restaurantId]
    );
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// PUT /api/admin/restaurant  — full settings update
router.put(
  '/restaurant',
  [
    body('name').optional().trim().notEmpty().isLength({ max: 120 }),
    body('address').optional({ nullable: true }).trim(),
    body('logoUrl').optional({ nullable: true }),
    body('phone').optional({ nullable: true }).trim().isLength({ max: 20 }),
    body('brandColor').optional().matches(/^#[0-9a-fA-F]{6}$/).withMessage('Must be a hex color'),
    body('kdsPin').optional({ nullable: true }).matches(/^[0-9]{4,6}$/).withMessage('PIN must be 4–6 digits'),
    body('openHours').optional({ nullable: true }).isObject(),
    body('dailySummaryEnabled').optional().isBoolean(),
  ],
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { res.status(400).json({ error: 'VALIDATION_ERROR', details: errors.array() }); return; }
    const { name, address, logoUrl, phone, brandColor, kdsPin, openHours, dailySummaryEnabled } =
      req.body as {
        name?: string; address?: string | null; logoUrl?: string | null;
        phone?: string | null; brandColor?: string;
        kdsPin?: string | null; openHours?: object | null;
        dailySummaryEnabled?: boolean;
      };
    try {
      const result = await query<RestaurantRow>(
        `UPDATE restaurants SET
           name                   = COALESCE($1, name),
           address                = COALESCE($2, address),
           logo_url               = COALESCE($3, logo_url),
           phone                  = COALESCE($4, phone),
           brand_color            = COALESCE($5, brand_color),
           kds_pin                = COALESCE($6, kds_pin),
           open_hours             = COALESCE($7::jsonb, open_hours),
           daily_summary_enabled  = COALESCE($8, daily_summary_enabled)
         WHERE id = $9
         RETURNING id, name, slug, logo_url, address, phone, brand_color,
                   kds_pin, open_hours, daily_summary_enabled`,
        [
          name ?? null, address ?? null, logoUrl ?? null,
          phone ?? null, brandColor ?? null, kdsPin ?? null,
          openHours ? JSON.stringify(openHours) : null,
          dailySummaryEnabled ?? null,
          req.auth!.restaurantId,
        ]
      );
      res.json(result.rows[0]);
    } catch (err) { next(err); }
  }
);

// Keep PATCH as an alias for backward compatibility
router.patch(
  '/restaurant',
  [body('name').optional().trim().notEmpty(), body('address').optional().trim()],
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { res.status(400).json({ error: 'VALIDATION_ERROR', details: errors.array() }); return; }
    const { name, address, logoUrl } = req.body as { name?: string; address?: string; logoUrl?: string };
    try {
      const result = await query<RestaurantRow>(
        `UPDATE restaurants SET
           name     = COALESCE($1, name),
           address  = COALESCE($2, address),
           logo_url = COALESCE($3, logo_url)
         WHERE id = $4
         RETURNING id, name, slug, logo_url, address, phone, brand_color,
                   kds_pin, open_hours, daily_summary_enabled`,
        [name ?? null, address ?? null, logoUrl ?? null, req.auth!.restaurantId]
      );
      res.json(result.rows[0]);
    } catch (err) { next(err); }
  }
);

// ── Menu categories ─────────────────────────────────────────────────────────

// GET /api/admin/categories
router.get('/categories', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await query<MenuCategoryRow>(
      `SELECT id, name, sort_order, is_archived FROM menu_categories WHERE restaurant_id = $1 AND is_archived = FALSE ORDER BY sort_order, name`,
      [req.auth!.restaurantId]
    );
    res.json(result.rows);
  } catch (err) { next(err); }
});

// POST /api/admin/categories
router.post(
  '/categories',
  [body('name').trim().notEmpty().isLength({ max: 80 })],
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { res.status(400).json({ error: 'VALIDATION_ERROR', details: errors.array() }); return; }
    const { name } = req.body as { name: string };
    try {
      const result = await query<MenuCategoryRow>(
        `INSERT INTO menu_categories (restaurant_id, name) VALUES ($1, $2) RETURNING id, name, sort_order`,
        [req.auth!.restaurantId, name]
      );
      res.status(201).json(result.rows[0]);
    } catch (err) { next(err); }
  }
);

// POST /api/admin/categories/prepopulate
router.post('/categories/prepopulate', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const commonCategories = ['Starters', 'Mains', 'Desserts', 'Beverages'];
  try {
    const results: MenuCategoryRow[] = [];
    for (const name of commonCategories) {
      const result = await query<MenuCategoryRow>(
        `INSERT INTO menu_categories (restaurant_id, name) VALUES ($1, $2) RETURNING id, name, sort_order`,
        [req.auth!.restaurantId, name]
      );
      results.push(result.rows[0]);
    }
    res.status(201).json(results);
  } catch (err) { next(err); }
});

// DELETE /api/admin/categories/:catId
// Blocked when the category has associated menu items — use PATCH .../archive instead.
router.delete('/categories/:catId', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const itemCheck = await query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM menu_items WHERE category_id = $1 AND restaurant_id = $2`,
      [req.params.catId, req.auth!.restaurantId]
    );
    if (parseInt(itemCheck.rows[0]?.count ?? '0', 10) > 0) {
      res.status(409).json({
        error: 'CATEGORY_HAS_ITEMS',
        message: 'This category has menu items associated with it. Archive the category instead.',
      });
      return;
    }
    await query(
      `DELETE FROM menu_categories WHERE id = $1 AND restaurant_id = $2`,
      [req.params.catId, req.auth!.restaurantId]
    );
    res.status(204).send();
  } catch (err) { next(err); }
});

// PATCH /api/admin/categories/:catId/archive — soft-delete (toggle)
router.patch('/categories/:catId/archive', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { archived } = req.body as { archived?: boolean };
  const isArchived = archived !== false; // default to true (archive)
  try {
    const result = await query<MenuCategoryRow>(
      `UPDATE menu_categories
          SET is_archived = $1
        WHERE id = $2 AND restaurant_id = $3
        RETURNING id, name, sort_order, is_archived`,
      [isArchived, req.params.catId, req.auth!.restaurantId]
    );
    if (!result.rows[0]) { res.status(404).json({ error: 'NOT_FOUND' }); return; }
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

// ── Menu items ───────────────────────────────────────────────────────────────

// GET /api/admin/items
router.get('/items', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await query<MenuItemRow>(
      `SELECT mi.id, mi.category_id, mc.name AS category_name,
              mi.name, mi.description, mi.price, mi.image_url,
              mi.is_vegetarian, mi.is_vegan, mi.is_available, mi.sort_order
       FROM menu_items mi
       JOIN menu_categories mc ON mc.id = mi.category_id
       WHERE mi.restaurant_id = $1
       ORDER BY mc.sort_order, mi.sort_order, mi.name`,
      [req.auth!.restaurantId]
    );
    res.json(result.rows);
  } catch (err) { next(err); }
});

// POST /api/admin/items
router.post(
  '/items',
  [
    body('categoryId').isUUID(),
    body('name').trim().notEmpty().isLength({ max: 120 }),
    body('description').optional().trim().isLength({ max: 500 }),
    body('price').isFloat({ min: 0 }),
    body('imageUrl').optional({ nullable: true }).isURL(),
    body('isVegetarian').isBoolean(),
    body('isVegan').isBoolean(),
  ],
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { res.status(400).json({ error: 'VALIDATION_ERROR', details: errors.array() }); return; }
    const { categoryId, name, description, price, imageUrl, isVegetarian, isVegan } = req.body as {
      categoryId: string; name: string; description?: string; price: number;
      imageUrl?: string; isVegetarian: boolean; isVegan: boolean;
    };
    try {
      // Verify category belongs to restaurant
      const catCheck = await query(
        `SELECT id FROM menu_categories WHERE id = $1 AND restaurant_id = $2`,
        [categoryId, req.auth!.restaurantId]
      );
      if (catCheck.rows.length === 0) {
        res.status(400).json({ error: 'INVALID_CATEGORY' }); return;
      }
      const result = await query<MenuItemRow>(
        `INSERT INTO menu_items (restaurant_id, category_id, name, description, price, image_url, is_vegetarian, is_vegan)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [req.auth!.restaurantId, categoryId, name, description ?? null, price, imageUrl ?? null, isVegetarian, isVegan]
      );
      res.status(201).json(result.rows[0]);
    } catch (err) { next(err); }
  }
);

// PATCH /api/admin/items/:itemId
router.patch(
  '/items/:itemId',
  [
    body('categoryId').optional().isUUID(),
    body('name').optional().trim().notEmpty().isLength({ max: 120 }),
    body('description').optional({ nullable: true }).trim(),
    body('price').optional().isFloat({ min: 0 }),
    body('isVegetarian').optional().isBoolean(),
    body('isVegan').optional().isBoolean(),
    body('isAvailable').optional().isBoolean(),
    body('imageUrl').optional({ nullable: true }),
  ],
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { res.status(400).json({ error: 'VALIDATION_ERROR', details: errors.array() }); return; }
    const { itemId } = req.params;
    const { categoryId, name, description, price, isVegetarian, isVegan, isAvailable, imageUrl } = req.body as {
      categoryId?: string; name?: string; description?: string; price?: number;
      isVegetarian?: boolean; isVegan?: boolean; isAvailable?: boolean; imageUrl?: string | null;
    };
    try {
      // Verify category belongs to restaurant if categoryId is provided
      if (categoryId) {
        const catCheck = await query(
          `SELECT id FROM menu_categories WHERE id = $1 AND restaurant_id = $2`,
          [categoryId, req.auth!.restaurantId]
        );
        if (catCheck.rows.length === 0) {
          res.status(400).json({ error: 'INVALID_CATEGORY' }); return;
        }
      }

      // Build dynamic UPDATE statement
      const updateFields: string[] = [];
      const params: unknown[] = [];
      let paramIndex = 1;

      if (categoryId !== undefined && categoryId !== null) {
        updateFields.push(`category_id = $${paramIndex++}`);
        params.push(categoryId);
      }
      if (name !== undefined && name !== null) {
        updateFields.push(`name = $${paramIndex++}`);
        params.push(name);
      }
      if (description !== undefined) {
        updateFields.push(`description = $${paramIndex++}`);
        params.push(description);
      }
      if (price !== undefined && price !== null) {
        updateFields.push(`price = $${paramIndex++}`);
        params.push(price);
      }
      if (isVegetarian !== undefined && isVegetarian !== null) {
        updateFields.push(`is_vegetarian = $${paramIndex++}`);
        params.push(isVegetarian);
      }
      if (isVegan !== undefined && isVegan !== null) {
        updateFields.push(`is_vegan = $${paramIndex++}`);
        params.push(isVegan);
      }
      if (isAvailable !== undefined && isAvailable !== null) {
        updateFields.push(`is_available = $${paramIndex++}`);
        params.push(isAvailable);
      }
      if (imageUrl !== undefined) {
        updateFields.push(`image_url = $${paramIndex++}`);
        params.push(imageUrl);
      }

      if (updateFields.length === 0) {
        res.status(400).json({ error: 'NO_FIELDS_TO_UPDATE' }); return;
      }

      params.push(itemId);
      params.push(req.auth!.restaurantId);

      const updateSql = `UPDATE menu_items SET ${updateFields.join(', ')} WHERE id = $${paramIndex++} AND restaurant_id = $${paramIndex++} RETURNING *`;
      const result = await query<MenuItemRow>(updateSql, params);

      if (result.rows.length === 0) {
        res.status(404).json({ error: 'ITEM_NOT_FOUND' }); return;
      }
      res.json(result.rows[0]);
    } catch (err) { next(err); }
  }
);

// DELETE /api/admin/items/:itemId
router.delete('/items/:itemId', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await query(
      `DELETE FROM menu_items WHERE id = $1 AND restaurant_id = $2`,
      [req.params.itemId, req.auth!.restaurantId]
    );
    res.status(204).send();
  } catch (err) { next(err); }
});

// ── Orders (admin view) ──────────────────────────────────────────────────────

// GET /api/admin/orders/stream — SSE live feed
router.get('/orders/stream', (req: Request, res: Response): void => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const remove = addAdminClient(req.auth!.restaurantId, res);

  // Keep-alive ping every 25 s
  const ping = setInterval(() => {
    try { res.write(': ping\n\n'); } catch { clearInterval(ping); remove(); }
  }, 25_000);

  req.on('close', () => { clearInterval(ping); remove(); });
});

// GET /api/admin/orders?status=pending
router.get('/orders', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { status } = req.query as { status?: string };
  try {
    const params: unknown[] = [req.auth!.restaurantId];
    const statusClause = status ? ` AND o.status = $2` : '';
    if (status) params.push(status);

    const result = await query<OrderRecord>(
      `SELECT o.id, o.customer_name, o.customer_phone, o.status, o.subtotal,
              o.notes, o.created_at, t.table_number
       FROM orders o
       LEFT JOIN tables t ON t.id = o.table_id
       WHERE o.restaurant_id = $1${statusClause}
       ORDER BY o.created_at DESC
       LIMIT 100`,
      params
    );
    res.json(result.rows);
  } catch (err) { next(err); }
});

// PATCH /api/admin/orders/:orderId/status
router.patch(
  '/orders/:orderId/status',
  [body('status').isIn(['confirmed', 'preparing', 'ready', 'served', 'cancelled'])],
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { res.status(400).json({ error: 'VALIDATION_ERROR', details: errors.array() }); return; }
    const { orderId } = req.params;
    const { status } = req.body as { status: string };
    try {
      const result = await query<{ id: string; status: string }>(
        `UPDATE orders SET status = $1 WHERE id = $2 AND restaurant_id = $3 RETURNING id, status`,
        [status, orderId, req.auth!.restaurantId]
      );
      if (result.rows.length === 0) {
        res.status(404).json({ error: 'ORDER_NOT_FOUND' }); return;
      }
      broadcast(req.auth!.restaurantId, 'order_updated', result.rows[0]);
      res.json(result.rows[0]);
    } catch (err) { next(err); }
  }
);

export default router;
