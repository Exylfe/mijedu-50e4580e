

# UI Refinement & Capacitor Config for Mobile APK

## Problem Summary (from screenshots)
1. **Gatekeeper header** lacks safe-area top padding -- overlaps status bar on notched devices
2. **Auth/Login screen** shows blank area when keyboard opens -- needs `min-h-screen` fix and scroll behavior
3. **Branding** -- logo is already Mijedu (`AdaptiveLogo` uses `src/assets/mijedu-logo.png`), config already says `appName: 'Mijedu'` and `appId: 'com.mijedu.app'` -- no changes needed here
4. **Gatekeeper** missing gradient accent to match rest of app

## Task 1: Gatekeeper Safe-Area + Gradient Accent
**File**: `src/pages/Gatekeeper.tsx`

- Add `style={{ paddingTop: 'env(safe-area-inset-top)' }}` to the `<header>` element (line 323)
- Add a gradient top bar (`h-1 bg-gradient-to-r from-primary to-secondary`) inside the header, matching the ImmersiveHeader pattern
- This brings the Gatekeeper header in line with the Feed header design

## Task 2: Auth Screen Keyboard Fix
**File**: `src/pages/Auth.tsx`

- Change the outer `<div>` from `min-h-screen ... flex items-center justify-center` to `min-h-screen overflow-y-auto` with the form content centered via `flex-1`
- This ensures when the keyboard opens and the viewport shrinks (via `resize: 'body'`), the form scrolls instead of getting clipped
- Add `min-h-[100dvh]` to use dynamic viewport height which accounts for keyboard

## Task 3: Gatekeeper Sidebar Safe-Area
**File**: `src/components/gatekeeper/GatekeeperSidebar.tsx`

- Add safe-area top padding to the sidebar header so it doesn't overlap the notch when opened

## Task 4: Capacitor Config -- Add `server.androidScheme`
**File**: `capacitor.config.ts`

- Add `server: { androidScheme: 'https' }` to ensure cookies/auth work correctly in the Android WebView (Capacitor 5+ best practice)

---

## Files Modified (4)
| File | Change |
|------|--------|
| `src/pages/Gatekeeper.tsx` | Safe-area padding on header + gradient accent bar |
| `src/pages/Auth.tsx` | Scrollable layout for keyboard compatibility |
| `src/components/gatekeeper/GatekeeperSidebar.tsx` | Safe-area padding on sidebar |
| `capacitor.config.ts` | Add `androidScheme: 'https'` |

No functions deleted. No route changes. No database changes. Branding already correct.

