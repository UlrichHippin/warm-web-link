
# FreshDream Booking Request — Build Plan

A standalone booking-request web app for FreshDream Mattress Care (Nairobi), wired to **your own Supabase project** (not Lovable Cloud) and using **Resend** (via the Lovable connector) for admin email notifications.

---

## What you'll need to do (3 things, all guided)

1. **Add 2 secrets** when prompted: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (from your Supabase project → Settings → API).
2. **Connect Resend** when prompted (one click — links your Resend account so the app can send admin emails).
3. **Run one SQL script** I'll generate, in your Supabase SQL Editor. It creates the table, the storage bucket, the user_roles table, and all RLS policies. Then create your admin user in Supabase Auth → Users and assign the `admin` role with one provided SQL line.

I will *not* enable Lovable Cloud and *not* create any Lovable database tables.

---

## Pages

| Route | Purpose |
|---|---|
| `/` | Public booking page (hero + multi-section form + live estimate + review step) |
| `/thank-you/:requestId` | Confirmation page with summary + WhatsApp CTA |
| `/admin/login` | Supabase Auth email/password login |
| `/admin` | Protected dashboard (list + filters + status cards) |
| `/admin/bookings/:requestId` | Booking detail + status updates + WhatsApp quick-actions |
| `/admin/settings` | Share/embed instructions (link, iframe, WhatsApp link, homepage button copy) |

Routes are TanStack Start file-routes. `/admin/*` lives under an `_authenticated` layout that checks Supabase session + the `admin` role, redirecting to `/admin/login` otherwise.

---

## Public booking form

Sections built exactly as specified:

1. Customer details (name, WhatsApp, email, property type)
2. Location (address textarea, area/zone select with prices in labels)
3. Service (package, mattress size, count, add-ons multi-select, notes, photo upload)
4. Schedule (date, time window)
5. Live estimate panel — recalculates as the user changes fields, using the pricing table below
6. Review summary + consent checkbox + submit

**Pricing logic** (computed client-side and re-validated server-side before insert):

```text
mattress_price: Single 1999, Double 2299, Queen 2499, King 2999, Not sure 0, Multiple 0
location_fee:   Zone A 300, Zone B 500, Zone C 800, Other 0
addons_price:   Sleep Area Dust 300, Extra Pillow 200, Stain Photo 0, Urgent 0
estimated_total = mattress_price * number_of_mattresses + location_fee + addons_price
```

Disclaimer + "Not sure / Multiple / Other" warning banners shown per spec. Form validated with `zod` + `react-hook-form`. Mobile-first layout, soft cards, large tap targets.

**Photo upload** goes to Supabase Storage bucket `booking-photos` (public-read, anon-insert with size + mime restrictions). The returned public URL is saved as `upload_photo_url`.

---

## Submission flow

1. Client validates with zod, recomputes the estimate, generates `request_id` = `FD-YYYYMMDD-XXXX` (4-char alphanumeric).
2. Client `INSERT`s into `booking_requests` using the anon key (allowed by RLS public-insert policy).
3. Client calls a TanStack server function `notifyNewBooking({ requestId })` which:
   - Reads the row from Supabase using a server-side client (anon key + a permissive `select` policy scoped to a one-time fetch by id, OR the row payload is passed in directly — I'll pass the row directly to avoid loosening RLS).
   - Sends the admin email to `bookings@freshdream.co.ke` via the Resend gateway using the project's `LOVABLE_API_KEY` + `RESEND_API_KEY` (gateway handles auth).
4. Customer is redirected to `/thank-you/:requestId` showing the full summary and a big WhatsApp button:
   `https://wa.me/254708835235?text=<URL-encoded pre-filled message>`.

(Customer confirmation email is included as well, sent in the same server function.)

---

## Admin dashboard

- **Auth**: Supabase email/password. `_authenticated` layout calls `supabase.auth.getUser()` in `beforeLoad`; if missing or user lacks `admin` role, redirect to `/admin/login`.
- **List**: TanStack Query reads `booking_requests` ordered by `created_at desc`. Columns per spec.
- **Filters**: name / phone / request_id search (debounced `ilike`), status / payment_status / appointment_status selects, preferred_date date picker.
- **Status cards** at top: counts for New, Confirmed, Awaiting Payment, Scheduled, Completed, Cancelled (computed via `count` queries with filters).
- **Detail page**: full record view, editable selects for `status` / `payment_status` / `appointment_status` and a textarea for `internal_notes`. Saves update Supabase and stamp `admin_last_updated_at = now()`.
- **Quick WhatsApp actions** (4 buttons per spec): each opens `https://wa.me/<customer>?text=<encoded message template>` with the customer's data interpolated. The "Request Payment" message has an inline input for `final_price` before opening WhatsApp.

---

## Settings / Instructions page

Static content with copy-to-clipboard buttons for:
- Public booking URL
- Homepage button HTML snippet
- iframe embed snippet
- Pre-filled WhatsApp link

URLs use `window.location.origin` so they're correct in dev, preview, and production.

---

## Database schema (you will run this in Supabase SQL Editor)

Single SQL script I'll generate creates:

- `app_role` enum (`admin`)
- `public.user_roles` table + `public.has_role(uuid, app_role)` SECURITY DEFINER function
- `public.booking_requests` table with all 24 fields exactly as specified, defaults, and an `updated_at` trigger
- Storage bucket `booking-photos` (public read)
- **RLS policies**:
  - `booking_requests`: `INSERT` allowed for `anon` + `authenticated`; `SELECT/UPDATE/DELETE` only when `has_role(auth.uid(), 'admin')`
  - `user_roles`: only admins can read/write; users can read their own roles
  - `storage.objects` for `booking-photos`: anon `INSERT` (with mime + size guard via bucket config), public `SELECT`, admin `DELETE`

After running it, you'll create your admin user in Supabase Auth → Users, then run a one-line snippet I'll provide:
```sql
insert into public.user_roles (user_id, role) values ('<your-user-id>', 'admin');
```

---

## Tech details (for reference)

- **Stack**: TanStack Start (already configured), `@supabase/supabase-js`, `react-hook-form` + `zod`, TanStack Query, shadcn/ui (already installed), Tailwind v4 with semantic tokens for the FreshDream palette.
- **Design tokens** added in `src/styles.css`: `--primary` fresh green, `--accent` soft teal, neutral whites/greys. All components use semantic classes (no hardcoded colors).
- **Supabase client**: thin wrapper at `src/integrations/supabase/client.ts` reading `import.meta.env.VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. No `.server.ts` admin client — no service role key in the project.
- **Server function**: `src/lib/notifications.functions.ts` — sends admin + customer emails through the Resend gateway. No Supabase access from the server (avoids needing service role).
- **Files I will create** (high level): `src/integrations/supabase/client.ts`, `src/lib/booking.ts` (pricing + zod schemas + request id), `src/lib/notifications.functions.ts`, `src/components/booking/*`, `src/components/admin/*`, route files for each page above, `src/hooks/useAuth.ts`, and `supabase-setup.sql` at the repo root with the schema script for you to run.

---

## Out of scope (per your instructions)

- No online payment collection.
- No Lovable Cloud / no Lovable database tables / no Lovable storage.
- No exposure of service role keys.
