

# Pilot-Ready Hardening Plan

## 1. Branding & Metadata
Update `index.html`: title to "Mijedu - Student Super-App", OG tags with Mijedu branding, description "Your campus super-app for tribes, marketplace, and student life", add favicon reference to Mijedu logo. Remove all Lovable references.

## 2. MediaUploader Hardening (`src/components/MediaUploader.tsx`)
- **Image compression**: Use `browser-image-compression` (already installed) to compress images before upload -- max width 1200px, quality 0.7, max size 2MB
- **Full try-catch**: Wrap entire upload flow in try-catch with user-friendly toast messages for network errors, timeouts, and storage failures
- **Blob URL cleanup**: Call `URL.revokeObjectURL()` on preview URLs when media is removed or component unmounts
- **File path sanitization**: Already uses `replace(/[^a-zA-Z0-9.-]/g, '_')` and user-ID-based paths -- this is already good, no changes needed

## 3. Auth Redirect URLs
Update 4 locations to use production domain `https://mijedu.vercel.app`:
- `src/pages/Auth.tsx` line 114: `emailRedirectTo`
- `src/pages/Auth.tsx` line 277: Google OAuth `redirectTo`
- `src/pages/Auth.tsx` line 308: password reset `redirectTo`
- `src/contexts/AuthContext.tsx` line 210: signUp `emailRedirectTo`

Strategy: Use an environment variable `VITE_APP_URL` with fallback to `window.location.origin`, defaulting to `https://mijedu.vercel.app` in production.

## 4. CreateAccountModal UX (`src/components/gatekeeper/CreateAccountModal.tsx`)
- Already has loading state and spinner -- good
- Add better error handling: detect "Failed to fetch" specifically and show "Connection error. Check your internet and try again." message
- Disable the close button and form inputs while loading to prevent accidental dismissal

## 5. Error Dashboard
Create an `error_logs` table in Supabase to capture client-side errors, and update `errorLogger.ts` to write errors there. Build a simple error viewer section in the Gatekeeper admin panel.

**Database migration**: Create `error_logs` table with columns: `id`, `created_at`, `user_id` (nullable), `error_type`, `error_message`, `context` (jsonb), `user_agent`, `url`.

**New component**: `src/components/gatekeeper/ErrorLogsSection.tsx` -- a simple table showing recent errors with filtering by type.

**Update errorLogger.ts**: Post errors to Supabase (fire-and-forget, never crash the app if logging fails). Include device info and current URL.

## 6. Additional Issues Found
- **Memory leaks**: Add cleanup for blob URLs in MediaUploader via `useEffect` return
- **Toast import consistency**: Ensure all files use `sonner` toast (already consistent)

---

## Technical Details

**Files to modify:**
- `index.html` -- metadata
- `.env` -- add `VITE_APP_URL=https://mijedu.vercel.app`
- `src/components/MediaUploader.tsx` -- compression, try-catch, blob cleanup
- `src/pages/Auth.tsx` -- redirect URLs
- `src/contexts/AuthContext.tsx` -- redirect URL
- `src/components/gatekeeper/CreateAccountModal.tsx` -- error messaging
- `src/utils/errorLogger.ts` -- write to Supabase
- `src/pages/Gatekeeper.tsx` -- add error logs tab

**New files:**
- `src/components/gatekeeper/ErrorLogsSection.tsx`

**Database migration:**
- Create `error_logs` table with RLS (admins can read, anyone authenticated can insert)

**No new dependencies needed** -- `browser-image-compression` is already in `package.json`.

