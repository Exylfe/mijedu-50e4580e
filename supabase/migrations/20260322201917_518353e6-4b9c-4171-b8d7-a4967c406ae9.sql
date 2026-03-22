CREATE TABLE IF NOT EXISTS public.error_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid,
  error_type text NOT NULL,
  error_message text NOT NULL,
  context jsonb DEFAULT '{}'::jsonb,
  user_agent text,
  url text
);

ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can insert errors"
  ON public.error_logs FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can read error logs"
  ON public.error_logs FOR SELECT TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Super admins can delete error logs"
  ON public.error_logs FOR DELETE TO authenticated
  USING (is_super_admin(auth.uid()));

CREATE INDEX idx_error_logs_created_at ON public.error_logs (created_at DESC);
CREATE INDEX idx_error_logs_type ON public.error_logs (error_type);