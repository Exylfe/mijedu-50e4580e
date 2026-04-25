# Push & Local Notifications — Engagement Triggers

## Goal
Add a robust notification layer that works once `google-services.json` is added by the user via GitHub Secrets. JavaScript will be safe even before that — dynamic imports + try/catch keep the APK from crashing if FCM is missing.

## Packages
Re-add to `package.json`:
- `@capacitor/push-notifications` (remote push, FCM)
- `@capacitor/local-notifications` (local in-app + scheduled retention notifications)

Remove `@capacitor/push-notifications` from `vite.config.ts` `rollupOptions.external` (now a real dep).

## Architecture

```text
src/hooks/usePushNotifications.ts   ← already exists, keep + harden
src/hooks/useLocalNotifications.ts  ← NEW: thin wrapper (schedule, cancel, permission)
src/lib/notifications.ts            ← NEW: high-level helpers used across the app
src/hooks/useRetentionReminder.ts   ← NEW: schedules "We miss you!" 48h after last activity
```

All native plugin imports are dynamic + wrapped — APK never crashes if a plugin/FCM is absent.

## Trigger Wiring

| Event | Where to call | Notification |
|------|---------------|--------------|
| Post created | `src/components/CreatePostModal.tsx` (after successful insert) | Local: "Post published 🎉" |
| Trending post detected | `src/pages/SocietyFeed.tsx` (poll/realtime check on `hot_posts`, fire_count threshold) | Local: "🔥 Trending in your tribe" |
| New room created | `src/pages/Rooms.tsx` realtime `rooms` INSERT | Local: "New room: {title}" (only if not creator) |
| Room about to expire | `src/pages/RoomChat.tsx` (when remaining TTL < 1h, user is participant) | Local scheduled at expiry-30m |
| New comment / reply on your post | existing notifications realtime in `useNotifications.ts` | Local: "{user} replied to your post" |
| New follower | `useNotifications.ts` realtime | Local: "{user} followed you" |
| Verification approved | `useNotifications.ts` realtime | Local: "You're verified ✅" |
| App reopened | `useRetentionReminder.ts` on every foreground | Cancels old reminder, schedules new one for +48h |
| Retention | scheduled local notification | "We miss you! See what's new on Mijedu 👀" |

All trigger functions live in `src/lib/notifications.ts`:
```ts
notify.postPublished()
notify.trending(title)
notify.newRoom(title, roomId)
notify.roomExpiring(title, roomId, expiresAt)
notify.newComment(name)
notify.newFollower(name)
notify.verified()
notify.scheduleRetention()   // 48h
notify.cancelRetention()
```

Each helper:
1. Dynamically imports `@capacitor/local-notifications`.
2. Checks `Capacitor.isNativePlatform()` — silently no-ops on web.
3. Requests permission once (cached in localStorage flag).
4. Calls `LocalNotifications.schedule({...})` with a unique id, title, body, and optional `extra.route` for deep-linking.

## Push (remote) — usePushNotifications.ts (already present, refine)
- Keep dynamic-import safety.
- On `registration` event → save token to `profiles.push_token` (column already exists from prior migration).
- On `pushNotificationActionPerformed` → navigate to `data.route`.
- No backend send logic in this task — token is stored so server-side functions can target users later.

## Retention reminder — useRetentionReminder.ts
- Mounted in `App.tsx` inside `AppRoutes` (so only authenticated users).
- On mount + on `App` resume event (`@capacitor/app`):
  - Cancel any existing retention notification (id `999001`).
  - Schedule a new one 48h ahead with id `999001`, title "We miss you 👋", body "Your tribe has new posts waiting for you on Mijedu."
- On logout: cancel.

## Trending detection
- In `SocietyFeed.tsx`, after fetching feed, look at top post's `fire_count` vs a `localStorage` watermark per user.
- If a new post has crossed a threshold (e.g. ≥10 fires) since last seen, fire `notify.trending(title)`. Update watermark.
- Throttle to once per hour per user via `localStorage` timestamp to avoid spam.

## vite.config.ts
Remove the `external` entry for `@capacitor/push-notifications` since it will now be a real installed dep. Remove the `/* @vite-ignore */` cast in `usePushNotifications.ts` (revert to a normal dynamic import that resolves).

## capacitor.config.ts
Add LocalNotifications + PushNotifications plugin config:
```ts
plugins: {
  PushNotifications: { presentationOptions: ['badge', 'sound', 'alert'] },
  LocalNotifications: { smallIcon: 'ic_stat_icon', iconColor: '#A855F7' },
  // existing Keyboard, StatusBar untouched
}
```

## Files Modified

| File | Change |
|------|--------|
| `package.json` | Add `@capacitor/push-notifications`, `@capacitor/local-notifications` |
| `vite.config.ts` | Remove `rollupOptions.external` for push-notifications |
| `capacitor.config.ts` | Add PushNotifications + LocalNotifications plugin entries |
| `src/hooks/usePushNotifications.ts` | Clean dynamic import, deep-link routing on tap |
| `src/hooks/useLocalNotifications.ts` | NEW — permission + schedule wrapper |
| `src/hooks/useRetentionReminder.ts` | NEW — 48h reminder on resume/login |
| `src/lib/notifications.ts` | NEW — high-level `notify.*` helpers |
| `src/App.tsx` | Mount `useRetentionReminder()` alongside `usePushNotifications()` |
| `src/components/CreatePostModal.tsx` | Call `notify.postPublished()` after success |
| `src/pages/SocietyFeed.tsx` | Trending detection + `notify.trending()` |
| `src/pages/Rooms.tsx` | Realtime new-room → `notify.newRoom()` |
| `src/pages/RoomChat.tsx` | Schedule `notify.roomExpiring()` |
| `src/hooks/useNotifications.ts` | Mirror inbound notifications to local notification when app is backgrounded |

No DB migration (push_token column already exists). No auth changes. Branding & keyboard fix preserved.

## Local Steps After Approval
```
git pull
npm install
npx cap sync android
```
Add `google-services.json` (via your GitHub Secret workflow) → rebuild APK. Push will activate automatically; local notifications work immediately.
