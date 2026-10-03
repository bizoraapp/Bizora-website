/**
 * French pages (/fr/ and /fr/point-de-vente/): content, hreflang, config
 * consistency and rendering in a real browser (same CSP as netlify.toml).
 *   node --test tests/french.test.mjs
 */
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { execSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import vm from "node:vm";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { startServer } from "./support/server.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => readFileSync(join(root, p), "utf8");
const cfg = vm.runInNewContext(read("config/site-config.js") + "\nSiteConfig;");
const fr = (n) => n.toLocaleString("fr-FR").replace(/[  ]/g, " ");
const PAGES = ["/fr/", "/fr/point-de-vente/"];

test("French pricing figures match config/site-config.js", () => {
  const html = read("components/fr/pricing.html");
  const p = cfg.pricing;
  assert.ok(html.includes(`${fr(p.monthly.price)} FCFA`), "monthly price");
  assert.ok(html.includes(`${fr(p.annual.price)} FCFA`), "first-year price");
  const yearOfMonthly = p.monthly.price * 12;
  assert.ok(html.includes(`Économisez ${fr(yearOfMonthly - p.annual.price)} FCFA`), "first-year saving");
  assert.ok(html.includes(`${fr(p.annual.renewalPrice)} FCFA par an`), "renewal price");
  assert.ok(html.includes(`${fr(yearOfMonthly - p.annual.renewalPrice)} FCFA de moins`), "renewal saving");
  assert.ok(html.includes(`${p.trial.durationDays} jours`), "trial length");
});

test("French components do not leak English config text or untranslated headings", () => {
  for (const f of readdirSync(join(root, "components/fr"))) {
    const h = read(`components/fr/${f}`);
    assert.equal(/data-config-text="(nav\.primaryCtaLabel|pricing\.)/.test(h), false, `${f}: uses English config text`);
    assert.equal(/DOWNLOAD NOW|Message us|Chat with us|Skip to/i.test(h), false, `${f}: English call-to-action text`);
  }
});

test("French pages: language, canonical, hreflang, one H1, French title", () => {
  for (const [file, canon, en] of [["fr/index.html", "https://www.bizora-cm.com/fr/", "https://www.bizora-cm.com/"], ["fr/point-de-vente/index.html", "https://www.bizora-cm.com/fr/point-de-vente/", "https://www.bizora-cm.com/pages/point-of-sale.html"]]) {
    const h = read(file);
    assert.match(h, /<html lang="fr">/);
    assert.ok(h.includes(`<link rel="canonical" href="${canon}" />`));
    assert.ok(h.includes(`hreflang="fr" href="${canon}"`) && h.includes(`hreflang="en" href="${en}"`) && h.includes(`hreflang="x-default" href="${en}"`));
    assert.equal((h.match(/<h1[\s>]/g) || []).length, 1, "one H1");
    assert.match(h, /<title>[^<]*(point de vente|Point de vente)[^<]*<\/title>/i);
    assert.ok(/point de vente \(POS\)/i.test(h.match(/<meta name="description" content="([^"]*)"/)[1]), "description names point de vente");
    assert.ok(/Cameroun/.test(h.match(/<title>([^<]*)<\/title>/)[1]), "title names Cameroun");
  }
});

test("English twins point back at the French pages; French home is in the sitemap", () => {
  assert.ok(read("index.html").includes('hreflang="fr" href="https://www.bizora-cm.com/fr/"'));
  assert.ok(read("pages/point-of-sale.html").includes('hreflang="fr" href="https://www.bizora-cm.com/fr/point-de-vente/"'));
  const sm = read("sitemap.xml");
  for (const u of ["https://www.bizora-cm.com/fr/", "https://www.bizora-cm.com/fr/point-de-vente/"]) assert.ok(sm.includes(`<loc>${u}</loc>`), u);
  assert.ok(read("components/footer.html").includes('href="/fr/"'), "English footer links to the French site");
});

/* ------------------------------------------------------------ browser tests */
const require = createRequire(import.meta.url);
let pw = null;
for (const load of [() => require("playwright"), () => require(join(execSync("npm root -g").toString().trim(), "playwright"))]) {
  try { pw = load(); break; } catch { /* try next */ }
}
const skip = pw ? false : "Playwright is not installed";
let srv, browser;
before(async () => {
  if (!pw) return;
  srv = await startServer();
  const exe = existsSync("/opt/pw-browsers/chromium") ? "/opt/pw-browsers/chromium" : undefined;
  browser = await pw.chromium.launch(exe ? { executablePath: exe } : {});
});
after(async () => { if (browser) await browser.close(); if (srv) srv.close(); });

async function open(path, viewport = { width: 390, height: 800 }) {
  const ctx = await browser.newContext({ viewport });
  const page = await ctx.newPage();
  const errors = [];
  page.on("console", (m) => { if (m.type() === "error" && !/net::ERR|Failed to load resource/.test(m.text())) errors.push(m.text()); });
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.addInitScript(() => document.addEventListener("securitypolicyviolation", (e) => console.error("CSPVIOLATION " + e.violatedDirective + " " + e.blockedURI)));
  await page.route("**/*", (r) => (r.request().url().startsWith(srv.base) ? r.continue() : r.abort()));
  await page.goto(srv.base + path);
  await page.waitForSelector("[data-component-loaded=footer]", { state: "attached" });
  return { ctx, page, errors };
}

test("French pages load French components with no console or CSP errors", { skip }, async () => {
  for (const path of PAGES) {
    const { ctx, page, errors } = await open(path);
    assert.equal(await page.locator('.navbar__links a[hreflang="en"]').count(), 1, `${path}: English switch in the navbar`);
    assert.match(await page.locator(".navbar__links").innerText(), /Accueil[\s\S]*Point de vente/);
    assert.match(await page.locator(".footer").innerText(), /Tous droits réservés/);
    assert.match(await page.locator(".navbar .btn-primary").first().innerText(), /TÉLÉCHARGER — 30 JOURS GRATUITS/);
    assert.ok(await page.locator(".navbar .btn-primary").first().getAttribute("href") !== "#", "trial link is resolved from config");
    assert.deepEqual(errors, [], `${path}: ${errors}`);
    await ctx.close();
  }
});

test("French home shows French pricing and support sections that the navbar anchors reach", { skip }, async () => {
  const { ctx, page } = await open("/fr/");
  await page.waitForSelector("#tarifs", { state: "attached" });
  await page.waitForSelector("#assistance", { state: "attached" });
  assert.match(await page.locator("#tarifs").innerText(), /12 000 FCFA/);
  assert.match(await page.locator("#assistance").innerText(), /WhatsApp/);
  await ctx.close();
});

test("French pages: no sideways scrolling and the navbar never overlaps at common widths", { skip }, async () => {
  for (const path of PAGES) for (const width of [360, 390, 412, 600, 1000, 1159, 1160, 1280, 1920]) {
    const { ctx, page } = await open(path, { width, height: 800 });
    await page.waitForSelector(".navbar__links a", { state: "attached" });
    const m = await page.evaluate(() => {
      const r = (s) => document.querySelector(s).getBoundingClientRect();
      const shown = getComputedStyle(document.querySelector(".navbar__links")).display !== "none";
      return { shown, brandR: r(".navbar__brand").right, linksL: shown ? r(".navbar__links").left : 0, linksR: shown ? r(".navbar__links").right : 0, actL: r(".navbar__actions").left, sw: document.documentElement.scrollWidth };
    });
    if (m.shown) { assert.ok(m.brandR + 8 <= m.linksL, `${path} ${width}: links hit logo`); assert.ok(m.linksR + 8 <= m.actL, `${path} ${width}: links hit button`); }
    else assert.ok(m.brandR + 8 <= m.actL, `${path} ${width}: menu hits logo`);
    assert.ok(m.sw <= width, `${path} ${width}: sideways scroll (${m.sw}px)`);
    await ctx.close();
  }
});

test("French pages work without JavaScript: H1, hero and FAQ are in the HTML", { skip }, async () => {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.route("**/*", (r) => (r.request().url().startsWith(srv.base) ? r.continue() : r.abort()));
  await page.goto(srv.base + "/fr/");
  assert.match(await page.locator("h1").innerText(), /Sachez exactement/);
  await page.goto(srv.base + "/fr/point-de-vente/");
  assert.match(await page.locator("h1").innerText(), /point de vente/i);
  assert.ok((await page.locator("details.faq-item").count()) >= 6);
  await ctx.close();
});
