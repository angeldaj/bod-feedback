# Product

## Register

brand

## Users
Guests of **La Bodega** — a restaurant + panadería in Puerto Ordaz, Venezuela. They open the survey right after a visit (table tent QR, receipt link, or the restaurant's own site), usually on a phone, sometimes tired or in a hurry. Spanish (Venezuela) speakers. The job to be done: tell the house how the visit went in under two minutes, and optionally leave contact details so a manager can follow up. Some arrive to complain; the flow must make that feel heard, not punished.

This surface, `/satisfaccion`, is the seed of the wider La Bodega landing site — the same brand system will carry the marketing pages.

## Product Purpose
A seven-state, single-card satisfaction/complaint flow: intro → overall rating → which branch & meal → four rated aspects → what to improve → optional contact → thank-you. Success is a completed response with a truthful overall score; low scores (≤2) should be routable to a manager alert on the backend. The experience must feel like an extension of the restaurant's craft — warmth, candlelight, attention — not a Google Form.

## Brand Personality
Warm, candlelit, unhurried. Three words: **hospitable, hand-set, nocturnal**. The voice is a maître d' who remembers your name: gracious, plainspoken, never corporate. Emotional goal — a guest should feel the same care they felt at the table. Copy is final Spanish and must not be rewritten.

## Anti-references
- Generic form builders (Google Forms, Typeform default themes) — no rounded cards, no drop shadows, no progress "wizard" chrome.
- Bright SaaS palettes, blue accents, emoji star ratings.
- Editorial-magazine slop (display-serif + drop caps + broadsheet grid) as decoration — the serif here is a *brand mark*, used only for the wordmark, rating numerals, and italic accents, not as a magazine affectation.
- Any lightening of the near-black ground "for readability" — separation comes from hairlines and value, never shadows or panels.

## Design Principles
1. **Separation by hairline and value, never by shadow.** Radius is 0 everywhere; there are no cards-with-shadows. Structure reads through 1px gold/cream hairlines on a warm near-black ground.
2. **Motion is motivated, never decorative.** Every transition serves a state change (step morph, meter fill, progress advance). Full `prefers-reduced-motion` parity is mandatory — the flow works instantly without a single animation.
3. **The serif is the brand's signature, used sparingly.** Cormorant Garamond appears only where it signs the brand: wordmark, rating numerals, italic asides. Everything else is Barlow Condensed.
4. **Candlelight, not spotlight.** A single warm ember breathes behind the card and gold catches the edges; the room is dim on purpose. Never flatten it into flat dark-UI gray.
5. **Respect the guest's two minutes.** No validation walls, no required fields except an honest overall rating; every screen is one clear decision.

## Accessibility & Inclusion
WCAG 2.1 AA. Rating groups are real `radiogroup`/`radio` with arrow-key support and accessible names ("Satisfacción general, 4 de 5"); improvement topics are toggle buttons with `aria-pressed`; step changes announce through a polite live region. Visible focus is a 2px gold outline with offset. Muted label color `#8E8267` on the card ground must clear 4.5:1 at its sizes — never lighten the ground behind it. Full reduced-motion alternative (instant crossfade/none). Fully keyboard operable.
