/**
 * demo-model.js
 * ------------------------------------------------------------------
 * SINGLE RESPONSIBILITY: the "See Bizora in Action" demo's data and maths.
 *
 * Pure, DOM-free and side-effect free: every function takes a state and
 * returns a NEW state (or a value). It never reads or writes localStorage,
 * cookies, the network or any real Bizora data - the whole demo lives in
 * memory and starts from DEMO_CATALOG below, so reloading or restarting
 * always gives the same clean shop.
 *
 * Loaded as a plain global (window.BizoraDemoModel) and also importable from
 * Node (module.exports) so the calculations can be unit-tested.
 * ------------------------------------------------------------------
 */
(function (root, factory) {
  var model = factory();
  if (typeof module === "object" && module.exports) module.exports = model;
  else root.BizoraDemoModel = model;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var CURRENCY = "XAF";

  var BUSINESS = {
    name: "Mama Grace Cosmetics",
    type: "Cosmetics & Beauty",
    currency: CURRENCY,
    phone: "677 123 456"
  };

  var CUSTOMER = { name: "Sarah", phone: "+237 677 123 456" };

  // Sample shop. The four products are chosen so the totals are exactly:
  //   inventory value  (cost x qty)    = 125,000
  //   projected revenue (price x qty)  = 210,000
  //   projected profit (revenue - cost) =  85,000
  var DEMO_CATALOG = [
    { id: "body-lotion", name: "Body Lotion", category: "Body Care", cost: 3000, price: 5000, qty: 10 },
    { id: "hair-shampoo", name: "Hair Shampoo", category: "Hair Care", cost: 2000, price: 3500, qty: 20 },
    { id: "face-cream", name: "Face Cream", category: "Face Care", cost: 2500, price: 4000, qty: 10 },
    { id: "hair-oil", name: "Hair Oil", category: "Hair Care", cost: 1500, price: 2500, qty: 20 }
  ];

  var RECEIPT_NO = "000001";

  function clone(x) { return JSON.parse(JSON.stringify(x)); }

  /** "125,000" - thousands separator, no decimals (XAF has none). */
  function fmt(n) {
    return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }
  function money(n) { return CURRENCY + " " + fmt(n); }

  function initialState() {
    return {
      business: null,      // set when setup finishes
      products: [],        // added one by one in step 3
      cart: [],            // [{ id, qty }]
      customer: null,      // set in step 4
      payment: null,       // "cash" once chosen
      sale: null,          // set when the sale is completed
      shared: false        // set when the WhatsApp receipt is sent
    };
  }

  function catalogProduct(index) {
    return DEMO_CATALOG[index] ? clone(DEMO_CATALOG[index]) : null;
  }

  function finishSetup(state) {
    var s = clone(state);
    s.business = clone(BUSINESS);
    return s;
  }

  /** Adds the next catalogue product (or the one at `index`) to the shop. */
  function addProduct(state, index) {
    var s = clone(state);
    var i = typeof index === "number" ? index : s.products.length;
    var p = catalogProduct(i);
    if (!p) throw new Error("No more demo products");
    if (s.products.some(function (x) { return x.id === p.id; })) throw new Error("Product already added");
    s.products.push(p);
    return s;
  }

  function inventoryTotals(products) {
    var value = 0, revenue = 0;
    products.forEach(function (p) {
      value += p.cost * p.qty;
      revenue += p.price * p.qty;
    });
    return { value: value, revenue: revenue, profit: revenue - value };
  }

  function findProduct(state, id) {
    return state.products.filter(function (p) { return p.id === id; })[0] || null;
  }

  function cartLine(state, id) {
    return state.cart.filter(function (l) { return l.id === id; })[0] || null;
  }

  /** Sets a cart quantity, clamped to the stock on hand. 0 removes the line. */
  function setCartQty(state, id, qty) {
    var s = clone(state);
    var p = findProduct(s, id);
    if (!p) throw new Error("Unknown product");
    var q = Math.max(0, Math.min(Math.floor(qty), p.qty));
    s.cart = s.cart.filter(function (l) { return l.id !== id; });
    if (q > 0) s.cart.push({ id: id, qty: q });
    return s;
  }

  function addToCart(state, id) {
    var line = cartLine(state, id);
    return setCartQty(state, id, (line ? line.qty : 0) + 1);
  }

  /** Cart lines with names and amounts, in the order they were added. */
  function cartLines(state) {
    return state.cart.map(function (l) {
      var p = findProduct(state, l.id);
      return { id: l.id, name: p.name, qty: l.qty, unitPrice: p.price, amount: p.price * l.qty, stock: p.qty };
    });
  }

  function cartTotal(state) {
    return cartLines(state).reduce(function (sum, l) { return sum + l.amount; }, 0);
  }

  function selectCustomer(state) {
    var s = clone(state);
    s.customer = clone(CUSTOMER);
    return s;
  }

  function selectCash(state) {
    var s = clone(state);
    s.payment = "cash";
    return s;
  }

  function canCompleteSale(state) {
    return state.cart.length > 0 && !!state.customer && state.payment === "cash" && !state.sale;
  }

  /** Completes the cash sale: totals it, writes the receipt data, reduces stock. */
  function completeSale(state, when) {
    if (!canCompleteSale(state)) throw new Error("Sale is not ready to complete");
    var s = clone(state);
    var lines = cartLines(s);
    var total = lines.reduce(function (sum, l) { return sum + l.amount; }, 0);
    var stockChanges = lines.map(function (l) {
      var p = findProduct(s, l.id);
      var before = p.qty;
      p.qty -= l.qty;
      return { id: l.id, name: l.name, before: before, after: p.qty };
    });
    s.sale = {
      receiptNo: RECEIPT_NO,
      customer: s.customer.name,
      lines: lines.map(function (l) { return { name: l.name, qty: l.qty, unitPrice: l.unitPrice, amount: l.amount }; }),
      subtotal: total,
      total: total,
      paid: total,        // cash sale, paid in full: no change due, no debt
      change: 0,
      method: "Cash",
      date: when || "",
      stockChanges: stockChanges
    };
    s.cart = [];
    return s;
  }

  /** What the shop looks like now: stock value, potential revenue and profit, plus sales. */
  function dashboard(state) {
    var t = inventoryTotals(state.products);
    var sales = state.sale ? state.sale.total : 0;
    return { inventoryValue: t.value, projectedRevenue: t.revenue, projectedProfit: t.profit, totalSales: sales, cashCollected: sales };
  }

  /** Plain-text receipt, as shared through WhatsApp. */
  function receiptText(state) {
    var sale = state.sale, b = state.business;
    if (!sale || !b) throw new Error("No completed sale");
    var out = [
      b.name,
      b.phone,
      "Receipt #" + sale.receiptNo,
      "Date: " + sale.date,
      "Customer: " + sale.customer,
      ""
    ];
    sale.lines.forEach(function (l) { out.push(l.name + " x" + l.qty + " - " + money(l.amount)); });
    out.push("", "TOTAL - " + money(sale.total), "Paid (" + sale.method + ") - " + money(sale.paid));
    return out.join("\n");
  }

  function whatsappMessage(state) {
    var sale = state.sale, b = state.business;
    if (!sale || !b) throw new Error("No completed sale");
    return [
      "Hello " + sale.customer + ",",
      "",
      "Thank you for your purchase from " + b.name + ".",
      "",
      "Receipt #: " + sale.receiptNo,
      "Date: " + sale.date,
      "Total: " + money(sale.total),
      "Paid: " + money(sale.paid)
    ].join("\n");
  }

  function markShared(state) {
    var s = clone(state);
    s.shared = true;
    return s;
  }

  return {
    CURRENCY: CURRENCY,
    DEMO_CATALOG: DEMO_CATALOG,
    BUSINESS: BUSINESS,
    CUSTOMER: CUSTOMER,
    RECEIPT_NO: RECEIPT_NO,
    fmt: fmt,
    money: money,
    initialState: initialState,
    catalogProduct: catalogProduct,
    finishSetup: finishSetup,
    addProduct: addProduct,
    inventoryTotals: inventoryTotals,
    findProduct: findProduct,
    setCartQty: setCartQty,
    addToCart: addToCart,
    cartLines: cartLines,
    cartTotal: cartTotal,
    selectCustomer: selectCustomer,
    selectCash: selectCash,
    canCompleteSale: canCompleteSale,
    completeSale: completeSale,
    dashboard: dashboard,
    receiptText: receiptText,
    whatsappMessage: whatsappMessage,
    markShared: markShared
  };
});
