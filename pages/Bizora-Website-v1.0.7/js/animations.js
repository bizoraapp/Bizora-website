/**
 * animations.js
 * ------------------------------------------------------------------
 * SINGLE RESPONSIBILITY: motion and reveal effects only.
 *   - smooth-scroll for in-page anchor links
 *   - IntersectionObserver-based scroll-reveal for sections
 *   - native lazy-loading fallback flag for older browsers
 *
 * Deliberately lightweight: no animation library, no scroll-jacking.
 * Respects prefers-reduced-motion by skipping reveal transitions
 * entirely (content is visible immediately, no motion is disabled
 * mid-way through).
 * ------------------------------------------------------------------
 */

(function () {
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  function initSmoothScroll() {
    document.addEventListener("click", (e) => {
      const link = e.target.closest('a[href^="#"]');
      if (!link) return;
      const targetId = link.getAttribute("href");
      if (targetId.length <= 1) return; // ignore bare "#"

      const target = document.querySelector(targetId);
      if (!target) return;

      e.preventDefault();
      target.scrollIntoView({
        behavior: prefersReducedMotion ? "auto" : "smooth",
        block: "start"
      });
      target.setAttribute("tabindex", "-1");
      target.focus({ preventScroll: true });
    });
  }

  function initScrollReveal() {
    if (prefersReducedMotion) return; // show everything immediately, no reveal

    const revealTargets = document.querySelectorAll(
      ".section, .feature-card, .pricing-card, .trust-item, .step"
    );

    if (!("IntersectionObserver" in window) || revealTargets.length === 0) return;

    revealTargets.forEach((el) => el.classList.add("reveal-init"));

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("reveal-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    revealTargets.forEach((el) => observer.observe(el));
  }

  function init() {
    initSmoothScroll();
    // Reveal init runs after components are injected so it can see them.
    document.addEventListener("component:loaded", initScrollReveal, { once: false });
    // Also run once for content already in the static page (non-component sections).
    initScrollReveal();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
