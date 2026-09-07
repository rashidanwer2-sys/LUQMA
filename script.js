const state = {
  cart: new Map(),
  paymentMethod: "",
  paymentMarkedPaid: false,
  orderCode: ""
};

const $ = (id) => document.getElementById(id);

document.addEventListener("DOMContentLoaded", () => {
  setupPage();
  bindEvents();
  renderMenu();
  renderCart();
});

function setupPage() {
  const c = LUQMA_CONFIG;

  $("menuTitle").textContent = c.menuName;
  $("menuNameHero").textContent = c.menuName;
  $("statusText").textContent = c.shopOpen ? "Orders Open" : "Orders Closed";
  $("statusPill").classList.toggle("closed", !c.shopOpen);
  $("closedBanner").classList.toggle("hidden", c.shopOpen);

  const groupLink = $("groupLinkBottom");
  if (groupLink) {
    if (c.whatsappGroupLink && c.whatsappGroupLink.trim()) {
      groupLink.href = c.whatsappGroupLink.trim();
      groupLink.target = "_blank";
      groupLink.rel = "noopener";
    } else {
      groupLink.href = "#";
      groupLink.addEventListener("click", (event) => {
        event.preventDefault();
        alert("WhatsApp Community link is not added yet. Paste it in menu.js.");
      });
    }
  }
}

function bindEvents() {
  $("openCartBtn").addEventListener("click", openCheckout);
  $("closeCheckoutBtn").addEventListener("click", closeCheckout);

  $("checkoutOverlay").addEventListener("click", (event) => {
    if (event.target === $("checkoutOverlay")) closeCheckout();
  });

  $("orderForm").addEventListener("submit", sendOrderToWhatsApp);

  document.querySelectorAll('input[name="paymentMethod"]').forEach((input) => {
    input.addEventListener("change", (event) => {
      state.paymentMethod = event.target.value;
      state.paymentMarkedPaid = false;
      $("paidConfirm").checked = false;
      updatePaymentUI();
    });
  });

  $("paidConfirm").addEventListener("change", () => {
    state.paymentMarkedPaid = $("paidConfirm").checked;
    updatePaymentUI();
  });

  $("closeClosedModal").addEventListener("click", () => {
    toggleOverlay("closedOverlay", false);
  });

  $("closedOverlay").addEventListener("click", (event) => {
    if (event.target === $("closedOverlay")) {
      toggleOverlay("closedOverlay", false);
    }
  });
}

function activeItems() {
  return LUQMA_CONFIG.items.filter((item) => item.active);
}

function renderMenu() {
  const items = activeItems();
  $("noMenu").classList.toggle("hidden", items.length > 0);

  $("menuGrid").innerHTML = items.map((item) => {
    const selectedQty = state.cart.get(item.id) || 0;
    const availableQty = Math.max(0, Number(item.quantity || 0));
    const soldOut = availableQty <= 0;

    return `
      <article class="dish-card">
        <div class="dish-visual">
          <img
            src="${escapeHtml(item.image)}"
            alt="${escapeHtml(item.name)}"
            loading="lazy"
            onerror="this.src='https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=1200&fit=crop'"
          />
        </div>

        <div class="dish-body">
          <div class="dish-top">
            <h3 class="dish-title">${escapeHtml(item.name)}</h3>
            <span class="price">${money(item.price)}</span>
          </div>

          <p class="dish-desc">${escapeHtml(item.description || "")}</p>

          <div class="dish-bottom">
            ${soldOut ? `<span class="sold-badge">SOLD OUT</span>` : ""}

            ${
              soldOut
                ? ""
                : `
                  <div class="qty-control" aria-label="Quantity selector for ${escapeHtml(item.name)}">
                    <button
                      type="button"
                      aria-label="Decrease quantity"
                      onclick="changeQty('${safeJs(item.id)}', -1)"
                      ${selectedQty <= 0 ? "disabled" : ""}
                    >−</button>

                    <span class="qty-number">${selectedQty}</span>

                    <button
                      type="button"
                      aria-label="Increase quantity"
                      onclick="changeQty('${safeJs(item.id)}', 1)"
                      ${selectedQty >= availableQty || !LUQMA_CONFIG.shopOpen ? "disabled" : ""}
                    >+</button>
                  </div>
                `
            }
          </div>
        </div>
      </article>
    `;
  }).join("");
}

window.changeQty = function changeQty(id, delta) {
  if (!LUQMA_CONFIG.shopOpen) {
    toggleOverlay("closedOverlay", true);
    return;
  }

  const item = LUQMA_CONFIG.items.find((entry) => entry.id === id);
  if (!item || !item.active) return;

  const current = state.cart.get(id) || 0;
  const maximum = Math.max(0, Number(item.quantity || 0));
  const next = Math.max(0, Math.min(maximum, current + delta));

  if (next > 0) {
    state.cart.set(id, next);
  } else {
    state.cart.delete(id);
  }

  renderMenu();
  renderCart();
};

function cartRows() {
  return [...state.cart.entries()]
    .map(([id, qty]) => {
      const item = LUQMA_CONFIG.items.find((entry) => entry.id === id);
      return item ? { item, qty } : null;
    })
    .filter(Boolean);
}

function cartTotal() {
  return cartRows().reduce(
    (sum, row) => sum + row.qty * Number(row.item.price || 0),
    0
  );
}

function renderCart() {
  const rows = cartRows();
  const itemCount = rows.reduce((sum, row) => sum + row.qty, 0);
  const total = cartTotal();

  $("cartCount").textContent = `${itemCount} item${itemCount === 1 ? "" : "s"}`;
  $("cartTotal").textContent = money(total);
  $("checkoutTotal").textContent = money(total);

  $("cartBar").classList.toggle(
    "visible",
    itemCount > 0 && LUQMA_CONFIG.shopOpen
  );

  $("orderLines").innerHTML = rows.length
    ? rows.map(({ item, qty }) => `
        <div class="order-line">
          <div>
            <strong>${escapeHtml(item.name)}</strong>
            <small>${qty} × ${money(item.price)}</small>
          </div>
          <strong>${money(qty * Number(item.price || 0))}</strong>
        </div>
      `).join("")
    : `<p>Your cart is empty.</p>`;

  updatePaymentUI();
}

function openCheckout() {
  if (!LUQMA_CONFIG.shopOpen) {
    toggleOverlay("closedOverlay", true);
    return;
  }

  if (!cartRows().length) return;

  if (!state.orderCode) {
    state.orderCode = makeOrderCode();
  }

  updatePaymentUI();
  toggleOverlay("checkoutOverlay", true);
}

function closeCheckout() {
  toggleOverlay("checkoutOverlay", false);
}

function toggleOverlay(id, show) {
  const overlay = $(id);
  overlay.classList.toggle("hidden", !show);
  overlay.setAttribute("aria-hidden", show ? "false" : "true");
  document.body.classList.toggle("no-scroll", show);
}

function updatePaymentUI() {
  const upiPanel = $("upiPanel");
  if (!upiPanel) return;

  const total = cartTotal();
  const method = state.paymentMethod;

  upiPanel.classList.toggle("hidden", method !== "UPI");

  if (method === "UPI") {
    if (!state.orderCode) {
      state.orderCode = makeOrderCode();
    }

    const upiUri = buildUpiUri(total, state.orderCode);

    $("upiAmount").textContent = money(total);
    $("upiPayBtnAmount").textContent = money(total);
    $("upiIdText").textContent = LUQMA_CONFIG.upiId;
    $("upiPayeeText").textContent = LUQMA_CONFIG.upiPayeeName;
    $("upiPayBtn").href = upiUri;

    $("upiQrImage").src =
      "https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=8&data=" +
      encodeURIComponent(upiUri);
  }

  const finalButton = $("finalOrderBtn");
  const finalText = $("finalOrderBtnText");

  if (!method) {
    finalButton.disabled = true;
    finalText.textContent = "Choose payment method";
    return;
  }

  if (method === "COD") {
    finalButton.disabled = false;
    finalText.textContent = "Place COD Order";
    return;
  }

  finalButton.disabled = !state.paymentMarkedPaid;
  finalText.textContent = state.paymentMarkedPaid
    ? "Place Paid Order"
    : "Complete payment first";
}

function buildUpiUri(total, orderCode) {
  const params = new URLSearchParams({
    pa: LUQMA_CONFIG.upiId,
    pn: LUQMA_CONFIG.upiPayeeName,
    am: Number(total || 0).toFixed(2),
    cu: "INR",
    tn: `LUQMA ${orderCode}`
  });

  return `upi://pay?${params.toString()}`;
}

function sendOrderToWhatsApp(event) {
  event.preventDefault();

  if (!LUQMA_CONFIG.shopOpen) {
    closeCheckout();
    toggleOverlay("closedOverlay", true);
    return;
  }

  const rows = cartRows();
  if (!rows.length) return;

  const name = $("customerName").value.trim();
  const phone = String($("customerPhone").value || "").replace(/\D/g, "");
  const address = $("customerAddress").value.trim();

  if (!name || !phone || !address) {
    alert("Please fill in your name, phone number and address.");
    return;
  }

  if (phone.length < 10) {
    alert("Please enter a valid phone number.");
    return;
  }

  if (!state.paymentMethod) {
    alert("Please choose a payment method.");
    return;
  }

  if (state.paymentMethod === "UPI" && !state.paymentMarkedPaid) {
    alert("Please complete the UPI payment and tick the payment confirmation box, or choose Cash on Delivery.");
    return;
  }

  const total = cartTotal();
  const orderId = state.orderCode || makeOrderCode();

  const paymentMethodText =
    state.paymentMethod === "UPI" ? "UPI / Online" : "Cash on Delivery";

  const paymentStatusText =
    state.paymentMethod === "UPI"
      ? "PAID — CUSTOMER MARKED PAID"
      : "PENDING — COD";

  const messageLines = [
    "🍽️ *LUQMA ORDER*",
    `*${LUQMA_CONFIG.menuName}*`,
    "",
    `*Order ID:* ${orderId}`,
    `*Name:* ${name}`,
    `*Phone:* ${phone}`,
    `*Address:* ${address}`,
    "",
    "*Order Details:*",
    ...rows.map(({ item, qty }) =>
      `• ${qty} × ${item.name} — ${moneyPlain(qty * Number(item.price || 0))}`
    ),
    "",
    `*Total:* ${moneyPlain(total)}`,
    "",
    `*Payment Method:* ${paymentMethodText}`,
    `*Payment Status:* ${paymentStatusText}`,
    "",
    "Please confirm my order. ❤️"
  ];

  const whatsappUrl =
    `https://wa.me/${LUQMA_CONFIG.orderWhatsApp}?text=` +
    encodeURIComponent(messageLines.join("\n"));

  window.open(whatsappUrl, "_blank", "noopener");
}

function makeOrderCode() {
  const date = new Date();

  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yy = String(date.getFullYear()).slice(-2);
  const random = Math.floor(100 + Math.random() * 900);

  return `LQ-${dd}${mm}${yy}-${random}`;
}

function money(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(Number(value || 0));
}

function moneyPlain(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function safeJs(value = "") {
  return String(value)
    .replaceAll("\\", "\\\\")
    .replaceAll("'", "\\'");
}
 