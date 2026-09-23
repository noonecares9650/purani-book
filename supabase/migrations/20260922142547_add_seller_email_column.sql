/*
# Add seller_email column to books table

Adds the `seller_email` column that was missing from the initial extension migration.
This column stores the seller's email address, required by the Add Book form.

## Changes
- New column: `seller_email` (text, default empty string) on `books` table
*/

ALTER TABLE books
  ADD COLUMN IF NOT EXISTS seller_email text DEFAULT '';