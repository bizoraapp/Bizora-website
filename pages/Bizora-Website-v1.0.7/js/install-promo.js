/**
 * install-promo.js
 * ------------------------------------------------------------------
 * SINGLE RESPONSIBILITY: show/hide the trial-promo corner card.
 *
 * Trigger: BOTH conditions must be true —
 *   - at least 12 seconds have elapsed on the page, AND
 *   - the visitor has scrolled to roughly 75% of the page's scrollable
 *     height (pages that don't scroll at all count as already past this).
 *
 * Neither condition alone is enough. This intentionally replaces an earlier
 * "whichever happens first" version at 50%/8s, which could interrupt a
 * visitor mid-read on the homepage's "How It Works" section on mobile.
 *
 * Shown AT MOST ONCE PER BROWSER SESSION (sessionStorage) — once shown,
 * it will not reappear on this page or any other page for the rest of the
 * session, dismissed or not.
 *
 * Reuses the existing BizoraAnalytics helper (js/analytics.js) rather than
 * creating a new tracking mechanism. The CTA itself is tracked automatically
 * by analytics.js's existing delegated listener via data-cta="trial".
 * ------------------------------------------------------------------
 */

(function () {
  "use strict";

  var SCROLL_THRESHOLD = 0.75;  // fraction of scrollable height
  var MIN_TIME_MS = 12000;      // minimum time on page before it may appear
  var STORAGE_KEY = "bizora_install_promo_shown";

  var el = null;
  var shown = false;
  var timeElapsed = false;

  function track(name, params) {
    if (window.BizoraAnalytics) window.BizoraAnalytics.track(name, params);
  }

  function alreadyShownThisSession() {
    try {
      return window.sessionStorage.getItem(STORAGE_KEY) === "1";
    } catch (e) {
      return false; // storage unavailable (private mode, etc.) — fail open
    }
  }

  function markShownThisSession() {
    try {
      window.sessionStorage.setItem(STORAGE_KEY, "1");
    } catch (e) {
      /* ignore — worst case it may show again this session */
    }
  }

  function scrollFraction() {
    var doc = document.documentElement;
    var max = doc.scrollHeight - doc.clientHeight;
    // A page that doesn't scroll has already shown 100% of its content.
    if (max <= 0) return 1;
    return (window.scrollY || doc.scrollTop) / max;
  }

  function reveal() {
    if (shown) return;
    shown = true;
    markShownThisSession();
    el.hidden = false;
    // Next frame, so the transition animates from the hidden state instead
    // of snapping straight to visible.
    window.requestAnimationFrame(function () {
      el.classList.add("install-promo--visible");
    });
    track("install_promo_shown", { location: "install-promo" });
    window.removeEventListener("scroll", onScroll);
  }

  function maybeReveal() {
    if (shown || !timeElapsed) return;
    if (scrollFraction() >= SCROLL_THRESHOLD) reveal();
  }

  function onScroll() {
    maybeReveal();
  }

  function dismiss() {
    if (!el) return;
    el.classList.remove("install-promo--visible");
    window.setTimeout(function () { el.hidden = true; }, 320);
    track("install_promo_dismissed", { location: "install-promo" });
    window.removeEventListener("scroll", onScroll);
  }

  function init(root) {
    el = root.querySelector("#install-promo");
    if (!el) return;

    // Already shown earlier this session — do not attach any listeners or
    // timers on this page at all.
    if (alreadyShownThisSession()) return;

    var closeBtn = el.querySelector(".install-promo__close");
    if (closeBtn) closeBtn.addEventListener("click", dismiss);

    window.addEventListener("scroll", onScroll, { passive: true });
    window.setTimeout(function () {
      timeElapsed = true;
      maybeReveal(); // covers the case where the visitor already scrolled
                      // past the threshold before the 12s mark was reached
    }, MIN_TIME_MS);
  }

  document.addEventListener("component:loaded", function (e) {
    if (e.detail.name === "install-promo") init(e.detail.el);
  });
})();
