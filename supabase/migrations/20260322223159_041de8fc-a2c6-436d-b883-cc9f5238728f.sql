-- Create security definer function for tribe-scoped admin checks
CREATE OR REPLACE FUNCTION public.is_same_tribe_admin(_admin_id uuid, _target_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.profiles admin_p ON admin_p.user_id = _admin_id
    JOIN public.profiles target_p ON target_p.user_id = _target_user_id
    WHERE ur.user_id = _admin_id
      AND ur.role = 'tribe_admin'
      AND admin_p.tribe = target_p.tribe
  )
$$;

-- Function to check if a tribe_admin can modify a target user
CREATE OR REPLACE FUNCTION public.can_admin_modify(_admin_id uuid, _target_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT
    public.is_super_admin(_admin_id)
    OR (
      public.is_same_tribe_admin(_admin_id, _target_user_id)
      AND NOT public.is_super_admin(_target_user_id)
      AND NOT public.has_role(_target_user_id, 'vip_brand')
    )
$$;