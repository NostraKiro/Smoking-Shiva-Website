(() => {
  "use strict";

  const config = window.SHOP_CONFIG || {};
  const products = (window.SHOP_PRODUCTS || []).filter((product) => product.active !== false);
  const CART_KEY = "storefront-starter-cart-v1";
  const AGE_KEY = "storefront-starter-age-confirmed";
  const byId = (id) => document.getElementById(id);

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

  let selectedCategory = "all";
  let lastOrderText = "";
  let cart = readCart();

  function readCart() {
    try {
      const parsed = JSON.parse(localStorage.getItem(CART_KEY) || "{}");
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch (error) {
      return {};
    }
  }

  function saveCart() {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch (error) {
      // Cart still works in memory if browser storage is unavailable.
    }
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[character]);
  }

  function formatMoney(amount) {
    const value = Number(amount) || 0;
    try {
      return new Intl.NumberFormat("en-PH", {
        style: "currency", currency: config.currency || "PHP", maximumFractionDigits: 2
      }).format(value);
    } catch (error) {
      return `₱${value.toFixed(2)}`;
    }
  }

  function getProduct(id) {
    return products.find((product) => product.id === id);
  }

  function getCartLines() {
    return Object.entries(cart)
      .map(([id, quantity]) => ({ product: getProduct(id), quantity: Number(quantity) }))
      .filter((line) => line.product && Number.isInteger(line.quantity) && line.quantity > 0);
  }

  function totalQuantity() {
    return getCartLines().reduce((sum, line) => sum + line.quantity, 0);
  }

  function subtotal() {
    return getCartLines().reduce((sum, line) => sum + line.product.price * line.quantity, 0);
  }

  function renderBranding() {
    const name = config.shopName || "YOUR SHOP NAME";
    document.title = `${name} | Adult-only catalog`;
    byId("brand-name").textContent = name;
    byId("footer-brand-name").textContent = name;
    byId("footer-copyright-name").textContent = name;
    byId("current-year").textContent = String(new Date().getFullYear());
    byId("demo-banner").hidden = !config.demoMode;
  }

  function renderCategories() {
    const categories = [...new Set(products.map((product) => product.category))].sort();
    categoryFilters.innerHTML = "";
    const allCategories = ["all", ...categories];
    allCategories.forEach((category) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `filter-chip${selectedCategory === category ? " active" : ""}`;
      button.dataset.category = category;
      button.setAttribute("aria-pressed", String(selectedCategory === category));
      button.textContent = category === "all" ? "All items" : category;
      categoryFilters.appendChild(button);
    });
  }

  function renderProducts() {
    const query = searchInput.value.trim().toLowerCase();
    const filtered = products.filter((product) => {
      const categoryMatches = selectedCategory === "all" || product.category === selectedCategory;
      const searchMatches = `${product.name} ${product.description} ${product.category}`.toLowerCase().includes(query);
      return categoryMatches && searchMatches;
    });

    productGrid.innerHTML = filtered.map((product) => {
      const warning = product.nicotine
        ? "Government warning: This product is harmful and contains nicotine which is a highly addictive substance. It is not recommended for use by nonsmokers."
        : "Warning: This product may contain a substance that is harmful. It is not recommended for use by nonsmokers.";
      return `
        <article class="product-card">
          <div class="product-visual" aria-hidden="true">
            <span class="product-badge">Sample listing</span>
            <div class="product-shape ${escapeHtml(product.visual || "shape-tall")}"></div>
          </div>
          <div class="product-body">
            <p class="product-category">${escapeHtml(product.category)}</p>
            <h3>${escapeHtml(product.name)}</h3>
            <p class="product-description">${escapeHtml(product.description)}</p>
            <p class="product-warning">${escapeHtml(warning)}</p>
            <div class="product-meta"><span class="product-price">${formatMoney(product.price)}</span><span class="product-stock">Availability to confirm</span></div>
            <button class="button button-primary add-button" type="button" data-add="${escapeHtml(product.id)}">Add to cart <span aria-hidden="true">+</span></button>
          </div>
        </article>`;
    }).join("");
    emptyState.hidden = filtered.length > 0;
  }

  function renderCart() {
    const lines = getCartLines();
    const count = totalQuantity();
    cartCount.textContent = String(count);
    cartHeadingCount.textContent = `(${count})`;
    cartSubtotal.textContent = formatMoney(subtotal());
    cartEmpty.hidden = lines.length > 0;
    byId("clear-cart").disabled = lines.length === 0;
    byId("clear-cart").style.opacity = lines.length === 0 ? ".45" : "1";

    cartItems.innerHTML = lines.map(({ product, quantity }) => `
      <article class="cart-row">
        <div><div class="cart-item-name">${escapeHtml(product.name)}</div><span class="cart-item-unit">${formatMoney(product.price)} each · ${escapeHtml(product.category)}</span></div>
        <div class="quantity-control" aria-label="Quantity for ${escapeHtml(product.name)}">
          <button type="button" data-quantity="${escapeHtml(product.id)}" data-delta="-1" aria-label="Decrease ${escapeHtml(product.name)} quantity">−</button>
          <span>${quantity}</span>
          <button type="button" data-quantity="${escapeHtml(product.id)}" data-delta="1" aria-label="Increase ${escapeHtml(product.name)} quantity">+</button>
        </div>
        <div class="line-total">${formatMoney(product.price * quantity)}</div>
      </article>`).join("");
  }

  function addToCart(id) {
    if (!getProduct(id)) return;
    cart[id] = Math.min(99, (Number(cart[id]) || 0) + 1);
    saveCart();
    renderCart();
  }

  function changeQuantity(id, delta) {
    const next = (Number(cart[id]) || 0) + delta;
    if (next <= 0) delete cart[id];
    else cart[id] = Math.min(99, next);
    saveCart();
    renderCart();
  }

  function buildOrderText() {
    const lines = getCartLines();
    const customerName = byId("customer-name").value.trim();
    const customerEmail = byId("customer-email").value.trim();
    const customerPhone = byId("customer-phone").value.trim();
    const customerCity = byId("customer-city").value.trim();
    const productsText = lines.length
      ? lines.map(({ product, quantity }) => `- ${product.name} × ${quantity} — ${formatMoney(product.price * quantity)}`).join("\n")
      : "(Cart is empty)";

    return [
      `Order request for ${config.shopName || "the shop"}`,
      "IMPORTANT: This is a request only. No purchase is confirmed.",
      "",
      `Name: ${customerName}`,
      `Email: ${customerEmail}`,
      `Contact number: ${customerPhone}`,
      `City / municipality: ${customerCity}`,
      "",
      "Requested items:",
      productsText,
      "",
      `Estimated subtotal: ${formatMoney(subtotal())}`,
      "Delivery fee and final total: to be confirmed by the shop.",
      "Age and delivery identity checks must be completed using the legally required process.",
      config.demoMode ? "DEMO MODE: Sample catalog only; do not process this as a real order." : ""
    ].filter(Boolean).join("\n");
  }

  function showAgeGate() {
    const confirmed = sessionStorage.getItem(AGE_KEY) === "yes";
    ageGate.hidden = confirmed;
    storefront.hidden = !confirmed;
    if (confirmed) {
      renderBranding();
      renderCategories();
      renderProducts();
      renderCart();
    }
  }

  byId("age-confirm").addEventListener("click", () => {
    sessionStorage.setItem(AGE_KEY, "yes");
    ageMessage.textContent = "";
    showAgeGate();
    window.scrollTo({ top: 0, behavior: "instant" });
  });

  byId("age-decline").addEventListener("click", () => {
    sessionStorage.removeItem(AGE_KEY);
    storefront.hidden = true;
    ageMessage.textContent = "You cannot access this website. Please leave this page.";
    byId("age-title").textContent = "Access denied";
    byId("age-confirm").hidden = true;
    byId("age-decline").textContent = "Understood";
    byId("age-decline").onclick = () => {
      ageMessage.textContent = "Please close this browser tab.";
    };
  });

  searchInput.addEventListener("input", renderProducts);
  categoryFilters.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-category]");
    if (!button) return;
    selectedCategory = button.dataset.category;
    renderCategories();
    renderProducts();
  });

  productGrid.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-add]");
    if (!button) return;
    addToCart(button.dataset.add);
    const originalText = button.innerHTML;
    button.textContent = "Added to cart ✓";
    window.setTimeout(() => { if (button.isConnected) button.innerHTML = originalText; }, 900);
  });

  cartItems.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-quantity]");
    if (!button) return;
    changeQuantity(button.dataset.quantity, Number(button.dataset.delta));
  });

  byId("clear-cart").addEventListener("click", () => {
    cart = {};
    saveCart();
    renderCart();
    orderPreview.hidden = true;
    orderStatus.textContent = "Cart cleared.";
  });

  orderForm.addEventListener("submit", (event) => {
    event.preventDefault();
    orderStatus.textContent = "";
    if (!orderForm.reportValidity()) return;
    if (getCartLines().length === 0) {
      orderStatus.textContent = "Add at least one item to your cart before preparing an order request.";
      byId("cart").scrollIntoView({ behavior: "smooth" });
      return;
    }

    lastOrderText = buildOrderText();
    orderPreviewText.textContent = lastOrderText;
    orderPreview.hidden = false;

    if (config.demoMode) {
      emailOrderLink.hidden = true;
      orderStatus.textContent = "Demo only: request preview created locally. Nothing has been sent.";
    } else {
      const subject = `Order request — ${config.shopName || "Online shop"}`;
      emailOrderLink.href = `mailto:${encodeURIComponent(config.orderEmail || "")}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lastOrderText)}`;
      emailOrderLink.hidden = false;
      orderStatus.textContent = "Review the request below. Open the email draft, then press Send in your email app.";
    }
    orderPreview.scrollIntoView({ behavior: "smooth", block: "nearest" });
  });

  copyOrderButton.addEventListener("click", async () => {
    if (!lastOrderText) return;
    try {
      await navigator.clipboard.writeText(lastOrderText);
      copyOrderButton.textContent = "Copied ✓";
    } catch (error) {
      const textArea = document.createElement("textarea");
      textArea.value = lastOrderText;
      textArea.setAttribute("readonly", "");
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.select();
      const copied = document.execCommand("copy");
      textArea.remove();
      copyOrderButton.textContent = copied ? "Copied ✓" : "Select text above to copy";
    }
    window.setTimeout(() => { copyOrderButton.textContent = "Copy request"; }, 1400);
  });

  showAgeGate();
})();
