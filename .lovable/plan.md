

# Pilot Stability & Feedback Plan

## Overview
Three groups of changes: MediaUploader hardening, a hybrid feedback system, and fixing the Following feed to show media (images).

---

## 1. MediaUploader Hardening

**File**: `src/components/MediaUploader.tsx`

Current state is already 80% there (compression, sanitization, try-catch, blob cleanup all exist). Changes needed:

- **EXIF orientation**: Already handled by `browser-image-compression` (it auto-corrects orientation by default). No code change needed.
- **Remove 50MB pre-check**: Remove the early `MAX_FILE_SIZE_MB` check before compression. For images, let compression run first, then only error if upload fails. Keep the check for non-image files (video/audio/PDF).
- **Better loading state**: Replace the small spinner with a full overlay message "Optimizing & Uploading..." on the attachment bar. Disable all labels during upload.
- **Toast cleanup**: Remove "Compressing image..." info toast (unnecessary noise). Just show spinner.

---

## 2. Feedback System

### Database Migration
Create `feedback` table:
- `id` (uuid, PK)
- `user_id` (uuid, not null)
- `rating` (integer, 1-5)
- `category` (text: 'bug_report', 'suggestion', 'experience')
- `context` (text, page URL)
- `message` (text, nullable)
- `created_at` (timestamptz)

RLS: authenticated users can insert their own; admins can read all.

### New Component: `FeedbackPopup.tsx`
- Small slide-up card with 5-star rating + optional message
- Two header buttons: "Report a Bug" / "Give Suggestion" that pre-set category
- Auto-captures `user_id` and `window.location.pathname`
- Triggered via context or callback

### Integration
- In `CreatePostModal.tsx`: after successful post creation, wait 2 seconds then trigger feedback popup
- In `MediaUploader.tsx`: after successful upload, trigger feedback popup
- Add `FeedbackPopup` to the app layout (in `App.tsx` or `SocietyFeed.tsx`)

### Gatekeeper Integration
Add a "Feedback" section to the Gatekeeper admin panel to view submitted feedback.

---

## 3. Fix Following Feed Missing Media

**Root cause**: The `hot_posts` view doesn't include `media_url` or `media_type`. When the Following feed backfills with hot_posts (lines 134-145 in SocietyFeed.tsx), it hardcodes `media_url: null`.

**Fix**:
1. **Database**: Recreate the `hot_posts` view to include `p.media_url` and `p.media_type`
2. **SocietyFeed.tsx**: Update the backfill mapping (lines 137-145) to use the actual `media_url` and `media_type` from hot_posts data instead of hardcoding null. Also update the `.select()` on line 130 to include these columns.

---

## Technical Details

**Files to modify:**
- `src/components/MediaUploader.tsx` -- loading state, remove pre-check for images
- `src/pages/SocietyFeed.tsx` -- backfill media fix, feedback trigger
- `src/pages/Gatekeeper.tsx` -- add feedback tab
- `src/components/gatekeeper/GatekeeperSidebar.tsx` -- add feedback nav item

**New files:**
- `src/components/FeedbackPopup.tsx`
- `src/components/gatekeeper/FeedbackSection.tsx`

**Database migration:**
- Recreate `hot_posts` view with media columns
- Create `feedback` table with RLS

**No new dependencies needed.**

