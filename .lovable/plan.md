## Goal
Honor `prefers-reduced-motion` for the "Edit details" interaction: skip the smooth scroll and the lime flash highlight, while preserving keyboard focus movement, focus-return on focusout, and the polite ARIA live announcement.

## Scope
Single file: `src/routes/index.tsx` (the "Edit details" button onClick in the Estimate card).

No changes to:
- `src/styles.css` flash keyframes (kept; just not applied when reduced motion is preferred)
- ARIA attributes, live region, or focus return logic
- Tab order or focusable elements

## Behavior matrix

| Capability | Normal motion | Reduced motion |
|---|---|---|
| Smooth scroll to section | yes (`behavior: "smooth"`) | instant (`behavior: "auto"`) |
| Lime flash highlight on card | yes | skipped |
| Move focus to Service Details card | yes | yes |
| Return focus to Edit details on focusout | yes | yes |
| Polite live-region announcement | yes | yes |

## Implementation sketch

In the button's `onClick`:
1. Read `const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;`
2. Use `el.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" })`.
3. Wrap the three flash-related lines (`classList.remove`, reflow, `classList.add`, and the cleanup `setTimeout`) in `if (!reduceMotion) { … }`.
4. Leave focus management, focusout listener, and live-region update untouched.

## Verification
- Toggle OS "Reduce motion" on, click Edit details: page jumps (no smooth scroll), no lime flash, focus still lands on the card, tabbing out still returns focus to the button, screen reader still hears the announcement.
- With reduce-motion off: behavior unchanged from current.