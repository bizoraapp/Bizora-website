/**
 * Unit tests for js/demo-model.js: the demo's numbers and rules.
 *   node --test tests/demo-model.test.mjs
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const M = createRequire(import.meta.url)("../js/demo-model.js");

function shopWithAllProducts() {
  let s = M.finishSetup(M.initialState());
  for (let i = 0; i < M.DEMO_CATALOG.length; i++) s = M.addProduct(s);
  return s;
}
function completedSale() {
  let s = shopWithAllProducts();
  s = M.addToCart(s, "body-lotion");
  s = M.addToCart(s, "face-cream");
  s = M.selectCustomer(s);
  s = M.selectCash(s);
  return M.completeSale(s, "02 Oct 2026, 16:00");
}

test("the demo starts from an empty business", () => {
  const s = M.initialState();
  assert.equal(s.business, null);
  assert.deepEqual(s.products, []);
  assert.deepEqual(s.cart, []);
  assert.equal(s.sale, null);
});

test("setup produces the Mama Grace Cosmetics profile in XAF", () => {
  const b = M.finishSetup(M.initialState()).business;
  assert.equal(b.name, "Mama Grace Cosmetics");
  assert.equal(b.type, "Cosmetics & Beauty");
  assert.equal(b.currency, "XAF");
});

test("products are added one at a time, in order, never twice", () => {
  let s = M.finishSetup(M.initialState());
  s = M.addProduct(s);
  assert.deepEqual(s.products.map((p) => p.name), ["Body Lotion"]);
  s = M.addProduct(s);
  assert.deepEqual(s.products.map((p) => p.name), ["Body Lotion", "Hair Shampoo"]);
  assert.throws(() => M.addProduct(s, 0), /already added/);
  s = M.addProduct(M.addProduct(s));
  assert.throws(() => M.addProduct(s), /No more demo products/);
});

test("inventory value, projected revenue and profit match the storyboard exactly", () => {
  const t = M.inventoryTotals(shopWithAllProducts().products);
  assert.equal(t.value, 125000);
  assert.equal(t.revenue, 210000);
  assert.equal(t.profit, 85000);
  assert.equal(t.revenue - t.value, t.profit);
});

test("inventory totals are derived from the products, not hard-coded", () => {
  const t = M.inventoryTotals([{ cost: 100, price: 150, qty: 4 }, { cost: 10, price: 30, qty: 1 }]);
  assert.deepEqual(t, { value: 410, revenue: 630, profit: 220 });
});

test("sale total is the sum of line amounts", () => {
  let s = shopWithAllProducts();
  s = M.addToCart(s, "body-lotion");
  assert.equal(M.cartTotal(s), 5000);
  s = M.addToCart(s, "face-cream");
  assert.equal(M.cartTotal(s), 9000);
  s = M.setCartQty(s, "body-lotion", 2);
  assert.equal(M.cartTotal(s), 14000);
});

test("cart quantity is clamped to the stock and 0 removes the line", () => {
  let s = shopWithAllProducts();
  s = M.setCartQty(s, "body-lotion", 999);
  assert.equal(M.cartLines(s)[0].qty, 10);
  s = M.setCartQty(s, "body-lotion", 0);
  assert.equal(s.cart.length, 0);
  assert.throws(() => M.setCartQty(s, "nope", 1), /Unknown product/);
});

test("a sale needs items, a customer and cash before it can complete", () => {
  let s = shopWithAllProducts();
  assert.equal(M.canCompleteSale(s), false);
  s = M.addToCart(s, "body-lotion");
  assert.equal(M.canCompleteSale(s), false);
  s = M.selectCustomer(s);
  assert.equal(M.canCompleteSale(s), false);
  s = M.selectCash(s);
  assert.equal(M.canCompleteSale(s), true);
  assert.throws(() => M.completeSale(shopWithAllProducts(), ""), /not ready/);
});

test("completing the sale reduces stock by exactly what was sold", () => {
  const s = completedSale();
  assert.equal(M.findProduct(s, "body-lotion").qty, 9);
  assert.equal(M.findProduct(s, "face-cream").qty, 9);
  assert.equal(M.findProduct(s, "hair-shampoo").qty, 20);
  assert.equal(M.findProduct(s, "hair-oil").qty, 20);
  assert.deepEqual(s.sale.stockChanges.map((c) => [c.name, c.before, c.after]), [["Body Lotion", 10, 9], ["Face Cream", 10, 9]]);
  assert.deepEqual(s.cart, []);
});

test("the completed cash sale is paid in full with no change", () => {
  const sale = completedSale().sale;
  assert.equal(sale.total, 9000);
  assert.equal(sale.paid, 9000);
  assert.equal(sale.change, 0);
  assert.equal(sale.method, "Cash");
  assert.equal(sale.customer, "Sarah");
  assert.equal(sale.receiptNo, "000001");
});

test("after the sale the dashboard reflects it (119,500 / 201,000 / 81,500)", () => {
  const d = M.dashboard(completedSale());
  assert.equal(d.inventoryValue, 119500);
  assert.equal(d.projectedRevenue, 201000);
  assert.equal(d.projectedProfit, 81500);
  assert.equal(d.totalSales, 9000);
  assert.equal(d.cashCollected, 9000);
});

test("the receipt text carries the shop, receipt number, customer, items and total", () => {
  const t = M.receiptText(completedSale());
  for (const part of ["Mama Grace Cosmetics", "Receipt #000001", "Customer: Sarah", "Body Lotion x1 - XAF 5,000", "Face Cream x1 - XAF 4,000", "TOTAL - XAF 9,000", "Date: 02 Oct 2026, 16:00"]) {
    assert.ok(t.includes(part), `receipt text should include "${part}"`);
  }
});

test("the WhatsApp message greets the customer and states the total", () => {
  const t = M.whatsappMessage(completedSale());
  assert.ok(t.startsWith("Hello Sarah,"));
  assert.ok(t.includes("Mama Grace Cosmetics"));
  assert.ok(t.includes("Total: XAF 9,000"));
  assert.throws(() => M.whatsappMessage(M.initialState()), /No completed sale/);
});

test("model functions never mutate their input (restart always gives a clean shop)", () => {
  const before = shopWithAllProducts();
  const snapshot = JSON.stringify(before);
  M.addToCart(before, "body-lotion");
  M.selectCash(before);
  assert.equal(JSON.stringify(before), snapshot);
  assert.equal(JSON.stringify(M.initialState()), JSON.stringify(M.initialState()));
  assert.equal(M.DEMO_CATALOG[0].qty, 10, "the catalogue itself is never changed by a sale");
  completedSale();
  assert.equal(M.DEMO_CATALOG[0].qty, 10);
});

test("money formatting uses thousands separators and the XAF currency", () => {
  assert.equal(M.fmt(125000), "125,000");
  assert.equal(M.fmt(0), "0");
  assert.equal(M.money(9000), "XAF 9,000");
});
