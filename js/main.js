/**
 * main.js
 * ------------------------------------------------------------------
 * SINGLE RESPONSIBILITY: load and inject HTML components via fetch.
 *
 * Usage in any page:
 *   <div data-component="navbar"></div>
 *   <div data-component="footer"></div>
 *
 * This script finds every [data-component] placeholder, fetches the
 * matching file from /components/, and injects it in place.
 * After injection it dispatches a "component:loaded" event so other
 * scripts (navigation.js, animations.js) can safely attach behavior
 * without racing the DOM injection.
 *
 * Do NOT add navigation, analytics, or animation logic here.
 * This file only ever handles loading + injecting markup.
 * ------------------------------------------------------------------
 */

(function () {
  const COMPONENTS_PATH = "/components/";

  async function loadComponent(el) {
    const name = el.getAttribute("data-component");
    if (!name) return;

    try {
      const response = await fetch(`${COMPONENTS_PATH}${name}.html`);
      if (!response.ok) throw new Error(`Failed to load component: ${name}`);
      const html = await response.text();
      el.innerHTML = html;
      el.setAttribute("data-component-loaded", name);
      bindConfigValues(el);

      document.dispatchEvent(
        new CustomEvent("component:loaded", { detail: { name, el } })
      );
    } catch (err) {
      // Fail quietly per-component so one broken include never takes
      // down the rest of the page.
      console.error(`[main.js] ${err.message}`);
      el.innerHTML = "";
    }
  }

  /**
   * Resolves [data-config-href] / [data-config-text] attributes against
   * SiteConfig, e.g. data-config-href="urls.trial" -> SiteConfig.urls.trial.
   * This is what keeps trial links, contact info, etc. defined in exactly
   * one place (config/site-config.js) while still living in static HTML.
   */
  function resolvePath(path) {
    if (typeof SiteConfig === "undefined") return null;
    return path.split(".").reduce((obj, key) => (obj ? obj[key] : undefined), SiteConfig);
  }

  function bindConfigValues(root) {
    root.querySelectorAll("[data-config-href]").forEach((el) => {
      const value = resolvePath(el.getAttribute("data-config-href"));
      if (value) el.setAttribute("href", value);
    });
    root.querySelectorAll("[data-config-text]").forEach((el) => {
      const value = resolvePath(el.getAttribute("data-config-text"));
      if (value) el.textContent = value;
    });

    const yearEl = root.querySelector("#footer-year");
    if (yearEl) yearEl.textContent = new Date().getFullYear();
  }

  function applySeoDefaults() {
    if (typeof SiteConfig === "undefined") return;

    if (!document.title || document.title.trim() === "") {
      document.title = SiteConfig.seo.defaultTitle;
    }

    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement("meta");
      metaDesc.setAttribute("name", "description");
      document.head.appendChild(metaDesc);
    }
    if (!metaDesc.getAttribute("content")) {
      metaDesc.setAttribute("content", SiteConfig.seo.defaultDescription);
    }
  }

  function init() {
    applySeoDefaults();
    // Bind config values on static page content first. Components get bound
    // separately as they load (see loadComponent) — without this line,
    // [data-config-href]/[data-config-text] outside a component is never
    // resolved, leaving static CTAs pointing at href="#".
    bindConfigValues(document);
    const placeholders = document.querySelectorAll("[data-component]");
    placeholders.forEach(loadComponent);
  }

  document.addEventListener("DOMContentLoaded", init);
})();
