import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export type Book = {
  id: string;
  user_id: string | null;
  title: string;
  author: string;
  price: number;
  original_price: number;
  condition: string;
  category: string;
  subject: string;
  edition_year: string;
  description: string;
  city: string;
  seller_name: string;
  seller_email: string;
  contact_number: string;
  alternate_number: string;
  photo_url: string | null;
  photo_urls: string[] | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
};

export type BookInsert = {
  title: string;
  author: string;
  price: number;
  original_price: number;
  condition: string;
  category: string;
  subject: string;
  edition_year: string;
  description: string;
  city: string;
  seller_name: string;
  seller_email: string;
  contact_number: string;
  alternate_number: string;
  photo_urls: string[];
  latitude: number | null;
  longitude: number | null;
};

export type WishlistItem = {
  id: string;
  user_id: string;
  book_id: string;
  created_at: string;
};

export type Profile = {
  id: string;
  email: string;
  full_name: string;
  is_admin: boolean;
  created_at: string;
};

export type UserWithCount = Profile & {
  listing_count: number;
};

export const CONDITIONS = ['New', 'Like New', 'Good', 'Fair', 'Acceptable'] as const;
