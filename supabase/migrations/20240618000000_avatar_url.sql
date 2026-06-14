-- Avatar URL for profile photos (stored in Supabase Storage bucket "avatars")

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;
