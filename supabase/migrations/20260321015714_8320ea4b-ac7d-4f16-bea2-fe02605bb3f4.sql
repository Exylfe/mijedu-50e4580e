
-- Fix security definer views by setting them to security invoker
ALTER VIEW public.hot_posts SET (security_invoker = on);
ALTER VIEW public.following_feed SET (security_invoker = on);
ALTER VIEW public.active_tribes SET (security_invoker = on);
ALTER VIEW public.trending_tribes SET (security_invoker = on);
ALTER VIEW public.room_lifecycle_stats SET (security_invoker = on);
