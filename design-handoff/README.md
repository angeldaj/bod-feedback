# Handoff: Encuesta de satisfacción — La Bodega

## Overview
Multi-step satisfaction / complaint form for the La Bodega website (restaurante + panadería, Puerto Ordaz, Venezuela). A guest finishes it in under two minutes: overall rating, which branch and meal, four rated aspects, what to improve, optional contact details, thank-you screen. Visual language matches the brand's Instagram and the pollo asado flier: warm near-black ground, gold hairlines, cream ink, no rounded corners.

## About the Design Files
The files in this bundle are **design references created in HTML** — a prototype of the intended look and behavior, not production code to copy. Recreate the design in the target codebase's existing environment (React, Vue, Next, Laravel Blade, etc.) using its established patterns, component library and form/validation stack. If no environment exists yet, pick the most appropriate framework for the site and implement it there.

`Encuesta Satisfaccion.dc.html` is a single-file prototype: markup plus a small state class, rendered by the bundled `support.js` runtime. Read it for exact markup, styles and state logic; do not ship `support.js`.

## Fidelity
**High fidelity.** Colors, typography, spacing and interaction states are final. Recreate the UI pixel-close using the codebase's own primitives. Copy is final Spanish (Venezuela) — do not rewrite.

## Screens / Views
Single page, one card, seven sequential states. Shell is shared by all states.

### Shell (all states)
- Full-height page, `background: radial-gradient(110% 70% at 50% -10%, #1C160F 0%, #0F0B08 55%, #0B0906 100%)`, ink `#F7F2E7`, padding `40px 20px 64px`, contents centered in a column.
- **Brand lockup** (top, centered, gap 10px):
  - 48×48 box, `1px solid #D9A94A`, no radius, centered letter “B”, Cormorant Garamond 26px, color `#D9A94A`.
  - “La Bodega” — Cormorant Garamond 22px, uppercase, `letter-spacing: .4em`, `padding-left: .4em` (compensates trailing tracking), line-height 1.
  - “Restaurante · Panadería” — Barlow Condensed 12px, uppercase, `letter-spacing: .36em`, color `#B4A382`.
- **Progress row** (max-width 760px, margin-top 34px, flex, gap 16px): 1px track `rgba(217,169,74,.22)` filling remaining width, with an absolutely positioned 1px fill in `#D9A94A` whose width is `step/5 * 100%`; right label Barlow Condensed 12px uppercase `letter-spacing: .3em`, color `#B4A382`, `white-space: nowrap`, text “Paso N de 5” (or “Completado” on the thank-you state).
- **Card** (max-width 760px, margin-top 38px): `border-top` and `border-bottom` `1px solid rgba(217,169,74,.5)` only (no side borders, no radius), `background: rgba(9,7,5,.6)`, padding `44px 44px 40px`, flex column, gap 28px.
- **Footer row** (max-width 760px, margin-top 26px): “Puerto Ordaz · Venezuela” left, “Encuesta de satisfacción” right; Barlow Condensed 14px uppercase `letter-spacing: .16em`, color `#8E8267`; wraps on narrow screens.

### 1. Intro (`step 0`)
Purpose: set expectations and start.
- Eyebrow: Cormorant Garamond italic 24px, `#E0B45C` — “Gracias por acompañarnos”.
- Headline: Barlow Condensed 600, 58px, `line-height: .92`, `letter-spacing: .04em`, uppercase, `text-wrap: balance` — “¿Cómo estuvo / tu visita?” (explicit `<br>` between lines).
- Body: 19px, `line-height 1.5`, `#D6C9AE`, `max-width: 52ch`, `text-wrap: pretty` — “Seis preguntas, menos de dos minutos. Lo que nos cuentes lo lee el equipo de sala y cocina cada semana.”
- Primary button “Comenzar” + italic aside “Anónimo si así lo prefieres” (Cormorant italic 18px, `#B4A382`), in a wrapping row, gap 18px.
- No back/next nav row on this state.

### 2. Satisfacción general (`step 1`)
- Step eyebrow: 12px uppercase `letter-spacing: .36em`, `#B4A382` — “Paso uno”.
- Title: Barlow Condensed 600, 42px, uppercase, `letter-spacing: .04em` — “Satisfacción general”.
- Five square buttons 88×88, gap 14px, wrapping; numeral 1–5 in Cormorant Garamond 30px. Single-select (see Chip states).
- Scale ends row, `max-width: 492px`, `justify-content: space-between`, 13px uppercase `letter-spacing: .2em`, `#8E8267` — “Mala” / “Excelente”.
- Live response line, Cormorant italic 22px, `#E0B45C`, `min-height: 1.4em` (reserves space so layout doesn't jump):
  - 1 → “Lo sentimos. Cuéntanos qué pasó.”
  - 2 → “Podemos hacerlo mucho mejor.”
  - 3 → “Bien, pero con detalles por pulir.”
  - 4 → “Nos alegra. Casi perfecto.”
  - 5 → “Gracias. Así queremos que sea siempre.”

### 3. Tu visita (`step 2`)
Eyebrow “Paso dos”, title “Tu visita”.
- Group label pattern: 13px uppercase `letter-spacing: .28em`, `#8E8267`, gap 12px above the options.
- **Sucursal** — single-select chips: `Bodega 1`, `Bodega 2`, `Bodega 3`. *(Placeholder names — confirm the real branch names before shipping.)*
- **Momento** — single-select chips: `Desayuno`, `Almuerzo`, `Cena`, `Para llevar`.
- Chips: padding `13px 26px`, 16px uppercase `letter-spacing: .14em`, 1px border, no radius, wrapping row gap 12px.

### 4. Lo que evaluamos (`step 3`)
Eyebrow “Paso tres”, title “Lo que evaluamos”. Four rows, each `border-top: 1px solid rgba(245,239,227,.12)`, padding `18px 0`, label left / rating right, `flex-wrap: wrap`:
| Label | Hint (Cormorant italic 17px, `#B4A382`) |
| --- | --- |
| La comida | Sabor, punto, temperatura |
| El servicio | Atención y trato del equipo |
| El ambiente | Música, luz, limpieza |
| El tiempo de espera | Desde el pedido hasta la mesa |

Label: Barlow Condensed 600, 22px, uppercase, `letter-spacing: .1em`. Rating: five 38×38 square buttons, gap 8px, numeral 15px, single-select per row.

### 5. ¿Algo que mejorar? (`step 4`)
Eyebrow “Paso cuatro”, title “¿Algo que mejorar?”.
- **Multi-select** chips, padding `11px 22px`, 15px uppercase `letter-spacing: .12em`, gap 12px: `Sabor`, `Espera`, `Atención`, `Precio`, `Limpieza`, `Pedido equivocado`, `Ruido`, `Nada, todo bien`.
- Label “Cuéntanos con tus palabras” + textarea: 5 rows, full width, `background: rgba(247,242,231,.04)`, `border: 1px solid rgba(217,169,74,.35)`, ink `#F7F2E7`, padding `16px 18px`, 18px / 1.5, `resize: vertical`, no radius, placeholder `#6F6350` — “Lo que pasó, lo que te gustó, lo que esperabas…”.

### 6. ¿Te contactamos? (`step 5`)
Eyebrow “Paso cinco”, title “¿Te contactamos?”, body 18px `#D6C9AE` — “Opcional. Si dejas tus datos, un encargado te escribe personalmente.”
- Grid `repeat(auto-fit, minmax(220px, 1fr))`, gap 18px, two fields sharing the textarea's input styling (padding `14px 16px`, 18px):
  - “Nombre” — placeholder “Tu nombre”.
  - “Teléfono o correo” — placeholder “+58 ··· / tu@correo”.
- Next button label becomes **“Enviar”**.

### 7. Gracias (`step 6`)
Centered column, gap 20px, padding `20px 0 10px`: 66×66 gold-bordered “B” (Cormorant 34px); “Gracias” Barlow Condensed 600, 50px, uppercase, `line-height: .95`; Cormorant italic 24px `#E0B45C` — “Tu opinión ya está con el equipo”; body 18px `#D6C9AE`, `max-width: 46ch` — “Si dejaste tus datos, te escribimos en las próximas 48 horas.”; ghost button “Enviar otra respuesta” resets all state to step 0. No nav row.

### Nav row (steps 1–5 only)
`margin-top: 6px; padding-top: 24px; border-top: 1px solid rgba(245,239,227,.12)`, space-between, wrapping.
- **Atrás** — transparent, `1px solid rgba(245,239,227,.28)`, `#D6C9AE`, padding `13px 28px`, 14px uppercase `letter-spacing: .24em`. Hover: border `#D9A94A`, text `#E0B45C`.
- **Siguiente / Enviar** — solid `#D9A94A` on `#12100C` ink, padding `14px 36px`, 15px 600 uppercase `letter-spacing: .24em`. Hover: `#EFC77E`.

## Interactions & Behavior
- **Chip / rating states** (one shared rule everywhere): inactive `border: 1px solid rgba(217,169,74,.35)`, `background: transparent`, ink `#D6C9AE`; active `border` + `background: #D9A94A`, ink `#12100C`. All squares/chips have `cursor: pointer` and no border-radius.
- **Selection semantics**: overall rating, sucursal, momento and each aspect are single-select (re-clicking keeps the value in the prototype — make it toggle-off only if the product wants it). Improvement topics are multi-select.
- **Navigation**: “Siguiente”/“Atrás” move one step, clamped to `[0, 6]`; each move calls `window.scrollTo({top: 0, behavior: 'smooth'})`. Steps advance with no validation in the prototype — add real rules on integration (suggested: require the overall rating on step 1; everything else optional; require at least a rating or a comment before submit).
- **Submit** is the “Enviar” button on step 5, which advances to the thank-you state. Wire it to the real endpoint; add pending and error states (the prototype has none): disable the button while posting, keep entered answers on failure, show an inline gold-bordered error notice above the nav row.
- **Progress** reflects `min(step, 5)/5`; step 0 shows “Paso 1 de 5” (label uses `max(1, step)`).
- **Responsive**: everything is fluid — max-width 760px card, wrapping chip rows, `auto-fit` contact grid. Below ~520px reduce card padding (e.g. `28px 20px 26px`) and step the intro headline down (`clamp(40px, 12vw, 58px)`); rating squares may shrink to 64×64 with gap 10px. No fixed heights on text boxes.
- **Accessibility**: implement the rating groups as `radiogroup` / `radio` (or fieldset + visually-hidden inputs) with accessible names (“Satisfacción general, 4 de 5”); topics as toggle buttons with `aria-pressed`; announce step changes via a polite live region; keep visible focus rings — use a `2px` gold outline with offset, since focus is not styled in the prototype. Contrast: `#8E8267` labels on the card ground pass at 13–14px uppercase; do not lighten the ground behind them.

## State Management
```
step: 0..6                    // intro, overall, visit, aspects, issues, contact, done
overall: 0 | 1..5
sucursal: '' | 'Bodega 1' | 'Bodega 2' | 'Bodega 3'
momento: '' | 'Desayuno' | 'Almuerzo' | 'Cena' | 'Para llevar'
aspects: { comida, servicio, ambiente, tiempo }   // each 0 | 1..5
temas: string[]               // multi-select labels
comentario: string
nombre: string
contacto: string
```
Transitions: `next` → `step+1`; `back` → `step-1`; chip click → set that field; topic click → add/remove from `temas`; text inputs → controlled on change; “Enviar otra respuesta” → reset all fields to the initial object and `step = 0`.
Data: no fetching on load. On submit, POST the whole object plus a timestamp; consider server-side routing of low scores (overall ≤ 2) to a manager alert, and persisting in-progress answers to `sessionStorage` so a reload doesn't lose them.

## Design Tokens
Colors
- Ground: `#0B0906`; gradient stops `#1C160F`, `#0F0B08`
- Card ground: `rgba(9,7,5,.6)`; input ground `rgba(247,242,231,.04)`
- Gold: `#D9A94A`; gold hover `#EFC77E`; gold italic accent `#E0B45C`
- Ink on gold: `#12100C`
- Cream ink: `#F7F2E7`; body text `#D6C9AE`; muted `#B4A382`; labels `#8E8267`; placeholder `#6F6350`
- Hairlines: `rgba(217,169,74,.5)` (card), `rgba(217,169,74,.35)` (chips/inputs), `rgba(217,169,74,.22)` (progress track), `rgba(245,239,227,.12)` (internal dividers), `rgba(245,239,227,.28)` (ghost button)

Typography — Barlow Condensed (400/500/600/700) for UI and display, Cormorant Garamond (400/600, italic) for the wordmark, numerals in the rating squares, and italic accents.
Scale: 58 / 50 / 42 (display 600) · 30, 26, 24, 22 (Cormorant) · 19, 18, 17, 16, 15 · 14, 13, 12 (uppercase labels).
Tracking: `.04em` display · `.1em`–`.14em` chips/labels · `.2em`–`.28em` small caps · `.3em`–`.44em` eyebrows and wordmark (always pair with matching `padding-left` when centered).

Spacing: 4 · 6 · 8 · 10 · 12 · 14 · 18 · 20 · 22 · 26 · 28 · 34 · 38 · 44 (px). Card max-width 760px. Radius: **0 everywhere**. Shadows: **none** — separation comes from hairlines and ground value.

## Assets
No images in this design. Fonts from Google Fonts (Barlow Condensed, Cormorant Garamond) — self-host in production. The “B” monogram is set as a Cormorant Garamond letter inside a bordered square, standing in for the real La Bodega mark; swap in the brand's actual logo file when available. `pollo.png` in the parent project belongs to the flier, not to this page.

## Files
- `Encuesta Satisfaccion.dc.html` — the prototype (markup + state class). Authoritative for styles and copy.
- `support.js` — prototype runtime only; needed to open the HTML locally, not part of the deliverable.
