-- ============================================================================
-- Contender image uploads
--
-- The create flow uploads to a bucket named 'contenders' and then calls
-- getPublicUrl(). Without this bucket every upload failed with a bucket-not-
-- found error that the UI swallowed as a blank "Error uploading image!".
--
-- Run once. Idempotent.
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'contenders',
  'contenders',
  true,                                                   -- public read; URLs are embedded in pages
  5242880,                                                -- 5MB, matching the client-side check
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;


-- Anyone may read (the bucket is public and images render in <img>).
drop policy if exists "contender images are public" on storage.objects;
create policy "contender images are public" on storage.objects
  for select using (bucket_id = 'contenders');

-- Only signed-in users may upload, and only into this bucket.
drop policy if exists "authenticated users upload contenders" on storage.objects;
create policy "authenticated users upload contenders" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'contenders');

-- Admins can clear out troll images from the moderation queue.
drop policy if exists "admins manage contender images" on storage.objects;
create policy "admins manage contender images" on storage.objects
  for delete to authenticated
  using (bucket_id = 'contenders' and public.is_admin());
