## Hero refinement plan

### 1. New hero image (`src/assets/hero-mattress.jpg`)
Regenerate via imagegen (overwriting the existing asset, same import path — no code import changes needed):
- Bright, pristine all-white tufted mattress as the focal subject
- Subtle textured sage/forest-green knit pillow resting on the corner
- Small potted plant (monstera or eucalyptus sprig) softly out of focus in the background
- Airy bedroom with soft natural daylight; warm but clean palette
- 16:10, photographic, shallow depth of field

### 2. Lime swoosh divider
Add an SVG curved wave at the bottom of the `<section>` hero in `src/routes/index.tsx`, positioned absolutely, full width, ~40px tall, very low opacity (~25%), filled with `var(--brand-lime)`. Sits just above `<TrustBanner />` as a soft visual handoff. Pointer-events disabled.

### 3. Headline emphasis
In `src/routes/index.tsx` line 88, change the `h1` classes:
- `font-extrabold` → `font-black`
- `text-foreground` → explicit dark forest green (already `--foreground = --brand-green`, but tighten via `text-[color:var(--brand-green)]` to make intent explicit and add slightly tighter tracking)
- Optional: bump to `text-5xl sm:text-6xl` for more presence

### 4. No other changes
TrustBanner, services, form, FAB stay untouched.

### Technical notes
- Image regeneration uses `imagegen--generate_image` with `standard` quality, `target_path: src/assets/hero-mattress.jpg`, `transparent_background: false`.
- Update the `alt` text to mention the green pillow + plant for accessibility.
- Swoosh is inline SVG (no new asset), uses semantic token `var(--brand-lime)`.
