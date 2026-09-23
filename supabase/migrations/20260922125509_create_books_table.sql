/*
# Create books table for Used Book Marketplace

1. New Tables
- `books` — stores listings for the used book marketplace
  - `id` (uuid, primary key)
  - `title` (text, not null) — book name
  - `author` (text, not null) — book author
  - `price` (numeric, not null) — asking price in USD
  - `condition` (text, not null) — book condition (New, Like New, Good, Fair, Acceptable)
  - `category` (text, not null) — course category (e.g. Computer Science, Biology, Mathematics)
  - `city` (text, not null) — seller's location/city
  - `seller_name` (text, not null) — name of the seller
  - `contact_number` (text, not null) — phone number for the "Call" button
  - `photo_url` (text) — base64 data URL of the uploaded photo, or null
  - `created_at` (timestptz, default now())

2. Security
- Enable RLS on `books`.
- Allow anon + authenticated CRUD because the marketplace is intentionally public (no sign-in required).

3. Notes
- This is a single-tenant app with no authentication. All listings are shared/public.
- Photos are stored as base64 data URLs in the `photo_url` text column to avoid needing a storage bucket.
*/

CREATE TABLE IF NOT EXISTS books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  author text NOT NULL,
  price numeric NOT NULL DEFAULT 0,
  condition text NOT NULL DEFAULT 'Good',
  category text NOT NULL DEFAULT 'General',
  city text NOT NULL,
  seller_name text NOT NULL,
  contact_number text NOT NULL,
  photo_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE books ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_books" ON books;
CREATE POLICY "anon_select_books" ON books FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_books" ON books;
CREATE POLICY "anon_insert_books" ON books FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_books" ON books;
CREATE POLICY "anon_update_books" ON books FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_books" ON books;
CREATE POLICY "anon_delete_books" ON books FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_books_category ON books(category);
CREATE INDEX IF NOT EXISTS idx_books_title ON books(title);
