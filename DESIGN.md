# Design

## Direction
**Pop, warm and appetite-first — day by default, with a night mode.** The official direction of the public surfaces (`/feedback`, landing, Bodega Club). It grew out of the original nocturnal system and keeps its identity (gold, coral, cream; Barlow Condensed + Cormorant Garamond) but trades hairlines-on-black for a friendly, tactile layer: pill chips, rounded tiles and cards, soft warm shadows, springy micro-motion and photographic covers.

- **Day ("Panadería de día")** is the default: cream ground, white cards, warm-dark ink. Scoped under `.day`, which re-points the `--lb-*` tokens so every token-driven component flips automatically.
- **Night** is the same system on the warm near-black ground (the original room lit like candlelight). Toggled from the header and remembered in `localStorage` (`labodega-theme`).
- The internal `/dashboard` demo keeps the old austere nocturnal look (no `.day`, no `.pop-*`).

Live tokens are the source of truth: `src/app/globals.css` (`--lb-*`, the `POP LAYER`, the `DAY LAYER` and `FEEDBACK SPLIT SELECTOR` blocks).

## Color
Exact brand hex (identity-preserved — do not re-derive in OKLCH). Two roles carry meaning:
- **Gold** = the brand and positive/primary actions (survey, points, selected chips).
- **Coral** = energy and urgency (complaint flow, errors, "lo que podemos mejorar", 911 banner).

| Role | Token | Night | Day |
| --- | --- | --- | --- |
| Ground | `--lb-ground` | `#0B0906` | `#FFF3E4` |
| Primary ink | `--lb-cream` | `#F7F2E7` | `#2A1A11` |
| Body | `--lb-body` | `#D6C9AE` | `#6A5142` |
| Muted | `--lb-muted` | `#B4A382` | `#7E6150` |
| Labels | `--lb-label` | `#8E8267` | `#7A5C49` |
| Gold (fill) | `--lb-gold` / `--lb-gold-hi` | `#D9A94A` / `#EFC77E` | `#D9A94A` / `#F0C274` |
| Gold as text | `--lb-gold-accent` | `#E0B45C` | `#A9761A` |
| Coral as text | `--lb-coral` | `#FF6A3D` | `#C8391A` |
| Coral (fill) | `--lb-coral-hi` / `--lb-coral-deep` | `#FF8A5F` / `#E2492A` | `#FF6A3D` / `#9E2C10` |
| Coral wash | `--lb-coral-soft` | `rgba(255,106,61,.14)` | `rgba(200,57,27,.12)` |
| Input ground | `--lb-input` | `rgba(247,242,231,.04)` | `rgba(120,72,40,.05)` |
| Divider | `--lb-hair-div` | `rgba(245,239,227,.12)` | `rgba(74,43,22,.13)` |

Rules: coral stickers (`.pop-badge-coral`, filled danger chips) always use the **bright** coral fill with dark ink so the label clears AA in both themes. Color never carries meaning alone — errors add an icon and text, selected chips add a check.

## Typography
- **Barlow Condensed** (400/500/600/700) — all UI and display. `--font-sans`. Step titles 40 px (32 px under 560 px), uppercase, weight 600, line-height 0.95. Labels 13 px uppercase `.14em`. Body 17 px / 1.55. Never below 13 px for text that must be read.
- **Cormorant Garamond** (400/600 + italic) — the brand's signature, used sparingly: wordmark, step leads and italic asides, reaction lines, the overall rating numerals. Numbers that are compared or scanned (NPS 0–10, aspect dots, case numbers) use Barlow with tabular figures.

## Shape, depth and surface
- **Radius scale:** pills `999px` (chips, buttons, badges, progress) · tiles `18px` (rating tiles, notices, inner boxes) · inputs `16px` · policy box `22px` · cards and covers `26–28px`. Use explicit values: the shadcn `--radius-*` tokens are 0 (legacy dashboard) so `rounded-xl/2xl` render square.
- **Depth = soft warm shadows**, one strategy throughout: cards get an inner top highlight plus a long, low-opacity warm drop; filled chips/tiles get a colored glow of their own fill. Covers are the only "raised block" (solid bottom edge) because they are the one big tap target.
- **Cards** are opaque (white-to-cream by day, `#0F0B08` by night) so the page glow never seams through.
- **Covers with photo:** `/public/img/feedback-*.png` under a sheen and a bottom scrim so white copy stays legible; the brand gradient is the fallback if the photo fails.

## Components
- **Chips** (`.pop-chip`, `ChipGroup`) — pills ≥ 44 px tall. Single-select = real `radiogroup` with one tab stop and arrow keys; multi-select = toggle buttons with `aria-pressed` and a check. Gold when on; `--danger` variant is coral. Missing answers get a coral edge (`data-invalid`).
- **Rating tiles** (`.pop-rate`) — overall 1–5 as a fluid 5-column grid (never wraps at 375 px), sentiment ramp coral → gold via `--sent`; aspect dots 44×44, clearable (tap again to unrate). **NPS 0–10** (`NpsScale`) is a choice, not a meter: only the chosen number fills; 6 + 5 in two rows under 560 px, 11 in a row above.
- **Buttons** — `pop` (gold→coral gradient), `popCoral` (deep coral, white label), `popGhost` (outline). One primary per step; "Atrás" is ghost and absent on step 1.
- **Inputs** (`.pop-input`, `BrandTextField/Area`) — visible label, "(opcional)" suffix, persistent hint and error under the field, fixed prefix support (`+58`).
- **Notices** (`.pop-notice`) — warm (tips) and alert (911, soft friction). **Policies box** (`.pop-policies`) — collapsible, `aria-expanded`.
- **Wizard shell** (`feedback/wizard.tsx`) — progress bar (`role=progressbar`), card with height morph, polite live region announcing "Paso N de M…", focus to the step title on change.
- **Thank-you** — seal, big uppercase title, serif aside; points sticker (`.pop-points`), case pill (`.pop-case`).

## Motion
Library: **Motion** (`motion/react`). Motion is motivated and quick:
- **Springs** for touch feedback: press scale 0.9–0.94, selected lift (`springBouncy` 480/20), step items stagger in with `springSoft` (320/26).
- **Ease-out expo** `cubic-bezier(0.22,1,0.36,1)` for layout: card height morph 450 ms, step leave 160 ms (exit faster than enter), cover ↔ form column morph.
- Ambient: slow cover sheen and chevron nudge, page glow crossfade between tones.
- **Full `prefers-reduced-motion` parity is mandatory**: `MotionConfig reducedMotion="user"` drops transforms, height/rotate transitions collapse to 0 ms, CSS loops and transitions are disabled; the flow stays fully usable.

## Layout
- Mobile-first. 375 px has no horizontal scroll: page gutter 14 px, card padding 20 px, every control fits the ~300 px content width.
- `/feedback` is a **split**: two covers side by side (stacked on mobile). Choosing one keeps it as a slim accent rail ("Estás enviando · Cambiar"; a banner on mobile) and opens the form in the other slot, max 560 px wide.
- Touch targets ≥ 44 px, ≥ 8 px apart.
