# Design

## Theme
Single, committed **nocturnal** theme — no light mode. A warm near-black room lit like candlelight: a breathing gold ember behind the content, fine film grain over everything, cream ink, gold hairlines. Separation is carried by 1px hairlines and value contrast, never by shadows or panels. **Radius is 0 everywhere. Shadows: none.** The strategy is *Drenched* (the dark ground IS the brand) with gold as the single committed accent.

Live tokens are the source of truth: `src/app/globals.css`.

## Color
Exact brand hex (identity-preserved from the handoff — do not re-derive in OKLCH).

| Role | Token | Value |
| --- | --- | --- |
| Ground | `--lb-ground` | `#0B0906` |
| Gradient stops | `--lb-grad-1/2/3` | `#1C160F` · `#0F0B08` · `#0B0906` |
| Card ground | `--lb-card` | `rgba(9,7,5,.6)` |
| Input ground | `--lb-input` | `rgba(247,242,231,.04)` |
| Gold (accent) | `--lb-gold` | `#D9A94A` |
| Gold hover | `--lb-gold-hi` | `#EFC77E` |
| Gold italic accent | `--lb-gold-accent` | `#E0B45C` |
| Ink on gold | `--lb-ink-on-gold` | `#12100C` |
| Cream ink | `--lb-cream` | `#F7F2E7` |
| Body text | `--lb-body` | `#D6C9AE` |
| Muted | `--lb-muted` | `#B4A382` |
| Labels | `--lb-label` | `#8E8267` |
| Placeholder | `--lb-placeholder` | `#6F6350` |
| Hairline · card | `--lb-hair-card` | `rgba(217,169,74,.5)` |
| Hairline · chip/input | `--lb-hair-chip` | `rgba(217,169,74,.35)` |
| Hairline · progress track | `--lb-hair-track` | `rgba(217,169,74,.22)` |
| Hairline · divider | `--lb-hair-div` | `rgba(245,239,227,.12)` |
| Hairline · ghost button | `--lb-hair-ghost` | `rgba(245,239,227,.28)` |

These are mapped onto shadcn semantic tokens (`--primary` = gold, `--background` = ground, etc.) so shadcn/Base-UI primitives inherit the theme, and re-exposed as Tailwind utilities (`text-gold`, `text-body`, `text-label`, `border-hair-card`, …).

## Typography
Two families, chosen as the brand's committed identity (reflex-reject list is overridden by identity-preservation):
- **Barlow Condensed** (400/500/600/700) — all UI and display. `--font-sans`.
- **Cormorant Garamond** (400/600 + italic) — the brand's signature, used sparingly: wordmark, rating numerals, italic asides. `--font-serif`.

Scale (px): display 58 / 50 / 42 (Barlow 600, uppercase, tracking `.04em`, line-height ~0.92–1). Cormorant 30 / 26 / 24 / 22. Body 19 / 18 / 17 / 16 / 15. Uppercase labels 14 / 13 / 12.
Tracking: `.04em` display · `.1em`–`.14em` chips/labels · `.2em`–`.28em` small caps · `.3em`–`.44em` eyebrows and wordmark (always pair with matching `padding-left` when centered so the trailing track stays balanced).

## Components
- **Rating meter** — cumulative fill: N squares, gold rises from the bottom on fill, hover previews a lighter fill up to the hovered value, selection pops. Overall = 88×88 (Cormorant 30px numerals); aspect dots = 38×38.
- **Chips** — single- or multi-select. Inactive: transparent, 1px `--lb-hair-chip`, body ink. Active: gold fill sweeps in from the left, ink-on-gold text. No radius.
- **Buttons** — primary: solid gold on ink, uppercase `.24em`, light sweep on hover → `--lb-gold-hi`. Ghost: transparent, `--lb-hair-ghost` border, hover to gold.
- **Inputs/Textarea** — input ground, hairline border, gold underline draws left→right on focus, no radius.
- **Progress** — 1px track with a gold fill at `min(step,5)/5·100%`; a brightness sweep runs when it advances.
- **Card** — top+bottom hairlines only (no sides), `--lb-card` ground, hairlines draw in from center on load.

## Motion
Library: **Motion** (`motion/react`). Motion is motivated, never decorative. Easing: `cubic-bezier(0.22,1,0.36,1)` (ease-out expo-ish), no bounce/elastic. Signature moments: shell load stagger, per-step enter/leave with height morph and child stagger, ember breathe, meter fill, progress sweep, thank-you seal ring pulse. **Full `prefers-reduced-motion` parity is mandatory** — every animation collapses to instant/crossfade and the flow stays fully usable.

## Layout
Centered single column, card `max-width: 760px`. Page padding `40px 20px 64px` (→ `28px 14px 40px` under ~560px). Fluid, wrapping chip rows; contact grid `repeat(auto-fit, minmax(220px, 1fr))`. Below ~560px: card padding `28px 20px 26px`, intro headline `clamp(40px,12vw,58px)`, overall squares shrink to 64×64.
