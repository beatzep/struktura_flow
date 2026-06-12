# Struktura Flow — Hero-Section (huly.io invertiert, Light-Mode)

Statischer Hero-Prototyp für **Struktura Digital**: weißer Hintergrund, dunkler
„Tinten-Flow" statt hellem Glow, Cursor-Reveal für verborgene Portal-UI und ein
nachgebautes Dashboard-Mockup (KPI-Donuts + Mandanten-Tabelle).

## Starten

Einfach `index.html` im Browser öffnen — oder mit Server (für saubere Font-Ladung):

```bash
python3 -m http.server 4317
# → http://localhost:4317
```

## Dateien

| Datei | Inhalt |
|---|---|
| `index.html` | Markup, statisches Flow-SVG (Trichter-Pfad + Filter), Strömungs-Layer, Mockup |
| `styles.css` | Design-Tokens, Layout, alle Animationen, Responsive, Reduced-Motion |
| `script.js` | Navbar-Blur beim Scrollen, Spotlight-Reveal, Flow-Sizing |

## Performance-Architektur (wichtig!)

Die SVG-Filter (`feTurbulence` + `feDisplacementMap` + `feGaussianBlur`) sind
**teuer** und dürfen nur **einmal** gerastert werden. Deshalb gilt:

1. **Nichts innerhalb des SVGs animieren** — keine Keyframes auf Pfaden oder
   Gruppen im `.flow-svg`. Jede Änderung darin zwingt den Browser, alle Filter
   pro Frame auf der CPU neu zu rechnen (→ Ruckeln wie in v1).
2. Atmen/Puls laufen als `transform`/`opacity` auf dem **`<svg>`-Element selbst**
   (Compositor-only, GPU).
3. Die Wasserfall-Strömung (`.flow-stream` mit `.fs-sheen/.fs-streaks/.fs-dots`)
   sind eigene HTML-Layer mit nahtlos kachelnden Gradients, animiert
   ausschließlich per `translateY`. **Loop-Distanz = Kachelhöhe** (340px/420px) —
   wer die Muster ändert, muss beide Werte synchron halten.
4. Cursor-Reveal = Spotlight: statisch maskierter 720px-Kreis bewegt sich per
   `translate3d`, die Layer-Kopie darin läuft gegenläufig mit. Keine
   Masken-Gradients pro Frame neu malen!

## Stellschrauben

- **Farben/Typo:** CSS-Variablen in `:root` (`--blue: #0B3D91`, `--ink`, Playfair Display / DM Sans).
- **Flow-Form:** `<path id="funnel">` in `index.html` (viewBox 1200×1000, Mitte x=600).
- **Flow-Look:** Gradients `gradCore/gradBlue/gradOrange`, Filter `fCore` (Rauch-Aura),
  `fInk` (scharfer Kern), `fAber` (Farbsaum-Blur).
- **Animations-Tempo:** `flow-pulse-soft` (Atmen, 4.2s), `flow-breathe` (6.5s),
  `fall-340`/`fall-420` (Strömung; Dauer pro Schicht in `.fs-*`).
- **Cursor-Reveal:** Spot-Größe in `.ghost-spot` (720px) **und** `R = 360` in
  `script.js` synchron ändern; Ruhe-Sichtbarkeit `.ghost-layer { opacity: .04 }`,
  Reveal-Stärke `.hero.cursor-on .ghost-spot { opacity: .52 }`.
- **Strahl-Position:** `.flow { left: 12vw }` → Strahl-Mitte bei ~62vw (rechts der Headline).

Der Strahl endet immer am Mockup: `script.js` misst `mockupWrap.offsetTop` und setzt
die Flow-Höhe; unter 860px startet er erst unterhalb des Hero-Texts.
