-- ============================================================================
-- FreshDream Booking Request — Supabase setup script
-- Run this ONCE in your Supabase project's SQL Editor.
-- After running, create your admin user in Authentication → Users, then run
-- the snippet at the bottom of this file to grant them the admin role.
-- ============================================================================

-- 1) Roles ------------------------------------------------------------------
do $$ begin
  create type public.app_role as enum ('admin');
exception when duplicate_object then null; end $$;

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

drop policy if exists "users can read own roles" on public.user_roles;
create policy "users can read own roles"
on public.user_roles for select
to authenticated
using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

drop policy if exists "admins manage roles" on public.user_roles;
create policy "admins manage roles"
on public.user_roles for all
to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

-- 2) Bookings table --------------------------------------------------------
create table if not exists public.booking_requests (
  id uuid primary key default gen_random_uuid(),
  request_id text unique not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  full_name text not null,
  whatsapp_number text not null,
  email text not null,
  property_type text,
  exact_address text not null,
  area_zone text not null,
  cleaning_package text not null,
  mattress_size text not null,
  number_of_mattresses integer not null,
  addons jsonb,
  special_notes text,
  preferred_date date not null,
  preferred_time_window text not null,
  upload_photo_url text,
  mattress_price integer,
  location_fee integer,
  addons_price integer,
  estimated_total integer,
  status text not null default 'New Request',
  payment_status text not null default 'Not requested yet',
  appointment_status text not null default 'Not confirmed',
  internal_notes text,
  admin_last_updated_at timestamptz
);

create index if not exists booking_requests_created_at_idx
  on public.booking_requests (created_at desc);
create index if not exists booking_requests_status_idx
  on public.booking_requests (status);
create index if not exists booking_requests_preferred_date_idx
  on public.booking_requests (preferred_date);

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists booking_requests_touch on public.booking_requests;
create trigger booking_requests_touch
before update on public.booking_requests
for each row execute function public.touch_updated_at();

alter table public.booking_requests enable row level security;

-- Server-side enforcement: compute pricing and reset admin-only fields on insert.
create or replace function public.booking_requests_enforce_server_fields()
returns trigger language plpgsql as $$
declare
  mp integer := 0; lf integer := 0; ap integer := 0; addon text;
begin
  if new.mattress_size like 'Single%' then mp := 1999;
  elsif new.mattress_size like 'Double%' then mp := 2299;
  elsif new.mattress_size like 'Queen%' then mp := 2499;
  elsif new.mattress_size like 'King%' then mp := 2999;
  end if;
  if new.area_zone like 'Zone A%' then lf := 300;
  elsif new.area_zone like 'Zone B%' then lf := 500;
  elsif new.area_zone like 'Zone C%' then lf := 800;
  end if;
  if new.addons is not null then
    for addon in select jsonb_array_elements_text(new.addons) loop
      if addon like 'Sleep Area Dust Refresh%' then ap := ap + 300;
      elsif addon like 'Extra Pillow%' then ap := ap + 200;
      end if;
    end loop;
  end if;
  new.mattress_price := mp;
  new.location_fee := lf;
  new.addons_price := ap;
  new.estimated_total := mp * coalesce(new.number_of_mattresses, 0) + lf + ap;
  new.status := 'New Request';
  new.payment_status := 'Not requested yet';
  new.appointment_status := 'Not confirmed';
  new.internal_notes := null;
  new.admin_last_updated_at := null;
  return new;
end; $$;

drop trigger if exists booking_requests_enforce_server_fields_trg on public.booking_requests;
create trigger booking_requests_enforce_server_fields_trg
before insert on public.booking_requests
for each row execute function public.booking_requests_enforce_server_fields();

drop policy if exists "anyone can submit a booking" on public.booking_requests;
create policy "anyone can submit a booking"
on public.booking_requests for insert
to anon, authenticated
with check (
  area_zone in (
    'Zone A – Roysambu / Zimmerman / Mirema / TRM / Kasarani – KES 300',
    'Zone B – Ruaraka / Ridgeways / Kahawa Sukari / Kahawa Wendani / Mwiki – KES 500',
    'Zone C – CBD / Parklands / Ngara / Pangani / Eastleigh / Kariobangi – KES 800',
    'Other Area – confirm by WhatsApp'
  )
  and cleaning_package in (
    'Freshen Up Mattress Refresh – from KES 1,999',
    'Deep Mattress Refresh – from KES 2,499',
    'Airbnb Turnover Mattress Refresh – from KES 2,999',
    'Host / Multiple Mattress Request – price confirmed after review'
  )
  and mattress_size in (
    'Single – KES 1,999','Double – KES 2,299','Queen – KES 2,499',
    'King – KES 2,999','Not sure','Multiple mattresses'
  )
  and preferred_time_window in ('Morning','Midday','Afternoon','Evening','Flexible')
  and (property_type is null or property_type in (
    'Private Home','Airbnb Host','Serviced Apartment','Hotel / Guesthouse','Other'
  ))
  and char_length(full_name) between 2 and 120
  and char_length(exact_address) between 5 and 1000
  and (special_notes is null or char_length(special_notes) <= 2000)
  and char_length(email) between 5 and 200
  and whatsapp_number ~ '^\+[1-9][0-9 ()-]{6,20}$'
  and number_of_mattresses between 1 and 50
  and preferred_date >= (current_date - interval '1 day')
  and (addons is null or (jsonb_typeof(addons) = 'array' and jsonb_array_length(addons) <= 10))
  and (upload_photo_url is null or upload_photo_url ~ '^[A-Za-z0-9._-]{1,255}$')
);

drop policy if exists "admins can read bookings" on public.booking_requests;
create policy "admins can read bookings"
on public.booking_requests for select
to authenticated
using (public.has_role(auth.uid(), 'admin'));

drop policy if exists "admins can update bookings" on public.booking_requests;
create policy "admins can update bookings"
on public.booking_requests for update
to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

drop policy if exists "admins can delete bookings" on public.booking_requests;
create policy "admins can delete bookings"
on public.booking_requests for delete
to authenticated
using (public.has_role(auth.uid(), 'admin'));

-- 3) Storage bucket --------------------------------------------------------
-- PRIVATE bucket — customer photos are read via short-lived signed URLs only.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'booking-photos',
  'booking-photos',
  false,
  10485760, -- 10 MB
  array['image/jpeg','image/jpg','image/png','image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "public can upload booking photos" on storage.objects;
create policy "public can upload booking photos"
on storage.objects for insert
to anon, authenticated
with check (bucket_id = 'booking-photos');

drop policy if exists "public can read booking photos" on storage.objects;
drop policy if exists "admins can read booking photos" on storage.objects;
create policy "admins can read booking photos"
on storage.objects for select
to authenticated
using (bucket_id = 'booking-photos' and public.has_role(auth.uid(), 'admin'));

drop policy if exists "admins can delete booking photos" on storage.objects;
create policy "admins can delete booking photos"
on storage.objects for delete
to authenticated
using (bucket_id = 'booking-photos' and public.has_role(auth.uid(), 'admin'));

-- ============================================================================
-- AFTER you create your admin user in Supabase Auth → Users, copy their
-- user id and run this once:
--
--   insert into public.user_roles (user_id, role)
--   values ('PASTE-USER-ID-HERE', 'admin');
-- ============================================================================
