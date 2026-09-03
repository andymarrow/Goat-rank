-- ============================================================================
-- Avatar library + username defaults
--
-- ALREADY APPLIED to the hosted project via MCP on 2026-09-03. Kept here so
-- the schema history stays in the repo and a fresh environment can be rebuilt.
-- Idempotent; safe to re-run.
-- ============================================================================

create table if not exists public.avatars (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  image_url  text not null,
  sort_order integer not null default 0,
  is_active  boolean not null default true,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.avatars enable row level security;

drop policy if exists "avatars are public" on public.avatars;
create policy "avatars are public" on public.avatars
  for select using (is_active or public.is_admin());

create index if not exists idx_avatars_active
  on public.avatars (sort_order) where is_active;

-- Storage for admin-curated avatar art and user-uploaded profile pictures.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 3145728,
        array['image/png','image/jpeg','image/webp','image/gif'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "avatar images are public" on storage.objects;
create policy "avatar images are public" on storage.objects
  for select using (bucket_id = 'avatars');

drop policy if exists "authenticated users upload avatars" on storage.objects;
create policy "authenticated users upload avatars" on storage.objects
  for insert to authenticated with check (bucket_id = 'avatars');

drop policy if exists "admins manage avatar images" on storage.objects;
create policy "admins manage avatar images" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and public.is_admin());

-- New signups draw a random avatar from the library, and fall back to the
-- previous dicebear URL while the library is still empty so signup never
-- breaks. Also derives a username from the email when none was supplied.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
declare
  _avatar text;
begin
  select a.image_url into _avatar
  from public.avatars a
  where a.is_active
  order by random()
  limit 1;

  insert into public.profiles (id, username, avatar_url)
  values (
    NEW.id,
    coalesce(
      NEW.raw_user_meta_data->>'username',
      split_part(NEW.email, '@', 1)
    ),
    coalesce(
      _avatar,
      'https://api.dicebear.com/7.x/pixel-art/svg?seed=' || NEW.id
    )
  );

  return NEW;
end;
$function$;
