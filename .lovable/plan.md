

# Mobile-Native App Experience Enhancement

## Overview
Five areas: persistent bottom nav with fast switching, skeleton loaders, network resilience, session hardening, and Auth page logo fix. No backend changes.

---

## 1. Auth Page Logo Fix
**File**: `src/pages/Auth.tsx`

- Remove the `<h1>Mijedu</h1>` text (line 157)
- Increase logo from `w-20 h-20` to `w-28 h-28`
- Remove GPU-heavy `blur-[120px]` background divs (lines 144-147)

---

## 2. Bottom Navigation -- Persistent Tab System
**File**: `src/App.tsx`

Currently each page (SocietyFeed, TribeFeed, Market, Explore) has its own `GhostBottomNav` that navigates via `react-router-dom`, causing full page reloads and state loss.

**Approach**: Create a shared layout component `MobileAppShell.tsx` that wraps all main pages:
- Renders a single persistent `BottomNav` at the bottom
- Uses React Router `<Outlet>` for page content
- Highlights the active tab based on current route
- Navigation uses `navigate()` -- React Router handles this without full reloads (SPA)

**New file**: `src/components/MobileAppShell.tsx`
- Wraps Feed, Explore, TribeFeed, Market, ProfilePage with a shared bottom nav
- Maps routes to nav items: `/feed` → home, `/explore` → discover, `/tribe-feed` → chat, `/market` → market
- Add a 5th "Profile" tab with User icon

**Update**: `src/App.tsx` -- wrap the 4 main routes in a `<Route element={<MobileAppShell />}>` layout route so they share the shell without remounting the nav.

**Remove**: Individual `GhostBottomNav` from `SocietyFeed.tsx`, `TribeFeed.tsx`, `Market.tsx`, `Explore.tsx` (they'll use the shell's nav instead).

---

## 3. Skeleton Loaders
**New file**: `src/components/FeedSkeleton.tsx`
- 3 skeleton cards matching PostCard layout: avatar circle, title bar, content lines, action buttons row
- Uses existing `Skeleton` component from `src/components/ui/skeleton.tsx`

**Apply in**:
- `SocietyFeed.tsx` -- replace spinner (line 533-535) with `<FeedSkeleton />`
- `TribeFeed.tsx` -- replace spinner with `<FeedSkeleton />`
- `Market.tsx` -- add product card skeletons (image rectangle + text lines)
- `Explore.tsx` -- add tribe/brand card skeletons

---

## 4. Network Resilience
**File**: `src/App.tsx` -- update QueryClient config

Add retry and stale time defaults:
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
      staleTime: 5 * 60 * 1000, // 5 min cache
      gcTime: 10 * 60 * 1000,
    },
  },
});
```

**New component**: `src/components/NetworkStatus.tsx`
- Listens to `window.online`/`offline` events
- Shows a small banner "You're offline" at top when disconnected
- Auto-dismisses when back online

**Add to** `App.tsx` inside providers.

**Update feed pages**: Add try-catch with user-friendly toast on fetch errors (replace `console.error` with `toast.error('Could not load posts. Pull to refresh.')`).

---

## 5. Session Persistence
**File**: `src/contexts/AuthContext.tsx`

Already uses Supabase with `persistSession: true` and `autoRefreshToken: true` -- this is correct. Verify the `onAuthStateChange` listener handles `TOKEN_REFRESHED` events (it does via the existing listener). No changes needed unless the listener is missing.

Add one safety measure: on app mount, call `supabase.auth.getSession()` to restore from localStorage immediately (verify this exists).

---

## 6. Touch & Scroll
- Add `overscroll-behavior-y: contain` to `<html>` in `index.css` to prevent rubber-band bounce
- Add `-webkit-overflow-scrolling: touch` for smooth scroll on iOS
- Add `touch-action: manipulation` globally to eliminate 300ms tap delay
- Ensure `overflow-x: hidden` on main containers

**File**: `src/index.css`

---

## Files Summary

**New files** (2):
- `src/components/MobileAppShell.tsx` -- shared layout with persistent bottom nav
- `src/components/FeedSkeleton.tsx` -- skeleton loaders

**Modified files** (8):
- `src/pages/Auth.tsx` -- bigger logo, remove "Mijedu" text, remove blur
- `src/App.tsx` -- layout route for shell, QueryClient retry config, NetworkStatus
- `src/pages/SocietyFeed.tsx` -- remove GhostBottomNav, use skeletons
- `src/pages/TribeFeed.tsx` -- remove GhostBottomNav, use skeletons
- `src/pages/Market.tsx` -- remove GhostBottomNav, use skeletons
- `src/pages/Explore.tsx` -- remove GhostBottomNav, use skeletons
- `src/index.css` -- touch/scroll optimizations
- `src/components/NetworkStatus.tsx` -- offline banner (new)

**No backend or database changes.**

