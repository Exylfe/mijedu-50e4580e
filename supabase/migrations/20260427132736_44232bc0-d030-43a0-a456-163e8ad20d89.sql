-- =====================================================================
-- 1. PROFILES: split SELECT into owner-full vs public-safe
-- =====================================================================
DROP POLICY IF EXISTS profiles_select ON public.profiles;

CREATE POLICY profiles_select_own
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Safe public view (no sensitive columns). SECURITY INVOKER is the default
-- in PG15+, but we set it explicitly to satisfy the linter.
DROP VIEW IF EXISTS public.profiles_public CASCADE;
CREATE VIEW public.profiles_public
WITH (security_invoker = true)
AS
SELECT
  id,
  user_id,
  nickname,
  avatar_url,
  bio,
  tribe,
  tribe_id,
  tribe_type,
  is_verified,
  points,
  role,
  brand_name,
  brand_logo_url,
  brand_description,
  social_links,
  website_url,
  academic_level,
  created_at
FROM public.profiles;

GRANT SELECT ON public.profiles_public TO authenticated, anon;

-- Allow authenticated users to read the underlying rows ONLY through the
-- view by adding a permissive SELECT policy that exposes the same safe
-- subset. The view is SECURITY INVOKER, so RLS still applies; we add a
-- second policy that complements the owner-only one above.
CREATE POLICY profiles_select_public_safe
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- NOTE: The above looks permissive but combined with the owner policy it is
-- the same SELECT surface as before for the base table. The real protection
-- comes from the application using `profiles_public` for cross-user reads.
-- We immediately tighten by REVOKING column-level access to sensitive cols
-- from the authenticated role on the base table.
REVOKE SELECT (whatsapp_number, verification_code, student_id_url, push_token)
  ON public.profiles FROM authenticated;
REVOKE SELECT (whatsapp_number, verification_code, student_id_url, push_token)
  ON public.profiles FROM anon;

-- Re-grant column SELECT on safe columns explicitly so authenticated users
-- can still read the rest of the row.
GRANT SELECT (
  id, user_id, nickname, avatar_url, bio, tribe, tribe_id, tribe_type,
  is_verified, points, role, brand_name, brand_logo_url, brand_description,
  social_links, website_url, academic_level, created_at, updated_at,
  tribe_id
) ON public.profiles TO authenticated;

-- The owner needs full access, including sensitive columns. Grant column
-- privileges via a SECURITY DEFINER function-style approach: we keep
-- column REVOKEs above, and provide the owner read path through the
-- existing RLS policy + a dedicated function.
CREATE OR REPLACE FUNCTION public.get_my_sensitive_profile()
RETURNS TABLE (
  whatsapp_number text,
  verification_code text,
  student_id_url text,
  push_token text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT whatsapp_number, verification_code, student_id_url, push_token
  FROM public.profiles
  WHERE user_id = auth.uid()
  LIMIT 1
$$;

GRANT EXECUTE ON FUNCTION public.get_my_sensitive_profile() TO authenticated;

-- =====================================================================
-- 2. NOTIFICATIONS: prevent spoofing
-- =====================================================================
DROP POLICY IF EXISTS notifications_insert ON public.notifications;

CREATE POLICY notifications_insert
  ON public.notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Either the actor is the caller, or there is no actor and the
    -- notification targets the caller themselves (self-notify, e.g. system events).
    (actor_id = auth.uid())
    OR (actor_id IS NULL AND user_id = auth.uid())
  );

-- =====================================================================
-- 3. BANNER STORAGE: enforce admin checks
-- =====================================================================
DROP POLICY IF EXISTS "Admin upload banners" ON storage.objects;
DROP POLICY IF EXISTS "Admin delete banners" ON storage.objects;

CREATE POLICY "Admin upload banners"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'banners' AND public.is_admin(auth.uid()));

CREATE POLICY "Admin delete banners"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'banners' AND public.is_admin(auth.uid()));

-- =====================================================================
-- 4. PUBLIC BUCKETS: drop broad list/select policies (CDN still serves files)
-- =====================================================================
DROP POLICY IF EXISTS "Public read banners" ON storage.objects;
DROP POLICY IF EXISTS "Public read post-media" ON storage.objects;
DROP POLICY IF EXISTS "Public read course-documents" ON storage.objects;
DROP POLICY IF EXISTS "Avatars are publicly viewable" ON storage.objects;

-- =====================================================================
-- 5. REALTIME: restrict channel subscriptions to topics owned by the user
-- =====================================================================
ALTER TABLE IF EXISTS realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can subscribe to own topics" ON realtime.messages;

CREATE POLICY "Users can subscribe to own topics"
  ON realtime.messages
  FOR SELECT
  TO authenticated
  USING (
    -- Topic naming convention contains the user's UUID for personal channels.
    -- Room channels use a room id; we allow them too since room_messages RLS
    -- already controls payload visibility.
    topic LIKE '%' || auth.uid()::text || '%'
    OR topic LIKE 'room-%'
    OR topic LIKE 'public:%'
  );
