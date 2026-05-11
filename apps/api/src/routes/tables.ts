import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import QRCode from 'qrcode';
import { query } from '../db';
import { requireAuth } from '../middleware/auth';
import type { TableRow } from '../types/shared';

const router = Router();

// All routes require authentication
router.use(requireAuth);

const APP_BASE_URL = process.env.APP_BASE_URL ?? 'http://localhost:5174';

/** Shared helper: generate QR data URL for a table */
async function generateQrForTable(
  restaurantId: string,
  tableId: string,
  tableNumber: string
): Promise<{ qrDataUrl: string; menuUrl: string; restaurantName: string; restaurantSlug: string }> {
  const restaurantResult = await query<{ slug: string; name: string }>(
    `SELECT slug, name FROM restaurants WHERE id = $1`,
    [restaurantId]
  );
  const { slug, name } = restaurantResult.rows[0];
  const menuUrl = `${APP_BASE_URL}/menu/${slug}?table=${tableId}`;
  const qrDataUrl = await QRCode.toDataURL(menuUrl, {
    width: 300,
    margin: 2,
    color: { dark: '#1a1a1a', light: '#ffffff' },
  });
  return { qrDataUrl, menuUrl, restaurantName: name, restaurantSlug: slug };
}

// GET /api/admin/tables
router.get('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await query<TableRow>(
      `SELECT id, table_number, capacity FROM tables
       WHERE restaurant_id = $1 ORDER BY table_number`,
      [req.auth!.restaurantId]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/tables — add a table
router.post(
  '/',
  [
    body('tableNumber').trim().notEmpty().isLength({ max: 20 }),
    body('capacity').isInt({ min: 1, max: 50 }),
  ],
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ error: 'VALIDATION_ERROR', details: errors.array() });
      return;
    }
    const { tableNumber, capacity } = req.body as { tableNumber: string; capacity: number };
    try {
      const result = await query<TableRow>(
        `INSERT INTO tables (restaurant_id, table_number, capacity)
         VALUES ($1, $2, $3) RETURNING id, table_number, capacity`,
        [req.auth!.restaurantId, tableNumber, capacity]
      );
      const table = result.rows[0];
      // Eagerly include QR data so the UI can display it immediately
      const qr = await generateQrForTable(req.auth!.restaurantId, table.id, table.table_number);
      res.status(201).json({ ...table, ...qr });
    } catch (err: unknown) {
      const pgErr = err as { code?: string };
      if (pgErr.code === '23505') {
        res.status(409).json({ error: 'TABLE_EXISTS', message: 'A table with that number already exists.' });
        return;
      }
      next(err);
    }
  }
);

// DELETE /api/admin/tables/:tableId
router.delete(
  '/:tableId',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { tableId } = req.params;
    try {
      await query(
        `DELETE FROM tables WHERE id = $1 AND restaurant_id = $2`,
        [tableId, req.auth!.restaurantId]
      );
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/admin/tables/:tableId/qr — generate QR code data URL
router.get(
  '/:tableId/qr',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { tableId } = req.params;
    try {
      const tableResult = await query<TableRow>(
        `SELECT id, table_number FROM tables WHERE id = $1 AND restaurant_id = $2`,
        [tableId, req.auth!.restaurantId]
      );
      if (tableResult.rows.length === 0) {
        res.status(404).json({ error: 'TABLE_NOT_FOUND' });
        return;
      }
      const table = tableResult.rows[0];
      const qr = await generateQrForTable(req.auth!.restaurantId, tableId, table.table_number);
      res.json({ tableId, tableNumber: table.table_number, ...qr });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/admin/tables/:tableId/qr — regenerate QR (alias for GET)
router.post(
  '/:tableId/qr',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { tableId } = req.params;
    try {
      const tableResult = await query<TableRow>(
        `SELECT id, table_number FROM tables WHERE id = $1 AND restaurant_id = $2`,
        [tableId, req.auth!.restaurantId]
      );
      if (tableResult.rows.length === 0) {
        res.status(404).json({ error: 'TABLE_NOT_FOUND' });
        return;
      }
      const table = tableResult.rows[0];
      const qr = await generateQrForTable(req.auth!.restaurantId, tableId, table.table_number);
      res.json({ tableId, tableNumber: table.table_number, ...qr });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
