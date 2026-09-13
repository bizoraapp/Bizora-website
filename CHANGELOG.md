# Bizora Website — Changelog

Versioning starts here, at the current live state, as agreed. Everything before
this point was built incrementally across many sessions without formal version
numbers — this file is the source of truth going forward.

**How to tell which version is deployed:** view-source on any live page and
check the `<meta name="site-version">` tag in `<head>`, or check the `VERSION`
file at the project root.

**Version scheme:** `MAJOR.MINOR.PATCH`
- **PATCH** (1.0.**1**) — bug fixes, copy corrections, image swaps, no new pages/sections
- **MINOR** (1.**1**.0) — new pages, new sections, new features added
- **MAJOR** (**2**.0.0) — redesign, restructure, or anything that changes the site's architecture

---

## [1.0.7] — 2026-09-12 — Homepage hero: WhatsApp contact prompt

Classified as PATCH: one small addition to the existing hero section, no new
pages, no redesign, reuses the site's existing WhatsApp destination and
tracking category.

**Changed:**
- `components/hero.html` — added a low-emphasis "Have questions? 💬 Chat
  with us on WhatsApp →" link directly under the hero CTA's supporting
  copy, so visitors who aren't ready to download can still reach Bizora.
  Wrapped it with the existing trust-line paragraphs in a new
  `.hero__extra` container (tightens the spacing between them so the
  addition doesn't push hero content further down the page).
- `css/components.css` — added `.hero__extra`, `.hero__whatsapp`, and
  `.hero__whatsapp-link` rules. The link is deliberately styled as plain
  text (WhatsApp green, no fill/border) rather than a button, so it stays
  visually secondary to the primary download CTA; padding + min-height
  keep it comfortably tappable on mobile.

**Reused, not duplicated:**
- Destination: `SiteConfig.contact.whatsapp` (`https://wa.me/237670615459`)
  — the same value already used by the footer, support page, and FAQ
  "Contact Support" links. No new number or WhatsApp URL was introduced.
- Analytics: the existing `data-cta="support-whatsapp"` attribute, so this
  link reports through the same tracking category as every other
  WhatsApp CTA on the site.

**Explicitly not changed:** trial logic, download/install functionality,
pricing, license logic, the footer WhatsApp link, any other page or
section, SEO structure, or unrelated CSS.

## [1.0.6] — 2026-09-12 — CTA copy overhaul: "30 Days Free" offer messaging

Classified as PATCH: CTA button copy and one supporting line, no new pages,
no redesign, no changes to trial logic, pricing, or destinations.

**Changed:**
- `config/site-config.js` — `nav.primaryCtaLabel` updated from
  "Start 30-Day Trial" to "DOWNLOAD NOW — 30 DAYS FREE"; new
  `nav.secondaryCtaLabel` field added ("GET BIZORA — 30 DAYS FREE") for
  buttons intentionally styled as secondary next to another primary CTA.
  Both values are the single source driving every trial CTA button
  sitewide via the existing `data-config-text` binding.
- 17 primary-styled trial CTA buttons across `components/navbar.html`,
  `components/hero.html`, `components/pricing.html`,
  `components/how-it-works.html`, `components/install-promo.html`,
  `index.html`, and `pages/{faq,about,features,pricing,support}.html` —
  literal fallback text updated to match the new config value.
- 3 secondary-styled trial CTA buttons (`pages/faq.html` bottom CTA,
  `pages/support.html` hero and final CTA) switched to the new
  `nav.secondaryCtaLabel` binding.
- `components/hero.html` — added one supporting line under the homepage
  hero buttons: "No payment. No credit card. No sign-up required to get
  started."
- Site-version meta tag bumped to 1.0.6 across all 7 HTML files.

**Explicitly not changed:** trial duration/activation logic, pricing,
licensing/payment flow, CTA destinations (`urls.trial`) or `data-cta`
analytics attributes, paid-plan CTAs ("Get the Monthly/Annual License"),
"Contact Support"/WhatsApp/email/phone CTAs, the footer "Install the app"
link, JSON-LD, and CSP configuration.

## [1.0.5] — 2026-09-12 — SEO Phase 2: FAQPage schema + sub-page entity signals

Classified as PATCH: structured-data additions and a CSP allowlist update, no
new pages, no redesign, no copy changes.

**Changed:**
- `pages/faq.html` — added `FAQPage` JSON-LD, combined into one `@graph` with
  `Organization` + `WebSite`. Covers all 37 existing visible Q&A pairs,
  extracted programmatically from the live `<details>/<summary>` markup and
  verified 1:1 against the schema (same order, same wording) — no questions
  or answers invented, no existing FAQ copy touched. Bold text and inline
  links in answers are expressed as plain text in the schema's `text` field.
- `pages/features.html`, `pages/pricing.html`, `pages/support.html`,
  `pages/about.html` — added the homepage's existing `Organization` +
  `WebSite` JSON-LD. Same `@id`s, same field values as `index.html`, reused
  rather than reinvented. `SoftwareApplication` and the pricing `AggregateOffer`
  deliberately excluded — that node describes the app, not these pages.
- `netlify.toml` — `script-src` extended with two new SHA-256 hashes so the
  new inline JSON-LD isn't silently dropped by the browser: one shared hash
  for the four identical Organization+WebSite-only blocks, one for
  `faq.html`'s larger block (which also carries `FAQPage`). Explanatory
  comment above the header rewritten to document all three hashes now in
  use and which file(s) each one covers. Existing homepage hash unchanged.
- Version bump: `VERSION` and the `site-version` meta tag on all 7 HTML files
  (`index.html`, `404.html`, and the 5 `pages/*.html`) updated to `1.0.5`.

**Not changed:** canonical tags, `sitemap.xml`, `robots.txt`, internal
nav/footer links (and their current URL form), H1s, page titles, meta
descriptions, offline-capability copy anywhere on the site (hero badge,
trust section, pricing bullets, sticky widget), About page trust content,
image alt text, CSS, JS, homepage body content, the homepage's
`SoftwareApplication`/`AggregateOffer` JSON-LD.

**Deliberately deferred** (see the SEO Phase 2 investigation report, not
touched in this release): the extensionless-internal-link vs.
`.html`-canonical inconsistency across the 5 sub-pages; offline-claim
phrasing consistency between the qualified long-form explanations and the
shorter unqualified badges/bullets; About-page trust signals; meta
description length on Features/About; mobile and performance validation.

---

## [1.0.4] — 2026-09-12 — Google Search Console verification

Classified as PATCH: single meta tag addition, no content or structural change.

**Changed:**
- `index.html` — added `<meta name="google-site-verification" content="ksNt4v2_no3cqdTbx4bJWMt_zv9JGCyiOZxBIgLgulE" />` to `<head>`, immediately after the existing `site-version` tag. This is Google's HTML-tag verification method for the Search Console property `https://www.bizora-cm.com/`, created under `lesleymbommbom@gmail.com`.

**Deliberately scoped to the homepage only** — Google's HTML-tag verification only checks the exact URL registered as the property (the homepage), so the tag was not added to the other 6 pages. Adding it everywhere would be unnecessary duplication.

**Not changed:** CSP hash (a `<meta>` tag isn't a script and has no effect on `script-src`), all other metadata, CSS, JS, sitemap, robots.txt.

**Next step (not part of this change):** once this version is deployed, return to Search Console and click **Verify**, then submit `sitemap.xml`.

---

## [1.0.3] — 2026-09-11 — SEO foundation: structured data, LCP fix, local relevance

Classified as PATCH: metadata/structured-data additions and a measured
performance-hint fix, no new pages, no redesign.

**Changed:**
- `index.html` JSON-LD — added `Organization` and `WebSite` schema, linked to
  the existing `SoftwareApplication` via `@id`/`publisher` relationships.
  Uses only verified facts: real name, real logo, real social handles already
  in `config/site-config.js` (TikTok, Facebook, Instagram), and `areaServed:
  "Cameroon"` (the site's actual established market). No fabricated address,
  founding date, employee count, ratings, or reviews.
- `netlify.toml` — CSP hash recomputed and verified byte-for-byte against the
  new JSON-LD content (old hash would have silently blocked the updated
  structured data)
- `components/hero.html` — `fetchpriority="high"` moved from the dashboard
  screenshot to the real photo. This wasn't a guess: I measured the actual
  LCP element via the Performance API at desktop viewport and found the hint
  was on the wrong image
- `components/trust.html` — "African businesses" → "businesses in Cameroon"
  in the trust band header. Confirmed "Cameroon" appeared zero times anywhere
  on the homepage despite being the site's real market
- `index.html` — "Point of Sale" → "Point of Sale (POS)" in the features grid
  (confirmed the exact term "POS" appeared zero times in raw HTML); added 3
  contextual internal links (FAQ, About, Support) near the final CTA —
  confirmed homepage body content had only 3 internal links total before this

**Known limitation, documented rather than fixed:** `index.html` has no
`<h1>` in its raw, unrendered HTML — the homepage's H1 lives inside
`components/hero.html`, fetched by JavaScript at runtime. This is a real,
measured SEO gap (confirmed via direct inspection), but fixing it properly
means restructuring how the hero loads, which conflicts with this phase's
explicit "do not redesign / do not rewrite JS unnecessarily" constraints.
Logged as a future opportunity, not fixed here.

**Not changed:** CSS, JS (all 8 files confirmed byte-identical to the
pre-phase checkpoint), sitemap.xml, robots.txt, canonical tags, the app URL
(`bizora-cm.netlify.app`), trial CTA destination, `AggregateOffer` pricing
data.

---

## [1.0.2] — 2026-09-11 — Domain migration to www.bizora-cm.com

Classified as PATCH: infrastructure/configuration change, no new pages, no
content or design changes.

**Canonical host changed:** `bizora-cm.com` → `https://www.bizora-cm.com`
(permanent production domain, now purchased and live).

**Changed (32 references across 9 files):**
- `config/site-config.js` — `siteUrl`
- Canonical tag, `og:url`, `og:image`, `twitter:image` on all 6 indexable pages
- `sitemap.xml` — all 6 `<loc>` entries
- `robots.txt` — `Sitemap:` declaration
- `netlify.toml` — added two 301 redirect rules (old temp Netlify subdomain →
  www, bare apex `bizora-cm.com` → www), both single-hop, no chains

**Deliberately NOT changed:**
- JSON-LD `url` field — describes the Bizora **app** (`bizora-cm.netlify.app`),
  not this marketing site; correctly left untouched
- CSP hash in `netlify.toml` — JSON-LD content didn't change, so the hash
  doesn't need recomputing (verified byte-for-byte match)
- `urls.trial` / `urls.pwaInstall` / `urls.login` — all point to the app,
  unaffected by the marketing site's domain
- CSS, JS — confirmed byte-identical to the pre-migration checkpoint
- Internal navigation links — already relative paths, nothing to convert

**Known discrepancy in the migration brief:** the brief referenced a
"v1.1.0 package" with "Phase 1 technical SEO" already completed (Organization/
WebSite JSON-LD schemas) and a prior temporary URL of
`guileless-shortbread-d1264b.netlify.app`. Neither matched the actual v1.0.1
package this migration was performed against — audited and confirmed absent
before proceeding (see migration report). The redirect rule for that Netlify
subdomain was added as instructed but is unverified — see Remaining Live
Checks.

---

## [1.0.1] — 2026-08-29 — Homepage copy upgrade

New hero/homepage copy applied throughout, per approved marketing copy document.
Structure unchanged — same sections, same order, same component files. Content
only.

**Changed:**
- Hero: new headline ("Know exactly what your shop made today as profit."),
  new subheadline, added a trust line beneath the CTAs (new element, explicitly
  requested by the copy brief)
- Problem/solution: new section header; 4 of 5 problem/solution pairs rewritten
  with more specific, scene-based language (the receipts pair was left
  unchanged — the new copy didn't address it)
- Features grid: new section header ("Same habit. Better memory.")
- Offline messaging (feature card + trust band): added the "no data bundle"
  point. Kept the existing connectivity qualifier (install/updates/support/
  payment still need internet) rather than dropping it — the new copy's
  phrasing risked reading as an absolute "never needs internet" claim, which
  this site has deliberately avoided everywhere else
- How It Works: new section header, steps 1 and 3 copy tightened (still 4
  steps — none added or removed)
- Homepage FAQ: 3 existing answers rewritten; added one new item ("What if my
  phone or computer is lost or damaged?") — the copy brief explicitly flagged
  this as essential ("do not skip this question"). Answered using the
  already-established backup/restore facts from pages/faq.html, not new claims
- Final CTA: new headline, new body copy, added a reassurance line beneath
  the button (new element, explicitly requested)

**Not changed:** trial CTA destination, page/section order, any pricing,
any product claims not present in the source copy document, receipts pair,
staff/devices FAQ answers, feature card blurbs (7 cards left as-is to avoid
duplicating language already used in the updated problem/solution section).

---

## [1.0.0] — 2026-08-28 — Baseline

The first formally versioned snapshot. Established as the baseline rather than
reconstructed retroactively, per the decision to version from here forward.

**Site structure:** 6 public pages (Home, Features, Pricing, Support, FAQ,
About) + 404, built as a vanilla HTML/CSS/JS static site with a component
loader for shared navbar/footer/hero elements.

**Included at this baseline:**
- Full homepage: hero, problem/solution, features grid, trust band, how-it-works,
  pricing, support/FAQ, install-promo popup
- Features page with 8 product screenshots (6 desktop browser mockups,
  2 phone mockups), each cropped for legibility (sidebar removed from desktop
  shots, KPI-focused crop on the hero composite)
- Pricing page with Free Trial / Monthly (3,000 CFA) / Annual (12,000 CFA)
  plans, comparison table, licensing steps, renewal-via-Selar explanation
- FAQ (11 categories, 37 questions), Support, and About pages
- Centralized configuration (`config/site-config.js`) — trial URL, contact
  details, pricing, analytics settings, all in one place
- Security headers in `netlify.toml`: CSP (hash-based, no `unsafe-inline` for
  scripts), HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy
- Content-hashed asset filenames for safe long-term caching
- `no-cache` on `/components/*` so component updates (navbar/footer/hero)
  go live immediately on deploy, not after up to an hour of stale caching
- Analytics helper (`js/analytics.js`) wired to GA4, currently dormant
  (no measurement ID set) — privacy-conscious, DNT-aware, PII-stripped
- Domain references set to `bizora-cm.com` (not yet connected/purchased
  at time of this baseline)

**Known open items carried into this baseline** (not blockers, tracked for
future versions):
- Custom domain not yet connected (site currently lives on a Netlify subdomain)
- GA4 measurement ID not yet set — analytics implemented but inactive
- Google Search Console not yet registered
- Trial length (30 days) stated on-site — worth confirming it matches the
  app's actual enforcement
- CSP has not been validated against a real deployed instance in a live
  browser (only tested locally without Netlify's headers applied)

---

## [Unreleased]

_Future changes will be logged here before being versioned._
