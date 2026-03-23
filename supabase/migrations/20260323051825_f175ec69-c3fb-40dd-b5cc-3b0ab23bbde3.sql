-- Create feedback table
CREATE TABLE IF NOT EXISTS public.feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  rating integer,
  category text NOT NULL DEFAULT 'experience',
  context text,
  message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own feedback" ON public.feedback
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can read all feedback" ON public.feedback
  FOR SELECT TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Users can read own feedback" ON public.feedback
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Recreate hot_posts view with media columns
DROP VIEW IF EXISTS public.hot_posts;
CREATE VIEW public.hot_posts AS
SELECT
  p.id,
  p.content,
  p.fire_count,
  p.view_count,
  p.created_at,
  p.user_id,
  p.media_url,
  p.media_type,
  pr.tribe_id,
  (p.fire_count * 2 + p.view_count + EXTRACT(EPOCH FROM (now() - p.created_at)) / -3600) AS hot_score
FROM posts p
LEFT JOIN profiles pr ON pr.user_id = p.user_id
WHERE p.is_hidden = false
  AND p.created_at > (now() - interval '7 days')
ORDER BY hot_score DESC;