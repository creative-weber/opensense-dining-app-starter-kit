-- Sprint 2 Migration: category soft-delete (archive)
-- Run: psql $DATABASE_URL -f src/db/migrations/002_category_archive.sql

ALTER TABLE menu_categories
  ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT FALSE;
