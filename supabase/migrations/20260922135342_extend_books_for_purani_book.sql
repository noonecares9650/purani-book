/*
# Extend books table for Purani Book marketplace

## Overview
Upgrades the existing `books` table to support authentication, extended metadata,
multiple photos, geolocation, and owner-scoped management. Adds a `wishlists`
table for user bookmarks.

## Changes to `books` table
New columns added (all nullable / defaulted to preserve existing rows):
- `user_id` (uuid, default auth.uid()) — owner of the listing; enables edit/delete ownership checks
- `original_price` (numeric) — MRP/original cover price for discount calculation
- `subject` (text) — subject within the course category
- `edition_year` (text) — edition or publication year
- `description` (text) — free-form description
- `alternate_number` (text) — secondary phone number
- `latitude` (double precision) — seller location lat
- `longitude` (double precision) — seller location lng
- `photo_urls` (text[]) — array of base64 data URLs for multiple cover photos

Data migration: existing `photo_url` values are copied into `photo_urls` as single-element arrays.

## New table: `wishlists`
- `id` (uuid PK)
- `user_id` (uuid, default auth.uid(), FK to auth.users)
- `book_id` (uuid, FK to books, cascade delete)
- `created_at` (timestamptz)
- Unique constraint on (user_id, book_id) to prevent duplicate wishlist entries

## Security changes
### books table
- SELECT: public (anon + authenticated) — visitors can browse without signing in
- INSERT/UPDATE/DELETE: authenticated owner only (auth.uid() = user_id)
- Old anon-CRUD policies are dropped and replaced

### wishlists table
- RLS enabled
- SELECT/INSERT/DELETE: authenticated owner only
- No UPDATE policy (wishlists are toggle-created/deleted, never updated)

### Important notes
1. Existing seed books have NULL user_id — they remain readable by everyone but cannot be edited/deleted (no owner). This is correct behavior.
2. Google OAuth provider must be enabled in the Supabase dashboard for Google sign-in to work. Email/password works out of the box.
*/

-- Add new columns to books
ALTER TABLE books
  ADD COLUMN IF NOT EXISTS user_id uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS original_price numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS subject text DEFAULT '',
  ADD COLUMN IF NOT EXISTS edition_year text DEFAULT '',
  ADD COLUMN IF NOT EXISTS description text DEFAULT '',
  ADD COLUMN IF NOT EXISTS alternate_number text DEFAULT '',
  ADD COLUMN IF NOT EXISTS latitude double precision,
  ADD COLUMN IF NOT EXISTS longitude double precision,
  ADD COLUMN IF NOT EXISTS photo_urls text[] DEFAULT '{}';

-- Migrate existing single photo_url into photo_urls array
UPDATE books
  SET photo_urls = ARRAY[photo_url]
  WHERE photo_url IS NOT NULL AND (photo_urls IS NULL OR photo_urls = '{}');

-- Replace books policies: public read, owner-only writes
DROP POLICY IF EXISTS "anon_select_books" ON books;
DROP POLICY IF EXISTS "anon_insert_books" ON books;
DROP POLICY IF EXISTS "anon_update_books" ON books;
DROP POLICY IF EXISTS "anon_delete_books" ON books;

CREATE POLICY "anyone_can_read_books" ON books FOR SELECT
  TO anon, authenticated USING (true);

CREATE POLICY "owners_can_insert_books" ON books FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "owners_can_update_books" ON books FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "owners_can_delete_books" ON books FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Create wishlists table
CREATE TABLE IF NOT EXISTS wishlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id uuid NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, book_id)
);

ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "owners_can_read_wishlists" ON wishlists;
CREATE POLICY "owners_can_read_wishlists" ON wishlists FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "owners_can_insert_wishlists" ON wishlists;
CREATE POLICY "owners_can_insert_wishlists" ON wishlists FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "owners_can_delete_wishlists" ON wishlists;
CREATE POLICY "owners_can_delete_wishlists" ON wishlists FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_books_user_id ON books(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_user_id ON wishlists(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_book_id ON wishlists(book_id);