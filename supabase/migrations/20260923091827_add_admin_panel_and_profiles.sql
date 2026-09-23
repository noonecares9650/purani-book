/*
# Admin panel: profiles table, admin role, user listing function

## New table: profiles
- Mirrors auth.users with is_admin flag
- Auto-populated via trigger on auth.users INSERT
- First registered user becomes admin automatically

## New functions
- is_admin() — returns true if current user has admin profile
- get_all_users() — SECURITY DEFINER, returns all users with listing counts
- admin_toggle_user_admin(p_user_id uuid, p_is_admin boolean) — admin can promote/demote

## RLS changes
- books UPDATE/DELETE: now allows admin OR owner
- profiles: users read own, admins read all, admins update all

## Backfill
- Creates profiles for existing auth.users
- Sets the earliest-created user as admin
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text DEFAULT '',
  full_name text DEFAULT '',
  is_admin boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Backfill existing users
INSERT INTO profiles (id, email, full_name, is_admin, created_at)
SELECT u.id, u.email, COALESCE(u.raw_user_meta_data->>'full_name', ''), false, u.created_at
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = u.id);

-- Make the earliest user admin
UPDATE profiles SET is_admin = true
WHERE id = (SELECT id FROM profiles ORDER BY created_at ASC LIMIT 1);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, is_admin)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    (SELECT count(*) = 0 FROM profiles)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- is_admin() function
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true
  );
$$ LANGUAGE sql;

-- get_all_users() — admin only, returns all users with listing counts
CREATE OR REPLACE FUNCTION get_all_users()
RETURNS TABLE (
  id uuid,
  email text,
  full_name text,
  is_admin boolean,
  created_at timestamptz,
  listing_count bigint
)
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied: admin only';
  END IF;
  RETURN QUERY
    SELECT
      p.id, p.email, p.full_name, p.is_admin, p.created_at,
      COUNT(b.id)::bigint as listing_count
    FROM profiles p
    LEFT JOIN books b ON b.user_id = p.id
    GROUP BY p.id, p.email, p.full_name, p.is_admin, p.created_at
    ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- admin_toggle_user_admin — promote or demote
CREATE OR REPLACE FUNCTION admin_toggle_user_admin(p_user_id uuid, p_is_admin boolean)
RETURNS void
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied: admin only';
  END IF;
  UPDATE profiles SET is_admin = p_is_admin WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- admin_delete_book — admin can delete any book
CREATE OR REPLACE FUNCTION admin_delete_book(p_book_id uuid)
RETURNS void
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied: admin only';
  END IF;
  DELETE FROM books WHERE id = p_book_id;
END;
$$ LANGUAGE plpgsql;

-- Grant execute
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION get_all_users() TO authenticated;
GRANT EXECUTE ON FUNCTION admin_toggle_user_admin(uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_delete_book(uuid) TO authenticated;

-- Profiles RLS
DROP POLICY IF EXISTS "users_read_own_profile" ON profiles;
CREATE POLICY "users_read_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "admins_read_all_profiles" ON profiles;
CREATE POLICY "admins_read_all_profiles" ON profiles FOR SELECT
  TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "admins_update_profiles" ON profiles;
CREATE POLICY "admins_update_profiles" ON profiles FOR UPDATE
  TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- Update books RLS to allow admin
DROP POLICY IF EXISTS "owners_can_update_books" ON books;
CREATE POLICY "owners_or_admin_can_update_books" ON books FOR UPDATE
  TO authenticated USING (auth.uid() = user_id OR is_admin()) WITH CHECK (auth.uid() = user_id OR is_admin());

DROP POLICY IF EXISTS "owners_can_delete_books" ON books;
CREATE POLICY "owners_or_admin_can_delete_books" ON books FOR DELETE
  TO authenticated USING (auth.uid() = user_id OR is_admin());