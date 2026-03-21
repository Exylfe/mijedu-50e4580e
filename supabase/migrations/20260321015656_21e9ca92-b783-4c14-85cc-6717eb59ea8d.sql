
-- Part 2: Functions, Trigger, RLS Policies

-- Security definer functions
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('super_admin', 'tribe_admin')) $$;

CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'super_admin') $$;

CREATE OR REPLACE FUNCTION public.is_verified(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = _user_id AND is_verified = true) $$;

CREATE OR REPLACE FUNCTION public.award_points(_user_id uuid, _points integer, _reason text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles SET points = points + _points WHERE user_id = _user_id;
  INSERT INTO public.points_history (user_id, points, reason) VALUES (_user_id, _points, _reason);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_room_message_counts(room_ids uuid[])
RETURNS TABLE(room_id uuid, message_count bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT rm.room_id, COUNT(*) as message_count FROM public.room_messages rm WHERE rm.room_id = ANY(room_ids) GROUP BY rm.room_id $$;

-- Handle new user trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _nickname text;
  _tribe text;
  _tribe_type text;
  _tribe_id uuid;
BEGIN
  _nickname := COALESCE(
    NEW.raw_user_meta_data ->> 'nickname',
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'name',
    split_part(NEW.email, '@', 1)
  );
  _tribe := NEW.raw_user_meta_data ->> 'tribe';
  _tribe_type := COALESCE(NEW.raw_user_meta_data ->> 'tribe_type', 'college');

  IF _tribe IS NOT NULL AND _tribe <> '' THEN
    SELECT id INTO _tribe_id FROM public.tribes WHERE name = _tribe LIMIT 1;
  END IF;

  INSERT INTO public.profiles (user_id, nickname, tribe, tribe_id, tribe_type, is_verified)
  VALUES (NEW.id, _nickname, _tribe, _tribe_id, _tribe_type, false)
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Fire count sync trigger
CREATE OR REPLACE FUNCTION sync_fire_count()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET fire_count = (SELECT count(*) FROM post_reactions WHERE post_id = NEW.post_id) WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET fire_count = (SELECT count(*) FROM post_reactions WHERE post_id = OLD.post_id) WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_fire_count ON post_reactions;
CREATE TRIGGER trg_sync_fire_count
AFTER INSERT OR DELETE ON post_reactions
FOR EACH ROW EXECUTE FUNCTION sync_fire_count();

-- Room last_activity_at trigger
CREATE OR REPLACE FUNCTION update_room_last_activity()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE rooms SET last_activity_at = now() WHERE id = NEW.room_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_room_activity ON room_messages;
CREATE TRIGGER trg_room_activity
AFTER INSERT ON room_messages
FOR EACH ROW EXECUTE FUNCTION update_room_last_activity();

-- RLS POLICIES
-- Tribes
CREATE POLICY "tribes_select" ON public.tribes FOR SELECT USING (true);
CREATE POLICY "tribes_insert" ON public.tribes FOR INSERT TO authenticated WITH CHECK (public.is_super_admin(auth.uid()));
CREATE POLICY "tribes_update" ON public.tribes FOR UPDATE TO authenticated USING (public.is_super_admin(auth.uid()));
CREATE POLICY "tribes_delete" ON public.tribes FOR DELETE TO authenticated USING (public.is_super_admin(auth.uid()));

-- Profiles
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE TO authenticated USING (user_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY "profiles_delete" ON public.profiles FOR DELETE TO authenticated USING (public.is_super_admin(auth.uid()));

-- User roles
CREATE POLICY "user_roles_select" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY "user_roles_insert" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "user_roles_update" ON public.user_roles FOR UPDATE TO authenticated USING (public.is_super_admin(auth.uid()));
CREATE POLICY "user_roles_delete" ON public.user_roles FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

-- Posts
CREATE POLICY "posts_select" ON public.posts FOR SELECT TO authenticated USING ((NOT is_hidden) OR user_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY "posts_insert" ON public.posts FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "posts_update" ON public.posts FOR UPDATE TO authenticated USING (user_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY "posts_delete" ON public.posts FOR DELETE TO authenticated USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

-- Comments
CREATE POLICY "comments_select" ON public.post_comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "comments_insert" ON public.post_comments FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "comments_delete" ON public.post_comments FOR DELETE TO authenticated USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

-- Reactions
CREATE POLICY "reactions_select" ON public.post_reactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "reactions_insert" ON public.post_reactions FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "reactions_delete" ON public.post_reactions FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Views
CREATE POLICY "views_select" ON public.post_views FOR SELECT TO authenticated USING (true);
CREATE POLICY "views_insert" ON public.post_views FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Reports
CREATE POLICY "reports_select" ON public.post_reports FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY "reports_insert" ON public.post_reports FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Follows
CREATE POLICY "follows_select" ON public.entity_follows FOR SELECT TO authenticated USING (true);
CREATE POLICY "follows_insert" ON public.entity_follows FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "follows_delete" ON public.entity_follows FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Brands
CREATE POLICY "brands_select" ON public.brands FOR SELECT TO authenticated USING (true);
CREATE POLICY "brands_insert" ON public.brands FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY "brands_update" ON public.brands FOR UPDATE TO authenticated USING (user_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY "brands_delete" ON public.brands FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

-- Categories
CREATE POLICY "categories_select" ON public.categories FOR SELECT USING (true);
CREATE POLICY "categories_insert" ON public.categories FOR INSERT TO authenticated WITH CHECK (public.is_super_admin(auth.uid()));

-- Products
CREATE POLICY "products_select" ON public.products FOR SELECT TO authenticated USING (true);
CREATE POLICY "products_insert" ON public.products FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "products_update" ON public.products FOR UPDATE TO authenticated USING (user_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY "products_delete" ON public.products FOR DELETE TO authenticated USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

-- Product categories
CREATE POLICY "product_categories_select" ON public.product_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "product_categories_insert" ON public.product_categories FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "product_categories_delete" ON public.product_categories FOR DELETE TO authenticated USING (true);

-- Product views/clicks
CREATE POLICY "product_views_select" ON public.product_views FOR SELECT TO authenticated USING (true);
CREATE POLICY "product_views_insert" ON public.product_views FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "product_clicks_select" ON public.product_clicks FOR SELECT TO authenticated USING (true);
CREATE POLICY "product_clicks_insert" ON public.product_clicks FOR INSERT TO authenticated WITH CHECK (true);

-- Notifications
CREATE POLICY "notifications_select" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "notifications_insert" ON public.notifications FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "notifications_update" ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- Rooms
CREATE POLICY "rooms_select" ON public.rooms FOR SELECT TO authenticated USING (true);
CREATE POLICY "rooms_insert" ON public.rooms FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY "rooms_update" ON public.rooms FOR UPDATE TO authenticated USING (created_by = auth.uid() OR public.is_admin(auth.uid()));

-- Room messages
CREATE POLICY "room_messages_select" ON public.room_messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "room_messages_insert" ON public.room_messages FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Stories
CREATE POLICY "stories_select" ON public.stories FOR SELECT TO authenticated USING (true);
CREATE POLICY "stories_insert" ON public.stories FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "stories_delete" ON public.stories FOR DELETE TO authenticated USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

-- Banners
CREATE POLICY "banners_select" ON public.banners FOR SELECT USING (true);
CREATE POLICY "banners_insert" ON public.banners FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "banners_update" ON public.banners FOR UPDATE TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "banners_delete" ON public.banners FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

-- Banner views
CREATE POLICY "banner_views_select" ON public.banner_views FOR SELECT TO authenticated USING (true);
CREATE POLICY "banner_views_insert" ON public.banner_views FOR INSERT TO authenticated WITH CHECK (true);

-- Promoted posts
CREATE POLICY "promoted_select" ON public.promoted_posts FOR SELECT TO authenticated USING (true);
CREATE POLICY "promoted_insert" ON public.promoted_posts FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY "promoted_update" ON public.promoted_posts FOR UPDATE TO authenticated USING (user_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY "promoted_delete" ON public.promoted_posts FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

-- Student shops
CREATE POLICY "shops_select" ON public.student_shops FOR SELECT TO authenticated USING (true);
CREATE POLICY "shops_insert" ON public.student_shops FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "shops_update" ON public.student_shops FOR UPDATE TO authenticated USING (user_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY "shops_delete" ON public.student_shops FOR DELETE TO authenticated USING (user_id = auth.uid());

-- App settings
CREATE POLICY "settings_select" ON public.app_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "settings_insert" ON public.app_settings FOR INSERT TO authenticated WITH CHECK (public.is_super_admin(auth.uid()));
CREATE POLICY "settings_update" ON public.app_settings FOR UPDATE TO authenticated USING (public.is_super_admin(auth.uid()));

-- Admin action logs
CREATE POLICY "logs_select" ON public.admin_action_logs FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "logs_insert" ON public.admin_action_logs FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));

-- Points history
CREATE POLICY "points_select" ON public.points_history FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY "points_insert" ON public.points_history FOR INSERT TO authenticated WITH CHECK (true);

-- Course documents
CREATE POLICY "courses_select" ON public.course_documents FOR SELECT TO authenticated USING (true);
CREATE POLICY "courses_insert" ON public.course_documents FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "courses_delete" ON public.course_documents FOR DELETE TO authenticated USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

-- VIEWS
CREATE OR REPLACE VIEW public.hot_posts AS
SELECT p.id, p.content, p.fire_count, p.view_count, p.created_at, p.user_id, pr.tribe_id,
  (p.fire_count * 3 + p.view_count + EXTRACT(EPOCH FROM (now() - p.created_at)) / -3600) AS hot_score
FROM public.posts p LEFT JOIN public.profiles pr ON pr.user_id = p.user_id
WHERE p.visibility = 'public' AND NOT p.is_hidden ORDER BY hot_score DESC;

CREATE OR REPLACE VIEW public.following_feed AS
SELECT p.id, p.content, p.fire_count, p.report_count, p.is_hidden, p.created_at,
  p.user_id, p.visibility, p.target_tribe, p.media_url, p.media_type,
  ef.user_id AS follower_user
FROM public.posts p
INNER JOIN public.entity_follows ef ON ef.entity_id = p.user_id::text AND ef.entity_type = 'user'
WHERE NOT p.is_hidden;

CREATE OR REPLACE VIEW public.active_tribes AS
SELECT t.id, t.name, t.type, t.description, t.logo_url, t.is_visible,
  COUNT(DISTINCT pr.id) AS member_count
FROM public.tribes t LEFT JOIN public.profiles pr ON pr.tribe_id = t.id
WHERE t.is_visible = true GROUP BY t.id;

CREATE OR REPLACE VIEW public.trending_tribes AS
SELECT t.id, t.name, t.type, COUNT(DISTINCT p.id) AS post_count
FROM public.tribes t LEFT JOIN public.profiles pr ON pr.tribe_id = t.id
LEFT JOIN public.posts p ON p.user_id = pr.user_id AND p.created_at > now() - interval '7 days'
WHERE t.is_visible = true GROUP BY t.id, t.name, t.type ORDER BY post_count DESC;

CREATE OR REPLACE VIEW public.room_lifecycle_stats AS
SELECT r.id AS room_id, r.title, r.tribe, r.is_active, r.created_at, r.last_activity_at,
  COUNT(rm.id) AS message_count
FROM public.rooms r LEFT JOIN public.room_messages rm ON rm.room_id = r.id GROUP BY r.id;

-- STORAGE
INSERT INTO storage.buckets (id, name, public) VALUES ('post-media', 'post-media', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('banners', 'banners', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('course-documents', 'course-documents', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read post-media" ON storage.objects FOR SELECT USING (bucket_id = 'post-media');
CREATE POLICY "Auth upload post-media" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'post-media');
CREATE POLICY "Auth delete own post-media" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'post-media' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Public read banners" ON storage.objects FOR SELECT USING (bucket_id = 'banners');
CREATE POLICY "Admin upload banners" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'banners');
CREATE POLICY "Admin delete banners" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'banners');
CREATE POLICY "Public read course-documents" ON storage.objects FOR SELECT USING (bucket_id = 'course-documents');
CREATE POLICY "Auth upload course-documents" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'course-documents');

-- SEED DATA
INSERT INTO public.tribes (name, type, description, is_visible) VALUES
  ('Mijedu', 'media', 'Official Mijedu admin tribe', true),
  ('University 1', 'college', 'First university community', true),
  ('Corporate Brands', 'media', 'For corporate brand partners', true)
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.categories (name, slug, icon) VALUES
  ('Electronics', 'electronics', 'Laptop'),
  ('Education', 'education', 'Book'),
  ('Fashion', 'fashion', 'Shirt'),
  ('Health & Beauty', 'health-beauty', 'Heart'),
  ('Food & Drink', 'food-drink', 'UtensilsCrossed'),
  ('Services', 'services', 'Wrench'),
  ('Stationery', 'stationery', 'Pencil'),
  ('Home & Living', 'home-living', 'Home'),
  ('Gaming', 'gaming', 'Gamepad2'),
  ('Sports', 'sports', 'Dumbbell'),
  ('Books & Media', 'books-media', 'BookOpen'),
  ('Accessories', 'accessories', 'Watch')
ON CONFLICT (slug) DO UPDATE SET icon = EXCLUDED.icon, name = EXCLUDED.name;

-- REALTIME
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.posts; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.post_comments; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.post_reactions; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.room_messages; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.stories; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.entity_follows; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

NOTIFY pgrst, 'reload schema';
