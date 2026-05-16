## Goal

Fix two warn-level security findings:

1. Anonymous booking inserts can set arbitrary `status`, `payment_status`, `appointment_status`, `estimated_total`, `mattress_price`, `location_fee`, `addons_price`, `internal_notes`, `admin_last_updated_at` (RLS uses `with check (true)`).
2. `booking-photos` storage bucket is public — every customer photo URL is permanently world-readable.

## Approach

### 1. Lock down `booking_requests` INSERT

New SQL migration:

- Tighten the public insert RLS policy with a `WITH CHECK` that:
  - Forces admin-only fields to defaults: `status = 'New Request'`, `payment_status = 'Not requested yet'`, `appointment_status = 'Not confirmed'`, `internal_notes IS NULL`, `admin_last_updated_at IS NULL`.
  - Validates whitelisted enum values for `area_zone`, `cleaning_package`, `mattress_size`, `preferred_time_window`, `property_type` (matches the constants in `src/lib/booking.ts`).
  - Enforces basic shape: `number_of_mattresses BETWEEN 1 AND 50`, `length(full_name) BETWEEN 2 AND 120`, `length(exact_address) BETWEEN 5 AND 1000`, `length(special_notes) <= 2000`, `whatsapp_number ~ '^\+[1-9][0-9 ()-]{6,20}$'`, `email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'`, `preferred_date >= current_date - interval '1 day'`.
  - Caps `addons` array length and rejects unknown addon strings.
- Add a `BEFORE INSERT` trigger on `booking_requests` that:
  - Recomputes `mattress_price`, `location_fee`, `addons_price`, `estimated_total` server-side from the submitted `mattress_size`, `area_zone`, `number_of_mattresses`, `addons` (mirrors `estimate()` in `src/lib/booking.ts`). This prevents spoofed totals regardless of what the client sends.
  - Forces `status`, `payment_status`, `appointment_status` to their defaults on insert (defense in depth alongside RLS).
- Keep existing admin SELECT/UPDATE/DELETE policies untouched.

Client change in `src/routes/index.tsx` (`onSubmit`): stop sending `mattress_price`, `location_fee`, `addons_price`, `estimated_total` in the insert payload — the trigger now owns them. The local `estimate()` call stays for the on-screen review step only.

### 2. Make `booking-photos` private + signed URLs

SQL migration:

- `update storage.buckets set public = false where id = 'booking-photos';`
- Drop the public read policy `"public can read booking photos"`.
- Add a new policy: only admins can `select` from `storage.objects where bucket_id = 'booking-photos'` (so the dashboard can still list/inspect via authenticated client if needed).
- Keep the existing public/anon INSERT policy (anonymous customers must still be able to upload), but tighten it: limit by `bucket_id = 'booking-photos'` and `(metadata->>'size')::int <= 10485760` if available. (Bucket-level `file_size_limit` and `allowed_mime_types` already enforce most of this.)

Code changes:

- `src/routes/index.tsx` upload handler: stop calling `getPublicUrl`. Instead store the object **path** (e.g. `1737000000-abc123.jpg`) in `upload_photo_url`. Rename the form field's stored value to be the storage path; the column stays the same to avoid a migration. Update the inline preview after upload to use `createSignedUrl(path, 3600)` for the local preview only.
- `src/routes/admin.bookings.$requestId.tsx`: when `booking.upload_photo_url` is present, call `supabase.storage.from('booking-photos').createSignedUrl(path, 3600)` in a small effect and render the resulting URL in the `<a href>` and `<img src>`. Show a loading state while the signed URL resolves.
- Update the Zod schema in `src/lib/booking.ts`: `upload_photo_url` becomes a path string (e.g. `z.string().max(255).regex(/^[A-Za-z0-9._-]+$/)`) instead of `z.string().url()`. Existing rows with full public URLs will need a one-time backfill — handled in the migration by extracting the filename from any row whose value starts with `http`.

### 3. Update `supabase-setup.sql`

Mirror both changes in the bootstrap script so fresh installs are secure by default (private bucket, hardened insert policy + trigger).

### 4. Verification

- Manual: submit a booking from the home page → confirm row inserted with server-computed totals and default statuses.
- Manual: try a raw `supabase.from('booking_requests').insert({ ..., status: 'Completed', estimated_total: 1 })` from devtools → expect RLS rejection / overwritten values.
- Manual: open admin booking detail with a photo → image renders via signed URL; copying the raw object URL from the bucket returns 400 (private).
- Mark both findings as fixed with `security--manage_security_finding` and update `mem://security-memory` to record the new posture (private photo bucket, server-authoritative pricing/status).

## Technical notes

- Pricing trigger duplicates logic from `src/lib/booking.ts` (`mattressPrice`, `locationFee`, `addonsPrice`). Acceptable trade-off — this is the only way to make totals server-authoritative without moving inserts into a `createServerFn`.
- An alternative would be to move the insert into a `createServerFn` using `supabaseAdmin`, validate with Zod there, and drop the public insert policy entirely. Cleaner but a bigger change; happy to take that path instead if you prefer — let me know.
- Existing booking photo URLs in the database (full `https://...storage/v1/object/public/booking-photos/<file>` URLs) get rewritten to just `<file>` in the same migration so the admin UI keeps working.
