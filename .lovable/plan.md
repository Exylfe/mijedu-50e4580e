

# Fix: Safe-Area Overlap + Header Background + Defensive Hardening

## What's Already Working
Route guards, ErrorBoundary, viewport-fit=cover, CSS native-feel, StatusBar config, PullToRefresh — all already in place. This plan addresses the **remaining gaps**.

## Problem 1: Header Has No Background Behind Status Bar
The `ImmersiveHeader` is `fixed top-0` with `paddingTop: env(safe-area-inset-top)`, but has **no background color**. On devices with camera cutouts, content scrolls visibly behind the transparent status bar area.

**Fix**: Add a solid/glass background to the header that extends into the status bar zone.

**File**: `src/components/ImmersiveHeader.tsx`
- Add `bg-background/95 backdrop-blur-lg` to the `<motion.header>` element so the header has an opaque background that covers the notch area.

## Problem 2: Header Spacer Doesn't Account for Safe Area
`SocietyFeed.tsx` has `<div className="h-16" />` as a spacer for the fixed header, but on notched devices the header is taller due to safe-area padding.

**Fix in 3 files**: `src/pages/SocietyFeed.tsx`, `src/pages/TribeFeed.tsx`, `src/pages/Market.tsx`
- Replace `<div className="h-16" />` with a spacer that includes safe-area: use inline style `height: calc(env(safe-area-inset-top) + 4rem)`.

## Problem 3: Menu Dropdown Position
The dropdown menu in `ImmersiveHeader` is positioned at `top-16` which doesn't account for the safe-area offset.

**File**: `src/components/ImmersiveHeader.tsx`
- Change the menu `className` from `fixed top-16` to use inline style `top: calc(env(safe-area-inset-top) + 4rem)`.

## Problem 4: Add Safe-Area Fallback CSS Utility
For devices that don't support `env()`.

**File**: `src/index.css`
- Add a `.safe-top` utility class: `padding-top: max(env(safe-area-inset-top), 0px);`

## Problem 5: Remaining Defensive Data Guards
Wrap any remaining `.map()` calls in TribeFeed and Market with `?? []` fallbacks if not already present.

**Files**: `src/pages/TribeFeed.tsx`, `src/pages/Market.tsx` — audit and add `(data ?? []).map(...)` where missing.

---

## Files Modified (4)
| File | Change |
|------|--------|
| `src/components/ImmersiveHeader.tsx` | Add bg to header, fix menu dropdown position for safe-area |
| `src/pages/SocietyFeed.tsx` | Safe-area-aware header spacer |
| `src/pages/TribeFeed.tsx` | Safe-area-aware header spacer + defensive data guards |
| `src/pages/Market.tsx` | Safe-area-aware header spacer + defensive data guards |
| `src/index.css` | Add `.safe-top` fallback utility |

No routes, auth logic, or database queries modified.

