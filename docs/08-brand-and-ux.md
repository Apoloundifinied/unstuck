# Unstuck — visual system and launch UX

## Brand thesis
A quieter, more precise way to find people who can ship reliable n8n automations. The brand is **independent of n8n** and should never look like an official partner product. Reference: editorial minimalism, warm neutrals and calm motion; original treatment in shape, typographic rhythm, flow diagrams and 3D layers.

## Experience contract
This is a **two-sided waitlist**, not a live marketplace. Every example request and specialist card must say *illustrative*, *sample* or *concept*. Never invent ratings, transaction counts, actual availability, customer names or verified case studies. The public homepage can explain the proposed experience, but cannot claim real matching, bookings or verified experts exist.

## Palette
| Token | Value | Use |
|---|---|---|
| page | #F5F2EC | Warm background |
| paper | #FCFAF6 | Readable surface |
| sand | #EAE4DA | Section contrast |
| ink | #292621 | Primary text and CTA |
| sub | #655F55 | Secondary text |
| rust | #BB6549 | Distinctive highlight, active status |
| sage | #78866B | Positive indicator |
| line | #D9D3C9 | Dividers |

Heading: DM Sans (600/500) with Instrument Serif italic for controlled contrast. UI: DM Sans. Technical labels: DM Mono. Fonts fall back to system sans/serif/mono.

## System dark appearance (2026-10-17)

The existing light design, typography, geometry, illustrations and interactions remain the baseline. Both homepage and privacy load `public/dark.css` only through `media="(prefers-color-scheme: dark)"`. The browser updates the theme live when the OS preference changes, without a stored override, toggle or JavaScript. Theme-color metadata follows the same preference; native controls use color-scheme dark.

Dark runtime tokens in `dark.css`: page #101113, paper #191B1F, sand #202227, ink #F4F1EB, sub #C4C0BA, quiet #AAA59E, rust #E69B7D, rust-dark #EDAC91, sage #A9BC94, line #41434A. Component overrides replace the original hardcoded light surfaces and low-contrast warm text in diagrams, example profiles, forms and footer. Layout/media breakpoints and reduced-motion rules remain owned by `styles.css`. Privacy shares the appearance stylesheet; its spacing remains in `privacy.css`.

## Motion
Hero cards drift subtly with CSS transforms; desktop pointer adds shallow perspective (no WebGL, no JS dependency for content). The scenario explorer has an animated activity pip. All major animation is optional, with `prefers-reduced-motion: reduce` supported. Avoid autoplay narratives that hide the form or require user interaction to understand.

## Reddit-first constraints
- Lead with an immediately recognizable n8n problem; avoid marketing jargon and unverifiable superiority claims.
- A screenshot or 20-second screen recording of the **interactive workflow explorer** is a more substantive demonstration than an abstract brand animation.
- For r/n8n, verify current rules before posting and use the designated weekly self-promotion thread when applicable. Prior examples require workflows to include example outputs; do not misrepresent this UI mockup as a functioning n8n workflow.
- Explicitly disclose affiliation status, waitlist status, and what data is collected.
- Main acquisition hypothesis: first users may come from maker communities, but buyers may be distributed across operations, agency and small-business communities. Test demand explicitly.

## Deliverable structure
`public/index.html` full homepage; `public/styles.css` visual tokens and responsive components; `public/motion.js` scenario explorer and perspective; `public/app.js` unchanged two-step waitlist client; `src/worker.js` unchanged API; `public/privacidade/index.html` matching privacy styling.

## Security / launch gates
Cloudflare D1 ID, Turnstile site/secret keys and real privacy contact are intentionally NOT configured. A local static preview works immediately, but API registrations require those external resources. Keep credentials out of the repo and ZIP. Never show fake signup success in a live interface. Run API tests before launch and verify deployments.
