/**
 * End-to-end tests for the interactive demo (pages/demo.html), run in a real
 * browser (Playwright) against a local static server that sends the same CSP
 * headers as netlify.toml.
 *   node --test tests/demo-flow.test.mjs
 */
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { startServer } from "./support/server.mjs";

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

/** Opens the demo in a fresh browser context and records errors and requests. */
async function open(viewport = { width: 390, height: 800 }, opts = {}) {
  const ctx = await browser.newContext({ viewport, ...opts });
  const page = await ctx.newPage();
  const log = { errors: [], requests: [] };
  page.on("console", (m) => { if (m.type() === "error" && !/net::ERR|Failed to load resource/.test(m.text())) log.errors.push(m.text()); });
  page.on("pageerror", (e) => log.errors.push(String(e)));
  page.on("request", (r) => log.requests.push({ url: r.url(), method: r.method() }));
  await page.addInitScript(() => document.addEventListener("securitypolicyviolation", (e) => console.error("CSPVIOLATION " + e.violatedDirective + " " + e.blockedURI)));
  // Third-party hosts (analytics) are unreachable in tests; only same-origin traffic is allowed.
  await page.route("**/*", (r) => (r.request().url().startsWith(srv.base) ? r.continue() : r.abort()));
  await page.goto(srv.base + "/pages/demo.html");
  if (opts.javaScriptEnabled !== false) await page.waitForSelector("#demo[data-demo-ready]");
  return { ctx, page, log };
}

const txt = (page, sel) => page.locator(sel).innerText();
const next = (page) => page.locator("#demo-next");

async function toSetup(page) {
  await page.click("#demo-download");
  await page.waitForSelector("#demo-open");
  await page.click("#demo-open");
  await page.waitForSelector("#demo-setup-go:not([disabled])");
}
async function toProducts(page) {
  await toSetup(page);
  await page.click("#demo-setup-go");
  await page.click("#demo-add-products");
  await page.click("#demo-add-product");
}
async function addAllProducts(page) {
  await toProducts(page);
  for (let i = 0; i < 4; i++) {
    await page.waitForSelector("#demo-save-product:not([disabled])");
    await page.click("#demo-save-product");
    if (i < 3) await page.click("#demo-add-product");
  }
}
async function toSale(page) {
  await addAllProducts(page);
  await page.click("#demo-see-inventory");
  await page.click("#demo-start-sale");
}
async function makeSale(page) {
  await page.click('[data-act="addToCart"][data-id="body-lotion"]');
  await page.click('[data-act="addToCart"][data-id="face-cream"]');
  await page.click("#demo-pick-customer");
  await page.click("#demo-cash");
  await page.click("#demo-complete-sale");
}
async function toReceipt(page) {
  await toSale(page);
  await makeSale(page);
  await page.click("#demo-gen-receipt");
}
async function toEnd(page) {
  await toReceipt(page);
  await page.click("#demo-send-wa");
  await page.click("#demo-open-wa");
  await page.click("#demo-wa-send");
  await page.click("#demo-see-updated");
  await page.click("#demo-finish");
}

test("1. the demo starts at Step 1 with the download screen", { skip }, async () => {
  const { ctx, page, log } = await open();
  assert.equal(await txt(page, "h1"), "See Bizora in Action");
  assert.match(await txt(page, "#demo-step-title"), /Step 1 of 5 · Download/);
  assert.equal(await txt(page, "#demo-download"), "DOWNLOAD NOW — 30 DAYS FREE");
  assert.equal(await page.locator(".stepper__i").count(), 5);
  assert.match(await txt(page, ".stepper__i.is-current"), /01\s*Download/);
  assert.equal(await page.locator("#demo-back").isDisabled(), true, "Back is disabled on the first screen");
  assert.deepEqual(log.errors, []);
  await ctx.close();
});

test("2. download, install and open lead to the setup screen; setup completes", { skip }, async () => {
  const { ctx, page } = await open();
  await page.click("#demo-download");
  await page.waitForSelector("#demo-open");
  assert.match(await txt(page, ".splash__ok"), /Bizora installed/);
  assert.equal(await txt(page, "#demo-open"), "OPEN BIZORA");
  await page.click("#demo-open");
  await page.waitForSelector("#demo-setup-go:not([disabled])");
  assert.equal(await txt(page, "#f-name"), "Mama Grace Cosmetics");
  assert.equal(await txt(page, "#f-type"), "Cosmetics & Beauty");
  assert.equal(await txt(page, "#f-cur"), "XAF");
  await page.click("#demo-setup-go");
  assert.match(await txt(page, ".splash__ok"), /Business profile ready/);
  assert.equal(await txt(page, "#demo-add-products"), "ADD YOUR PRODUCTS");
  assert.match(await txt(page, ".stepper__i.is-done"), /Download/);
  await ctx.close();
});

test("3. products can be added one by one with price, cost and stock", { skip }, async () => {
  const { ctx, page } = await open();
  await page.click("#demo-download"); await page.waitForSelector("#demo-open"); await page.click("#demo-open");
  await page.waitForSelector("#demo-setup-go:not([disabled])"); await page.click("#demo-setup-go"); await page.click("#demo-add-products");
  assert.match(await txt(page, ".app-head"), /0 total products/);
  await page.click("#demo-add-product");
  await page.waitForSelector("#demo-save-product:not([disabled])");
  assert.equal(await txt(page, "#f-pname"), "Body Lotion");
  assert.equal(await txt(page, "#f-pcost"), "3,000");
  assert.equal(await txt(page, "#f-pprice"), "5,000");
  assert.equal(await txt(page, "#f-pqty"), "10");
  await page.click("#demo-save-product");
  assert.equal(await page.locator(".plist__row").count(), 1);
  assert.match(await txt(page, ".app-toast"), /Body Lotion saved/);
  await page.click("#demo-add-product");
  await page.waitForSelector("#demo-save-product:not([disabled])");
  await page.click("#demo-save-product");
  assert.equal(await page.locator(".plist__row").count(), 2);
  await ctx.close();
});

test("4. inventory value, projected revenue and projected profit are correct", { skip }, async () => {
  const { ctx, page } = await open();
  await addAllProducts(page);
  assert.equal(await page.locator(".plist__row").count(), 4);
  assert.equal(await txt(page, "#demo-see-inventory"), "SEE WHAT YOUR STOCK IS WORTH");
  await page.click("#demo-see-inventory");
  assert.equal(await txt(page, "#demo-inv-value"), "XAF 125,000");
  assert.equal(await txt(page, "#demo-inv-revenue"), "XAF 210,000");
  assert.equal(await txt(page, "#demo-inv-profit"), "XAF 85,000");
  assert.match(await txt(page, ".splash__ok"), /Your shop is ready to sell/);
  assert.equal(await txt(page, "#demo-start-sale"), "START A SALE");
  await ctx.close();
});

test("5. the sale total, quantity, customer and cash rules work", { skip }, async () => {
  const { ctx, page } = await open();
  await toSale(page);
  assert.equal(await page.locator("#demo-complete-sale").isDisabled(), true);
  await page.click('[data-act="addToCart"][data-id="body-lotion"]');
  assert.equal(await txt(page, "#demo-running-total"), "XAF 5,000");
  await page.click('[aria-label="Add one Body Lotion"]');
  assert.equal(await txt(page, "#demo-running-total"), "XAF 10,000");
  await page.click('[aria-label="Remove one Body Lotion"]');
  assert.equal(await txt(page, "#demo-running-total"), "XAF 5,000");
  await page.click('[data-act="addToCart"][data-id="face-cream"]');
  assert.equal(await txt(page, "#demo-running-total"), "XAF 9,000");
  assert.equal(await page.locator("#demo-complete-sale").isDisabled(), true, "needs a customer and cash first");
  await page.click("#demo-pick-customer");
  assert.equal(await txt(page, "#demo-customer"), "Sarah");
  assert.equal(await page.locator("#demo-complete-sale").isDisabled(), true, "still needs cash");
  await page.click("#demo-cash");
  assert.equal(await page.locator("#demo-complete-sale").isDisabled(), false);
  await page.click("#demo-complete-sale");
  assert.match(await txt(page, ".splash__ok"), /Sale completed/);
  assert.equal(await txt(page, "#demo-sale-total"), "XAF 9,000");
  await ctx.close();
});

test("6. stock decreases after the sale and the numbers update", { skip }, async () => {
  const { ctx, page } = await open();
  await toSale(page);
  await makeSale(page);
  const changes = await txt(page, "#demo-stock-changes");
  assert.match(changes, /Body Lotion\s+10 → 9/);
  assert.match(changes, /Face Cream\s+10 → 9/);
  await page.click("#demo-gen-receipt");
  await page.click("#demo-send-wa"); await page.click("#demo-open-wa"); await page.click("#demo-wa-send"); await page.click("#demo-see-updated");
  assert.equal(await txt(page, "#demo-new-value"), "XAF 119,500");
  assert.equal(await txt(page, "#demo-new-revenue"), "XAF 201,000");
  assert.equal(await txt(page, "#demo-new-profit"), "XAF 81,500");
  assert.equal(await txt(page, "#demo-new-sales"), "XAF 9,000");
  assert.equal(await txt(page, "#demo-new-cash"), "XAF 9,000");
  await ctx.close();
});

test("7. the receipt contains the correct sale information", { skip }, async () => {
  const { ctx, page } = await open();
  await toReceipt(page);
  const r = await txt(page, "#demo-receipt");
  for (const part of ["Mama Grace Cosmetics", "677 123 456", "000001", "Sarah", "Body Lotion x1", "XAF 5,000", "Face Cream x1", "XAF 4,000", "XAF 9,000", "Cash", "Thank you for your business"]) {
    assert.ok(r.includes(part), `receipt should include "${part}"`);
  }
  assert.match(await txt(page, ".app-head"), /Receipt ready/);
  assert.equal(await txt(page, "#demo-send-wa"), "SEND VIA WHATSAPP");
  await ctx.close();
});

test("8. WhatsApp sharing is simulated: nothing is sent or opened", { skip }, async () => {
  const { ctx, page, log } = await open();
  await toReceipt(page);
  const url = page.url();
  await page.click("#demo-send-wa");
  assert.match(await txt(page, ".splash__ok"), /Receipt ready to share/);
  assert.match(await txt(page, ".app-body"), /Your receipt has been prepared for Sarah\./);
  await page.click("#demo-open-wa");
  assert.match(await txt(page, "#demo-wa-draft"), /Hello Sarah,[\s\S]*Total: XAF 9,000/);
  await page.click("#demo-wa-send");
  assert.match(await txt(page, "#demo-shared"), /Receipt shared/);
  assert.equal(page.url(), url, "the page never navigates to WhatsApp");
  assert.equal(log.requests.some((r) => /whatsapp|wa\.me/i.test(r.url)), false, "no request to WhatsApp");
  assert.equal(page.context().pages().length, 1, "no new tab or window opens");
  await ctx.close();
});

test("9. the finish screen summarises the journey and offers the two CTAs", { skip }, async () => {
  const { ctx, page } = await open();
  await toEnd(page);
  assert.match(await txt(page, "#demo-complete h3"), /Your shop is now running with Bizora/);
  assert.equal(await page.locator("#demo-complete .checks li").count(), 7);
  assert.equal(await txt(page, "#demo-trial"), "START YOUR 30-DAY FREE TRIAL");
  assert.equal(await txt(page, "#demo-explore"), "EXPLORE BIZORA");
  const trial = await page.evaluate(() => SiteConfig.urls.trial);
  assert.equal(await page.getAttribute("#demo-trial", "href"), trial, "the trial CTA uses the real, central trial link");
  assert.equal(await page.getAttribute("#demo-explore", "href"), "/pages/features.html");
  assert.equal(await page.locator(".stepper__i.is-done").count(), 5);
  await ctx.close();
});

test("10. restarting resets all demo data", { skip }, async () => {
  const { ctx, page } = await open();
  await toSale(page);
  await makeSale(page);
  await page.click("#demo-restart");
  assert.match(await txt(page, "#demo-step-title"), /Step 1 of 5 · Download/);
  assert.equal(await page.locator("#demo-download").count(), 1);
  // walk the same path again: everything must be back to the sample shop
  await toProducts(page);
  await page.waitForSelector("#demo-save-product:not([disabled])");
  assert.match(await txt(page, "#f-pname"), /Body Lotion/);
  await page.click("#demo-save-product");
  assert.equal(await page.locator(".plist__row").count(), 1, "only the new product exists");
  for (let i = 0; i < 3; i++) { await page.click("#demo-add-product"); await page.waitForSelector("#demo-save-product:not([disabled])"); await page.click("#demo-save-product"); }
  await page.click("#demo-see-inventory"); await page.click("#demo-start-sale");
  assert.match(await txt(page, ".slist"), /Body Lotion\s+XAF 5,000\s+Stock: 10/);
  assert.equal(await txt(page, "#demo-running-total"), "XAF 0");
  await ctx.close();
});

test("11. Back steps back through the journey and Next performs the on-screen action", { skip }, async () => {
  const { ctx, page } = await open();
  await next(page).click();                       // download -> installing -> installed
  await page.waitForSelector("#demo-open");
  await next(page).click();                       // open -> setup
  await page.waitForSelector("#demo-setup-go:not([disabled])");
  await page.click("#demo-back");
  assert.equal(await page.locator("#demo-open").count(), 1, "Back from setup returns to the installed screen");
  await page.click("#demo-back");
  assert.equal(await page.locator("#demo-download").count(), 1, "Back again skips the install animation and returns to the download screen");
  assert.equal(await page.locator("#demo-back").isDisabled(), true);
  await ctx.close();
  // Next alone can drive the whole journey to the finish screen
  const run = await open();
  for (let i = 0; i < 60 && !(await run.page.locator("#demo-complete").count()); i++) {
    await run.page.waitForFunction(() => !document.querySelector("#demo-next").disabled || document.querySelector("#demo-complete"));
    if (await run.page.locator("#demo-complete").count()) break;
    await run.page.click("#demo-next");
  }
  assert.equal(await run.page.locator("#demo-complete").count(), 1);
  assert.equal(await run.page.locator("#demo-next").isDisabled(), true);
  await run.ctx.close();
});

test("12. mobile 360px: no horizontal scroll, touch-friendly, no console or CSP errors", { skip }, async () => {
  const { ctx, page, log } = await open({ width: 360, height: 740 }, { hasTouch: true, isMobile: true });
  const check = async (label) => {
    const o = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth - window.innerWidth,
      phone: document.querySelector(".phone").getBoundingClientRect().width,
      small: [...document.querySelectorAll(".demo-btn:not(:disabled), .qty__b, .demo-ctl, .demo-add, .chip, .pay__o, .wa__send")]
        .filter((e) => e.offsetParent && e.getBoundingClientRect().height < 40).map((e) => e.textContent.trim())
    }));
    assert.ok(o.overflow <= 0, `${label}: horizontal overflow ${o.overflow}px`);
    assert.ok(o.phone <= 360, `${label}: phone is ${o.phone}px wide`);
    assert.deepEqual(o.small, [], `${label}: touch targets under 40px`);
  };
  await check("download");
  for (let i = 0; i < 60 && !(await page.locator("#demo-complete").count()); i++) {
    await page.waitForFunction(() => !document.querySelector("#demo-next").disabled || document.querySelector("#demo-complete"));
    if (await page.locator("#demo-complete").count()) break;
    await page.click("#demo-next");
    await page.waitForTimeout(60);
    await check(await txt(page, "#demo-step-title"));
  }
  assert.deepEqual(log.errors, [], "no console errors or CSP violations");
  await ctx.close();
});

test("13. desktop 1280px: guide beside the phone, no overflow", { skip }, async () => {
  const { ctx, page, log } = await open({ width: 1280, height: 900 });
  const g = await page.locator("#demo-guide").boundingBox();
  const p = await page.locator(".phone").boundingBox();
  assert.ok(g.x + g.width <= p.x + 1, "guide is to the left of the phone");
  assert.ok(Math.abs(g.y - p.y) < 120, "guide and phone start at a similar height");
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
  assert.deepEqual(log.errors, []);
  await ctx.close();
});

test("14. the demo is isolated: no storage, no cookies, no writes, same-origin requests only", { skip }, async () => {
  const { ctx, page, log } = await open();
  await toEnd(page);
  const stored = await page.evaluate(() => ({ local: localStorage.length, session: sessionStorage.length, cookie: document.cookie, idb: indexedDB.databases ? null : null }));
  assert.equal(stored.local, 0);
  assert.equal(stored.session, 0);
  assert.equal(stored.cookie, "");
  const mine = log.requests.filter((r) => r.url.startsWith(srv.base));
  assert.ok(mine.every((r) => r.method === "GET"), "only GET requests to this site");
  assert.equal(mine.some((r) => /api|login|checkout|subscribe/i.test(r.url)), false);
  await ctx.close();
});

test("15. without JavaScript the page still explains the steps and links to pricing", { skip }, async () => {
  const { ctx, page } = await open({ width: 390, height: 800 }, { javaScriptEnabled: false });
  assert.match(await txt(page, "#demo"), /Download Bizora and start the 30-day free trial/);
  assert.equal(await page.locator('#demo a[href="/pages/pricing.html"]').count(), 1);
  assert.equal(await txt(page, "h1"), "See Bizora in Action");
  await ctx.close();
});

test("16. keyboard users can drive the demo with Tab and Enter", { skip }, async () => {
  const { ctx, page } = await open();
  await page.focus("#demo-download");
  await page.keyboard.press("Enter");
  await page.waitForSelector("#demo-open");
  await page.focus("#demo-open");
  await page.keyboard.press("Enter");
  await page.waitForSelector("#demo-setup-go:not([disabled])");
  await page.focus("#demo-next");
  await page.keyboard.press("Enter");
  assert.match(await txt(page, ".splash__ok"), /Business profile ready/);
  await ctx.close();
});

test("17. visitors are told the demo is interactive, and the cue follows their progress", { skip }, async () => {
  const { ctx, page } = await open();
  assert.match(await page.locator(".demo-hero__note").textContent(), /This is not a video\. Tap the buttons inside the phone/);
  assert.match(await txt(page, "#demo-try"), /This is not a video\. Tap the gold buttons inside the phone/);
  assert.equal(await page.locator("#demo-try.is-started").count(), 0);
  await page.click("#demo-download");
  assert.match(await txt(page, "#demo-try"), /Keep tapping the gold button inside the phone/);
  assert.equal(await page.locator("#demo-try.is-started").count(), 1);
  await page.click("#demo-restart");
  assert.match(await txt(page, "#demo-try"), /This is not a video/, "Restart brings the first-time cue back");
  await ctx.close();
});

test("18. the home page hero line 'Point of Sale (POS) and Business Management App' is ALL CAPS, heavy, large and gold", { skip }, async () => {
  const { ctx, page } = await open({ width: 390, height: 844 });
  await page.goto(srv.base + "/index.html");
  await page.waitForSelector(".hero__kicker");
  const s = await page.locator(".hero__kicker").evaluate((el) => {
    const c = getComputedStyle(el);
    return { text: el.textContent.trim(), shown: el.innerText, weight: Number(c.fontWeight), size: parseFloat(c.fontSize), color: c.color, bg: c.backgroundColor, upper: c.textTransform };
  });
  assert.equal(s.text, "Point of Sale (POS) and Business Management App", "the source text stays in normal case (better for screen readers and search)");
  assert.equal(s.upper, "uppercase");
  assert.equal(s.shown, "POINT OF SALE (POS) AND BUSINESS MANAGEMENT APP", "what visitors see is all capitals");
  assert.ok(s.weight >= 800, `heavy (weight ${s.weight})`);
  assert.ok(s.size >= 22, `large (${s.size}px)`);
  assert.equal(s.color, "rgb(217, 166, 46)", "brand gold");
  assert.equal(s.bg, "rgb(10, 31, 68)", "on the deep navy brand colour, so the gold stays readable");
  const box = await page.locator(".hero__kicker").boundingBox();
  assert.ok(box.x >= 0 && box.x + box.width <= 390, "the hero line fits inside the screen");
  await ctx.close();
});

test("19. the navbar never overlaps itself: logo, links and the download button at common widths", { skip }, async () => {
  for (const width of [360, 390, 412, 600, 1000, 1159, 1160, 1280, 1440, 1920]) {
    const { ctx, page } = await open({ width, height: 800 });
    await page.goto(srv.base + "/index.html");
    await page.waitForSelector(".navbar__links a", { state: "attached" });
    const m = await page.evaluate(() => {
      const r = (s) => document.querySelector(s).getBoundingClientRect();
      const shown = getComputedStyle(document.querySelector(".navbar__links")).display !== "none";
      return { shown, brandR: r(".navbar__brand").right, linksL: shown ? r(".navbar__links").left : null, linksR: shown ? r(".navbar__links").right : null, actL: r(".navbar__actions").left, sw: document.documentElement.scrollWidth };
    });
    if (m.shown) {
      assert.ok(m.brandR + 8 <= m.linksL, `${width}px: links run into the logo`);
      assert.ok(m.linksR + 8 <= m.actL, `${width}px: links run into the download button`);
    } else {
      assert.ok(m.brandR + 8 <= m.actL, `${width}px: menu/button run into the logo`);
    }
    assert.ok(m.sw <= width, `${width}px: page scrolls sideways (${m.sw}px wide)`);
    await ctx.close();
  }
});
