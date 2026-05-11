import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import { body, validationResult } from 'express-validator';
import { query, getClient } from '../db';
import { signToken } from '../middleware/auth';

const router = Router();

// POST /api/auth/register — create restaurant + admin account
router.post(
  '/register',
  [
    body('restaurantName').trim().notEmpty(),
    body('slug').trim().matches(/^[a-z0-9-]+$/),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
  ],
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ error: 'VALIDATION_ERROR', details: errors.array() });
      return;
    }
    const { restaurantName, slug, email, password } = req.body as {
      restaurantName: string;
      slug: string;
      email: string;
      password: string;
    };
    try {
      // Check slug uniqueness
      const existing = await query('SELECT id FROM restaurants WHERE slug = $1', [slug]);
      if (existing.rows.length > 0) {
        res.status(409).json({ error: 'SLUG_TAKEN', message: 'That restaurant URL is already taken.' });
        return;
      }

      // Check email uniqueness
      const existingEmail = await query('SELECT id FROM admin_users WHERE email = $1', [email]);
      if (existingEmail.rows.length > 0) {
        res.status(409).json({ error: 'EMAIL_TAKEN', message: 'An account with that email already exists.' });
        return;
      }

      const passwordHash = await bcrypt.hash(password, 12);

      // Use a transaction so a failed admin_user insert rolls back the restaurant row
      const client = await getClient();
      let restaurantId: string;
      let adminId: string;
      try {
        await client.query('BEGIN');

        const restaurantResult = await client.query<{ id: string }>(
          `INSERT INTO restaurants (name, slug) VALUES ($1, $2) RETURNING id`,
          [restaurantName, slug]
        );
        restaurantId = restaurantResult.rows[0].id;

        const adminResult = await client.query<{ id: string }>(
          `INSERT INTO admin_users (restaurant_id, email, password_hash) VALUES ($1, $2, $3) RETURNING id`,
          [restaurantId, email, passwordHash]
        );
        adminId = adminResult.rows[0].id;

        await client.query('COMMIT');
      } catch (txErr) {
        await client.query('ROLLBACK');
        throw txErr;
      } finally {
        client.release();
      }

      const token = signToken({ adminId, restaurantId, email });
      res.status(201).json({ token, restaurantId, restaurantName, slug });
    } catch (err: unknown) {
      // Handle DB unique constraint violations as a safety net
      const pgErr = err as { code?: string; constraint?: string };
      if (pgErr.code === '23505') {
        if (pgErr.constraint?.includes('slug')) {
          res.status(409).json({ error: 'SLUG_TAKEN', message: 'That restaurant URL is already taken.' });
        } else if (pgErr.constraint?.includes('email')) {
          res.status(409).json({ error: 'EMAIL_TAKEN', message: 'An account with that email already exists.' });
        } else {
          res.status(409).json({ error: 'DUPLICATE_ENTRY', message: 'A record with these details already exists.' });
        }
        return;
      }
      next(err);
    }
  }
);

// POST /api/auth/login
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ error: 'VALIDATION_ERROR', details: errors.array() });
      return;
    }
    const { email, password } = req.body as { email: string; password: string };
    try {
      const result = await query<{
        id: string;
        restaurant_id: string;
        email: string;
        password_hash: string;
        restaurant_name: string;
        slug: string;
      }>(
        `SELECT au.id, au.restaurant_id, au.email, au.password_hash,
                r.name AS restaurant_name, r.slug
         FROM admin_users au
         JOIN restaurants r ON r.id = au.restaurant_id
         WHERE au.email = $1`,
        [email]
      );

      if (result.rows.length === 0) {
        res.status(401).json({ error: 'INVALID_CREDENTIALS' });
        return;
      }

      const user = result.rows[0];
      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) {
        res.status(401).json({ error: 'INVALID_CREDENTIALS' });
        return;
      }

      const token = signToken({ adminId: user.id, restaurantId: user.restaurant_id, email: user.email });
      res.json({
        token,
        restaurantId: user.restaurant_id,
        restaurantName: user.restaurant_name,
        slug: user.slug,
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
