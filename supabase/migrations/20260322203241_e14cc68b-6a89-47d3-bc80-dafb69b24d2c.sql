-- 1. handle_new_user trigger on auth.users
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 2. sync_fire_count trigger on post_reactions
CREATE OR REPLACE TRIGGER on_reaction_change
  AFTER INSERT OR DELETE ON public.post_reactions
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_fire_count();

-- 3. update_room_last_activity trigger on room_messages
CREATE OR REPLACE TRIGGER on_room_message_insert
  AFTER INSERT ON public.room_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_room_last_activity();