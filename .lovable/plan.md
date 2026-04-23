

# Fix: App Crashes After Login (Push Notifications Root Cause)

## Real Root Cause

The app crashes **after login** because `usePushNotifications()` is called inside `AppRoutes` — which only mounts after a user is authenticated. On Android, even with our dynamic-import + try/catch wrapper in the JS hook, the `@capacitor/push-notifications` plugin is **registered natively at app build time** via `npx cap sync`. When Android instantiates the plugin and there is no `google-services.json`, the **native Java code throws before our JS try/catch can ever run**, killing the process.

Wrapping the JS import is not enough. The plugin must not be present in the Android build at all unless Firebase is configured.

## The Fix

### 1. Remove the native plugin from the Android build by default
**File**: `package.json`
- Move `@capacitor/push-notifications` out of `dependencies`. Keep the JS hook code intact (it already fails gracefully when the module is missing thanks to the dynamic import + `.catch`).
- Without the package in `dependencies`, `npx cap sync android` will not register the native plugin, so Android won't try to initialize FCM and won't crash.

### 2. Add an extra safety net in the hook
**File**: `src/hooks/usePushNotifications.ts`
- Already uses dynamic import with `.catch` → keep as is. When the package is absent, `import()` rejects → caught silently → hook no-ops. No behavior change for users.

### 3. Verify nothing else added recently can crash post-login
**Files reviewed (no changes — confirming they are safe)**:
- `src/hooks/useBackButton.ts` — already dynamic-import + try/catch ✓
- `capacitor.config.ts` — Keyboard `resize: 'none'` (your working keyboard fix) — **left untouched** ✓
- `src/index.css` body safe-area — pure CSS, cannot crash ✓
- `src/pages/Auth.tsx` scroll-on-focus — pure JS event handler, cannot crash ✓

### 4. Re-enabling push later (documented, not done now)
When the user is ready for real push:
1. `npm i @capacitor/push-notifications`
2. Create a Firebase project, download `google-services.json`, place it in `android/app/`
3. `npx cap sync android` and rebuild

The hook already handles registration the moment the plugin is present.

## Files Modified

| File | Change |
|------|--------|
| `package.json` | Remove `@capacitor/push-notifications` from dependencies |

## Local Steps After Approval
```
git pull
npm install
npx cap sync android
```
Then rebuild the APK. The app will install, log in, and run on any Android device. Keyboard fix is preserved. Back button is preserved. Safe-area is preserved. Only the native FCM plugin (the actual crasher) is removed.

