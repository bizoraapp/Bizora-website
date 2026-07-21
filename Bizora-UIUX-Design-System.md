# Bizora — UI/UX Design System & Page Blueprint

*Prepared as the design foundation for all remaining pages and components. Build against this document — new sections extend it, they don't replace it.*

---

## 1. Visual Design Direction

**Positioning:** Bizora is the business system for entrepreneurs who can't afford downtime. The design should feel like a **calm, competent tool**, not a flashy consumer app — closer to a trusted ledger than a trend-chasing SaaS product.

**Direction:** *Confident Clarity.* Navy conveys stability and trust (the bank-adjacent color for financial tools); gold conveys growth and value without tipping into "luxury" or "crypto" territory. White space does the heavy lifting — SME owners are scanning on a small screen for 8 seconds, not reading a brochure.

**Signature element:** The ascending-bars motif from the logo's chart glyph recurs as a quiet structural device — section dividers, hover states, the hero background — tying every screen back to Bizora's actual promise: *growth you can see.* Used sparingly, never as decoration for its own sake.

**What we avoid:** Stock "team high-fiving in an office" photography, generic gradient blobs, dense corporate jargon, heavy scroll animation that taxes low-end Android GPUs.

---

## 2. Color Palette

| Token | Hex | Usage |
|---|---|---|
| `--color-navy-deep` | `#0A1F44` | Headlines, nav, footer background |
| `--color-navy` | `#123B72` | Secondary text on light, link hover |
| `--color-navy-soft` | `#1E4E8C` | Icon fills, secondary accents |
| `--color-gold` | `#D9A62E` | Primary CTA, price highlights |
| `--color-gold-light` | `#F0C862` | Gradient partner, hover glow |
| `--color-ink` | `#1B2430` | Body text |
| `--color-ink-soft` | `#4A5568` | Secondary/supporting text |
| `--color-cloud` | `#F7F8FA` | Page background |
| `--color-white` | `#FFFFFF` | Cards, navbar |
| `--color-border` | `#E4E7EC` | Dividers, card borders |
| `--color-success` | `#2F9E5B` | Confirmation states, "included" checkmarks |
| `--color-danger` | `#C0392B` | Form errors only — never decorative |

**Rule of use:** Gold is reserved for *action and value* (buttons, prices, checkmarks). It never fills large background areas — at that scale it reads cheap rather than premium. Navy carries authority; gold carries momentum.

---

## 3. Typography System

| Role | Face | Weight | Size (mobile → desktop) |
|---|---|---|---|
| Display / H1 | Sora | 700 | 1.75rem → 3.25rem |
| H2 | Sora | 700 | 1.5rem → 2rem |
| H3 | Sora | 600 | 1.15rem → 1.5rem |
| Body | Inter | 400 | 1rem |
| Body small / captions | Inter | 400 | 0.85rem |
| Buttons / labels | Sora | 600 | 1rem |
| Eyebrow / tags | Sora | 600, uppercase-off, letterspaced | 0.85rem |

**Why this pairing:** Sora's geometric, slightly rounded letterforms feel modern without being cold — approachable for a shop owner, not sterile for an enterprise buyer. Inter carries dense information (feature descriptions, FAQ) with maximum legibility on cheap screens at small sizes.

**Rule:** Never more than 3 weights on a single screen. Line length capped at ~60 characters for body text (`max-width: 46ch` pattern already in the hero).

---

## 4. Button Styles

| Style | Use case | Visual |
|---|---|---|
| **Primary** | Start Free Trial — appears once per section max | Gold→gold-light gradient fill, navy-deep text, soft shadow, lifts on hover |
| **Secondary** | "See how it works", "Learn more" | Transparent fill, 1.5px border, navy text, border darkens on hover |
| **Tertiary / text link** | In-card links, footer nav | No border, underline on hover only, navy or ink color |
| **WhatsApp CTA** | Support section | Solid `#25D366` (WhatsApp brand green) — the one deliberate exception to the palette, because instant recognizability matters more than palette purity here |

**States required for every button:** default, hover, active (scale 0.98), focus-visible (gold outline, already global), disabled (40% opacity, no pointer).

**Rule:** Exactly one primary-styled button visible per viewport scroll position. Multiple gold buttons stacked together dilute the "this is THE action" signal.

---

## 5. Card Designs

| Card type | Structure | Notes |
|---|---|---|
| **Feature card** | Icon chip (44×44, gold-tinted navy icon) → H3 → 1-line description | Already built. Hover: lift 2px + shadow. No CTA inside — the whole grid funnels to one CTA below it. |
| **Problem card** | Small "before" icon (muted/gray) → problem statement in ink-soft | Deliberately less visually confident than solution cards — supports the before/after narrative |
| **Solution card** | Gold check icon → solution statement in navy-deep, bold | Visually "louder" than its paired problem card — the contrast IS the persuasion device |
| **Step card** (How It Works) | Large numeral (not decorative — this genuinely is a sequence) → short label → 1-line detail | Numbers connected by a thin dotted line on desktop to imply a path |
| **Pricing card** | Plan name → price (large, Sora 700) → feature checklist → CTA | Featured plan gets gold border + subtle shadow lift, NOT a "MOST POPULAR" ribbon (feels like a template default — let the visual weight speak instead) |
| **Testimonial card** | Quote → name, business type, location (no stock photo — use a colored initial-avatar instead, more honest given no real photos yet) | |
| **Trust card** | Icon → bold micro-headline → 1-line proof point | Grid of 4, equal visual weight — no single trust point should dominate |

---

## 6. Navigation Structure

Already implemented (`components/navbar.html`) — confirming it holds under this design system:

- Logo + wordmark (left) → Features / Pricing / Support / About (center-right, desktop only) → **Start Free Trial** button (persistent, right-most position, always gold)
- Mobile: hamburger reveals a full-width dropdown panel, CTA repeated at the bottom of the panel
- Sticky on scroll — SME users on long feature pages need the CTA reachable at all times without scrolling back up

No changes needed to the nav architecture itself; this section confirms it, it doesn't replace it.

---

## 7. Mobile-First Layout (base breakpoint, <700px)

```
┌─────────────────────────┐
│ ☰   BIZORA        [CTA] │  sticky navbar
├─────────────────────────┤
│  "Works offline" tag     │
│  HEADLINE (2 lines)      │
│  Supporting sentence     │
│  [Start Free Trial]      │
│  [See how it works]      │
│  ┌─────────────────────┐ │
│  │  App screenshot      │ │
│  │  (single visual)     │ │
│  └─────────────────────┘ │
├─────────────────────────┤
│  Problem/Solution        │
│  (stacked, 1 col)        │
├─────────────────────────┤
│  Features grid           │
│  (1 col, stacked cards)  │
├─────────────────────────┤
│  Trust section            │
│  (2x2 grid, compact)     │
├─────────────────────────┤
│  How It Works             │
│  (vertical steps,        │
│   numeral + line)        │
├─────────────────────────┤
│  Pricing (stacked cards, │
│  featured plan first)    │
├─────────────────────────┤
│  Support (WhatsApp CTA   │
│  prominent, FAQ below)   │
├─────────────────────────┤
│  Final CTA band          │
├─────────────────────────┤
│  Footer (stacked cols)   │
└─────────────────────────┘
```

Single-column, generous tap targets (min 44px), one decision per screen — mobile users on slow connections shouldn't have to parse a dense grid.

---

## 8. Desktop Layout (≥900px)

```
┌───────────────────────────────────────────────────────────┐
│  LOGO   Features  Pricing  Support  About      [Start Trial]│
├───────────────────────────────────────────────────────────┤
│  Tag                              ┌─────────────────────┐  │
│  HEADLINE (large, 2 lines)        │                      │  │
│  Supporting sentence               │   App screenshot     │  │
│  [Start Trial] [See how it works] │   (mockup, elevated) │  │
│                                    └─────────────────────┘  │
├───────────────────────────────────────────────────────────┤
│         Problem cards (4 across)  →  Solution framing        │
├───────────────────────────────────────────────────────────┤
│   [icon]      [icon]      [icon]                            │
│   Sales       Credit      Inventory     (3-col feature grid) │
│   [icon]      [icon]      [icon]                            │
│   Expenses    Reports     Staff Access                       │
├───────────────────────────────────────────────────────────┤
│   Trust: 4-across icon strip, full-bleed navy band           │
├───────────────────────────────────────────────────────────┤
│   1 ─ dotted ─ 2 ─ dotted ─ 3 ─ dotted ─ 4   (How It Works)  │
├───────────────────────────────────────────────────────────┤
│   [Trial card]   [Professional card ★]   [Renewal note]     │
├───────────────────────────────────────────────────────────┤
│   Support: WhatsApp CTA (left) | FAQ accordion (right)       │
├───────────────────────────────────────────────────────────┤
│                    Final CTA band, centered                  │
├───────────────────────────────────────────────────────────┤
│   Footer: 4-column grid                                      │
└───────────────────────────────────────────────────────────┘
```

---

## 9. Conversion Sections — Strategy Notes

- **One CTA style, repeated verbatim** ("Start Free Trial") at hero, post-features, and final band. Repetition without variation builds pattern recognition — a shop owner shouldn't have to parse whether "Get Started" and "Try Now" are the same action.
- **Problem section precedes feature list.** People don't buy features, they buy relief from a named pain. Naming "customers who owe you money and you can't remember how much" before "credit tracking module" is the actual conversion lever.
- **Trust section sits between features and pricing**, not at the very bottom — it needs to land *before* the person is asked to consider payment, not after.
- **Pricing never leads with "Buy."** The featured card's CTA still reads "Start Free Trial" — the plan comparison is informational, not the conversion point itself. Renewal/upgrade messaging is clearly marked as something that happens *inside the app*, reducing pre-trial friction.
- **Support section functions as a trust close**, not an afterthought — WhatsApp support specifically de-risks the trial decision for a hesitant SME buyer who doesn't want to be stuck with unfamiliar software and no help.

---

## Page Blueprint — Section-by-Section

### HERO
- Eyebrow: "Works fully offline"
- H1: "Run your business without waiting on the internet." *(already live)*
- Subtext: one sentence, plain language, no jargon
- Primary CTA + secondary "See how it works" link
- Screenshot mockup, right-aligned desktop / stacked mobile
- Signature ascending-bars accent, low-opacity, bottom-right of visual

### FEATURES (7 items per brief: Sales, Credit, Debt Collection, Inventory, Expenses, Reports, Offline)
- Section header: "Everything you need to run your day"
- 3-col desktop / 1-col mobile grid
- Each card: icon, name, one-sentence benefit (not a spec list)
- Offline capability gets its own **larger, standalone card or mini-band** below the grid — it's the differentiator, it shouldn't be visually equal to "Reports"

### PROBLEM / SOLUTION
- Two-column desktop layout: muted "problem" list (left) → bold "Bizora fixes this" list (right), line-matched
- Mobile: problem stated, immediately followed by its solution (paired, not two separate stacked lists) so the connection isn't lost when scrolling
- Four pairs per brief: debts owed / lost records / poor stock visibility / manual calculation

### HOW IT WORKS
- Exactly 4 numbered steps per brief: Start Trial → Install → Manage → Upgrade
- This is a genuine sequence, so numerals are earned here (unlike a generic feature list)
- Dotted connector line on desktop, vertical stack with numeral badges on mobile

### TRUST
- Navy full-bleed band (visual break from white sections around it — signals "this is the credibility moment")
- 4 items: Offline-first / Your data stays with your business / Built for SMEs / Works without constant internet
- Icon + bold micro-claim + one supporting line each, equal visual weight

### PRICING
- 3 elements per brief: **Free Trial** (entry card) / **Professional License** (featured, gold border) / **Renewal** (framed as a note under the Professional card, not a separate competing card — renewal isn't a plan choice, it's a continuation)
- No price-anchoring tricks (no fake-crossed-out "was" prices) — plain, honest pricing matches the trustworthy positioning
- CTA on every card still routes to trial/install, never straight to a payment form

### SUPPORT
- WhatsApp CTA as the visually primary element (brand-green button, per Section 4) — fastest path to a human for a hesitant buyer
- FAQ accordion beneath, 4–6 top objections answered in plain language
- Link out to full Help Center / user guides (existing `/pages/support.html`, `/pages/faq.html`)

---

*This document is the reference for all subsequent build work. Component and page files should be built to match these specs exactly; if a build decision requires deviating from this doc, update this doc in the same change rather than letting code and design drift apart.*
