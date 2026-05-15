## Tastatur-Sync für den WhatsApp-FAB-Tooltip

Aktuell öffnet `onFocus` den Tooltip und `onBlur` schließt ihn. Es gibt aber keine Möglichkeit, den Tooltip per Tastatur **zu schließen, während der Fokus auf dem Button bleibt**, und `aria-expanded` kann dadurch „hängen bleiben" (Tooltip sichtbar, aber Nutzer:in will ihn weg, ohne den Fokus zu verlieren). Das gleichen wir an das Touch-Toggle-Verhalten an.

### Verhalten nach der Änderung

| Eingabe | Aktion | `aria-expanded` |
|---|---|---|
| Tab/Fokus auf Button | Tooltip öffnet | `true` |
| **Space** (auf Button) | Tooltip toggelt (auf/zu), **Link wird nicht aufgerufen** | wechselt |
| **Enter** (auf Button) | Link wird geöffnet (Standard-Anchor-Verhalten), Tooltip schließt vorher | `false` |
| **Escape** | Tooltip schließt, Fokus bleibt am Button | `false` |
| Blur (Tab weiter) | Tooltip schließt | `false` |

Begründung: Enter aktiviert bei Links nativ den `href` — das ist die Erwartung von Screenreader-Nutzer:innen und sollte erhalten bleiben. Space hat bei `<a>` **keine** native Aktion, daher wird sie für das Toggeln des Tooltips frei und spiegelt damit das Touch-Tipp-Verhalten 1:1.

### Änderungen in `src/components/StickyWhatsAppBar.tsx`

- Neuen `onKeyDown`-Handler ergänzen:
  - `e.key === " "` (Space): `e.preventDefault()`, dann `setOpen(prev => !prev)`. `suppressClickRef` nicht antasten (kein Klick).
  - `e.key === "Escape"`: nur reagieren, wenn `open === true` → `setOpen(false)` und `e.stopPropagation()` (verhindert, dass z. B. ein übergeordneter Modal-Close getriggert wird).
  - `e.key === "Enter"`: nicht abfangen, aber vorher `setOpen(false)`, damit `aria-expanded="false"` korrekt ist, bevor die Navigation erfolgt.
- `onBlur` bleibt — falls Nutzer:in mit Tab weitergeht, schließt der Tooltip ohnehin.
- `onFocus` bleibt — Fokus öffnet weiterhin.
- `aria-expanded`, `aria-controls`, `aria-describedby` (bereits vorhanden) bleiben mit dem `open`-State synchron, da sie aus genau diesem State abgeleitet werden — kein zusätzlicher Code nötig.

### Nicht im Scope

- Keine Änderung an Position, Größe, Farbe oder WhatsApp-Nachricht des FAB.
- Kein Hijacking von Enter (Link-Aktivierung bleibt nativ).
- Kein Fokus-Trap — der Tooltip ist non-modal.
