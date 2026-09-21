/* =========================================================
   LUQMA - SCRIPT.JS
   ========================================================= */

const state = {
  cart: new Map(),
  paymentMethod: "",
  upiApp: "GPAY",
  paymentMarkedPaid: false,
  orderCode: ""
};

const $ = (id) => document.getElementById(id);


/* =========================================================
   START
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  setupPage();
  bindEvents();
  renderMenu();
  renderCart();
});


/* =========================================================
   PAGE SETUP
   ========================================================= */

function setupPage() {

  const c = LUQMA_CONFIG;

  $("menuTitle").textContent = c.menuName;
  $("menuNameHero").textContent = c.menuName;

  $("statusText").textContent =
    c.shopOpen
      ? "Orders Open"
      : "Orders Closed";

  $("statusPill").classList.toggle(
    "closed",
    !c.shopOpen
  );

  $("closedBanner").classList.toggle(
    "hidden",
    c.shopOpen
  );


  /* WhatsApp Community */

  const groupLink =
    $("groupLinkBottom");

  if (groupLink) {

    if (
      c.whatsappGroupLink &&
      c.whatsappGroupLink.trim()
    ) {

      groupLink.href =
        c.whatsappGroupLink.trim();

      groupLink.target =
        "_blank";

      groupLink.rel =
        "noopener";

    } else {

      groupLink.href = "#";

      groupLink.addEventListener(
        "click",
        (event) => {

          event.preventDefault();

          alert(
            "WhatsApp Community link is not added yet. Paste it in menu.js."
          );

        }
      );
    }
  }
}


/* =========================================================
   EVENTS
   ========================================================= */

function bindEvents() {

  $("openCartBtn").addEventListener(
    "click",
    openCheckout
  );


  $("closeCheckoutBtn").addEventListener(
    "click",
    closeCheckout
  );


  $("checkoutOverlay").addEventListener(
    "click",
    (event) => {

      if (
        event.target ===
        $("checkoutOverlay")
      ) {

        closeCheckout();

      }
    }
  );


  /* FINAL ORDER */

  $("orderForm").addEventListener(
    "submit",
    sendOrderToWhatsApp
  );


  /* =====================================================
     PAYMENT METHOD
     ===================================================== */

  document
    .querySelectorAll(
      'input[name="paymentMethod"]'
    )
    .forEach((input) => {

      input.addEventListener(
        "change",
        (event) => {

          state.paymentMethod =
            event.target.value;

          state.paymentMarkedPaid =
            false;

          const paidConfirm =
            $("paidConfirm");

          if (paidConfirm) {
            paidConfirm.checked = false;
          }

          updatePaymentUI();
        }
      );
    });


  /* =====================================================
     UPI APP
     ===================================================== */

  document
    .querySelectorAll(
      'input[name="upiApp"]'
    )
    .forEach((input) => {

      input.addEventListener(
        "change",
        (event) => {

          state.upiApp =
            event.target.value;

          updatePaymentUI();

        }
      );
    });


  /* =====================================================
     PAYMENT CONFIRMATION
     ===================================================== */

  $("paidConfirm").addEventListener(
    "change",
    () => {

      state.paymentMarkedPaid =
        $("paidConfirm").checked;

      updatePaymentUI();

    }
  );


  /* CLOSED MODAL */

  $("closeClosedModal").addEventListener(
    "click",
    () => {

      toggleOverlay(
        "closedOverlay",
        false
      );

    }
  );


  $("closedOverlay").addEventListener(
    "click",
    (event) => {

      if (
        event.target ===
        $("closedOverlay")
      ) {

        toggleOverlay(
          "closedOverlay",
          false
        );

      }
    }
  );
}


/* =========================================================
   ACTIVE MENU
   ========================================================= */

function activeItems() {

  return LUQMA_CONFIG.items.filter(
    (item) => item.active
  );
}


/* =========================================================
   MENU
   ========================================================= */

function renderMenu() {

  const items =
    activeItems();

  $("noMenu").classList.toggle(
    "hidden",
    items.length > 0
  );


  $("menuGrid").innerHTML =
    items
      .map((item) => {

        const selectedQty =
          state.cart.get(item.id) || 0;

        const availableQty =
          Math.max(
            0,
            Number(item.quantity || 0)
          );

        const soldOut =
          availableQty <= 0;


        return `

          <article class="dish-card">

            <div class="dish-visual">

              <img
                src="${escapeHtml(item.image)}"
                alt="${escapeHtml(item.name)}"
                loading="lazy"

                onerror="
                  this.src='https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=1200&fit=crop'
                "
              />

            </div>


            <div class="dish-body">

              <div class="dish-top">

                <h3 class="dish-title">
                  ${escapeHtml(item.name)}
                </h3>

                <span class="price">
                  ${money(item.price)}
                </span>

              </div>


              <p class="dish-desc">
                ${escapeHtml(
                  item.description || ""
                )}
              </p>


              <div class="dish-bottom">

                ${
                  soldOut
                    ? `
                      <span class="sold-badge">
                        SOLD OUT
                      </span>
                    `
                    : `
                      <div
                        class="qty-control"
                        aria-label="Quantity selector for ${escapeHtml(
                          item.name
                        )}"
                      >

                        <button
                          type="button"
                          aria-label="Decrease quantity"

                          onclick="
                            changeQty(
                              '${safeJs(item.id)}',
                              -1
                            )
                          "

                          ${
                            selectedQty <= 0
                              ? "disabled"
                              : ""
                          }
                        >
                          −
                        </button>


                        <span class="qty-number">
                          ${selectedQty}
                        </span>


                        <button
                          type="button"
                          aria-label="Increase quantity"

                          onclick="
                            changeQty(
                              '${safeJs(item.id)}',
                              1
                            )
                          "

                          ${
                            selectedQty >= availableQty ||
                            !LUQMA_CONFIG.shopOpen
                              ? "disabled"
                              : ""
                          }
                        >
                          +
                        </button>

                      </div>
                    `
                }

              </div>

            </div>

          </article>

        `;

      })
      .join("");
}


/* =========================================================
   QUANTITY
   ========================================================= */

window.changeQty =
  function changeQty(
    id,
    delta
  ) {

    if (!LUQMA_CONFIG.shopOpen) {

      toggleOverlay(
        "closedOverlay",
        true
      );

      return;
    }


    const item =
      LUQMA_CONFIG.items.find(
        (entry) =>
          entry.id === id
      );


    if (
      !item ||
      !item.active
    ) {

      return;
    }


    const current =
      state.cart.get(id) || 0;


    const maximum =
      Math.max(
        0,
        Number(item.quantity || 0)
      );


    const next =
      Math.max(
        0,
        Math.min(
          maximum,
          current + delta
        )
      );


    if (next > 0) {

      state.cart.set(
        id,
        next
      );

    } else {

      state.cart.delete(id);

    }


    renderMenu();
    renderCart();
  };


/* =========================================================
   CART
   ========================================================= */

function cartRows() {

  return [
    ...state.cart.entries()
  ]
    .map(([id, qty]) => {

      const item =
        LUQMA_CONFIG.items.find(
          (entry) =>
            entry.id === id
        );

      return item
        ? {
            item,
            qty
          }
        : null;

    })
    .filter(Boolean);
}


function cartTotal() {

  return cartRows().reduce(
    (sum, row) =>
      sum +
      row.qty *
      Number(
        row.item.price || 0
      ),
    0
  );
}


/* =========================================================
   CART DISPLAY
   ========================================================= */

function renderCart() {

  const rows =
    cartRows();


  const itemCount =
    rows.reduce(
      (sum, row) =>
        sum + row.qty,
      0
    );


  const total =
    cartTotal();


  $("cartCount").textContent =
    `${itemCount} item${
      itemCount === 1
        ? ""
        : "s"
    }`;


  $("cartTotal").textContent =
    money(total);


  $("checkoutTotal").textContent =
    money(total);


  $("cartBar").classList.toggle(
    "visible",

    itemCount > 0 &&
    LUQMA_CONFIG.shopOpen
  );


  $("orderLines").innerHTML =
    rows.length

      ? rows
          .map(
            ({ item, qty }) => `

              <div class="order-line">

                <div>

                  <strong>
                    ${escapeHtml(
                      item.name
                    )}
                  </strong>

                  <small>
                    ${qty}
                    ×
                    ${money(item.price)}
                  </small>

                </div>


                <strong>
                  ${money(
                    qty *
                    Number(
                      item.price || 0
                    )
                  )}
                </strong>

              </div>

            `
          )
          .join("")

      : `
          <p>
            Your cart is empty.
          </p>
        `;


  updatePaymentUI();
}


/* =========================================================
   CHECKOUT
   ========================================================= */

function openCheckout() {

  if (!LUQMA_CONFIG.shopOpen) {

    toggleOverlay(
      "closedOverlay",
      true
    );

    return;
  }


  if (!cartRows().length) {
    return;
  }


  if (!state.orderCode) {

    state.orderCode =
      makeOrderCode();

  }


  updatePaymentUI();


  toggleOverlay(
    "checkoutOverlay",
    true
  );
}


function closeCheckout() {

  toggleOverlay(
    "checkoutOverlay",
    false
  );
}


function toggleOverlay(
  id,
  show
) {

  const overlay =
    $(id);


  overlay.classList.toggle(
    "hidden",
    !show
  );


  overlay.setAttribute(
    "aria-hidden",
    show
      ? "false"
      : "true"
  );


  document.body.classList.toggle(
    "no-scroll",
    show
  );
}


/* =========================================================
   PAYMENT UI
   ========================================================= */

function updatePaymentUI() {

  const upiPanel =
    $("upiPanel");

  const finalButton =
    $("finalOrderBtn");

  const finalText =
    $("finalOrderBtnText");


  if (
    !upiPanel ||
    !finalButton ||
    !finalText
  ) {

    return;
  }


  const total =
    cartTotal();

  const method =
    state.paymentMethod;


  /* =====================================================
     SHOW / HIDE UPI PANEL
     ===================================================== */

  upiPanel.classList.toggle(
    "hidden",
    method !== "UPI"
  );


  /* =====================================================
     ONLINE PAYMENT
     ===================================================== */

  if (method === "UPI") {

    if (!state.orderCode) {

      state.orderCode =
        makeOrderCode();

    }


    $("upiAmount").textContent =
      money(total);


    $("upiIdText").textContent =
      LUQMA_CONFIG.upiId;


    $("upiPayeeText").textContent =
      LUQMA_CONFIG.upiPayeeName;


    /* Static LUQMA QR */

    $("upiQrImage").src =
      "assets/images/QrCode.jpg";


    const upiPayBtn =
      $("upiPayBtn");


    /* GOOGLE PAY */

    if (
      state.upiApp === "GPAY"
    ) {

      upiPayBtn.href =
        buildGooglePayUri(
          total,
          state.orderCode
        );


      upiPayBtn.textContent =
        `Open Google Pay • ${money(total)}`;

    }

    /* OTHER UPI APP */

    else {

      upiPayBtn.href =
        buildUpiUri(
          total,
          state.orderCode
        );


      upiPayBtn.textContent =
        `Pay ${money(total)} via UPI`;

    }
  }


  /* =====================================================
     NO PAYMENT METHOD
     ===================================================== */

  if (!method) {

    finalButton.disabled =
      true;


    finalText.textContent =
      "Choose payment method";


    return;
  }


  /* =====================================================
     COD
     ===================================================== */

  if (method === "COD") {

    finalButton.disabled =
      false;


    finalText.textContent =
      "Place COD Order";


    return;
  }


  /* =====================================================
     UPI
     ===================================================== */

  if (method === "UPI") {

    finalButton.disabled =
      !state.paymentMarkedPaid;


    finalText.textContent =
      state.paymentMarkedPaid
        ? "Place Paid Order"
        : "Complete payment first";
  }
}


/* =========================================================
   STANDARD UPI LINK
   ========================================================= */

function buildUpiUri(
  total,
  orderCode
) {

  const params =
    new URLSearchParams({

      pa:
        LUQMA_CONFIG.upiId,

      pn:
        LUQMA_CONFIG.upiPayeeName,

      am:
        Number(
          total || 0
        ).toFixed(2),

      cu:
        "INR",

      tn:
        `LUQMA ${orderCode}`

    });


  return (
    `upi://pay?${params.toString()}`
  );
}


/* =========================================================
   GOOGLE PAY ANDROID DEEP LINK
   ========================================================= */

function buildGooglePayUri(
  total,
  orderCode
) {

  const params =
    new URLSearchParams({

      pa:
        LUQMA_CONFIG.upiId,

      pn:
        LUQMA_CONFIG.upiPayeeName,

      am:
        Number(
          total || 0
        ).toFixed(2),

      cu:
        "INR",

      tn:
        `LUQMA ${orderCode}`

    });


  return (
    `intent://pay?${params.toString()}` +
    `#Intent;` +
    `scheme=upi;` +
    `package=com.google.android.apps.nbu.paisa.user;` +
    `end`
  );
}


/* =========================================================
   SEND ORDER TO WHATSAPP
   ========================================================= */

function sendOrderToWhatsApp(
  event
) {

  event.preventDefault();


  /* SHOP CLOSED */

  if (!LUQMA_CONFIG.shopOpen) {

    closeCheckout();


    toggleOverlay(
      "closedOverlay",
      true
    );


    return;
  }


  /* CART */

  const rows =
    cartRows();


  if (!rows.length) {

    alert(
      "Your cart is empty."
    );

    return;
  }


  /* CUSTOMER DETAILS */

  const name =
    $("customerName")
      .value
      .trim();


  const phone =
    String(
      $("customerPhone")
        .value || ""
    )
      .replace(
        /\D/g,
        ""
      );


  const address =
    $("customerAddress")
      .value
      .trim();


  if (
    !name ||
    !phone ||
    !address
  ) {

    alert(
      "Please fill in your name, phone number and address."
    );

    return;
  }


  if (phone.length < 10) {

    alert(
      "Please enter a valid phone number."
    );

    return;
  }


  /* PAYMENT METHOD */

  if (!state.paymentMethod) {

    alert(
      "Please choose a payment method."
    );

    return;
  }


  /* ONLINE PAYMENT */

  if (
    state.paymentMethod === "UPI" &&
    !state.paymentMarkedPaid
  ) {

    alert(
      "Please complete the UPI payment and tick the payment confirmation box, or choose Cash on Delivery."
    );

    return;
  }


  const total =
    cartTotal();


  /* ORDER CODE */

  if (!state.orderCode) {

    state.orderCode =
      makeOrderCode();

  }


  const orderId =
    state.orderCode;


  /* =====================================================
     PAYMENT TEXT
     ===================================================== */

  let paymentMethodText;
  let paymentStatusText;


  if (
    state.paymentMethod === "UPI"
  ) {

    paymentMethodText =
      state.upiApp === "GPAY"
        ? "Google Pay"
        : "UPI App";


    paymentStatusText =
      "PAID — CUSTOMER MARKED PAID";

  } else {

    paymentMethodText =
      "Cash on Delivery";


    paymentStatusText =
      "PENDING — COD";
  }


  /* =====================================================
     WHATSAPP MESSAGE
     ===================================================== */

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

    ...rows.map(
      ({ item, qty }) =>

        `• ${qty} × ${item.name} — ${moneyPlain(
          qty *
          Number(
            item.price || 0
          )
        )}`
    ),

    "",

    `*Total:* ${moneyPlain(
      total
    )}`,

    "",

    `*Payment Method:* ${paymentMethodText}`,

    `*Payment Status:* ${paymentStatusText}`,

    "",

    "Please confirm my order. ❤️"

  ];


  const message =
    encodeURIComponent(
      messageLines.join("\n")
    );


  const whatsappUrl =
    `https://wa.me/${LUQMA_CONFIG.orderWhatsApp}?text=${message}`;


  /* =====================================================
     BUTTON FEEDBACK
     ===================================================== */

  const finalButton =
    $("finalOrderBtn");


  const finalText =
    $("finalOrderBtnText");


  finalButton.disabled =
    true;


  finalText.textContent =
    "Opening WhatsApp...";


  /*
   * Same-page redirect is generally
   * more reliable on mobile.
   */

  window.location.href =
    whatsappUrl;


  /*
   * Restore button if customer returns.
   */

  setTimeout(
    () => {

      finalButton.disabled =
        false;


      if (
        state.paymentMethod === "UPI"
      ) {

        finalText.textContent =
          "Place Paid Order";

      } else {

        finalText.textContent =
          "Place COD Order";

      }

    },
    1500
  );
}


/* =========================================================
   ORDER CODE
   ========================================================= */

function makeOrderCode() {

  const date =
    new Date();


  const dd =
    String(
      date.getDate()
    ).padStart(
      2,
      "0"
    );


  const mm =
    String(
      date.getMonth() + 1
    ).padStart(
      2,
      "0"
    );


  const yy =
    String(
      date.getFullYear()
    ).slice(-2);


  const random =
    Math.floor(
      100 +
      Math.random() *
      900
    );


  return (
    `LQ-${dd}${mm}${yy}-${random}`
  );
}


/* =========================================================
   MONEY
   ========================================================= */

function money(value) {

  return new Intl.NumberFormat(
    "en-IN",
    {

      style:
        "currency",

      currency:
        "INR",

      maximumFractionDigits:
        0

    }
  ).format(
    Number(
      value || 0
    )
  );
}


function moneyPlain(value) {

  return (
    `₹${Number(
      value || 0
    ).toLocaleString(
      "en-IN"
    )}`
  );
}


/* =========================================================
   SECURITY / ESCAPING
   ========================================================= */

function escapeHtml(
  value = ""
) {

  return String(value)

    .replaceAll(
      "&",
      "&amp;"
    )

    .replaceAll(
      "<",
      "&lt;"
    )

    .replaceAll(
      ">",
      "&gt;"
    )

    .replaceAll(
      '"',
      "&quot;"
    )

    .replaceAll(
      "'",
      "&#039;"
    );
}


function safeJs(
  value = ""
) {

  return String(value)

    .replaceAll(
      "\\",
      "\\\\"
    )

    .replaceAll(
      "'",
      "\\'"
    );
}