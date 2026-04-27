
## Goals

1. Profile photo upload works from **both Camera and Gallery** on Android (and from the file picker on web).
2. Fix the **app stopping** issue (Android native crash) and add guard rails so it does not silently die again.
3. Resolve the open **security findings** shown in the Security view.

---

## 1. Avatar upload — Camera OR Gallery (root cause of the crash)

**Why the app stops now:** `ProfileSection.tsx` uses `<input type="file" capture="environment">`. On Android Capacitor WebView this forces the **camera-only** intent — no gallery option, and on devices without a default camera handler the WebView intent fails and the app process is killed. Tapping it currently has no chooser.

**Fix:**
- Install `@capacitor/camera` (already a Capacitor-friendly package, browser-compatible, works with `npx cap sync`).
- Create `src/lib/avatarPicker.ts` with `pickAvatar()`:
  - On native (`Capacitor.isNativePlatform()`): call `Camera.getPhoto({ source: CameraSource.Prompt, ... })` which shows the native **"Camera / Photo Library / Cancel"** action sheet.
  - On web: open the existing hidden `<input type="file" accept="image/*">` (no `capture` attribute, so the browser shows its standard chooser including gallery + camera on mobile browsers).
  - Returns a `File` with size + dimension validation already centralized.
- Update `ProfileSection.tsx`:
  - Remove `capture="environment"` from the input.
  - Tapping the avatar calls `pickAvatar()` → unified flow → existing validation + Supabase upload code stays the same.
  - Permissions are requested by the plugin on first use; show a friendly toast if denied.

---

## 2. Stability — prevent silent native crashes

- Wrap `pickAvatar()` in try/catch with structured errors logged via `errorLogger` so future failures are captured to the `error_logs` table instead of killing the app.
- Verify the existing `ErrorBoundary` covers the Settings route; add a fallback if not.
- Run a TypeScript build (`bun run build`) before finishing — type errors are the most common cause of an APK that boots then white-screens / closes.
- Confirm `npx cap sync` compatibility: `@capacitor/camera` is a first-party Capacitor plugin, fully compatible.

---

## 3. Security findings (from the Security view)

Apply via SQL migrations + edge function update:

### a. `profiles` exposes sensitive fields to all authenticated users
- Drop the broad `profiles_select` policy.
- Add two policies:
  - `profiles_select_own` — `auth.uid() = user_id` (full row access to self).
  - `profiles_select_public` — others can read but only via a new SECURITY INVOKER **view** `public.profiles_public` exposing only safe columns: `user_id, nickname, avatar_url, bio, tribe, tribe_id, tribe_type, is_verified, points, role, brand_name, brand_logo_url, brand_description, social_links, website_url, academic_level, created_at`.
  - Excluded from public view: `whatsapp_number`, `verification_code`, `student_id_url`, `push_token`.
- Keep base table readable for self only; update any client query that selects sensitive fields from other users to use `profiles_public` (audit and update call sites — most already only use safe fields).

### b. `notifications` INSERT is `WITH CHECK (true)`
- Replace policy with: `WITH CHECK (actor_id = auth.uid() OR actor_id IS NULL AND user_id = auth.uid())`. This prevents spoofing while still allowing the existing app code (which sets `actor_id` to the acting user) to insert.

### c. `ai-chat` edge function accepts unauthenticated requests
- Add JWT verification at top of `supabase/functions/ai-chat/index.ts`:
  - Read `Authorization` header, create a Supabase client with that header, call `auth.getUser()`, return 401 if missing/invalid.
  - Use the authenticated `user.id` for any future server-side rate limiting (kept as a TODO note; client limit unchanged for now).

### d. Banner storage policies missing admin check
- Drop `Admin upload banners` and `Admin delete banners`, recreate with `is_admin(auth.uid())` in the WITH CHECK / USING clauses.

### e. Public bucket allows listing (avatars + others)
- Already fixed for `avatars` in a prior migration. Also drop the broad `Public read banners` / `Public read post-media` / `Public read course-documents` SELECT policies on `storage.objects` — public buckets serve via CDN URLs and don't need a list policy.

### f. Realtime channel authorization
- Add RLS on `realtime.messages` restricting topic subscriptions to the authenticated user. Policy: subscribers may only join topics matching their own `auth.uid()` for `user-notifications-*` and topics they have access to for `room_messages` (verified via room membership). For now apply a conservative policy: allow only topics where the topic name contains `auth.uid()::text`, which matches the existing `user-notifications-{userId}` naming convention.

### g. Security Definer View
- Audit existing views; recreate any flagged view with `SECURITY INVOKER` (the default in PG 15+) or explicitly drop `SECURITY DEFINER`.

### h. Leaked password protection (warn)
- Cannot toggle from migrations — note in the response with a link to Auth settings so the user enables it manually.

### i. Other warnings
- `RLS Policy Always True` — covered by the notifications fix above.
- `Public Bucket Allows Listing` — covered by storage policy cleanup.

---

## Files to change

- **New**: `src/lib/avatarPicker.ts`
- **Edit**: `src/components/settings/ProfileSection.tsx` (use new picker, remove `capture`)
- **Edit**: `package.json` (add `@capacitor/camera`)
- **Edit**: `supabase/functions/ai-chat/index.ts` (JWT verification)
- **New migration**: profile RLS split + `profiles_public` view, notifications insert tightening, banner storage admin checks, drop public-bucket SELECT list policies, realtime channel policy, view security-invoker fixes.

## Verification before finishing

1. `bun run build` — must pass with zero type errors.
2. Run Supabase linter — no new errors introduced.
3. Manual self-review: confirm queries that read other users' profiles use only safe columns (or migrate them to `profiles_public`).
