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
    logo: "/assets/logos/bizora-logo.png",
    logoAlt: "Bizora logo"
  },

  // The MARKETING site's own domain — NOT the app. Still a placeholder until
  // this website itself is deployed somewhere (its own Netlify site or a
  // custom domain like bizora.co). Used for OG tags, canonical URL, sitemap.
  siteUrl: "https://bizora.co",

  urls: {
    home: "/index.html",
    // Confirmed: the live Bizora PWA is hosted here.
    trial: "https://bizora-cm.netlify.app/",
    pwaInstall: "https://bizora-cm.netlify.app/",
    login: "https://bizora-cm.netlify.app/login"
  },

  contact: {
    supportEmail: "ngwelesleymbom@gmail.com",
    salesEmail: "ngwelesleymbom@gmail.com",
    phone: "+237 670 615 459",
    // Assumed same country code (+237) as the call number provided —
    // confirm if the WhatsApp number is different from the call number.
    whatsapp: "https://wa.me/237670615459"
  },

  social: {
    facebook: "https://facebook.com/bizoraapp",
    twitter: "https://twitter.com/bizoraapp",
    instagram: "https://instagram.com/bizoraapp",
    linkedin: "https://linkedin.com/company/bizora"
  },

  nav: {
    primaryCtaLabel: "Start Free Trial",
    links: [
      { label: "Features", href: "/pages/features.html" },
      { label: "Pricing", href: "/pages/pricing.html" },
      { label: "Support", href: "/pages/support.html" },
      { label: "About", href: "/pages/about.html" }
    ]
  },

  seo: {
    defaultTitle: "Bizora — Offline Business Management for African SMEs",
    defaultDescription:
      "Bizora helps small businesses manage sales, inventory, customer debts and daily operations from one simple offline-first system.",
    ogImage: "/assets/images/og-cover.jpg"
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
