## Service Card Restyle

Update `src/components/ServiceCard.tsx` and its usage in `src/routes/index.tsx` to match the FreshDream brand spec.

### Visual changes (ServiceCard.tsx)

- **Container**: pure white background (`bg-card`), generous padding (`p-6`), `rounded-2xl`, subtle light-grey drop shadow (replace current `shadow-[var(--shadow-soft)]` with a softer neutral grey shadow like `shadow-[0_4px_16px_-4px_rgb(0_0_0/0.06)]`), hover lifts shadow slightly.
- **Leading icon**: small minimalist Dark Forest Green icon (no filled accent tile background — just the icon in `text-foreground`, ~20px, strokeWidth 2). Sits left of the title.
- **Title row**: bold Dark Forest Green title combined with the price (e.g. `Deep Dust Refresh · KES 1,999` or `Deep Dust Refresh + KES 300`), `font-bold text-foreground`. Description sits below in `text-muted-foreground text-sm`.
- **Selection control**: a fully rounded (`rounded-full`) Vibrant Lime Green circular indicator on the right side replacing the chevron. Default state: lime outline ring; selected state: solid lime fill with white check icon. Size ~28px.
- **Selected state**: card gets a thin lime ring (`ring-2 ring-primary`) plus a faint lime-tinted shadow so the active service is unmistakable.
- **Spacing**: increase vertical gap between title, description, and price hint; ensure min-height feels airy.

### Wiring (index.tsx)

- Track the currently selected service id and pass `selected={selectedId === s.id}` to each `ServiceCard`.
- Update `handleServiceSelect` to also store the service id alongside the existing package + title state.

### Out of scope

- No changes to booking logic, schema, or WhatsApp message format.
- No changes to TrustBanner, hero, or sticky bottom bar.
