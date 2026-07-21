/**
 * analytics.js
 * ------------------------------------------------------------------
 * SINGLE RESPONSIBILITY: fire conversion events only.
 *
 * No analytics provider is wired in yet — this file defines WHERE
 * events fire (trial CTA clicks, WhatsApp clicks) without committing
 * to a specific tool. Swap the body of `track()` for your provider
 * of choice (Plausible, GA4, Fathom, etc.) in ONE place, and every
 * call site below keeps working unchanged.
 *
 * Respects Do Not Track: if the browser signals DNT, events are
 * logged to console only, never sent anywhere.
 * ------------------------------------------------------------------
 */

(function () {
  const dntEnabled =
    navigator.doNotTrack === "1" || window.doNotTrack === "1";

  function track(eventName, detail) {
    if (dntEnabled) {
      console.log(`[analytics:dnt-blocked] ${eventName}`, detail || {});
      return;
    }

    // ---- Provider integration point ----
    // Example (Plausible):
    //   if (window.plausible) window.plausible(eventName, { props: detail });
    // Example (GA4):
    //   if (window.gtag) window.gtag('event', eventName, detail);
    //
    // Left unimplemented intentionally until a provider is chosen.
    console.log(`[analytics] ${eventName}`, detail || {});
  }

  function initTracking() {
    document.body.addEventListener("click", (e) => {
      const trialLink = e.target.closest('[data-config-href="urls.trial"]');
      if (trialLink) {
        track("trial_cta_click", { location: trialLink.closest("section")?.className || "unknown" });
        return;
      }

      const whatsappLink = e.target.closest('[data-config-href="contact.whatsapp"]');
      if (whatsappLink) {
        track("whatsapp_click");
      }
    });
  }

  document.addEventListener("DOMContentLoaded", initTracking);
})();
