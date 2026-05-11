-- OpenDiningApp Database Schema
-- Run: psql $DATABASE_URL -f schema.sql

-- Restaurants
CREATE TABLE IF NOT EXISTS restaurants (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                     TEXT NOT NULL,
  slug                     TEXT UNIQUE NOT NULL,
  logo_url                 TEXT,
  address                  TEXT,
  phone                    TEXT,
  brand_color              TEXT NOT NULL DEFAULT '#f97316',
  kds_pin                  TEXT,
  open_hours               JSONB,
  daily_summary_enabled    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Admin users (one per restaurant for simplicity)
CREATE TABLE IF NOT EXISTS admin_users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id   UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  email           TEXT UNIQUE NOT NULL,
  password_hash   TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Menu categories
CREATE TABLE IF NOT EXISTS menu_categories (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id   UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  sort_order      INT NOT NULL DEFAULT 0,
  is_archived     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Menu items
CREATE TABLE IF NOT EXISTS menu_items (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id     UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  category_id       UUID NOT NULL REFERENCES menu_categories(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  description       TEXT,
  price             NUMERIC(10, 2) NOT NULL,
  image_url         TEXT,
  is_vegetarian     BOOLEAN NOT NULL DEFAULT FALSE,
  is_vegan          BOOLEAN NOT NULL DEFAULT FALSE,
  is_available      BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order        INT NOT NULL DEFAULT 0,
  allergens         TEXT[]  NOT NULL DEFAULT '{}',
  ingredients       TEXT[]  NOT NULL DEFAULT '{}',
  meal_time         TEXT[]  NOT NULL DEFAULT '{}',
  tags              TEXT[]  NOT NULL DEFAULT '{}',
  is_jain           BOOLEAN NOT NULL DEFAULT FALSE,
  is_halal          BOOLEAN NOT NULL DEFAULT FALSE,
  nutrition         JSONB,
  nutrition_source  TEXT CHECK (nutrition_source IN ('database', 'ai', 'manual')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tables (physical dining tables)
CREATE TABLE IF NOT EXISTS tables (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id   UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  table_number    TEXT NOT NULL,
  capacity        INT NOT NULL DEFAULT 4,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(restaurant_id, table_number)
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id   UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  table_id        UUID REFERENCES tables(id) ON DELETE SET NULL,
  customer_name   TEXT NOT NULL,
  customer_phone  TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','confirmed','preparing','ready','served','cancelled')),
  notes           TEXT,
  subtotal        NUMERIC(10, 2) NOT NULL DEFAULT 0,
  tax             NUMERIC(10, 2) NOT NULL DEFAULT 0,
  payment_status  TEXT NOT NULL DEFAULT 'pending'
                    CHECK (payment_status IN ('pending', 'paid', 'failed')),
  whatsapp_sent   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Order items
CREATE TABLE IF NOT EXISTS order_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id    UUID REFERENCES menu_items(id) ON DELETE SET NULL,
  name            TEXT NOT NULL,
  price           NUMERIC(10, 2) NOT NULL,
  quantity        INT NOT NULL,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_menu_items_restaurant ON menu_items(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_category   ON menu_items(category_id);
CREATE INDEX IF NOT EXISTS idx_orders_restaurant     ON orders(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_orders_status         ON orders(status);
CREATE INDEX IF NOT EXISTS idx_tables_restaurant     ON tables(restaurant_id);
