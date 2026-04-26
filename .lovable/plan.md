# Mijedu Unified Web + Mobile Protocol — Adopt & Patch Gaps

## Goal

Lock in your 4-section protocol as **standing project rules** (so every future change follows it automatically) and patch the few small spots where the current code doesn't yet meet it. Today's codebase is already ~90% compliant.

## Audit Result vs Your Protocol


| Rule                                            | Status                                                            | Action                                                                                         |
| ----------------------------------------------- | ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `overscroll-behavior` on body                   | Partial — only `overscroll-behavior-y: contain` on `html`         | Patch: add `overscroll-behavior: none` to body                                                 |
| 44×44 min touch targets                         | Done (mobile shell + memory rule already enforces)                | None                                                                                           |
| Mobile-first + max-width on web                 | Bottom nav uses `max-w-lg`, but `Outlet` content is full-width    | Patch: wrap `MobileAppShell` `<Outlet/>` in `max-w-2xl mx-auto` so wide monitors don't stretch |
| Safe-area insets                                | Done (`pb-safe`, `safe-top`, env() in body)                       | None                                                                                           |
| Hybrid native vs web (Capacitor + Web fallback) | Done for push/local-notifications/back-button via dynamic imports | None                                                                                           |
| Bottom nav (mobile) / sidebar (desktop)         | Bottom nav exists; no desktop sidebar variant                     | Defer — flag as future enhancement, not today                                                  |
| `import.meta.env` for Supabase                  | Done                                                              | None                                                                                           |
| Auth redirect handles Vercel + Capacitor        | Uses `VITE_APP_URL                                                | &nbsp;                                                                                         |
| `supabase/migrations` as source of truth        | Done (50+ migrations committed)                                   | None — continue this pattern                                                                   |
| Performance / image optim                       | Done (memory: image optimization util)                            | None                                                                                           |
| `npx cap sync` compatibility                    | Done (no Node-only deps; native plugins dynamic-imported)         | None                                                                                           |


## Patches (tiny, safe)

### 1. `src/index.css` — add overscroll lock to body

Add `overscroll-behavior: none;` alongside the existing body rules so the whole app feels native on web too (no rubber-band).

### 2. `src/components/MobileAppShell.tsx` — center content on wide screens

Wrap `<Outlet />` in a `<div className="max-w-2xl mx-auto w-full">` so on desktop / tablet the feed doesn't stretch edge-to-edge, while staying full-width on phones. Bottom nav already centers itself.

### 3. `src/contexts/AuthContext.tsx` and `src/pages/Auth.tsx` — Capacitor-aware redirects

Compute `redirectUrl` once:

```ts
const isNative = (await import('@capacitor/core').catch(()=>({Capacitor:null as any}))).Capacitor?.isNativePlatform?.();
const redirectUrl = isNative
  ? (import.meta.env.VITE_APP_URL || 'https://mijedu.vercel.app') + '/auth/callback'
  : `${import.meta.env.VITE_APP_URL || window.location.origin}/auth/callback`;
```

Use this for `signUp.emailRedirectTo`, Google OAuth `redirectTo`, and password-reset `redirectTo`. This guarantees the email/OAuth callback always lands on the hosted Vercel URL (which is whitelisted in Supabase Auth) instead of the unsupported `capacitor://` scheme.

## Save Protocol as Project Memory (so it auto-applies forever)

Create `mem://project/unified-web-mobile-protocol` containing the 4 sections verbatim, and add a one-liner reference under **Core** in `mem://index.md` so every future Lovable session loads it as a standing rule:

> *"Single codebase serves Web (Vercel) + Native (Capacitor). Enforce 44px touch targets, safe-area insets, overscroll:none, max-width on desktop, dynamic-imported Capacitor plugins with Web fallbacks, env-based Supabase config, and `supabase/migrations` as source of truth."*

## Files Changed


| File                                        | Change                                                   |
| ------------------------------------------- | -------------------------------------------------------- |
| `src/index.css`                             | Add `overscroll-behavior: none;` to `body`               |
| `src/components/MobileAppShell.tsx`         | Wrap `<Outlet/>` in `max-w-2xl mx-auto w-full` container |
| `src/contexts/AuthContext.tsx`              | Capacitor-aware redirect URL                             |
| `src/pages/Auth.tsx`                        | Capacitor-aware redirect URL (signup, Google, reset)     |
| `mem://project/unified-web-mobile-protocol` | New memory file with full protocol                       |
| `mem://index.md`                            | Add Core line referencing the protocol                   |


## Out of Scope (today)

- Desktop sidebar variant of nav (would be a separate larger task — bottom nav is acceptable on desktop for now)
- New Capacitor plugins (Camera/Share) — will be added with hybrid Web-API fallback when those features are actually requested
- Implement a profile picture upload feature for the student profile page. Use Supabase Storage for this:
- UI: Add an avatar circle with an 'Edit' icon. When clicked, it should open the device's file picker (or camera on mobile).
- Storage: Create a function to upload the selected image to a Supabase bucket named avatars. Ensure the filename is unique (e.g., using crypto.randomUUID()).
- Database: Once the upload is successful, retrieve the Public URL from Supabase Storage and update the avatar_url column in the profiles table for the current user.
- Feedback: Show a loading spinner during the upload and a toast notification once the profile is updated.

After approval and merge, run locally:

```
git pull && npm install && npx cap sync android
```