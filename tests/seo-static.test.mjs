/**
 * Static SEO checks (no browser): what a search engine sees in the raw HTML,
 * before any JavaScript runs.
 *   node --test tests/seo-static.test.mjs
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => readFileSync(join(root, p), "utf8");
const home = read("index.html");
const ld = JSON.parse(home.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);

test("the home page source contains the H1 and the point-of-sale line (not injected by JavaScript)", () => {
  assert.equal((home.match(/<h1[\s>]/g) || []).length, 1, "exactly one H1 in the raw HTML");
  assert.match(home, /<h1 class="hero__title">Know exactly what your shop made today as profit\.<\/h1>/);
  assert.match(home, /<p class="hero__kicker">Point of Sale \(POS\) and Business Management App<\/p>/);
  assert.match(home, /Bizora is a point of sale and business management app/);
  assert.equal(home.includes('data-component="hero"'), false, "the hero is no longer a JavaScript component");
  assert.equal(existsSync(join(root, "components/hero.html")), false, "the unused hero component is removed");
});

test("home page title and descriptions name point of sale and Cameroon", () => {
  assert.match(home, /<title>Bizora — Point of Sale \(POS\) and Business Management App in Cameroon<\/title>/);
  for (const attr of ['name="description"', 'property="og:description"', 'name="twitter:description"']) {
    const m = home.match(new RegExp(`<meta ${attr} content="([^"]*)"`));
    assert.ok(m && /Cameroon/.test(m[1]) && /point of sale/i.test(m[1]), `${attr} mentions point of sale and Cameroon`);
  }
  assert.match(read("config/site-config.js"), /defaultTitle: "Bizora — Point of Sale \(POS\) and Business Management App in Cameroon"/);
});

test("other pages mention Cameroon in their search descriptions", () => {
  for (const p of ["pages/features.html", "pages/pricing.html", "pages/about.html", "pages/faq.html", "pages/support.html"]) {
    const m = read(p).match(/<meta name="description" content="([^"]*)"/);
    assert.ok(m && /Cameroon/.test(m[1]) && /point of sale/i.test(m[1]), `${p} description`);
  }
});

test("SoftwareApplication structured data describes a point-of-sale app", () => {
  const app = ld["@graph"].find((n) => n["@type"] === "SoftwareApplication");
  assert.equal(app.applicationSubCategory, "Point of Sale (POS) software");
  assert.ok(app.featureList.length >= 6 && app.featureList.some((f) => /receipt/i.test(f)));
  for (const url of app.screenshot) {
    assert.ok(url.startsWith("https://www.bizora-cm.com/assets/screenshots/"));
    assert.ok(existsSync(join(root, url.replace("https://www.bizora-cm.com", ""))), `screenshot exists: ${url}`);
  }
  assert.match(app.description, /Point of sale \(POS\) and business management app/);
});

test("every sitemap entry for a page has a lastmod date", () => {
  const entries = read("sitemap.xml").match(/<url>[\s\S]*?<\/url>/g);
  assert.ok(entries.length >= 7);
  for (const e of entries) assert.match(e, /<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/, e.match(/<loc>(.*?)<\/loc>/)[1]);
});

test("both articles link to the demo and the features page with descriptive text", () => {
  for (const slug of ["how-to-manage-stock-in-a-small-shop", "how-to-calculate-profit-in-a-small-business"]) {
    const page = read(`articles/${slug}/index.html`);
    assert.match(page, /<a href="\/pages\/demo\.html">point of sale \(POS\) app in the interactive demo<\/a>/);
    assert.match(page, /<a href="\/pages\/features\.html">Bizora features page<\/a>/);
  }
});
