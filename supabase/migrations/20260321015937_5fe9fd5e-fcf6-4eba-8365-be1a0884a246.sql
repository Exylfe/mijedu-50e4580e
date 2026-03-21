
-- Add missing columns that the frontend code expects

-- banners needs status and brand_user_id
ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';
ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS brand_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- posts needs tribe_id for tribe-specific queries
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS tribe_id uuid REFERENCES public.tribes(id) ON DELETE SET NULL;

-- Recreate views with expected columns
CREATE OR REPLACE VIEW public.active_tribes WITH (security_invoker = on) AS
SELECT t.id, t.name, t.type, t.description, t.logo_url, t.is_visible,
  COUNT(DISTINCT pr.id) AS member_count,
  COUNT(DISTINCT ef.id) AS follower_count
FROM public.tribes t
LEFT JOIN public.profiles pr ON pr.tribe_id = t.id
LEFT JOIN public.entity_follows ef ON ef.entity_id = t.id::text AND ef.entity_type = 'tribe'
WHERE t.is_visible = true GROUP BY t.id;

CREATE OR REPLACE VIEW public.trending_tribes WITH (security_invoker = on) AS
SELECT t.id, t.name, t.type,
  COUNT(DISTINCT p.id) AS post_count,
  COUNT(DISTINCT ef.id) AS follower_count
FROM public.tribes t
LEFT JOIN public.profiles pr ON pr.tribe_id = t.id
LEFT JOIN public.posts p ON p.user_id = pr.user_id AND p.created_at > now() - interval '7 days'
LEFT JOIN public.entity_follows ef ON ef.entity_id = t.id::text AND ef.entity_type = 'tribe'
WHERE t.is_visible = true GROUP BY t.id, t.name, t.type ORDER BY post_count DESC;

-- Create room_lifecycle_stats as an RPC function instead of view for aggregated stats
CREATE OR REPLACE FUNCTION public.get_room_lifecycle_stats()
RETURNS json LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT json_build_object(
    'total_rooms', (SELECT count(*) FROM rooms),
    'active_rooms', (SELECT count(*) FROM rooms WHERE is_active = true),
    'expired_rooms', (SELECT count(*) FROM rooms WHERE is_active = false),
    'average_room_lifespan_hours', COALESCE(
      (SELECT avg(EXTRACT(EPOCH FROM (COALESCE(last_activity_at, created_at) - created_at)) / 3600) FROM rooms),
      0
    ),
    'average_messages_per_room', COALESCE(
      (SELECT avg(cnt) FROM (SELECT count(*) as cnt FROM room_messages GROUP BY room_id) sub),
      0
    )
  )
$$;

NOTIFY pgrst, 'reload schema';
