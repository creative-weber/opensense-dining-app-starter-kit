-- Sprint 1 Migration
-- Run: psql $DATABASE_URL -f src/db/migrations/001_sprint1.sql

-- ── restaurants: settings columns ───────────────────────────────────────────
ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS phone                   TEXT,
  ADD COLUMN IF NOT EXISTS brand_color             TEXT NOT NULL DEFAULT '#f97316',
  ADD COLUMN IF NOT EXISTS kds_pin                 TEXT,
  ADD COLUMN IF NOT EXISTS open_hours              JSONB,
  ADD COLUMN IF NOT EXISTS daily_summary_enabled   BOOLEAN NOT NULL DEFAULT FALSE;

-- ── menu_items: dietary & nutrition columns ──────────────────────────────────
ALTER TABLE menu_items
  ADD COLUMN IF NOT EXISTS allergens         TEXT[]  NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS ingredients       TEXT[]  NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS meal_time         TEXT[]  NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS tags              TEXT[]  NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS is_jain           BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_halal          BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS nutrition         JSONB,
  ADD COLUMN IF NOT EXISTS nutrition_source  TEXT
    CHECK (nutrition_source IN ('database', 'ai', 'manual'));

-- ── orders: billing & delivery columns ──────────────────────────────────────
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS tax             NUMERIC(10, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment_status  TEXT NOT NULL DEFAULT 'pending'
    CHECK (payment_status IN ('pending', 'paid', 'failed')),
  ADD COLUMN IF NOT EXISTS whatsapp_sent   BOOLEAN NOT NULL DEFAULT FALSE;
