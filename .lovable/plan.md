

# Mobile Optimization & Capacitor Readiness Plan

## Audit Answers

1. **Framework**: React 18 + Vite 5 + TypeScript
2. **Build**: `vite build` → outputs to `dist/`
3. **API calls**: All use Supabase JS client with absolute URLs (`https://abgvndknznaensqcahls.supabase.co`) -- no localhost references in app code
4. **Auth**: Supabase Auth (JWT, persisted in localStorage, auto-refresh)
5. **Responsive design**: Partially -- uses Tailwind responsive classes, mobile-first bottom nav, but several pages (Gatekeeper, Market tables, Settings tabs) have desktop assumptions
6. **Heavy components**: `framer-motion` on every page, `recharts` (Gatekeeper analytics), `PostCard` tracks views per-render (N+1 queries), 638-line PostCard component
7. **PWA**: None -- no manifest, no service worker
8. **Browser-only APIs**: `localStorage` (works in WebView), no camera/geolocation/push APIs used
9. **State management**: React Context (AuthContext, ViewAsContext, ProfileCardContext) + TanStack Query
10. **Main pages**: Auth, SocietyFeed, TribeFeed, Explore, Market, Gatekeeper, Settings, ProfilePage, Rooms/RoomChat, BrandHub, ShopOffice, Leaderboard

---

## PHASE 1: Mobile Readiness Issues Found

### HIGH Impact
1. **PostCard.tsx (638 lines)** -- fires a `post_views` INSERT on every render with a 1-second timer. On a feed of 20 posts, that's 20 DB writes on load. On low-end phones this causes lag.
2. **Gatekeeper tables** -- `MembersSection` renders all members in a single list with no virtualization. On 200+ students this will lag on mobile.
3. **Background blur effects** -- Every page has `blur-[120px]` divs. These are GPU-heavy on low-end Android devices and cause jank.
4. **CreatePostModal.tsx (588 lines)** -- inline image compression logic duplicated from MediaUploader; large component.

### MEDIUM Impact
5. **Settings TabsList** -- horizontal tabs overflow on narrow screens when 4+ tabs are shown (Profile, Brand, Security, Shop).
6. **Market product grid** -- `grid-cols-2` with no `gap` adjustment for very small screens (< 360px). Product cards have nested badges that overflow.
7. **Touch targets** -- category filter buttons in Market use `px-3 py-1.5` (approx 32px height), below the 44px minimum.
8. **PostCard action buttons** -- icon buttons have no explicit min-height/width, relying on icon size alone (~24px).

### LOW Impact
9. **Guided posting prompt bar** in SocietyFeed -- horizontal scroll with no scroll snap, buttons are small.
10. **Background gradient divs** add unnecessary DOM nodes on every page.

---

## PHASE 2: Mobile-First Refactor

### 1. Remove heavy blur backgrounds (all pages)
Replace `blur-[120px]` decorative divs with simple CSS gradients or remove entirely. This alone will fix most Android lag.

**Files**: `SocietyFeed.tsx`, `Market.tsx`, `Gatekeeper.tsx`, `Index.tsx`, `Explore.tsx`, `TribeFeed.tsx`

### 2. Optimize PostCard view tracking
Wrap the `post_views` insert in an `IntersectionObserver` so it only fires when the post is actually visible, and batch/debounce the inserts. Use a session-level Set to avoid duplicate tracking.

**File**: `PostCard.tsx`

### 3. Fix touch targets
Add `min-h-[44px] min-w-[44px]` to all interactive elements: Market category filters, PostCard action buttons, Settings tabs, guided posting prompts.

**Files**: `Market.tsx`, `PostCard.tsx`, `SocietyFeed.tsx`, `Settings.tsx`

### 4. Settings tabs -- make scrollable on mobile
Convert `TabsList` to horizontal scroll with `overflow-x-auto` and `scrollbar-hide` for small screens.

**File**: `Settings.tsx`

### 5. Market grid -- responsive columns
Change to `grid-cols-1 sm:grid-cols-2` for very small screens, ensure badges don't overflow.

**File**: `Market.tsx`

### 6. Simplify Gatekeeper for mobile
The sidebar already uses a Sheet pattern. Ensure the main content area doesn't overflow horizontally. Add `overflow-x-hidden` to the main container.

**File**: `Gatekeeper.tsx`

---

## PHASE 3: PWA Preparation (Installability Only)

Per project constraints, we will NOT add a service worker or `vite-plugin-pwa`. Instead, we'll add a simple `manifest.json` for installability (Add to Home Screen).

### 1. Create `public/manifest.json`
```json
{
  "name": "Mijedu - Student Super-App",
  "short_name": "Mijedu",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#7c3aed",
  "icons": [
    { "src": "/mijedu-logo.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/mijedu-logo.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

### 2. Add manifest link + mobile meta tags to `index.html`
- `<link rel="manifest" href="/manifest.json">`
- `<meta name="theme-color" content="#7c3aed">`
- `<meta name="apple-mobile-web-app-capable" content="yes">`
- `<meta name="apple-mobile-web-app-status-bar-style" content="default">`
- `<link rel="apple-touch-icon" href="/mijedu-logo.png">`

### 3. Generate proper 192x192 and 512x512 PWA icons
Create properly sized icon files in `public/`.

---

## PHASE 4: Capacitor Readiness

### 1. Build output
Already correct: `vite build` outputs to `dist/`. No changes needed.

### 2. API URLs
All API calls go through Supabase JS client with absolute URLs. No localhost references. Ready for WebView.

### 3. Auth persistence
Uses `localStorage` which works in WebView. Supabase client configured with `persistSession: true` and `autoRefreshToken: true`. Ready.

### 4. Incompatible dependencies
None found. All dependencies are web-standard. `framer-motion` works in WebView. `vaul` (drawer) works in WebView.

### 5. Add Capacitor config preparation
Document the Capacitor setup steps but do NOT install Capacitor packages yet (user should do this after export to GitHub). Add a note in the codebase.

---

## Implementation Summary

**Files to modify** (11):
- `index.html` -- PWA meta tags + manifest link
- `src/pages/SocietyFeed.tsx` -- remove blur divs
- `src/pages/Market.tsx` -- fix grid, touch targets, remove blur
- `src/pages/Gatekeeper.tsx` -- remove blur, overflow fix
- `src/pages/Index.tsx` -- remove blur
- `src/pages/Explore.tsx` -- remove blur
- `src/pages/Settings.tsx` -- scrollable tabs, touch targets
- `src/components/PostCard.tsx` -- optimize view tracking with IntersectionObserver
- `src/components/GhostBottomNav.tsx` -- ensure 44px touch targets

**Files to create** (1):
- `public/manifest.json`

**No backend changes. No new dependencies.**

