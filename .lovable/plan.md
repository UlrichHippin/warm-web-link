# FreshDream Redesign Plan

A complete visual overhaul of the booking app: pure-white, airy, mobile-first, with Dark Forest Green typography, Lime Green CTAs, and a Clean Blue location/trust accent. The detailed booking form stays fully functional — only its styling and surrounding structure change. Admin pages adopt the same tokens for a consistent brand.

## 1. Design tokens (`src/styles.css`)

Replace the current oklch palette with the FreshDream system:

- `--background`: #FFFFFF (pure white)
- `--foreground`: #1E4B35 (dark forest green) — all primary text/headers
- `--primary`: #65A745 (vibrant lime/leaf) — CTAs, accents
- `--primary-foreground`: #FFFFFF
- `--secondary` / accent for trust + "Nairobi": #1D70B8 (clean blue)
- `--muted-foreground`: soft slate-green for body copy
- `--border`: very light green-tinted gray
- `--radius`: bump to `1rem` so cards/buttons land at `rounded-2xl`
- Add `--shadow-soft` and `--gradient-leaf` tokens for the subtle background swooshes
- Dark mode: keep tokens but desaturate; no explicit dark-mode designs requested, so we mirror the light theme respectfully

Typography: load **Inter** via `<link>` in `__root.tsx` head (variable weights), set as default sans in `styles.css`. Headings use weight 800, tight tracking.

## 2. Hero image

Generate one premium asset with the image tool:

- Path: `src/assets/hero-mattress.jpg`
- Prompt: bright, sunlit, perfectly white tufted mattress on a clean linen platform, soft natural light, airy bedroom, minimalist, photographic, 1600×1200
- Used as a soft, right-aligned hero image with white-to-transparent gradient overlay so headings stay legible on mobile

## 3. Homepage structure (`src/routes/index.tsx`)

Top → bottom (mobile-first, single column, generous whitespace):

1. **Header** — centered "FreshDream" wordmark in dark forest green with a small inline `Leaf` icon; under it, a tiny `MapPin` + "Nairobi" chip in clean blue. Transparent background, no border.
2. **Hero** — H1 "FreshDream Booking" (extra-large, bold, forest green); subhead "Professional mattress cleaning in minutes." Hero mattress image behind/aside with white gradient. Subtle lime swoosh SVG bottom-right.
3. **Trust banner** — 3 minimal icon+label tiles in a horizontal row: Safe (Leaf), Deep Clean (Shield), Fresh (Wind). Forest-green icons, blue underline accents.
4. **Service selection** — vertical stack of white `rounded-2xl` cards with soft shadow. Each card: icon, title, one-line description, small "from KES …" hint, chevron. Tapping a card scrolls to the form and pre-selects the matching package. Defaults (since you didn't specify): Deep Dust Refresh, Stain & Odor Treatment, Airbnb Turnover, Allergen Sanitization, Multi-Mattress / Host.
5. **Booking form** — same fields, schema, and Supabase submission as today; restyled with the new tokens (rounded-2xl inputs, lime focus ring, forest-green labels, generous spacing). Live price estimate card uses lime accent.
6. **Footer** — minimal contact strip (WhatsApp number, email, hours).
7. **Sticky bottom bar** — fixed full-width lime CTA "Book via WhatsApp" using the existing `createWhatsAppUrl()` helper (wa.me, opens via `target="_blank" rel="noopener noreferrer"` — already correct). Adds bottom padding to the page so content isn't hidden behind it. Hidden on `/admin*` routes.

No business logic changes: validation, estimate calculation, Supabase insert, request-ID generation, thank-you redirect — all unchanged.

## 4. Other customer pages

- `src/routes/thank-you.$requestId.tsx` — restyled with same tokens, big lime check icon, forest-green confirmation text, prominent "Open WhatsApp" button.
- `src/routes/admin.login.tsx` — clean white card on white bg, lime CTA, forest-green branding.

## 5. Admin app (token-only restyle)

Apply the new palette to `src/routes/admin.tsx`, `admin.index.tsx`, `admin.bookings.$requestId.tsx`, `admin.settings.tsx`, `settings.share.tsx`. No structural changes, no permission changes, no RLS changes — just:

- Replace any hardcoded colors with semantic tokens
- Cards use `rounded-2xl`
- Primary buttons inherit lime; destructive stays red
- Status badges keep their semantic colors but are recolored to harmonize with the new palette
- Sticky WhatsApp bar is **not** rendered in the admin layout

## 6. Files touched

- `src/styles.css` — new token values, radius bump, font-family
- `src/routes/__root.tsx` — Inter font link, default meta
- `src/routes/index.tsx` — full restructure (header, hero, trust, services, form, sticky bar)
- `src/routes/thank-you.$requestId.tsx` — restyle
- `src/routes/admin.login.tsx` — restyle
- `src/routes/admin.tsx`, `admin.index.tsx`, `admin.bookings.$requestId.tsx`, `admin.settings.tsx`, `settings.share.tsx` — token cleanup, rounded-2xl, button variants
- `src/lib/booking.ts` — add a `SERVICES` array (id, label, icon, package mapping) to power the service cards; no changes to schema/estimate
- New: `src/components/StickyWhatsAppBar.tsx`, `src/components/TrustBanner.tsx`, `src/components/ServiceCard.tsx`, `src/components/SiteHeader.tsx`
- New asset: `src/assets/hero-mattress.jpg` (generated)

## 7. Out of scope (unchanged)

- Supabase schema, RLS, admin/operator roles
- WhatsApp helper (`waLink`, `createWhatsAppUrl`) — already wa.me-correct
- Booking submission logic, validation, estimate math
- Routing structure / route guards

## Technical details

- Tailwind v4 tokens in `oklch()` (project rule); hex values from the brief converted to oklch equivalents.
- Sticky bar implemented with `fixed inset-x-0 bottom-0 z-40` + `pb-[calc(env(safe-area-inset-bottom)+88px)]` on the page wrapper to avoid content overlap on iOS.
- Service card → form pre-select via a small `useState` + `scrollIntoView({behavior:"smooth"})` call.
- Hero image imported as ES6 module (`import hero from "@/assets/hero-mattress.jpg"`).
- All new components are presentational — no new data fetching, no new server functions.
