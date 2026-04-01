

# Capacitor Mobile UX & UI Optimization Plan

## Important Note
`npx cap sync` cannot be run in Lovable -- you must run it locally after pulling the changes from GitHub. The `@capacitor/keyboard` and `@capacitor/status-bar` plugins are **native** plugins that require local `npx cap sync` to take effect in the APK.

---

## Task 1: Global Error Boundary
**New file**: `src/components/ErrorBoundary.tsx`
- React class component catching JS errors
- Shows a branded "Something went wrong" screen with a "Try Again" button that reloads the page
- Uses Mijedu purple/gradient branding

**Edit**: `src/App.tsx`
- Wrap `<App>` content inside `<ErrorBoundary>` to prevent white screens on crashes

---

## Task 2: CSS -- Native Feel, Status Bar, Keyboard
**Edit**: `src/index.css`

Add to the base layer:
- `user-select: none` on body (disable text selection for native feel)
- `-webkit-tap-highlight-color: transparent` (already present on html -- also add to body)
- Safe area padding: `env(safe-area-inset-top)` support via utility classes
- Momentum scrolling is already enabled (`-webkit-overflow-scrolling: touch`)

**Edit**: `index.html`
- Add `<meta name="viewport" content="..., viewport-fit=cover">` to extend into status bar area

---

## Task 3: Capacitor Plugins Config
**Edit**: `capacitor.config.ts`
- Add `plugins` config for `Keyboard` (resize mode: `body`, scroll enabled) and `StatusBar` (overlay: true, style: dark, backgroundColor: transparent)
- These are config-only -- the native plugins activate after `npx cap sync` locally

**Install**: `@capacitor/keyboard`, `@capacitor/status-bar` npm packages

---

## Task 4: Status Bar + Safe Area in Layout
**Edit**: `src/components/MobileAppShell.tsx`
- Add `pt-[env(safe-area-inset-top)]` to the main container so header content avoids the notch
- Bottom nav already has `pb-safe`

**Edit**: `src/components/ImmersiveHeader.tsx`
- Add safe-area top padding to the fixed header so it sits below the status bar/notch

---

## Task 5: Pull-to-Refresh
**New file**: `src/components/PullToRefresh.tsx`
- A wrapper component that detects pull-down gesture on touch devices
- Shows a spinner indicator, calls `onRefresh` callback
- Uses CSS transforms, no extra dependencies

**Edit**: `src/pages/SocietyFeed.tsx` -- Wrap the feed content in `<PullToRefresh onRefresh={handleRefresh}>`

**Edit**: `src/pages/Market.tsx` -- Same treatment for the marketplace

---

## Task 6: Tab Prefetching (Optimistic UI)
**Edit**: `src/components/MobileAppShell.tsx`
- On mount, trigger React Query prefetches for the main tabs' initial data (tribe posts, market products) using `queryClient.prefetchQuery`
- This makes tab switching feel instant since data is already cached

---

## Task 7: Defensive Data Mapping
**Edit**: `src/pages/SocietyFeed.tsx`, `src/pages/TribeFeed.tsx`, `src/pages/Market.tsx`
- Add optional chaining and nullish coalescing to all `.map()` calls on fetched data (e.g., `posts?.map(...)`, `(data ?? []).map(...)`)
- Prevents crashes on null/undefined API responses in the APK

---

## Files Summary
| Action | File |
|--------|------|
| Create | `src/components/ErrorBoundary.tsx` |
| Create | `src/components/PullToRefresh.tsx` |
| Edit | `src/App.tsx` |
| Edit | `src/index.css` |
| Edit | `index.html` |
| Edit | `capacitor.config.ts` |
| Edit | `src/components/MobileAppShell.tsx` |
| Edit | `src/components/ImmersiveHeader.tsx` |
| Edit | `src/pages/SocietyFeed.tsx` |
| Edit | `src/pages/TribeFeed.tsx` |
| Edit | `src/pages/Market.tsx` |
| Install | `@capacitor/keyboard`, `@capacitor/status-bar` |

No existing functions deleted. No route paths changed. No database logic modified. Purple/gradient branding preserved.

After implementation, you must **git pull** and run `npx cap sync` locally before building the APK.

