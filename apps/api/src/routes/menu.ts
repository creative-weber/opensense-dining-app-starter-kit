import { Router, Request, Response, NextFunction } from 'express';
import { query } from '../db';
import type { MenuCategoryRow, MenuItemRow } from '../types/shared';

const router = Router();

// GET /api/menu/:slug — public menu for a restaurant
// Customer app calls this with ?table=<tableId> to show table context
router.get(
  '/:slug',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { slug } = req.params;
    const { table: tableId } = req.query as { table?: string };

    try {
      const restaurantResult = await query<{
        id: string;
        name: string;
        slug: string;
        logo_url: string | null;
        address: string | null;
      }>(
        `SELECT id, name, slug, logo_url, address FROM restaurants WHERE slug = $1`,
        [slug]
      );

      if (restaurantResult.rows.length === 0) {
        res.status(404).json({ error: 'RESTAURANT_NOT_FOUND' });
        return;
      }

      const restaurant = restaurantResult.rows[0];

      // Optionally resolve table info
      let table: { id: string; table_number: string; capacity: number } | null = null;
      if (tableId) {
        const tableResult = await query<{ id: string; table_number: string; capacity: number }>(
          `SELECT id, table_number, capacity FROM tables
           WHERE id = $1 AND restaurant_id = $2`,
          [tableId, restaurant.id]
        );
        if (tableResult.rows.length > 0) {
          table = tableResult.rows[0];
        }
      }

      // Fetch categories
      const categoriesResult = await query<MenuCategoryRow>(
        `SELECT id, name, sort_order FROM menu_categories
         WHERE restaurant_id = $1 AND is_archived = FALSE ORDER BY sort_order, name`,
        [restaurant.id]
      );

      // Fetch all available items for this restaurant
      const itemsResult = await query<MenuItemRow>(
        `SELECT id, category_id, name, description, price, image_url,
                is_vegetarian, is_vegan, is_available, sort_order
         FROM menu_items
         WHERE restaurant_id = $1 AND is_available = TRUE
         ORDER BY sort_order, name`,
        [restaurant.id]
      );

      const itemsByCategory: Record<string, MenuItemRow[]> = {};
      for (const item of itemsResult.rows) {
        const key = item.category_id;
        if (!itemsByCategory[key]) itemsByCategory[key] = [];
        itemsByCategory[key].push(item);
      }

      const categories = categoriesResult.rows
        .map((cat) => ({
          id: cat.id,
          name: cat.name,
          items: (itemsByCategory[cat.id] ?? []).map((item) => ({
            id: item.id,
            name: item.name,
            description: item.description,
            price: Number(item.price),
            imageUrl: item.image_url,
            isVegetarian: item.is_vegetarian,
            isVegan: item.is_vegan,
          })),
        }))
        .filter((cat) => cat.items.length > 0);

      res.json({
        restaurant: {
          id: restaurant.id,
          name: restaurant.name,
          slug: restaurant.slug,
          logoUrl: restaurant.logo_url,
          address: restaurant.address,
        },
        table,
        categories,
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
