/**
 * navigation.js
 * ------------------------------------------------------------------
 * SINGLE RESPONSIBILITY: navbar behavior only
 *   - mobile menu open/close
 *   - closing menu on link click / outside click
 *   - marking the active page link
 *
 * Listens for "component:loaded" (dispatched by main.js) instead of
 * DOMContentLoaded, because the navbar markup doesn't exist in the
 * DOM until main.js has fetched and injected it.
 * ------------------------------------------------------------------
 */

(function () {
  function setActiveLink(navRoot) {
    var path = window.location.pathname.replace(/\/index\.html$/, "/");
    var isHome = path === "/" || path === "";

    navRoot.querySelectorAll("a[href]").forEach(function (link) {
      var href = link.getAttribute("href");
      // Skip anchors and external links (e.g. the trial CTA, which is
      // rewritten to an absolute URL from site-config).
      if (!href || href.charAt(0) === "#" || /^https?:/i.test(href)) return;

      var linkPath = href.replace(/\/index\.html$/, "/");
      var match = linkPath === "/"
        ? isHome                                   // Home only on the homepage
        : path.endsWith(linkPath.replace(/^\//, ""));

      if (match) {
        link.classList.add("is-active");
        link.setAttribute("aria-current", "page");
      }
    });
  }

  function initNavbar(navRoot) {
    const toggle = navRoot.querySelector(".navbar__toggle");
    const panel = navRoot.querySelector(".navbar__mobile-panel");
    if (!toggle || !panel) return;

    toggle.addEventListener("click", () => {
      const isOpen = panel.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(isOpen));
    });

    panel.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        panel.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });

    document.addEventListener("click", (e) => {
      if (!navRoot.contains(e.target)) {
        panel.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });

    setActiveLink(navRoot);
  }

  document.addEventListener("component:loaded", (e) => {
    if (e.detail.name === "navbar") {
      initNavbar(e.detail.el);
    }
  });
})();
