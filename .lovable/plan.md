

# Dynamic Routing + Build Caching Plan

## Task 1: Dynamic Router (Web + Capacitor)

**File**: `src/App.tsx`

**Change**: Replace the hardcoded `BrowserRouter` with a dynamic router that auto-detects the environment.

1. Add `HashRouter` to the import from `react-router-dom`
2. Add environment detection constant:
   ```typescript
   const isNative = typeof window !== 'undefined' && 
     (window.location.protocol === 'capacitor:' || window.location.protocol === 'file:');
   ```
3. Create dynamic router component:
   ```typescript
   const Router = isNative ? HashRouter : BrowserRouter;
   ```
4. In the `App` component, replace `<BrowserRouter>` / `</BrowserRouter>` with `<Router>` / `</Router>`

No route paths, auth logic, or navigation logic changes. All existing routes stay identical.

---

## Task 2: GitHub Actions Build Caching

**File**: `.github/workflows/android.yml`

Two additions:

1. **npm cache** -- add `cache: 'npm'` to the `setup-node` step (line 20)
2. **Gradle cache** -- add a new step after `Setup Android SDK`:
   ```yaml
   - name: Cache Gradle
     uses: actions/cache@v4
     with:
       path: |
         ~/.gradle/caches
         ~/.gradle/wrapper
       key: ${{ runner.os }}-gradle-${{ hashFiles('**/*.gradle*', '**/gradle-wrapper.properties') }}
       restore-keys: |
         ${{ runner.os }}-gradle-
   ```

---

## Files Modified (2)
- `src/App.tsx` -- dynamic BrowserRouter/HashRouter
- `.github/workflows/android.yml` -- npm + Gradle caching

No new dependencies. No backend changes. No route changes.

