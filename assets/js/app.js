
(() => {
  "use strict";

  // ==========================================
  // SMOKING SHIVA - STOREFRONT APPLICATION
  // ==========================================

  const config = window.SHOP_CONFIG || {};
  const products = (window.SHOP_PRODUCTS || []).filter(
    (product) => product.active !== false
  );

  const CART_KEY = "smoking-shiva-cart-v1";
  const AGE_KEY = "smoking-shiva-age-confirmed";

  const byId = (id) => document.getElementById(id);

  // Existing HTML elements
  const ageGate = byId("age-gate");
  const storefront = byId("storefront");
  const ageMessage = byId("age-message");
  const productGrid = byId("product-grid");
  const categoryFilters = byId("category-filters");
  const searchInput = byId("search-input");
  const emptyState = byId("empty-state");
  const cartItems = byId("cart-items");
  const cartEmpty = byId("cart-empty");
  const cartCount = byId("cart-count");
  const cartHeadingCount = byId("cart-heading-count");
  const cartSubtotal = byId("cart-subtotal");
  const orderForm = byId("order-form");
  const orderStatus = byId("order-status");
  const orderPreview = byId("order-preview");
  const orderPreviewText = byId("order-preview-text");
const copyOrderButton = byId("copy-order");
const emailOrderLink = byId("email-order");
const printReceiptButton = byId("print-receipt");

  let selectedCategory = "all";
  let lastOrderText = "";
  let cart = readCart();

  // ==========================================
  // GENERAL HELPERS
  // ==========================================

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[character]);
  }

  function formatMoney(amount) {
    const value = Number(amount) || 0;

    try {
      return new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: config.currency || "PHP",
        maximumFractionDigits: 2
      }).format(value);
    } catch (error) {
      return `₱${value.toFixed(2)}`;
    }
  }

  function readCart() {
    try {
      const saved = JSON.parse(localStorage.getItem(CART_KEY) || "{}");
      return saved && typeof saved === "object" && !Array.isArray(saved)
        ? saved
        : {};
    } catch (error) {
      return {};
    }
  }

  function saveCart() {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch (error) {
      // The cart can still work during the current page session.
    }
  }

  function getProduct(id) {
    return products.find((product) => product.id === id);
  }

  function getCartLines() {
    return Object.entries(cart)
      .map(([id, quantity]) => ({
        product: getProduct(id),
        quantity: Number(quantity)
      }))
      .filter(
        (line) =>
          line.product &&
          Number.isInteger(line.quantity) &&
          line.quantity > 0
      );
  }

  function totalQuantity() {
    return getCartLines().reduce((sum, line) => sum + line.quantity, 0);
  }

  function subtotal() {
    return getCartLines().reduce(
      (sum, line) => sum + Number(line.product.price) * line.quantity,
      0
    );
  }

  // ==========================================
  // BRANDING AND LOGO
  // ==========================================

  function renderBranding() {
    const name = config.shopName || "Smoking Shiva";

    document.title = `${name} | Online Catalog`;

    if (byId("brand-name")) {
      byId("brand-name").textContent = name;
    }

    if (byId("footer-brand-name")) {
      byId("footer-brand-name").textContent = name;
    }

    if (byId("footer-copyright-name")) {
      byId("footer-copyright-name").textContent = name;
    }

    if (byId("current-year")) {
      byId("current-year").textContent = String(
        new Date().getFullYear()
      );
    }

    const demoBanner = byId("demo-banner");

    if (demoBanner) {
      demoBanner.hidden = !config.demoMode;
    }

    // Add the logo beside the existing brand name.
    const brandName = byId("brand-name");

    if (brandName && config.logo) {
      let logo = byId("brand-logo");

      if (!logo) {
        logo = document.createElement("img");
        logo.id = "brand-logo";
        logo.className = "brand-logo";
        logo.alt = `${name} logo`;

        brandName.parentElement.insertBefore(logo, brandName);
      }

      logo.src = config.logo;
      logo.alt = `${name} logo`;
    }

    // Apply the brand's gold accent color.
    const root = document.documentElement;
    const colors = config.colors || {};

    root.style.setProperty("--color-accent", colors.gold || "#a37e2c");
    root.style.setProperty("--color-accent-ink", "#ffffff");
  }

  // ==========================================
  // PRODUCT CATEGORIES
  // ==========================================

  function renderCategories() {
    if (!categoryFilters) return;

    const categories = [
      ...new Set(products.map((product) => product.category).filter(Boolean))
    ].sort();

    categoryFilters.innerHTML = "";

    ["all", ...categories].forEach((category) => {
      const button = document.createElement("button");

      button.type = "button";
      button.className =
        `filter-chip${selectedCategory === category ? " active" : ""}`;
      button.dataset.category = category;
      button.setAttribute(
        "aria-pressed",
        String(selectedCategory === category)
      );

      button.textContent = category === "all" ? "All items" : category;

      categoryFilters.appendChild(button);
    });
  }

  // ==========================================
  // PRODUCT DISPLAY
  // ==========================================

  function renderProducts() {
    if (!productGrid || !searchInput) return;

    const query = searchInput.value.trim().toLowerCase();

    const filtered = products.filter((product) => {
      const categoryMatches =
        selectedCategory === "all" ||
        product.category === selectedCategory;

      const searchText =
        `${product.name || ""} ${product.description || ""} ${product.category || ""}`
          .toLowerCase();

      return categoryMatches && searchText.includes(query);
    });

    productGrid.innerHTML = filtered.map((product) => {
      const warning = product.nicotine
        ? "Government warning: This product is harmful and contains nicotine, which is highly addictive. It is not recommended for use by nonsmokers."
        : "Warning: This product may contain a harmful substance. It is not recommended for use by nonsmokers.";

      const imageMarkup = product.image
        ? `
          <div class="product-visual">
            <img
              class="product-image"
              src="${escapeHtml(product.image)}"
              alt="${escapeHtml(product.name)} product photo"
              loading="lazy"
              onerror="this.hidden=true; this.nextElementSibling.hidden=false;"
            >
            <span class="image-fallback" hidden>
              Product image unavailable
            </span>
          </div>
        `
        : `
          <div class="product-visual">
            <span class="image-fallback">
              Product photo coming soon
            </span>
          </div>
        `;

      return `
        <article class="product-card">
          ${imageMarkup}

          <div class="product-body">
            <p class="product-category">
              ${escapeHtml(product.category || "Products")}
            </p>

            <h3>${escapeHtml(product.name)}</h3>

            <p class="product-description">
              ${escapeHtml(product.description || "")}
            </p>

            <p class="product-warning">
              ${escapeHtml(warning)}
            </p>

            <div class="product-meta">
              <span class="product-price">
                ${formatMoney(product.price)}
              </span>
              <span class="product-stock">Availability to confirm</span>
            </div>

            <button
              class="button button-primary add-button"
              type="button"
              data-add="${escapeHtml(product.id)}"
            >
              Add to cart <span aria-hidden="true">+</span>
            </button>
          </div>
        </article>
      `;
    }).join("");

    if (emptyState) {
      emptyState.hidden = filtered.length > 0;
    }
  }

  // ==========================================
  // SHOPPING CART
  // ==========================================

  function renderCart() {
    const lines = getCartLines();
    const count = totalQuantity();

    if (cartCount) {
      cartCount.textContent = String(count);
    }

    if (cartHeadingCount) {
      cartHeadingCount.textContent = `(${count})`;
    }

    if (cartSubtotal) {
      cartSubtotal.textContent = formatMoney(subtotal());
    }

    if (cartEmpty) {
      cartEmpty.hidden = lines.length > 0;
    }

    const clearButton = byId("clear-cart");

    if (clearButton) {
      clearButton.disabled = lines.length === 0;
      clearButton.style.opacity = lines.length === 0 ? "0.45" : "1";
    }

    if (!cartItems) return;

    cartItems.innerHTML = lines.map(({ product, quantity }) => `
      <article class="cart-row">
        <div>
          <div class="cart-item-name">
            ${escapeHtml(product.name)}
          </div>

          <span class="cart-item-unit">
            ${formatMoney(product.price)} each
          </span>
        </div>

        <div
          class="quantity-control"
          aria-label="Quantity for ${escapeHtml(product.name)}"
        >
          <button
            type="button"
            data-quantity="${escapeHtml(product.id)}"
            data-delta="-1"
            aria-label="Decrease quantity"
          >−</button>

          <span>${quantity}</span>

          <button
            type="button"
            data-quantity="${escapeHtml(product.id)}"
            data-delta="1"
            aria-label="Increase quantity"
          >+</button>
        </div>

        <div class="line-total">
          ${formatMoney(Number(product.price) * quantity)}
        </div>
      </article>
    `).join("");
  }

  function addToCart(id) {
    if (!getProduct(id)) return;

    cart[id] = Math.min(99, (Number(cart[id]) || 0) + 1);

    saveCart();
    renderCart();
  }

  function changeQuantity(id, delta) {
    const next = (Number(cart[id]) || 0) + delta;

    if (next <= 0) {
      delete cart[id];
    } else {
      cart[id] = Math.min(99, next);
    }

    saveCart();
    renderCart();
  }

  // ==========================================
  // ORDER REQUEST
  // ==========================================

  function buildOrderText() {
    const lines = getCartLines();

    const customerName = byId("customer-name")?.value.trim() || "";
    const customerEmail = byId("customer-email")?.value.trim() || "";
    const customerPhone = byId("customer-phone")?.value.trim() || "";
    const customerCity = byId("customer-city")?.value.trim() || "";

    const itemsText = lines.map(({ product, quantity }) =>
      `- ${product.name} x ${quantity} — ${formatMoney(Number(product.price) * quantity)}`
    ).join("\n");

    return [
      `Order request for ${config.shopName || "Smoking Shiva"}`,
      "",
      "This is an order request only. It is not a confirmed purchase.",
      "",
      `Customer name: ${customerName}`,
      `Email: ${customerEmail || "Not provided"}`,
      `Contact number: ${customerPhone}`,
      `City / municipality: ${customerCity}`,
      "",
      "Requested items:",
      itemsText,
      "",
      `Estimated subtotal: ${formatMoney(subtotal())}`,
      "Delivery fee and final total: To be confirmed by the shop.",
      "",
      `Delivery area: ${config.deliveryRegion || "Albay"}`,
      `Pickup location: ${config.pickupLocation || "P6 UPPER BONGA BACACAY ALBAY"}`,
      "",
      "Please confirm availability, fulfillment arrangements, applicable legal requirements, and the final total with the shop.",
      config.demoMode
        ? "DEMO MODE: This preview is for testing only. Do not process it as a real order."
        : ""
    ].filter(Boolean).join("\n");
  }

  
  // ==========================================
  // PRINTABLE RECEIPT
  // ==========================================

  function openPrintableReceipt() {
    if (!lastOrderText) {
      if (orderStatus) {
        orderStatus.textContent =
          "Please prepare your order request first.";
      }
      return;
    }

    const receiptWindow = window.open("", "_blank");

    if (!receiptWindow) {
      if (orderStatus) {
        orderStatus.textContent =
          "The receipt tab was blocked. Allow pop-ups for this website and try again.";
      }
      return;
    }

    const lines = getCartLines();
    const customerName = byId("customer-name")?.value.trim() || "";
    const customerEmail = byId("customer-email")?.value.trim() || "";
    const customerPhone = byId("customer-phone")?.value.trim() || "";
    const customerCity = byId("customer-city")?.value.trim() || "";

    const shopName = config.shopName || "Smoking Shiva";
    const messengerUrl =
      config.messengerUrl || "https://m.me/shivamori.bermundo.4";

    const receiptNumber =
      "SS-" +
      new Date().toISOString()
        .replace(/[-:TZ.]/g, "")
        .slice(0, 14);

    const receiptDate = new Date().toLocaleString("en-PH", {
      dateStyle: "medium",
      timeStyle: "short"
    });

    const itemsHtml = lines.map(({ product, quantity }) => `
      <tr>
        <td>${escapeHtml(product.name)}</td>
        <td class="center">${quantity}</td>
        <td class="money">${escapeHtml(formatMoney(product.price))}</td>
        <td class="money">${escapeHtml(
          formatMoney(Number(product.price) * quantity)
        )}</td>
      </tr>
    `).join("");

    const receiptHtml = `
      <!doctype html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>${escapeHtml(shopName)} — Order Request Receipt</title>

        <style>
          :root {
            color-scheme: light;
            --gold: #a37e2c;
            --green: #006039;
            --ink: #222;
            --muted: #666;
            --line: #ddd;
          }

          * { box-sizing: border-box; }

          body {
            margin: 0;
            padding: 24px;
            background: #f1f1f1;
            color: var(--ink);
            font-family: Arial, Helvetica, sans-serif;
          }

          .receipt {
            max-width: 760px;
            margin: 0 auto;
            padding: 36px;
            background: white;
            border-top: 7px solid var(--gold);
            box-shadow: 0 4px 24px #00000012;
          }

          .header {
            text-align: center;
            padding-bottom: 22px;
            border-bottom: 1px solid var(--line);
          }

          .header h1 {
            margin: 0 0 8px;
            letter-spacing: 2px;
            font-size: 27px;
          }

          .eyebrow {
            color: var(--gold);
            font-size: 11px;
            font-weight: bold;
            letter-spacing: 2px;
          }

          .status {
            margin: 22px 0;
            padding: 13px;
            border: 1px solid var(--gold);
            background: #fffaf0;
            text-align: center;
            font-weight: bold;
            letter-spacing: .5px;
          }

          .details {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px 24px;
            margin: 22px 0;
          }

          .detail-label {
            display: block;
            margin-bottom: 4px;
            color: var(--muted);
            font-size: 12px;
          }

          .detail-value {
            overflow-wrap: anywhere;
            font-weight: 600;
          }

          h2 {
            margin: 26px 0 12px;
            font-size: 17px;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
          }

          th, td {
            padding: 12px 8px;
            border-bottom: 1px solid var(--line);
            text-align: left;
          }

          th {
            background: #f7f5ef;
            font-size: 11px;
            text-transform: uppercase;
          }

          .center { text-align: center; }
          .money { text-align: right; white-space: nowrap; }

          .total {
            margin-top: 18px;
            text-align: right;
            font-size: 20px;
            font-weight: bold;
          }

          .notice {
            margin-top: 24px;
            padding: 15px;
            background: #f7f5ef;
            font-size: 13px;
            line-height: 1.6;
          }

          .messenger {
            margin-top: 24px;
            padding: 20px;
            border: 1px solid var(--line);
            text-align: center;
          }

          .messenger a {
            display: inline-block;
            margin-top: 10px;
            padding: 12px 18px;
            background: var(--green);
            color: white;
            text-decoration: none;
            font-weight: bold;
          }

          .actions {
            display: flex;
            justify-content: center;
            flex-wrap: wrap;
            gap: 10px;
            margin: 24px auto;
          }

          .actions button, .actions a {
            border: 0;
            padding: 12px 16px;
            background: var(--gold);
            color: white;
            font: inherit;
            font-weight: bold;
            text-decoration: none;
            cursor: pointer;
          }

          .actions .secondary {
            background: #222;
          }

          .footer {
            margin-top: 25px;
            color: var(--muted);
            font-size: 11px;
            line-height: 1.5;
            text-align: center;
          }

          @media (max-width: 520px) {
            body { padding: 0; }
            .receipt { padding: 22px 15px; }
            .details { grid-template-columns: 1fr; }
            table { font-size: 11px; }
            th, td { padding: 9px 4px; }
            .total { font-size: 18px; }
          }

          @media print {
            body { padding: 0; background: white; }
            .receipt {
              max-width: none;
              padding: 10px;
              border-top: 4px solid var(--gold);
              box-shadow: none;
            }
            .actions, .messenger a { display: none !important; }
            .messenger { break-inside: avoid; }
            .notice { break-inside: avoid; }
            tr { break-inside: avoid; }
          }
        </style>
      </head>

      <body>
        <main class="receipt">
          <header class="header">
            <p class="eyebrow">ADULT-ONLY CATALOG</p>
            <h1>${escapeHtml(shopName.toUpperCase())}</h1>
            <p>Order Request Receipt</p>
          </header>

          <div class="status">
            ORDER REQUEST — AWAITING CONFIRMATION
          </div>

          <div class="details">
            <div>
              <span class="detail-label">Request reference</span>
              <span class="detail-value">${escapeHtml(receiptNumber)}</span>
            </div>
            <div>
              <span class="detail-label">Date prepared</span>
              <span class="detail-value">${escapeHtml(receiptDate)}</span>
            </div>
            <div>
              <span class="detail-label">Customer</span>
              <span class="detail-value">${escapeHtml(customerName)}</span>
            </div>
            <div>
              <span class="detail-label">Contact number</span>
              <span class="detail-value">${escapeHtml(customerPhone)}</span>
            </div>
            <div>
              <span class="detail-label">Email</span>
              <span class="detail-value">${escapeHtml(customerEmail)}</span>
            </div>
            <div>
              <span class="detail-label">City / Municipality</span>
              <span class="detail-value">${escapeHtml(customerCity)}</span>
            </div>
          </div>

          <h2>Requested items</h2>

          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th class="center">Qty</th>
                <th class="money">Unit price</th>
                <th class="money">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div class="total">
            Estimated subtotal: ${escapeHtml(formatMoney(subtotal()))}
          </div>

          <div class="notice">
            <strong>Important:</strong> This document records a request only.
            It is not a confirmed order, proof of payment, or sales invoice.
            Delivery fees, product availability, and the final total must be
            confirmed directly by the shop. No payment has been processed
            by this website.
            ${config.demoMode ? "<br><br><strong>DEMO MODE:</strong> This request is for testing only. Do not treat it as a real order." : ""}
          </div>

          <section class="messenger">
            <h2>What to do next</h2>
            <p>
              <strong>1.</strong> Take a screenshot of this receipt,
              or print it / save it as a PDF.
            </p>
            <p>
              <strong>2.</strong> Open Smoking Shiva Messenger and send
              the screenshot to the shop.
            </p>
            <p>
              <strong>3.</strong> Wait for the shop to confirm availability,
              delivery arrangements, and the final total.
            </p>
            <a href="${escapeHtml(messengerUrl)}"
               target="_blank"
               rel="noopener noreferrer">
              Send receipt through Messenger
            </a>
          </section>

          <div class="actions">
            <button onclick="window.print()">Print / Save as PDF</button>
            <button class="secondary"
                    onclick="window.open('${escapeHtml(messengerUrl)}', '_blank', 'noopener,noreferrer')">
              Open Messenger
            </button>
          </div>

          <footer class="footer">
            ${escapeHtml(shopName)} · ${escapeHtml(config.deliveryRegion || "Albay")}
            <br>
            Adult-only catalog. Follow applicable age-verification and delivery requirements.
            <br>
            Keep this receipt private because it contains your contact details.
          </footer>
        </main>
      </body>
      </html>
    `;

    receiptWindow.document.open();
    receiptWindow.document.write(receiptHtml);
    receiptWindow.document.close();
  }

  if (printReceiptButton) {
  printReceiptButton.addEventListener("click", (event) => {
    event.preventDefault();
    openPrintableReceipt();
  });

  printReceiptButton.style.position = "relative";
  printReceiptButton.style.zIndex = "5";
  printReceiptButton.style.pointerEvents = "auto";
}

  function prepareOrder(event) {
    event.preventDefault();

    if (orderStatus) {
      orderStatus.textContent = "";
    }

    if (!orderForm || !orderForm.reportValidity()) return;

    if (getCartLines().length === 0) {
      if (orderStatus) {
        orderStatus.textContent =
          "Your cart is empty. Add a product before preparing an order request.";
      }

      byId("cart")?.scrollIntoView({ behavior: "smooth" });
      return;
    }

    lastOrderText = buildOrderText();

    if (orderPreviewText) {
      orderPreviewText.textContent = lastOrderText;
    }

    if (orderPreview) {
      orderPreview.hidden = false;
    }

    if (config.demoMode) {
      if (emailOrderLink) {
        emailOrderLink.hidden = true;
      }

      if (orderStatus) {
        orderStatus.textContent =
          "Demo mode: Your order preview is ready, but nothing has been sent.";
      }
    } else {
      if (emailOrderLink) {
        emailOrderLink.href =
          config.messengerUrl || "https://m.me/shivamori.bermundo.4";

        emailOrderLink.target = "_blank";
        emailOrderLink.rel = "noopener noreferrer";
        emailOrderLink.textContent = "Continue in Messenger";
        emailOrderLink.hidden = false;
      }

      if (orderStatus) {
        orderStatus.textContent =
          "Review your request and copy it, then continue to Messenger to contact the shop. Your order is not confirmed until the shop replies.";
      }
    }

    orderPreview?.scrollIntoView({
      behavior: "smooth",
      block: "nearest"
    });
  }

  // ==========================================
  // AGE GATE
  // ==========================================

  function showAgeGate() {
    if (!ageGate || !storefront) return;

    let confirmed = false;

    try {
      confirmed = sessionStorage.getItem(AGE_KEY) === "yes";
    } catch (error) {
      // Keep the age gate visible if session storage is unavailable.
    }

    ageGate.hidden = confirmed;
    storefront.hidden = !confirmed;

    if (confirmed) {
      renderBranding();
      renderCategories();
      renderProducts();
      renderCart();
    }
  }

  const ageConfirm = byId("age-confirm");
  const ageDecline = byId("age-decline");

  if (ageConfirm) {
    ageConfirm.addEventListener("click", () => {
      try {
        sessionStorage.setItem(AGE_KEY, "yes");
      } catch (error) {
        // Access may continue for this page session.
      }

      if (ageMessage) {
        ageMessage.textContent = "";
      }

      showAgeGate();
      window.scrollTo({ top: 0, behavior: "auto" });
    });
  }

  if (ageDecline) {
    ageDecline.addEventListener("click", () => {
      try {
        sessionStorage.removeItem(AGE_KEY);
      } catch (error) {
        // Ignore unavailable session storage.
      }

      if (storefront) {
        storefront.hidden = true;
      }

      if (ageMessage) {
        ageMessage.textContent =
          "You cannot access this website. Please leave this page.";
      }

      if (byId("age-title")) {
        byId("age-title").textContent = "Access denied";
      }

      if (ageConfirm) {
        ageConfirm.hidden = true;
      }

      ageDecline.textContent = "Understood";
      ageDecline.onclick = () => {
        if (ageMessage) {
          ageMessage.textContent = "Please close this browser tab.";
        }
      };
    });
  }

  // ==========================================
  // SEARCH AND CATEGORY EVENTS
  // ==========================================

  if (searchInput) {
    searchInput.addEventListener("input", renderProducts);
  }

  if (categoryFilters) {
    categoryFilters.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-category]");

      if (!button) return;

      selectedCategory = button.dataset.category;

      renderCategories();
      renderProducts();
    });
  }

  // ==========================================
  // ADD TO CART EVENTS
  // ==========================================

  if (productGrid) {
    productGrid.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-add]");

      if (!button) return;

      addToCart(button.dataset.add);

      const originalText = button.innerHTML;
      button.textContent = "Added to cart ✓";

      window.setTimeout(() => {
        if (button.isConnected) {
          button.innerHTML = originalText;
        }
      }, 900);
    });
  }

  if (cartItems) {
    cartItems.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-quantity]");

      if (!button) return;

      changeQuantity(
        button.dataset.quantity,
        Number(button.dataset.delta)
      );
    });
  }

  // ==========================================
  // CLEAR CART
  // ==========================================

  const clearCartButton = byId("clear-cart");

  if (clearCartButton) {
    clearCartButton.addEventListener("click", () => {
      cart = {};

      saveCart();
      renderCart();

      if (orderPreview) {
        orderPreview.hidden = true;
      }

      if (orderStatus) {
        orderStatus.textContent = "Cart cleared.";
      }
    });
  }

  // ==========================================
  // ORDER FORM EVENTS
  // ==========================================

  if (orderForm) {
    orderForm.addEventListener("submit", prepareOrder);
  }

  // ==========================================
  // COPY ORDER REQUEST
  // ==========================================

  if (copyOrderButton) {
    copyOrderButton.addEventListener("click", async () => {
      if (!lastOrderText) return;

      let copied = false;

      try {
        await navigator.clipboard.writeText(lastOrderText);
        copied = true;
      } catch (error) {
        const textArea = document.createElement("textarea");

        textArea.value = lastOrderText;
        textArea.setAttribute("readonly", "");
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";

        document.body.appendChild(textArea);
        textArea.select();

        try {
          copied = document.execCommand("copy");
        } catch (copyError) {
          copied = false;
        }

        textArea.remove();
      }

      copyOrderButton.textContent = copied
        ? "Copied ✓"
        : "Please copy the text manually";

      window.setTimeout(() => {
        if (copyOrderButton.isConnected) {
          copyOrderButton.textContent = "Copy request";
        }
      }, 1600);
    });
  }

  // ==========================================
  // START THE WEBSITE
  // ==========================================

  showAgeGate();

})();
