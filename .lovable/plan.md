

# Fix: Global Safe Area, Hardware Back Button, Keyboard, and App Branding

## Why Previous Fixes Didn't Work

Safe-area padding was applied to individual components (ImmersiveHeader, MobileAppShell, Gatekeeper header) but **not globally**. Many pages render outside MobileAppShell (Auth, Gatekeeper, Rooms, RoomChat, ProfilePage, TribeAdminHub, About, Settings, etc.) and their `sticky top-0` headers sit right under the notch. The fix must be at the CSS level so every page gets it automatically.

---

## Task 1: Global Safe-Area via CSS (covers ALL pages)

**File**: `src/index.css`

- Add `padding-top: env(safe-area-inset-top, 0px)` directly on the `body` rule. This pushes all page content below the notch universally -- no per-page changes needed.
- Add `padding-bottom: env(safe-area-inset-bottom, 0px)` for home bar devices.
- Remove the per-component `paddingTop: 'env(safe-area-inset-top)'` from MobileAppShell since body now handles it.

**File**: `src/components/MobileAppShell.tsx`
- Remove `style={{ paddingTop: 'env(safe-area-inset-top)' }}` from the outer div (body CSS now handles this).

**File**: `src/components/ImmersiveHeader.tsx`
- Keep the `paddingTop: env(safe-area-inset-top)` on the **fixed** header because fixed elements don't inherit body padding. This is correct and stays.

**File**: `src/pages/Gatekeeper.tsx`
- Keep the `paddingTop: env(safe-area-inset-top)` on the **sticky** header. This is correct.

**Files**: `src/pages/SocietyFeed.tsx`, `src/pages/TribeFeed.tsx`, `src/pages/Market.tsx`
- Keep the safe-area spacer divs as-is (they account for the fixed ImmersiveHeader height).

**Result**: Every page -- Auth, About, Rooms, RoomChat, ProfilePage, TribeAdminHub, Leaderboard, AIAssistant, ShopOffice, VerificationStation, etc. -- gets safe-area top padding automatically.

---

## Task 2: Hardware Back Button Handler

**New file**: `src/hooks/useBackButton.ts`

- Import `@capacitor/app` (the App plugin).
- On mount, register `App.addListener('backButton', handler)`.
- Logic:
  - If on a root tab (`/feed`, `/explore`, `/tribe-feed`, `/market`, `/settings`):
    - If NOT on `/feed`, navigate to `/feed`.
    - If already on `/feed`, show a toast "Press back again to exit" and set a 2-second flag. On second press within that window, call `App.exitApp()`.
  - Otherwise, call `window.history.back()`.
- Clean up the listener on unmount.

**File**: `src/App.tsx`
- Call `useBackButton()` inside the `AppRoutes` component (it has access to Router context).

**Install**: `@capacitor/app` npm package.

---

## Task 3: Keyboard Configuration

**File**: `capacitor.config.ts`
- Change Keyboard `resize` from `'body'` to `'native'`. The `'body'` mode resizes the entire page which squishes the UI. `'native'` lets the Android system handle the resize naturally (pan mode), keeping input fields visible without layout distortion.

---

## Task 4: App Branding / Asset Generation Instructions

The `@capacitor/assets` CLI tool generates native icons and splash screens from a source image. This cannot run in Lovable, so the user must run it locally.

**File**: Copy the uploaded `Mijedu.Logo.jpg` to `src/assets/mijedu-logo-source.jpg` for reference.

**Instructions to provide** (post-implementation):
1. Git pull the project.
2. Place the Mijedu logo as `resources/icon.png` (1024x1024, square).
3. Create a splash source at `resources/splash.png` (2732x2732, centered logo on purple background).
4. Run:
   ```bash
   npm install -D @capacitor/assets
   npx capacitor-assets generate --android
   ```
5. Run `npx cap sync android` and rebuild the APK.

---

## Files Summary

| Action | File |
|--------|------|
| Edit | `src/index.css` -- add body safe-area padding |
| Edit | `src/components/MobileAppShell.tsx` -- remove redundant inline safe-area |
| Edit | `capacitor.config.ts` -- change Keyboard resize to `'native'` |
| Create | `src/hooks/useBackButton.ts` -- hardware back button handler |
| Edit | `src/App.tsx` -- wire up useBackButton |
| Install | `@capacitor/app` |
| Copy | Uploaded logo to `src/assets/` |

No routes, database logic, or component structure changed. After implementation, run `npx cap sync` locally before building the APK.

