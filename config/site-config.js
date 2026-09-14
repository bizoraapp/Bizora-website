/**
 * site-config.js
 * ------------------------------------------------------------------
 * SINGLE SOURCE OF TRUTH for site-wide values.
 *
 * Rule: Never hardcode a URL, contact detail, or brand string directly
 * inside a component or page. Reference SiteConfig instead.
 * Changing a trial link, support email, etc. should require editing
 * ONLY this file.
 *
 * Loaded as a plain global (window.SiteConfig) so it can be used from
 * any page without a build step or module bundler.
 * ------------------------------------------------------------------
 */

const SiteConfig = {
  brand: {
    name: "Bizora",
    tagline: "Take control of sales, inventory and customer debts — even offline.",
    logo: "/assets/logos/bizora-logo.28e13026.png",
    logoAlt: "Bizora logo"
  },

  // The MARKETING site's own domain — confirmed live and publicly accessible.
  siteUrl: "https://www.bizora-cm.com",

  urls: {
    home: "/index.html",
    // Confirmed: the live Bizora PWA is hosted here.
    trial: "https://bizora-cm.netlify.app/",
    pwaInstall: "https://bizora-cm.netlify.app/",
    login: "https://bizora-cm.netlify.app/login"
  },

  // ---- Commercial / licensing values ----
  // IMPORTANT: these drive what is publicly displayed on pages/pricing.html.
  // Update HERE only — never hardcode a price into a page.
  // ---- Commercial / licensing values ----
  // SINGLE SOURCE OF TRUTH for every price shown anywhere on the site
  // (homepage pricing component AND pages/pricing.html both read from here).
  // Never hardcode a price or currency into HTML.
  //
  // Bizora's market is Central/West Africa — currency is CFA, never Naira.
  //
  // Plans differ by LICENSING PERIOD ONLY. All plans provide the same product
  // functionality; do not introduce feature gates that the product does not
  // actually enforce.
  pricing: {
    currency: "CFA",
    trial: {
      label: "Free Trial",
      amount: "Free",
      period: "for 30 days",
      // Confirmed trial length. Any copy stating a duration must read from
      // here rather than hardcoding a number.
      durationDays: 30,
      status: "confirmed"
    },
    monthly: {
      label: "Monthly License",
      price: 3000,
      amount: "3,000 CFA",
      period: "per month",
      status: "confirmed"
    },
    annual: {
      label: "Annual License",
      price: 12000,
      amount: "12,000 CFA",
      period: "per year",
      status: "confirmed"
    },
    // No payment/checkout URL exists yet. Paid-plan CTAs therefore route to the
    // existing contact pathway (WhatsApp) rather than an invented checkout link.
    purchaseUrl: null
  },

  // ---- Analytics ----
  // Centralized so the measurement ID lives in exactly one place.
  //
  // provider: "ga4" is the only supported value today. Set to null to disable
  // analytics entirely.
  //
  // measurementId: ACTIVE as of 2026-09-14 (GA4 property "Bizora Website").
    // js/analytics.js loads gtag.js, respects Do Not Track, anonymizes IP,
    // and sends only page_view + the fixed CTA/engagement event taxonomy
    // defined there — no PII, no business data.
    //
    // PRIVACY NOTE: GA4 sets cookies. No cookie-consent banner exists yet.
    // This was enabled deliberately without one because the target market
    // (Cameroon / CEMAC) is not subject to EU/UK prior-consent rules. If
    // meaningful EU/UK traffic appears, add a consent mechanism before
    // relying on this further.
  analytics: {
    provider: "ga4",
    measurementId: "G-K8X7E75MK6",
    // Strips query strings and hash fragments from the reported page path so
    // no user-identifying data can leak into analytics via the URL.
    sanitizePaths: true
  },

  contact: {
    supportEmail: "ngwelesleymbom@gmail.com",
    salesEmail: "ngwelesleymbom@gmail.com",
    phone: "+237 670 615 459",
    // URI-ready variants. The component loader assigns [data-config-href]
    // straight into href, so link values must be complete URIs — the display
    // strings above (with spaces) are not valid inside tel:/mailto:.
    phoneTel: "tel:+237670615459",
    emailHref: "mailto:ngwelesleymbom@gmail.com",
    // Assumed same country code (+237) as the call number provided —
    // confirm if the WhatsApp number is different from the call number.
    whatsapp: "https://wa.me/237670615459"
  },

  // Verified accounts. Bizora has no Twitter/X or LinkedIn presence — do not
  // add links for platforms without a real account.
  social: {
    tiktok: "https://tiktok.com/@bizora.cm",
    facebook: "https://facebook.com/Bizora.cm",
    instagram: "https://instagram.com/bizora.cm"
  },

  nav: {
    // Primary CTA copy: shown wherever the CTA specifically asks the visitor
    // to download/get Bizora (data-config-text="nav.primaryCtaLabel").
    primaryCtaLabel: "DOWNLOAD NOW — 30 DAYS FREE",
    // Secondary CTA copy: a shorter, contextual variant used only where a
    // trial CTA is intentionally de-emphasized next to another primary
    // action on the same section (data-config-text="nav.secondaryCtaLabel").
    // Keeps the same "30 DAYS FREE" core phrase as the primary label.
    secondaryCtaLabel: "GET BIZORA — 30 DAYS FREE",
    links: [
      { label: "Home", href: "/index.html" },
      { label: "Features", href: "/pages/features.html" },
      { label: "Pricing", href: "/pages/pricing.html" },
      { label: "Support", href: "/pages/support.html" },
      { label: "FAQ", href: "/pages/faq.html" },
      { label: "About", href: "/pages/about.html" }
    ]
  },

  seo: {
    defaultTitle: "Bizora — Offline Business Management for African SMEs",
    defaultDescription:
      "Bizora helps small businesses manage sales, inventory, customer debts and daily operations from one simple offline-first system.",
    ogImage: "/assets/images/og-cover.6e3fe7b6.png"
  }
};

// Freeze to prevent accidental mutation from any page script.
Object.freeze(SiteConfig);
Object.freeze(SiteConfig.brand);
Object.freeze(SiteConfig.urls);
Object.freeze(SiteConfig.contact);
Object.freeze(SiteConfig.social);
Object.freeze(SiteConfig.nav);
Object.freeze(SiteConfig.seo);
Object.freeze(SiteConfig.analytics);
Object.freeze(SiteConfig.pricing);
Object.freeze(SiteConfig.pricing.trial);
Object.freeze(SiteConfig.pricing.monthly);
Object.freeze(SiteConfig.pricing.annual);
