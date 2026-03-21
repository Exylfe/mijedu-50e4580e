# Mijedu Platform -- Build Plan

## Overview

Mijedu is a student social platform with tribes (campus groups), posts/reactions, marketplace ("Bwalo"), chat rooms, stories, AI assistant, admin tools, and a points/leaderboard system. The source code from the zip contains ~236 files including full frontend and 6 database migrations.

## Step 1: Run Database Migrations (Backend Setup)

Execute the 6 migration files in order against the connected Supabase project. These create:

- **1 enum**: `app_role` (user, tribe_admin, super_admin, vip_brand)
- **22 tables**: profiles, user_roles, tribes, posts, post_comments, post_reactions, post_views, post_reports, entity_follows, brands, categories, products, product_categories, product_views, product_clicks, notifications, rooms, room_messages, stories, banners, banner_views, promoted_posts, student_shops, app_settings, admin_action_logs, points_history, course_documents
- **6 security-definer functions**: has_role, is_admin, is_super_admin, is_verified, award_points, get_room_message_counts
- **1 trigger**: handle_new_user (auto-creates profile + default role on signup)
- **2 additional triggers**: sync_fire_count, update_room_last_activity
- **50+ RLS policies** covering all tables
- **5 views**: hot_posts, following_feed, active_tribes, trending_tribes, room_lifecycle_stats
- **3 storage buckets**: post-media, banners, course-documents (with storage RLS policies)
- **Realtime** enabled on 9 tables
- **Seed data**: 3 initial tribes + 12 marketplace categories

The later migrations add: brands status/logo columns, posts comments_locked/reach_limited, room message status, fire_count sync trigger, room activity trigger, product categories array, and category icons.

## Step 2: Deploy Edge Function

Deploy the `ai-chat` edge function. It uses `LOVABLE_API_KEY` (already set) to proxy AI queries through the Lovable AI gateway. Supports streaming responses, conversation history, and course-document tutor mode.

## Step 3: Copy All Frontend Source Code

Replace the current placeholder app with the full source from the zip (~200+ files):

- **3 context providers**: AuthContext, ViewAsContext, ProfileCardContext
- **30+ pages**: Auth, SocietyFeed, Market, TribeFeed, Rooms, RoomChat, Explore, Settings, ProfilePage, Leaderboard, AIAssistant, Gatekeeper, ExecutiveConsole, BrandHub, CreatorStudio, ShopOffice, VerificationStation, TribeAdminHub, PostManagement, and more
- **60+ components**: PostCard, CommentSection, StoryTray, NotificationBell, BottomNav, MediaUploader, ProductDetailModal, DigitalIDCard, SplashScreen, etc.
- **15+ hooks**: useAIChat, useEntityFollow, useNotifications, useRoleManager, useCategories, useCourses, useLeaderboard, useMaintenanceMode, etc.
- **3 utility modules**: errorLogger, pointsSystem, demoContentGenerator
- **Updated App.tsx** with full routing (protected, admin, brand routes)
- **Updated index.css** with Mijedu theme (purple/pink gradients, Sora font)
- **Updated tailwind.config.ts** with custom design tokens
- **Updated package.json** with additional dependencies (framer-motion, react-markdown, browser-image-compression, recharts, @fontsource/sora)

## Step 4: Update Supabase Client

Point `src/integrations/supabase/client.ts` to the connected Supabase project (already done -- URL and anon key match). Remove `@lovable.dev/cloud-auth-js` dependency since we're using external Supabase.

## Step 5: Verify & Test

- Confirm all tables exist and RLS is active
- Test the ai-chat edge function
- Verify the app loads, auth flow works (signup with tribe selection, verification gate)

---

## Technical Details

**Migration strategy**: The first migration (`20260318000001_full_schema.sql`) is a monolithic schema file. However, it duplicates content with the second migration (`20260318201120`), which recreates the same tables/functions/policies. To avoid conflicts, I will consolidate into a single clean migration that uses `IF NOT EXISTS` and `OR REPLACE` patterns throughout, then apply the 4 incremental migrations on top.

**Dependencies to add**: `@fontsource/sora`, `browser-image-compression`, `framer-motion`, `react-markdown`, `recharts`, `@tailwindcss/typography`

**Dependencies to remove**: `@lovable.dev/cloud-auth-js` (Lovable Cloud auth -- not applicable for external Supabase)

**Storage buckets**: Created via migration SQL (`INSERT INTO storage.buckets`). Storage RLS policies allow public read on all buckets, authenticated upload on post-media and course-documents.

**Realtime**: 9 tables added to `supabase_realtime` publication for live updates on posts, comments, reactions, notifications, rooms, messages, stories, follows, and profiles.

Remember to follow the schema provided u can add any missing ones 