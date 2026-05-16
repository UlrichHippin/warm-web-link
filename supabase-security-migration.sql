-- ============================================================================
-- FreshDream — Security hardening migration
-- Run ONCE in your Supabase SQL Editor on top of the original supabase-setup.sql.
-- Fixes:
--   1. booking_requests INSERT was `with check (true)` — anyone could set
--      arbitrary status / payment_status / appointment_status / pricing fields.
--   2. booking-photos bucket was public — every uploaded image was permanently
--      world-readable.
-- ============================================================================

-- 1) Server-side pricing + status defaults trigger -------------------------

create or replace function public.booking_requests_enforce_server_fields()
returns trigger
language plpgsql
as $$
declare
  mp integer := 0;
  lf integer := 0;
  ap integer := 0;
  addon text;
begin
  -- Mattress price
  if new.mattress_size like 'Single%' then mp := 1999;
  elsif new.mattress_size like 'Double%' then mp := 2299;
  elsif new.mattress_size like 'Queen%' then mp := 2499;
  elsif new.mattress_size like 'King%' then mp := 2999;
  else mp := 0;
  end if;

  -- Location fee
  if new.area_zone like 'Zone A%' then lf := 300;
  elsif new.area_zone like 'Zone B%' then lf := 500;
  elsif new.area_zone like 'Zone C%' then lf := 800;
  else lf := 0;
  end if;

  -- Add-ons price
  if new.addons is not null then
    for addon in
      select jsonb_array_elements_text(new.addons)
    loop
      if addon like 'Sleep Area Dust Refresh%' then ap := ap + 300;
      elsif addon like 'Extra Pillow%' then ap := ap + 200;
      end if;
    end loop;
  end if;

  new.mattress_price := mp;
  new.location_fee := lf;
  new.addons_price := ap;
  new.estimated_total := mp * coalesce(new.number_of_mattresses, 0) + lf + ap;

  -- Force admin-controlled fields to safe defaults on insert.
  new.status := 'New Request';
  new.payment_status := 'Not requested yet';
  new.appointment_status := 'Not confirmed';
  new.internal_notes := null;
  new.admin_last_updated_at := null;

  return new;
end;
$$;

drop trigger if exists booking_requests_enforce_server_fields_trg on public.booking_requests;
create trigger booking_requests_enforce_server_fields_trg
before insert on public.booking_requests
for each row execute function public.booking_requests_enforce_server_fields();

-- 2) Tighten INSERT RLS policy --------------------------------------------

drop policy if exists "anyone can submit a booking" on public.booking_requests;
create policy "anyone can submit a booking"
on public.booking_requests for insert
to anon, authenticated
with check (
  -- whitelisted enum values
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
    'Single – KES 1,999',
    'Double – KES 2,299',
    'Queen – KES 2,499',
    'King – KES 2,999',
    'Not sure',
    'Multiple mattresses'
  )
  and preferred_time_window in ('Morning','Midday','Afternoon','Evening','Flexible')
  and (property_type is null or property_type in (
    'Private Home','Airbnb Host','Serviced Apartment','Hotel / Guesthouse','Other'
  ))
  -- shape checks
  and char_length(full_name) between 2 and 120
  and char_length(exact_address) between 5 and 1000
  and (special_notes is null or char_length(special_notes) <= 2000)
  and char_length(email) between 5 and 200
  and whatsapp_number ~ '^[+][1-9][0-9 ()-]{6,20}$'
  and number_of_mattresses between 1 and 50
  and preferred_date >= (current_date - interval '1 day')
  -- addons array bounded
  and (
    addons is null
    or (jsonb_typeof(addons) = 'array' and jsonb_array_length(addons) <= 10)
  )
  -- photo path: filename only, no slashes/URLs (signed URLs are derived in app)
  and (
    upload_photo_url is null
    or upload_photo_url ~ '^[A-Za-z0-9._-]{1,255}$'
  )
);

-- 3) Backfill any existing public-URL photo values to plain object paths ---

update public.booking_requests
set upload_photo_url = regexp_replace(upload_photo_url, '^.*/booking-photos/', '')
where upload_photo_url is not null
  and upload_photo_url like 'http%';

-- 4) Make booking-photos bucket PRIVATE -----------------------------------

update storage.buckets
set public = false
where id = 'booking-photos';

drop policy if exists "public can read booking photos" on storage.objects;
create policy "admins can read booking photos"
on storage.objects for select
to authenticated
using (bucket_id = 'booking-photos' and public.has_role(auth.uid(), 'admin'));

-- Anonymous customers must still be able to upload; existing insert policy stays.
