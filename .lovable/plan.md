

# Push Notifications, Keyboard Fix, and UI Improvements

## Task 1: Push Notifications via `@capacitor/push-notifications`

**Install**: `@capacitor/push-notifications`

**New file**: `src/hooks/usePushNotifications.ts`
- Import `PushNotifications` from `@capacitor/push-notifications`
- On mount (if user is authenticated):
  1. Request permission via `PushNotifications.requestPermissions()`
  2. If granted, call `PushNotifications.register()`
  3. Listen for `registration` event — save the FCM token to the user's profile row (`push_token` column) in Supabase
  4. Listen for `pushNotificationReceived` (foreground) — show a sonner toast with the notification body
  5. Listen for `pushNotificationActionPerformed` (tap) — navigate to the relevant page based on notification data payload
- Clean up listeners on unmount

**Edit**: `src/App.tsx` — call `usePushNotifications()` inside `AppRoutes` (next to `useBackButton()`)

**Database**: Add a `push_token` text column to the `profiles` table via migration so tokens can be stored per user

**Note**: Actual sending of push notifications requires Firebase Cloud Messaging (FCM) setup on the Android side and a server-side function to trigger sends. This implementation covers the **client-side registration and handling**. After pulling, you need to:
1. Create a Firebase project and download `google-services.json` into `android/app/`
2. Run `npx cap sync android`

---

## Task 2: Fix Keyboard Blank Area on Auth Screen

The screenshot shows the Auth page with a large blank gap between the form and the keyboard. The issue: `resize: 'native'` with `overlaysWebView: true` on StatusBar causes the WebView to not resize properly on some Android devices.

**Fix approach** (two-part):

**File**: `capacitor.config.ts`
- Change Keyboard `resize` from `'native'` to `'none'`. This tells Capacitor to NOT resize the WebView at all — we handle scrolling ourselves via CSS.
- This prevents the blank area because the WebView stays full-size and the form scrolls into view naturally.

**File**: `src/pages/Auth.tsx`
- Add an `inputMode` attribute and an `onFocus` handler to scroll the focused input into view:
  ```
  onFocus={(e) => setTimeout(() => e.target.scrollIntoView({ block: 'center', behavior: 'smooth' }), 300)}
  ```
- Apply this to both the email and password inputs (and nickname/tribe on sign-up)
- The outer container already has `overflow-y-auto` which enables this scroll behavior

**File**: `src/index.css` — add a global rule:
```css
input:focus, textarea:focus {
  scroll-margin-top: 100px;
}
```

---

## Task 3: UI Improvements for a More Polished Look

### 3a. Global safe-area padding on body (still missing)
**File**: `src/index.css` — add to the `body` rule:
```css
padding-top: env(safe-area-inset-top, 0px);
padding-bottom: env(safe-area-inset-bottom, 0px);
```
This was planned previously but never applied. This single change covers ALL pages.

### 3b. Smoother card elevations
**File**: `src/index.css` — enhance `.card-shadow`:
```css
box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.06);
transition: box-shadow 0.2s ease;
```

### 3c. Auth screen polish
**File**: `src/pages/Auth.tsx`
- Add subtle entrance animation delay to form fields for a staggered reveal
- Add a frosted glass effect to the form card background

### 3d. Bottom navigation active indicator
**File**: `src/components/BottomNav.tsx`
- Add a small animated dot/pill indicator under the active tab icon (common in modern mobile apps)

### 3e. Skeleton loading shimmer improvement
**File**: `src/components/FeedSkeleton.tsx`
- Ensure skeleton cards have rounded corners matching actual PostCard design

---

## Files Summary

| Action | File |
|--------|------|
| Install | `@capacitor/push-notifications` |
| Create | `src/hooks/usePushNotifications.ts` |
| Edit | `src/App.tsx` — wire up push notifications hook |
| Edit | `capacitor.config.ts` — change Keyboard resize to `'none'` |
| Edit | `src/pages/Auth.tsx` — scrollIntoView on focus + staggered animations |
| Edit | `src/index.css` — body safe-area, input scroll-margin, card shadows |
| Edit | `src/components/BottomNav.tsx` — active tab indicator |
| Migration | Add `push_token` column to profiles |

No routes deleted. No auth logic changed. Branding preserved.

**Post-implementation (local)**:
1. Git pull
2. Add `google-services.json` from Firebase Console to `android/app/`
3. Run `npx cap sync android`
4. Build APK

