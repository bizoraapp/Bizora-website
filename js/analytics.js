/**
 * analytics.js
 * ------------------------------------------------------------------
 * SINGLE RESPONSIBILITY: privacy-conscious website measurement.
 *
 * Design rules enforced here:
 *   1. Configuration lives ONLY in config/site-config.js. No measurement ID
 *      appears in any HTML page or anywhere else in this file.
 *   2. If no measurement ID is configured, NO third-party script loads, NO
 *      cookies are set, and nothing leaves the browser. Events go to the
 *      console so the taxonomy can still be verified in development.
 *   3. Analytics can never break the site. Every entry point is wrapped, and
 *      failure (blocked script, offline, ad-blocker) is silent and harmless.
 *   4. NO personal data is ever sent. Paths are sanitized: query strings and
 *      hash fragments are stripped, so nothing user-identifying can leak via
 *      the URL. Only a small fixed set of parameters is permitted.
 *   5. This layer is completely separate from the Bizora application. It does
 *      not read LocalStorage, IndexedDB, or any business data. Ever.
 *
 * Event taxonomy (deliberately small):
 *   page_view          - one per page load
 *   trial_cta_click    - Start Free Trial
 *   support_cta_click  - WhatsApp / email / phone
 *   pricing_cta_click  - monthly / annual plan CTAs
 *   navigation_click   - primary nav links
 *   faq_question_open  - FAQ accordion opened (category only, never text)
 * ------------------------------------------------------------------
 */

(function () {
  "use strict";

  // ---- Configuration (single source of truth) ----
  var cfg = (typeof SiteConfig !== "undefined" && SiteConfig.analytics) || {};
  var MEASUREMENT_ID = cfg.measurementId || null;
  var ENABLED = Boolean(MEASUREMENT_ID) && cfg.provider === "ga4";

  // ---- Do Not Track ----
  var dnt =
    navigator.doNotTrack === "1" ||
    window.doNotTrack === "1" ||
    navigator.msDoNotTrack === "1";

  // ---- Parameter allow-list: nothing outside this set is ever transmitted ----
  var ALLOWED_PARAMS = ["page", "location", "cta", "channel", "category"];

  /** Strip query + hash so no user data can leak through the URL. */
  function safePath() {
    try {
      return cfg.sanitizePaths === false
        ? window.location.pathname + window.location.search
        : window.location.pathname;
    } catch (e) {
      return "/";
    }
  }

  /** Drop any parameter not on the allow-list, and coerce values to strings. */
  function sanitize(params) {
    var out = {};
    if (!params) return out;
    ALLOWED_PARAMS.forEach(function (key) {
      if (params[key] !== undefined && params[key] !== null) {
        out[key] = String(params[key]).slice(0, 100);
      }
    });
    return out;
  }

  /** Load GA4 once, asynchronously. Never blocks rendering.
   *  Skipped entirely under Do Not Track — loading gtag.js would set cookies
   *  even if no events were subsequently sent, so the script must not load. */
  var loaded = false;
  function loadProvider() {
    if (loaded || !ENABLED || dnt) return;
    loaded = true;
    try {
      var s = document.createElement("script");
      s.async = true;
      s.src = "https://www.googletagmanager.com/gtag/js?id=" + MEASUREMENT_ID;
      s.onerror = function () {
        /* blocked or offline — site continues normally */
      };
      document.head.appendChild(s);

      window.dataLayer = window.dataLayer || [];
      window.gtag = function () { window.dataLayer.push(arguments); };
      window.gtag("js", new Date());
      // send_page_view is disabled here; page views are sent explicitly below
      // so there is exactly one per page load and the path is sanitized.
      window.gtag("config", MEASUREMENT_ID, {
        send_page_view: false,
        anonymize_ip: true
      });
    } catch (e) {
      /* never surface analytics failures to the user */
    }
  }

  /** Central send function — the only place an event leaves this file. */
  function track(eventName, params) {
    var payload = sanitize(params);
    payload.page = payload.page || safePath();

    if (dnt || !ENABLED) {
      // Not transmitted. Logged so the taxonomy is verifiable in development.
      if (window.console && console.debug) {
        console.debug(
          "[analytics:" + (dnt ? "dnt" : "not-configured") + "]",
          eventName,
          payload
        );
      }
      return;
    }

    try {
      if (typeof window.gtag === "function") window.gtag("event", eventName, payload);
    } catch (e) {
      /* silent */
    }
  }

  // Expose a minimal helper for any future call site. No other analytics
  // utility should be created.
  window.BizoraAnalytics = { track: track };

  // ---- Page view: exactly one per page load ----
  var pageViewSent = false;
  function sendPageView() {
    if (pageViewSent) return;
    pageViewSent = true;
    track("page_view", { page: safePath() });
  }

  /** Derive a coarse location label — section name, never user content. */
  function locationOf(el) {
    try {
      var section = el.closest("section, nav, footer");
      if (!section) return "unknown";
      if (section.tagName === "NAV") return "navbar";
      if (section.tagName === "FOOTER") return "footer";
      var id = section.getAttribute("id");
      if (id) return id;
      var cls = (section.className || "").split(" ")[0];
      return cls || "section";
    } catch (e) {
      return "unknown";
    }
  }

  function initTracking() {
    // Delegated click handling — one listener for the whole document.
    document.addEventListener("click", function (e) {
      var el = e.target && e.target.closest ? e.target.closest("[data-cta], nav a") : null;
      if (!el) return;

      var cta = el.getAttribute("data-cta");

      if (cta === "trial") {
        track("trial_cta_click", { location: locationOf(el), cta: "trial" });
      } else if (cta === "support-whatsapp") {
        track("support_cta_click", { location: locationOf(el), channel: "whatsapp" });
      } else if (cta === "support-email") {
        track("support_cta_click", { location: locationOf(el), channel: "email" });
      } else if (cta === "support-phone") {
        track("support_cta_click", { location: locationOf(el), channel: "phone" });
      } else if (cta === "monthly" || cta === "annual") {
        track("pricing_cta_click", { location: locationOf(el), cta: cta });
      } else if (!cta && el.closest("nav")) {
        // Primary navigation only. Uses the link's own text, which is a fixed
        // label from the navbar component — never user-entered content.
        var label = (el.textContent || "").trim().slice(0, 40);
        if (label) track("navigation_click", { location: "navbar", cta: label });
      }
    });

    // FAQ accordions: record the CATEGORY only, never the question text.
    document.addEventListener(
      "toggle",
      function (e) {
        var d = e.target;
        if (!d || d.tagName !== "DETAILS" || !d.open) return;
        var group = d.closest(".faq-group");
        var category = group ? group.getAttribute("id") || "faq" : "faq";
        track("faq_question_open", { category: category });
      },
      true // capture: the toggle event does not bubble
    );
  }

  function init() {
    loadProvider();
    sendPageView();
    initTracking();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
