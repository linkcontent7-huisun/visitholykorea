-- 한 줄 순례 기록에 여러 장의 사진을 안전하게 붙인다. 기존 대표 사진은 지우지 않아 예전 화면도 유지한다.
create table if not exists public.stamp_photos (
  id uuid primary key default gen_random_uuid(),
  stamp_id uuid not null references public.pilgrimage_stamps(id) on delete cascade,
  url text not null,
  position integer not null,
  created_at timestamptz not null default now(),
  unique (stamp_id, position)
);

alter table public.stamp_photos enable row level security;
drop policy if exists "stamp_photos_select_public" on public.stamp_photos;
create policy "stamp_photos_select_public" on public.stamp_photos for select using (true);
drop policy if exists "stamp_photos_insert_own" on public.stamp_photos;
create policy "stamp_photos_insert_own" on public.stamp_photos for insert to authenticated
  with check (exists (select 1 from public.pilgrimage_stamps p where p.id = stamp_id and p.user_id = auth.uid()));
drop policy if exists "stamp_photos_update_own" on public.stamp_photos;
create policy "stamp_photos_update_own" on public.stamp_photos for update to authenticated
  using (exists (select 1 from public.pilgrimage_stamps p where p.id = stamp_id and p.user_id = auth.uid()))
  with check (exists (select 1 from public.pilgrimage_stamps p where p.id = stamp_id and p.user_id = auth.uid()));
drop policy if exists "stamp_photos_delete_own" on public.stamp_photos;
create policy "stamp_photos_delete_own" on public.stamp_photos for delete to authenticated
  using (exists (select 1 from public.pilgrimage_stamps p where p.id = stamp_id and p.user_id = auth.uid()));

insert into public.stamp_photos (stamp_id, url, position)
select id, photo_url, 1 from public.pilgrimage_stamps s
where photo_url is not null
  and not exists (select 1 from public.stamp_photos p where p.stamp_id = s.id and p.position = 1)
on conflict (stamp_id, position) do nothing;

drop view if exists public.site_visit_notes;
create view public.site_visit_notes as
select s.id, s.site_id, s.note, s.photo_url,
  coalesce(array_agg(p.url order by p.position) filter (where p.id is not null), '{}'::text[]) as photos,
  s.created_at
from public.pilgrimage_stamps s
left join public.stamp_photos p on p.stamp_id = s.id
where (s.note is not null or s.photo_url is not null) and s.hidden = false
group by s.id, s.site_id, s.note, s.photo_url, s.created_at;
grant select on public.site_visit_notes to anon, authenticated;

drop view if exists public.admin_pending_photos;
create view public.admin_pending_photos as
select p.id as photo_id, s.id as stamp_id, s.site_id, h.name as site_name, h.diocese,
  p.url as photo_url, s.note, s.photo_featured, s.created_at
from public.stamp_photos p
join public.pilgrimage_stamps s on s.id = p.stamp_id
join public.holy_sites h on h.id = s.site_id
where s.hidden = false and public.can_edit_site(h.diocese);
grant select on public.admin_pending_photos to authenticated;

-- 매개변수 이름이 바뀌므로(p_stamp_id → p_photo_id) create or replace 로는 안 된다 — 먼저 지운다
drop function if exists public.admin_set_photo_featured(uuid, boolean);
create function public.admin_set_photo_featured(p_photo_id uuid, p_featured boolean)
returns void language plpgsql security definer set search_path = public as $$
declare stamp uuid; site_diocese text; photo_url_value text;
begin
  select p.stamp_id, h.diocese, p.url into stamp, site_diocese, photo_url_value
  from stamp_photos p join pilgrimage_stamps s on s.id = p.stamp_id join holy_sites h on h.id = s.site_id
  where p.id = p_photo_id;
  if not found then raise exception '없는 사진입니다.'; end if;
  if not public.can_edit_site(site_diocese) then raise exception '권한이 없습니다.'; end if;
  update pilgrimage_stamps set photo_featured = p_featured, photo_url = case when p_featured then photo_url_value else photo_url end where id = stamp;
end; $$;
revoke all on function public.admin_set_photo_featured(uuid, boolean) from public;
grant execute on function public.admin_set_photo_featured(uuid, boolean) to authenticated;
