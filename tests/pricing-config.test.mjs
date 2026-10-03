/**
 * Keeps the pricing text in step with the pricing numbers.
 *   node --test tests/pricing-config.test.mjs
 * config/site-config.js is the single source of truth; the static HTML copy on
 * the pricing page and the homepage pricing component must match it.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => readFileSync(join(root, p), "utf8");
const cfg = vm.runInNewContext(read("config/site-config.js") + "\nSiteConfig;").pricing;
const fmt = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",") + " CFA";

test("monthly and annual prices", () => {
  assert.equal(cfg.monthly.price, 3000);
  assert.equal(cfg.annual.price, 12000);
  assert.equal(cfg.annual.renewalPrice, 25000);
  assert.equal(cfg.annual.amount, fmt(cfg.annual.price));
  assert.equal(cfg.annual.renewalAmount, fmt(cfg.annual.renewalPrice));
  assert.equal(cfg.annual.period, "first year");
});

test("the savings in the annual note are worked out from the prices", () => {
  const yearOfMonthly = cfg.monthly.price * 12;                 // 36,000
  const year1Saving = yearOfMonthly - cfg.annual.price;          // 24,000
  const renewalSaving = yearOfMonthly - cfg.annual.renewalPrice; // 11,000
  assert.equal(year1Saving, 24000);
  assert.equal(renewalSaving, 11000);
  assert.equal(cfg.annual.note,
    `Save ${fmt(year1Saving)} in year 1. Then ${fmt(cfg.annual.renewalPrice)}/year, still ${fmt(renewalSaving)} less than paying monthly.`);
});

test("static HTML copy matches the config (what search engines and no-JS visitors see)", () => {
  for (const file of ["pages/pricing.html", "components/pricing.html"]) {
    const html = read(file);
    assert.ok(html.includes(`data-config-text="pricing.annual.amount">${cfg.annual.amount}<`), `${file}: annual amount`);
    assert.ok(html.includes(`data-config-text="pricing.annual.period">${cfg.annual.period}<`), `${file}: annual period`);
    assert.ok(html.includes(`data-config-text="pricing.annual.note">${cfg.annual.note}<`), `${file}: annual note`);
    assert.ok(html.includes(`data-config-text="pricing.monthly.amount">${cfg.monthly.amount}<`), `${file}: monthly amount`);
  }
});
