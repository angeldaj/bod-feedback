# Product

## Register

brand

## Users
Guests of **La Bodega**, a restaurant + panadería in Puerto Ordaz, Venezuela, and members of its loyalty program **Bodega Club**. They open `/feedback` right after a visit or an order (table-tent QR, receipt, the site), almost always on a phone, sometimes in a hurry, sometimes upset. Spanish (Venezuela) speakers, addressed with *tú*. Two jobs:
- **Tell the house how it went** in about a minute, anonymously.
- **Get a problem fixed**: report what went wrong and be contacted by a real person on WhatsApp.

## Product Purpose
`/feedback` is one door with two paths, chosen from photographic covers (the covers ARE the intro; one tap opens step 1):

1. **Survey (5 steps, anonymous, by channel):** where/how/when (branch, dine-in · bakery · takeaway · delivery, breakfast · lunch · dinner) → overall 1–5 → aspects that fit the channel (optional) → what we did best / what to improve, a shout-out to a team member and a comment → NPS 0–10. The thank-you adapts: club points (or a nudge to join), a Google review invite for promoters, and a **bridge to a complaint** for detractors (overall ≤ 2 or NPS ≤ 6) that opens it pre-filled.
2. **Complaint (3 steps, a case):** where (branch, channel, order number for delivery) → what happened (grouped categories, text or voice note, photo/video) → how to reach you (Venezuelan WhatsApp, optional name). Policies are explained up front in a warm tone; health & safety cases surface the 911 notice and "tell the staff if you are still here"; the thank-you shows the real case number and when we will write.

Success: complete, truthful responses; complaints that reach the right branch with a way to contact the guest; detractors routed to a manager instead of lost.

## Brand Personality
Warm, bright, hospitable — **the bakery at breakfast time**, with a candlelit night mode. Three words: **cercana, alegre, resolutiva**. The voice is a host who is genuinely on the guest's side: plainspoken, never corporate, never defensive. "En La Bodega queremos superar siempre tus expectativas." Approved copy lives in the specs (`docs/superpowers/specs/`) and is not rewritten without the owner.

## Anti-references
- Generic form builders (Google Forms, default Typeform): long pages of fields, grey inputs, a wall of required asterisks.
- Cold SaaS blues, emoji star ratings, confetti for its own sake.
- Complaint flows that feel like a legal claim or a chatbot. A person answers.
- Hiding cost or friction: if something is required, say so on that step, next to the field.

## Design Principles
1. **One decision per screen, validated right there.** Required answers are checked per step; the error sits under the field and focus moves to it. Nothing fails at the end.
2. **Ask only what this visit needs.** Aspects follow the channel; optional stays optional (blank is skipped, never sent as zero). The survey never asks for name or contact.
3. **Tactile and friendly, never noisy.** Pills, rounded tiles, soft shadows and springs make it feel like tapping real things; motion always answers a touch or a state change.
4. **Gold is the house, coral is urgency.** The two colors carry meaning consistently across both flows.
5. **Help first, rules second.** Policies are explained as care ("una foto vale más que mil explicaciones"); soft friction warns, never blocks.

## Accessibility & Inclusion
WCAG 2.1 AA in both themes. Single-choice groups are real `radiogroup`/`radio` with one tab stop and arrow keys; multi-choice chips are toggles with `aria-pressed`; ratings have accessible names ("4 de 5", "9 de 10"). Step changes are announced in a polite live region and focus moves to the step title. Errors use `role="alert"` and `aria-describedby`. Visible focus ring on every control. Touch targets ≥ 44 px; 375 px with no horizontal scroll. Full `prefers-reduced-motion` parity. Fully keyboard operable.
