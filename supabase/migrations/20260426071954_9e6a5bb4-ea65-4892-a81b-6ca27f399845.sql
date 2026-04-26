-- Drop the broad SELECT policy that allowed listing all avatar objects.
-- The avatars bucket remains public, so direct image URLs still load via the CDN
-- without needing a SELECT policy on storage.objects.
drop policy if exists "Avatars are publicly viewable" on storage.objects;