## WhatsApp-FAB: Tooltip bei Hover/Fokus

Aktuell zeigt der schwebende WhatsApp-Button unten rechts nur das native `title`-Attribut. Das ist langsam, unstilisiert und auf Touch-Geräten unsichtbar. Wir ersetzen es durch einen richtigen Tooltip im FreshDream-Stil.

### Änderungen

**`src/components/StickyWhatsAppBar.tsx`**
- Den `<a>`-Button in den vorhandenen shadcn `Tooltip` einwickeln (`TooltipProvider`, `Tooltip`, `TooltipTrigger asChild`, `TooltipContent`).
- `title`-Attribut entfernen (Tooltip übernimmt das, doppelte Anzeige vermeiden).
- Tooltip-Inhalt:
  - Erste Zeile: **„WhatsApp öffnen"** (fett).
  - Zweite Zeile (nur wenn `selectedService` gesetzt): „Service: <Name>" in kleinerem, gedämpftem Text.
- `side="left"` damit der Tooltip nicht aus dem Viewport ragt, mit kleinem `sideOffset`.
- Tooltip öffnet bei Hover **und** Tastatur-Fokus (shadcn macht beides automatisch via Radix).
- `aria-label` bleibt für Screenreader erhalten.

### Nicht im Scope

- Keine Änderung an Position, Größe oder Farbe des FAB.
- Keine Änderung an der WhatsApp-Nachricht oder Booking-Logik.
- Kein Tooltip auf Touch-Geräten erzwingen (Radix unterdrückt ihn dort sinnvollerweise — der FAB bleibt direkt antippbar).
