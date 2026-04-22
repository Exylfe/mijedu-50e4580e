

# Fix: Stop the APK from Crashing on Launch

## Root Cause

The APK crashes immediately ("Mijedu keeps stopping") because `@capacitor/push-notifications` was wired to run on every native launch via `usePushNotifications()` in `App.tsx`. On Android, this plugin **requires `google-services.json` from a Firebase project to be present in `android/app/`**. Without it, the native side fails during plugin initialization and the entire app crashes before React can even mount — which is why the JS-level `try/catch` inside the hook never saves it, and why no Supabase secret can fix it.

A Supabase secret cannot solve this. FCM is an Android-native dependency, not a runtime env var.

## The Fix (two layers)

### Layer 1 — Make the app installable & stable on ANY Android device, even without Firebase set up

**File**: `src/hooks/usePushNotifications.ts`
- Wrap the dynamic import of `@capacitor/push-notifications` so the plugin module is **only loaded if the platform is native AND the plugin is actually available**.
- Use `await import('@capacitor/push-notifications')` instead of a top-level import. If the import or `requestPermissions()` throws (i.e., FCM not configured), swallow the error and log a warning. This guarantees the app never crashes because of push.
- Keep all listener registration inside the same try/catch.

**File**: `src/hooks/useBackButton.ts`
- Same defensive treatment: wrap `@capacitor/app` in a dynamic import inside a try/catch so a missing/broken plugin can't crash launch.

**File**: `src/App.tsx`
- No structural change — both hooks remain wired but are now crash-proof.

### Layer 2 — Branding + clear FCM setup instructions (for when the user wants real push)

The user must, locally:
1. Place the Mijedu logo at `resources/icon.png` (1024×1024) and `resources/splash.png` (2732×2732).
2. Run `npm i -D @capacitor/assets && npx capacitor-assets generate --android` to replace the Capacitor logo on the installer.
3. (Only when push is wanted) Create a free Firebase project, download `google-services.json`, drop it into `android/app/`, then `npx cap sync android`.

Until step 3 is done, push will silently no-op — but the app will install and run perfectly on any Android device.

## Files Modified

| File | Change |
|------|--------|
| `src/hooks/usePushNotifications.ts` | Dynamic import + full try/catch so missing FCM never crashes the app |
| `src/hooks/useBackButton.ts` | Dynamic import of `@capacitor/app` wrapped in try/catch |

No DB, route, or auth changes. After approval, the user runs locally:
```
git pull
npm install
npx cap sync android
```
…and the APK will install and launch on any Android device. Push remains dormant until `google-services.json` is added.

