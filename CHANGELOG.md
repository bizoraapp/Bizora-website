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
