/**
 * demo.js
 * ------------------------------------------------------------------
 * SINGLE RESPONSIBILITY: the "See Bizora in Action" guided demo UI
 * (pages/demo.html). Everything is simulated, in memory:
 *   - nothing is downloaded, installed, printed or sent
 *   - no network requests, no storage, no real Bizora data
 *   - restarting rebuilds the sample shop from js/demo-model.js
 *
 * Calculations live in demo-model.js; this file only renders screens and
 * wires the buttons. Back/Next/Restart sit beside the phone; Next simply
 * performs the on-screen action for the visitor.
 * ------------------------------------------------------------------
 */
(function () {
  "use strict";

  var M = window.BizoraDemoModel;
  var host = document.getElementById("demo");
  if (!M || !host) return;

  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var STEPS = [
    { n: 1, label: "Download" },
    { n: 2, label: "Setup" },
    { n: 3, label: "Products" },
    { n: 4, label: "First Sale" },
    { n: 5, label: "Receipt" }
  ];

  /* Where each screen sits in the journey, what the visitor is doing and what comes next. */
  var META = {
    download: { step: 1, doing: "You found Bizora and you are about to start your free trial.", next: "Tap DOWNLOAD NOW — 30 DAYS FREE." },
    installing: { step: 1, doing: "Bizora is installing on the phone. This takes a few seconds.", next: "Wait for the install to finish." },
    installed: { step: 1, doing: "Bizora is installed and ready.", next: "Tap OPEN BIZORA." },
    setup: { step: 2, doing: "Setting up the business profile: just a name, a type and a currency.", next: "When the details are filled in, tap Get Started." },
    setupDone: { step: 2, doing: "The business profile is ready. Setup took seconds.", next: "Tap ADD YOUR PRODUCTS." },
    productsEmpty: { step: 3, doing: "The shop has no products yet.", next: "Tap ADD PRODUCT." },
    productForm: { step: 3, doing: "Adding a product: name, cost price, selling price and how many you have.", next: "Tap Save Product." },
    productsList: { step: 3, doing: "Products are in the shop. Keep adding until all four are in.", next: "Tap ADD PRODUCT, then see what your stock is worth." },
    inventory: { step: 3, doing: "Bizora works out what your stock is worth and what it can earn.", next: "Tap START A SALE." },
    sale: { step: 4, doing: "Making the first sale: choose products, the customer and how they pay.", next: "Follow the hint at the bottom of the phone." },
    saleDone: { step: 4, doing: "The sale is recorded and the stock has gone down by what was sold.", next: "Tap GENERATE RECEIPT." },
    receipt: { step: 5, doing: "The receipt for Sarah is ready, with every item and the total.", next: "Tap SEND VIA WHATSAPP." },
    waReady: { step: 5, doing: "The receipt is prepared. Sarah's phone number is already filled in.", next: "Tap OPEN WHATSAPP." },
    waChat: { step: 5, doing: "WhatsApp opens with the receipt message ready to send.", next: "Tap the green send button." },
    waSent: { step: 5, doing: "The receipt has been shared with Sarah.", next: "Tap SEE YOUR UPDATED NUMBERS." },
    updated: { step: 5, doing: "Your numbers already changed: stock, sales and cash collected.", next: "Tap FINISH." },
    complete: { step: 6, doing: "That is the whole journey, from an empty business to a shared receipt.", next: "Start your free trial, or restart the demo." }
  };

  var state, history, timers = [], busy = false, instant = false, touched = false;
  var els = {};

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function later(fn, ms) { timers.push(setTimeout(fn, reduceMotion || instant ? 0 : ms)); }
  function cancelTimers() { timers.forEach(clearTimeout); timers = []; }

  function nowText() {
    var d = new Date();
    var mon = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][d.getMonth()];
    var p = function (n) { return (n < 10 ? "0" : "") + n; };
    return p(d.getDate()) + " " + mon + " " + d.getFullYear() + ", " + p(d.getHours()) + ":" + p(d.getMinutes());
  }

  /* ------------------------------------------------------------ state */
  function reset() {
    cancelTimers();
    state = { screen: "download", model: M.initialState(), toast: "" };
    history = [];
    touched = false;
    instant = false;
    render();
  }

  function go(screen, model, extra) {
    // The install animation is a transition, not a place to come back to.
    if (state.screen !== "installing") history.push({ screen: state.screen, model: state.model });
    state = { screen: screen, model: model || state.model, toast: (extra && extra.toast) || "" };
    instant = false;
    render();
  }

  function back() {
    if (!history.length) return;
    cancelTimers();
    var prev = history.pop();
    state = { screen: prev.screen, model: prev.model, toast: "" };
    instant = true; // forms re-open already filled in
    render();
  }

  /* -------------------------------------------------------- actions */
  var ACTIONS = {
    install: function () { go("installing"); later(function () { go("installed"); }, 1500); },
    open: function () { go("setup"); },
    finishSetup: function () { go("setupDone", M.finishSetup(state.model)); },
    goProducts: function () { go("productsEmpty"); },
    openForm: function () { go("productForm"); },
    saveProduct: function () {
      var m = M.addProduct(state.model);
      var added = m.products[m.products.length - 1];
      go("productsList", m, { toast: added.name + " saved to your products" });
    },
    showInventory: function () { go("inventory"); },
    startSale: function () { go("sale"); },
    completeSale: function () {
      if (!M.canCompleteSale(state.model)) return;
      go("saleDone", M.completeSale(state.model, nowText()));
    },
    showReceipt: function () { go("receipt"); },
    shareWhatsapp: function () { go("waReady"); },
    openWhatsapp: function () { go("waChat"); },
    sendWa: function () { go("waSent", M.markShared(state.model)); },
    showUpdated: function () { go("updated"); },
    finish: function () { go("complete"); },
    restart: reset,

    /* sale screen: same model, same screen, so no history entry */
    addToCart: function (id) { setModel(M.addToCart(state.model, id)); },
    setQty: function (id, qty) { setModel(M.setCartQty(state.model, id, qty)); },
    selectCustomer: function () { setModel(M.selectCustomer(state.model)); },
    selectCash: function () { setModel(M.selectCash(state.model)); },
    selectCredit: function () { flash("Credit sales are part of Bizora too. This demo uses a cash sale."); },
    inert: function (_, label) { flash(label); }
  };

  function setModel(m) {
    state.model = m;
    state.toast = "";
    renderScreen(true);
    renderChrome();
  }

  function flash(text) {
    state.toast = text;
    var t = els.screen.querySelector(".app-toast");
    if (t) { t.textContent = text; t.hidden = false; }
  }

  /** What "Next" does on each screen: the same thing the on-screen button does. */
  function autoAction() {
    var s = state.screen, m = state.model;
    switch (s) {
      case "download": return { run: ACTIONS.install };
      case "installed": return { run: ACTIONS.open };
      case "setup": return busy ? null : { run: ACTIONS.finishSetup };
      case "setupDone": return { run: ACTIONS.goProducts };
      case "productsEmpty": return { run: ACTIONS.openForm };
      case "productForm": return busy ? null : { run: ACTIONS.saveProduct };
      case "productsList": return { run: m.products.length < M.DEMO_CATALOG.length ? ACTIONS.openForm : ACTIONS.showInventory };
      case "inventory": return { run: ACTIONS.startSale };
      case "sale": return { run: saleNext };
      case "saleDone": return { run: ACTIONS.showReceipt };
      case "receipt": return { run: ACTIONS.shareWhatsapp };
      case "waReady": return { run: ACTIONS.openWhatsapp };
      case "waChat": return { run: ACTIONS.sendWa };
      case "waSent": return { run: ACTIONS.showUpdated };
      case "updated": return { run: ACTIONS.finish };
      default: return null;
    }
  }

  function saleNext() {
    var m = state.model, ids = ["body-lotion", "face-cream"];
    for (var i = 0; i < ids.length; i++) {
      if (m.cart.length < 2 && !m.cart.some(function (l) { return l.id === ids[i]; })) return ACTIONS.addToCart(ids[i]);
    }
    if (!m.cart.length) return ACTIONS.addToCart(ids[0]);
    if (!m.customer) return ACTIONS.selectCustomer();
    if (m.payment !== "cash") return ACTIONS.selectCash();
    return ACTIONS.completeSale();
  }

  /* ----------------------------------------------------- typing effect */
  function typeInto(list, onDone) {
    busy = true;
    var fi = 0, ci = 0;
    (function tick() {
      if (fi >= list.length) { busy = false; onDone(); return; }
      var f = list[fi], el = els.screen.querySelector(f.sel);
      if (!el) { busy = false; return; }
      if (reduceMotion || instant) { el.textContent = f.text; fi++; tick(); return; }
      el.classList.add("is-typing");
      ci++;
      el.textContent = f.text.slice(0, ci);
      if (ci >= f.text.length) { el.classList.remove("is-typing"); fi++; ci = 0; later(tick, 220); }
      else later(tick, 32);
    })();
  }

  function enable(sel) {
    var b = els.screen.querySelector(sel);
    if (b) b.disabled = false;
    renderChrome();
  }

  /* ------------------------------------------------------- screens */
  var money = M.money, fmt = M.fmt;

  function appHeader(title, sub) {
    return '<header class="app-head"><h3>' + esc(title) + "</h3>" + (sub ? "<p>" + esc(sub) + "</p>" : "") + "</header>";
  }
  function field(label, id, value) {
    return '<div class="field"><span class="field__label">' + esc(label) + '</span><div class="field__box" id="' + id + '" data-final="' + esc(value || "") + '"></div></div>';
  }
  function btn(action, label, cls, extra) {
    return '<button type="button" class="btn ' + (cls || "btn-primary") + ' demo-btn" data-act="' + action + '"' + (extra || "") + ">" + label + "</button>";
  }
  function toastHtml() { return '<div class="app-toast" role="status"' + (state.toast ? "" : " hidden") + ">" + esc(state.toast) + "</div>"; }

  function productRows(products) {
    return products.map(function (p) {
      return '<li class="plist__row"><div><strong>' + esc(p.name) + '</strong><span>' + esc(p.category) + " · Cost " + fmt(p.cost) +
        '</span></div><div class="plist__r"><strong>' + fmt(p.price) + "</strong><span>Stock: " + p.qty + "</span></div></li>";
    }).join("");
  }

  var SCREENS = {
    download: function () {
      return '<div class="browser"><span aria-hidden="true">🔒</span> bizora-cm.netlify.app</div>' +
        '<div class="splash"><img src="/assets/logos/bizora-logo.28e13026.png" alt="Bizora logo" width="72" height="72">' +
        '<h3 class="splash__word">BIZORA</h3><p>Business management made simple.</p><p class="splash__lead">Start your 30-day free trial.</p>' +
        btn("install", "DOWNLOAD NOW — 30 DAYS FREE", "btn-primary", ' id="demo-download"') + "</div>";
    },
    installing: function () {
      return '<div class="splash splash--center"><img src="/assets/logos/bizora-logo.28e13026.png" alt="" width="72" height="72">' +
        '<p class="splash__lead">Installing Bizora…</p><div class="progress" role="progressbar" aria-label="Installing Bizora"><span class="progress__bar"></span></div></div>';
    },
    installed: function () {
      return '<div class="splash splash--center"><img src="/assets/logos/bizora-logo.28e13026.png" alt="Bizora app icon" width="72" height="72">' +
        '<p class="splash__ok" role="status">✓ Bizora installed</p><p>Ready on your phone. No data bundle needed to use it.</p>' +
        btn("open", "OPEN BIZORA", "btn-primary", ' id="demo-open"') + "</div>";
    },
    setup: function () {
      return appHeader("Set up your business", "Takes 30 seconds. You can change this later in Settings.") +
        '<div class="app-body">' + field("Business name", "f-name", M.BUSINESS.name) + field("Business type", "f-type", M.BUSINESS.type) +
        field("Currency", "f-cur", M.BUSINESS.currency) + field("Phone number (optional)", "f-phone", M.BUSINESS.phone) +
        btn("finishSetup", "Get Started", "btn-primary", ' id="demo-setup-go" disabled') + "</div>";
    },
    setupDone: function () {
      var b = state.model.business;
      return '<div class="app-body app-body--center"><p class="splash__ok" role="status">✓ Business profile ready</p>' +
        '<div class="app-card"><strong>' + esc(b.name) + "</strong><span>" + esc(b.type) + " · " + esc(b.currency) + " · " + esc(b.phone) + "</span></div>" +
        "<p>Your shop is set up. Now tell Bizora what you sell.</p>" + btn("goProducts", "ADD YOUR PRODUCTS", "btn-primary", ' id="demo-add-products"') + "</div>";
    },
    productsEmpty: function () {
      return appHeader("Products", "0 total products") + '<div class="app-body app-body--center"><div class="empty" aria-hidden="true">📦</div><p><strong>No products yet</strong></p>' +
        "<p>Add what you sell, with the cost price, selling price and stock.</p>" + btn("openForm", "ADD PRODUCT", "btn-primary", ' id="demo-add-product"') + "</div>";
    },
    productForm: function () {
      var p = M.catalogProduct(state.model.products.length);
      return appHeader("Add Product", "Product " + (state.model.products.length + 1) + " of " + M.DEMO_CATALOG.length) +
        '<div class="app-body">' + field("Product name", "f-pname", p.name) + field("Category", "f-pcat", p.category) +
        field("Cost price (what you paid)", "f-pcost", fmt(p.cost)) + field("Selling price", "f-pprice", fmt(p.price)) +
        field("Opening stock (pcs)", "f-pqty", String(p.qty)) + btn("saveProduct", "Save Product", "btn-primary", ' id="demo-save-product" disabled') + "</div>";
    },
    productsList: function () {
      var m = state.model, more = m.products.length < M.DEMO_CATALOG.length;
      return appHeader("Products", m.products.length + " total product" + (m.products.length === 1 ? "" : "s")) +
        '<div class="app-body"><ul class="plist" aria-label="Your products">' + productRows(m.products) + "</ul>" + toastHtml() +
        (more ? btn("openForm", "ADD PRODUCT", "btn-primary", ' id="demo-add-product"') : btn("showInventory", "SEE WHAT YOUR STOCK IS WORTH", "btn-primary", ' id="demo-see-inventory"')) + "</div>";
    },
    inventory: function () {
      var m = state.model, t = M.inventoryTotals(m.products);
      var rows = m.products.map(function (p) {
        return "<tr><td>" + esc(p.name) + "</td><td>" + p.qty + " × " + fmt(p.cost) + " = " + fmt(p.qty * p.cost) + "</td><td>" + p.qty + " × " + fmt(p.price) + " = " + fmt(p.qty * p.price) + "</td></tr>";
      }).join("");
      return appHeader("Financial Summary", "Inventory potential") + '<div class="app-body">' +
        statCard("Inventory Value", t.value, "Cost of stock on hand", "demo-inv-value") +
        statCard("Projected Revenue", t.revenue, "If all current stock sells at listed price", "demo-inv-revenue") +
        statCard("Projected Profit", t.profit, "Potential profit still sitting in stock", "demo-inv-profit", true) +
        '<details class="how"><summary>How these are worked out</summary><table><thead><tr><th>Product</th><th>Cost value</th><th>Sales value</th></tr></thead><tbody>' + rows +
        "</tbody></table></details>" +
        '<p class="splash__ok" role="status">Your shop is ready to sell.</p>' + btn("startSale", "START A SALE", "btn-primary", ' id="demo-start-sale"') + "</div>";
    },
    sale: function () { return saleScreen(); },
    saleDone: function () {
      var s = state.model.sale;
      var rows = s.stockChanges.map(function (c) { return "<li><span>" + esc(c.name) + "</span><span>" + c.before + " → <strong>" + c.after + "</strong> in stock</span></li>"; }).join("");
      return '<div class="app-body app-body--center"><p class="splash__ok" role="status">✓ Sale completed</p><p class="big" id="demo-sale-total">' + money(s.total) + "</p>" +
        "<p>Cash sale to " + esc(s.customer) + ". Paid in full, nothing owed.</p>" +
        '<div class="app-card app-card--list"><strong>Stock updated automatically</strong><ul class="stocklist" id="demo-stock-changes">' + rows + "</ul></div>" +
        btn("showReceipt", "GENERATE RECEIPT", "btn-primary", ' id="demo-gen-receipt"') + "</div>";
    },
    receipt: function () {
      var m = state.model, s = m.sale, b = m.business;
      var lines = s.lines.map(function (l) { return "<tr><td>" + esc(l.name) + " x" + l.qty + "</td><td>" + money(l.amount) + "</td></tr>"; }).join("");
      return appHeader("Receipt ready", "") + '<div class="app-body"><div class="receipt" id="demo-receipt">' +
        '<p class="receipt__biz"><strong>' + esc(b.name) + "</strong><br>" + esc(b.phone) + "</p>" +
        '<dl class="receipt__meta"><div><dt>Receipt #</dt><dd id="r-no">' + esc(s.receiptNo) + "</dd></div><div><dt>Date</dt><dd>" + esc(s.date) + "</dd></div><div><dt>Customer</dt><dd id=\"r-cust\">" + esc(s.customer) + "</dd></div></dl>" +
        '<table class="receipt__lines"><tbody>' + lines + "</tbody></table>" +
        '<table class="receipt__lines receipt__lines--total"><tbody><tr><td>Subtotal</td><td>' + money(s.subtotal) + '</td></tr><tr class="grand"><td>TOTAL</td><td id="r-total">' + money(s.total) + "</td></tr>" +
        "<tr><td>Amount paid</td><td>" + money(s.paid) + "</td></tr><tr><td>Change</td><td>" + money(s.change) + "</td></tr><tr><td>Payment</td><td>" + esc(s.method) + "</td></tr></tbody></table>" +
        '<p class="receipt__thanks">Thank you for your business!<br><small>Powered by BIZORA</small></p></div>' + toastHtml() +
        btn("shareWhatsapp", "SEND VIA WHATSAPP", "btn-wa", ' id="demo-send-wa"') +
        '<div class="two"><button type="button" class="btn btn-secondary demo-btn" data-act="inert" data-label="Download is simulated in this demo. Nothing is saved.">Download</button>' +
        '<button type="button" class="btn btn-secondary demo-btn" data-act="inert" data-label="Printing is simulated in this demo. Nothing is printed.">Print Receipt</button></div></div>';
    },
    waReady: function () {
      var s = state.model.sale;
      return appHeader("Share receipt", "") + '<div class="app-body app-body--center"><p class="splash__ok" role="status">✓ Receipt ready to share</p>' +
        "<p>Your receipt has been prepared for " + esc(s.customer) + ".</p>" +
        '<div class="app-card"><strong>Receipt #' + esc(s.receiptNo) + "</strong><span>" + money(s.total) + " · " + esc(M.CUSTOMER.phone) + "</span></div>" +
        btn("openWhatsapp", "OPEN WHATSAPP", "btn-wa", ' id="demo-open-wa"') + "</div>";
    },
    waChat: function () { return waScreen(false); },
    waSent: function () { return waScreen(true); },
    updated: function () {
      var d = M.dashboard(state.model), before = M.inventoryTotals(M.DEMO_CATALOG);
      return appHeader("Stock and numbers updated", "Right after the sale") + '<div class="app-body">' +
        statCard("Inventory Value", d.inventoryValue, "Was " + fmt(before.value) + " before the sale", "demo-new-value") +
        statCard("Projected Revenue", d.projectedRevenue, "Was " + fmt(before.revenue), "demo-new-revenue") +
        statCard("Projected Profit", d.projectedProfit, "Was " + fmt(before.profit), "demo-new-profit", true) +
        statCard("Total Sales", d.totalSales, "Cash sale to " + esc(state.model.sale.customer), "demo-new-sales") +
        statCard("Cash Collected", d.cashCollected, "Money in your hand", "demo-new-cash") +
        btn("finish", "FINISH", "btn-primary", ' id="demo-finish"') + "</div>";
    },
    complete: function () {
      // SiteConfig is a top-level const (not a window property), so reference it by name.
      var trial = (typeof SiteConfig !== "undefined" && SiteConfig.urls && SiteConfig.urls.trial) || "/pages/pricing.html";
      return '<div class="app-body app-body--center complete" id="demo-complete"><h3>Your shop is now running with Bizora.</h3><p>You have:</p>' +
        '<ul class="checks"><li>Set up your business</li><li>Added products</li><li>Seen your inventory value</li><li>Seen projected revenue and profit</li><li>Completed your first sale</li><li>Generated a receipt</li><li>Shared it through WhatsApp</li></ul>' +
        '<a class="btn btn-primary demo-btn" id="demo-trial" href="' + esc(trial) + '" data-cta="trial" rel="noopener noreferrer">START YOUR 30-DAY FREE TRIAL</a>' +
        '<a class="btn btn-secondary demo-btn" id="demo-explore" href="/pages/features.html">EXPLORE BIZORA</a></div>';
    }
  };

  function statCard(label, value, note, id, accent) {
    return '<div class="stat' + (accent ? " stat--accent" : "") + '"><span class="stat__label">' + esc(label) + '</span><strong class="stat__value" id="' + id + '">' + money(value) + '</strong><span class="stat__note">' + note + "</span></div>";
  }

  function saleScreen() {
    var m = state.model, lines = M.cartLines(m), total = M.cartTotal(m);
    var products = m.products.map(function (p) {
      var line = m.cart.filter(function (l) { return l.id === p.id; })[0];
      var ctrl = line
        ? '<div class="qty"><button type="button" class="qty__b" aria-label="Remove one ' + esc(p.name) + '" data-act="setQty" data-id="' + p.id + '" data-qty="' + (line.qty - 1) + '">−</button>' +
          '<span class="qty__n" aria-label="Quantity">' + line.qty + '</span><button type="button" class="qty__b" aria-label="Add one ' + esc(p.name) + '" data-act="setQty" data-id="' + p.id + '" data-qty="' + (line.qty + 1) + '">+</button></div>'
        : '<button type="button" class="btn btn-secondary demo-add" aria-label="Add ' + esc(p.name) + ' to the sale" data-act="addToCart" data-id="' + p.id + '">Add</button>';
      return '<li class="sprod"><div><strong>' + esc(p.name) + "</strong><span>" + money(p.price) + "</span><span>Stock: " + p.qty + "</span></div>" + ctrl + "</li>";
    }).join("");
    var cartRows = lines.map(function (l) { return "<li><span>" + esc(l.name) + " × " + l.qty + "</span><span>" + money(l.amount) + "</span></li>"; }).join("");
    var hint = !m.cart.length ? "Tap Add next to Body Lotion."
      : m.cart.length < 2 ? "Now add a second product: Face Cream."
      : !m.customer ? "Choose the customer: tap Sarah."
      : m.payment !== "cash" ? "Choose Cash Sale."
      : "Everything is ready. Tap COMPLETE SALE.";
    return appHeader("Start a Sale", "Cash or credit, one tap each") + '<div class="app-body">' +
      '<div class="field"><span class="field__label">Customer</span><div class="field__box field__box--static" id="demo-customer">' + (m.customer ? esc(m.customer.name) : '<span class="muted">Walk-in / Select customer…</span>') + "</div>" +
      (m.customer ? "" : '<button type="button" class="chip" data-act="selectCustomer" id="demo-pick-customer">+ Sarah (new customer)</button>') + "</div>" +
      '<p class="field__label">Products</p><ul class="slist" aria-label="Products to sell">' + products + "</ul>" +
      '<div class="cart" aria-live="polite"><ul>' + (cartRows || '<li class="muted">No items yet</li>') + '</ul><p class="cart__total"><span>Running total</span><strong id="demo-running-total">' + money(total) + "</strong></p></div>" +
      '<p class="field__label">Payment</p><div class="pay" role="radiogroup" aria-label="Payment type">' +
      '<button type="button" role="radio" aria-checked="' + (m.payment === "cash") + '" class="pay__o' + (m.payment === "cash" ? " is-on" : "") + '" data-act="selectCash" id="demo-cash"><strong>Cash Sale</strong><span>Paid in full now. No debt created.</span></button>' +
      '<button type="button" role="radio" aria-checked="false" class="pay__o pay__o--off" data-act="selectCredit"><strong>Credit Sale</strong><span>Adds to the customer\'s balance.</span></button></div>' +
      (m.payment === "cash" ? '<div class="cart__total"><span>Amount received</span><strong>' + money(total) + '</strong></div><div class="cart__total"><span>Change returned</span><strong>' + money(0) + "</strong></div>" : "") +
      toastHtml() + '<p class="hint" id="demo-hint">' + hint + "</p>" +
      btn("completeSale", "COMPLETE SALE", "btn-primary", ' id="demo-complete-sale"' + (M.canCompleteSale(m) ? "" : " disabled")) + "</div>";
  }

  function waScreen(sent) {
    var m = state.model, s = m.sale, msg = M.whatsappMessage(m);
    var bubble = '<div class="wa__bubble">' + esc(msg).replace(/\n/g, "<br>") + '<div class="wa__file">📄 Receipt-' + esc(s.receiptNo) + '.html</div><span class="wa__time">' + esc(s.date.split(", ")[1] || "") + (sent ? " ✓✓" : "") + "</span></div>";
    return '<div class="wa"><header class="wa__head"><strong>' + esc(s.customer) + "</strong><span>" + esc(M.CUSTOMER.phone) + '</span></header><div class="wa__chat">' +
      (sent ? bubble + '<p class="wa__done" role="status" id="demo-shared">✓ Receipt shared</p>' : '<p class="wa__empty">Today</p>') + "</div>" +
      (sent
        ? '<div class="wa__foot">' + btn("showUpdated", "SEE YOUR UPDATED NUMBERS", "btn-primary", ' id="demo-see-updated"') + "</div>"
        : '<div class="wa__compose"><div class="wa__draft" id="demo-wa-draft">' + esc(msg).replace(/\n/g, "<br>") + '<div class="wa__file">📄 Receipt-' + esc(s.receiptNo) + '.html</div></div>' +
          '<button type="button" class="wa__send" aria-label="Send the receipt to ' + esc(s.customer) + '" data-act="sendWa" id="demo-wa-send">➤</button></div>') + "</div>";
  }

  /* ---------------------------------------------------------- render */
  function renderScreen(keepScroll) {
    var top = els.screen.scrollTop;
    cancelTimersExceptInstall();
    busy = false;
    els.screen.innerHTML = SCREENS[state.screen]();
    els.screen.scrollTop = keepScroll ? top : 0;
    if (state.screen === "setup") startSetupTyping();
    if (state.screen === "productForm") startProductTyping();
    if (state.screen === "installing") {
      var bar = els.screen.querySelector(".progress__bar");
      if (bar) requestAnimationFrame(function () { requestAnimationFrame(function () { bar.style.width = "100%"; }); });
    }
  }
  function cancelTimersExceptInstall() { if (state.screen !== "installing") cancelTimers(); }

  function startSetupTyping() {
    var f = function (id) { return { sel: "#" + id, text: els.screen.querySelector("#" + id).getAttribute("data-final") }; };
    busy = true;
    typeInto([f("f-name"), f("f-type"), f("f-cur"), f("f-phone")], function () { enable("#demo-setup-go"); });
  }
  function startProductTyping() {
    var f = function (id) { return { sel: "#" + id, text: els.screen.querySelector("#" + id).getAttribute("data-final") }; };
    busy = true;
    typeInto([f("f-pname"), f("f-pcat"), f("f-pcost"), f("f-pprice"), f("f-pqty")], function () { enable("#demo-save-product"); });
  }

  function renderChrome() {
    var meta = META[state.screen];
    var cur = meta.step;
    // stepper
    els.stepper.innerHTML = STEPS.map(function (s) {
      var cls = cur > 5 || s.n < cur ? "is-done" : s.n === cur ? "is-current" : "";
      return '<li class="stepper__i ' + cls + '"' + (s.n === cur ? ' aria-current="step"' : "") + '><span class="stepper__n">0' + s.n + '</span><span class="stepper__l">' + s.label + "</span></li>";
    }).join("");
    // guide
    var title = cur > 5 ? "Done" : "Step " + cur + " of 5 · " + STEPS[cur - 1].label;
    els.guide.innerHTML = '<button type="button" class="demo__restart" id="demo-restart">Restart demo</button>' +
      '<p class="guide__step" id="demo-step-title">' + esc(title) + "</p>" +
      '<p class="guide__row guide__row--doing"><span>You are doing</span>' + esc(meta.doing) + "</p>" +
      '<p class="guide__row"><span>What happens next</span>' + esc(meta.next) + "</p>";
    // "this is interactive" cue
    var done = cur > 5;
    els.try.classList.toggle("is-started", touched || done);
    els.tryText.textContent = done
      ? "You did it! You just ran a shop on Bizora."
      : touched
        ? "Nice! Keep tapping the gold button inside the phone, or use Next."
        : "This is not a video. Tap the gold buttons inside the phone to try Bizora yourself.";
    // controls
    var auto = autoAction();
    els.back.disabled = history.length === 0;
    els.next.disabled = !auto;
  }

  function render() {
    renderScreen(false);
    renderChrome();
  }

  /* ------------------------------------------------------------ wiring */
  function build() {
    host.innerHTML =
      '<div class="container demo__inner">' +
      '<p class="demo__try" id="demo-try" role="status"><span class="demo__try-icon" aria-hidden="true">👆</span><span id="demo-try-text"></span></p>' +
      '<ol class="stepper" id="demo-stepper" aria-label="Demo progress"></ol>' +
      '<div class="demo__layout"><div class="demo__guide" id="demo-guide" aria-live="polite"></div>' +
      '<div class="demo__device"><div class="phone"><div class="phone__screen" id="demo-screen" role="region" aria-label="Bizora demo screen" tabindex="-1"></div></div>' +
      '<div class="demo__controls"><button type="button" class="btn btn-secondary demo-ctl" id="demo-back">← Back</button>' +
      '<button type="button" class="btn btn-primary demo-ctl" id="demo-next">Next →</button>' +
      '</div>' +
      '<p class="demo__note">Simulated demo with sample data. Nothing is downloaded, installed, printed or sent.</p></div></div></div>';
    els.stepper = host.querySelector("#demo-stepper");
    els.guide = host.querySelector("#demo-guide");
    els.try = host.querySelector("#demo-try");
    els.tryText = host.querySelector("#demo-try-text");
    els.screen = host.querySelector("#demo-screen");
    els.back = host.querySelector("#demo-back");
    els.next = host.querySelector("#demo-next");
    host.addEventListener("click", function (e) { if (e.target.closest("#demo-restart")) ACTIONS.restart(); });
    els.back.addEventListener("click", back);
    els.next.addEventListener("click", function () { var a = autoAction(); if (a) { touched = true; a.run(); } });
    els.screen.addEventListener("click", function (e) {
      var t = e.target.closest("[data-act]");
      if (!t || t.disabled) return;
      touched = true;
      var act = t.getAttribute("data-act"), id = t.getAttribute("data-id");
      if (act === "setQty") return ACTIONS.setQty(id, Number(t.getAttribute("data-qty")));
      if (act === "addToCart") return ACTIONS.addToCart(id);
      if (act === "inert") return ACTIONS.inert(null, t.getAttribute("data-label"));
      if (ACTIONS[act]) ACTIONS[act]();
    });
  }

  build();
  reset();
  host.setAttribute("data-demo-ready", "true");
})();
