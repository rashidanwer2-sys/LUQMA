const state={
  cart:new Map(),
  paymentMethod:"",
  paymentMarkedPaid:false,
  orderCode:""
};

const $=id=>document.getElementById(id);

document.addEventListener("DOMContentLoaded",()=>{
  setupPage();
  bindEvents();
  renderMenu();
  renderCart();
});

function setupPage(){
  const c=LUQMA_CONFIG;
  $("menuTitle").textContent=c.menuName;
  $("menuNameHero").textContent=c.menuName;
  $("statusText").textContent=c.shopOpen?"Orders Open":"Orders Closed";
  $("statusPill").classList.toggle("closed",!c.shopOpen);
  $("closedBanner").classList.toggle("hidden",c.shopOpen);

  ["groupLinkTop","groupLinkBottom"].forEach(id=>{
    const el=$(id);
    if(!el)return;
    el.classList.remove("hidden");
    if(c.whatsappGroupLink&&c.whatsappGroupLink.trim()){
      el.href=c.whatsappGroupLink.trim();
      el.target="_blank";
      el.rel="noopener";
    }else{
      el.href="#";
      el.addEventListener("click",e=>{
        e.preventDefault();
        alert("WhatsApp Community link is not added yet. Paste it in menu.js.");
      });
    }
  });
}

function bindEvents(){
  $("openCartBtn").onclick=openCheckout;
  $("closeCheckoutBtn").onclick=closeCheckout;
  $("checkoutOverlay").onclick=e=>{if(e.target===$("checkoutOverlay"))closeCheckout();};
  $("orderForm").addEventListener("submit",sendOrderToWhatsApp);

  document.querySelectorAll('input[name="paymentMethod"]').forEach(input=>{
    input.addEventListener("change",e=>{
      state.paymentMethod=e.target.value;
      state.paymentMarkedPaid=false;
      $("paidConfirm").checked=false;
      updatePaymentUI();
    });
  });

  $("paidConfirm").addEventListener("change",()=>{
    state.paymentMarkedPaid=$("paidConfirm").checked;
    updatePaymentUI();
  });

  $("closeClosedModal").onclick=()=>toggleOverlay("closedOverlay",false);
  $("closedOverlay").onclick=e=>{if(e.target===$("closedOverlay"))toggleOverlay("closedOverlay",false);};
}

function activeItems(){return LUQMA_CONFIG.items.filter(i=>i.active);}

function renderMenu(){
  const items=activeItems();
  $("noMenu").classList.toggle("hidden",items.length>0);

  $("menuGrid").innerHTML=items.map(item=>{
    const qty=state.cart.get(item.id)||0;
    const available=Number(item.quantity||0);
    const sold=available<=0;
    
    return `<article class="dish-card">
      <div class="dish-visual">
        ${item.image?`<img src="${esc(item.image)}" alt="${esc(item.name)}" loading="lazy">`:`<span>${dishEmoji(item.name)}</span>`}
      </div>
      <div class="dish-body">
        <div class="dish-top">
          <h3 class="dish-title">${esc(item.name)}</h3>
          <span class="price">${money(item.price)}</span>
        </div>
        <p class="dish-desc">${esc(item.description||"")}</p>
        <div class="dish-bottom">
          
          ${sold
            ?`<span class="sold-badge">SOLD OUT</span>`
            :`<div class="qty-control">
                <button type="button" onclick="changeQty('${safeJs(item.id)}',-1)" ${qty<=0?"disabled":""}>−</button>
                <span class="qty-number">${qty}</span>
                <button type="button" onclick="changeQty('${safeJs(item.id)}',1)" ${qty>=available||!LUQMA_CONFIG.shopOpen?"disabled":""}>+</button>
              </div>`
          }
        </div>
      </div>
    </article>`;
  }).join("");
}

window.changeQty=(id,delta)=>{
  if(!LUQMA_CONFIG.shopOpen){
    toggleOverlay("closedOverlay",true);
    return;
  }

  const item=LUQMA_CONFIG.items.find(x=>x.id===id);
  if(!item||!item.active)return;

  const current=state.cart.get(id)||0;
  const max=Number(item.quantity||0);
  const next=Math.max(0,Math.min(max,current+delta));

  next?state.cart.set(id,next):state.cart.delete(id);

  renderMenu();
  renderCart();
};

function cartRows(){
  return [...state.cart.entries()]
    .map(([id,qty])=>{
      const item=LUQMA_CONFIG.items.find(x=>x.id===id);
      return item?{item,qty}:null;
    })
    .filter(Boolean);
}

function renderCart(){
  const rows=cartRows();
  const count=rows.reduce((s,r)=>s+r.qty,0);
  const total=rows.reduce((s,r)=>s+r.qty*Number(r.item.price||0),0);

  $("cartCount").textContent=`${count} item${count===1?"":"s"}`;
  $("cartTotal").textContent=money(total);
  $("checkoutTotal").textContent=money(total);
  $("cartBar").classList.toggle("visible",count>0&&LUQMA_CONFIG.shopOpen);

  $("orderLines").innerHTML=rows.length
    ?rows.map(({item,qty})=>`
      <div class="order-line">
        <div>
          <strong>${esc(item.name)}</strong>
          <small>${qty} × ${money(item.price)}</small>
        </div>
        <strong>${money(qty*Number(item.price||0))}</strong>
      </div>`).join("")
    :`<p>Your cart is empty.</p>`;

  updatePaymentUI();
}

function openCheckout(){
  if(!LUQMA_CONFIG.shopOpen){
    toggleOverlay("closedOverlay",true);
    return;
  }
  if(!cartRows().length)return;

  if(!state.orderCode)state.orderCode=makeOrderCode();
  updatePaymentUI();
  toggleOverlay("checkoutOverlay",true);
}

function closeCheckout(){toggleOverlay("checkoutOverlay",false);}

function toggleOverlay(id,show){
  $(id).classList.toggle("hidden",!show);
  $(id).setAttribute("aria-hidden",show?"false":"true");
  document.body.classList.toggle("no-scroll",show);
}

function updatePaymentUI(){
  if(!$("upiPanel"))return;

  const total=cartRows().reduce((s,r)=>s+r.qty*Number(r.item.price||0),0);
  const method=state.paymentMethod;

  $("upiPanel").classList.toggle("hidden",method!=="UPI");

  if(method==="UPI"){
    if(!state.orderCode)state.orderCode=makeOrderCode();

    const upiUri=buildUpiUri(total,state.orderCode);

    $("upiAmount").textContent=money(total);
    $("upiPayBtnAmount").textContent=money(total);
    $("upiIdText").textContent=LUQMA_CONFIG.upiId;
    $("upiPayeeText").textContent=LUQMA_CONFIG.upiPayeeName;
    $("upiPayBtn").href=upiUri;

    // Dynamic QR with the current order amount and order ID.
    $("upiQrImage").src=
      "https://api.qrserver.com/v1/create-qr-code/?size=240x240&data="+encodeURIComponent(upiUri);
  }

  const button=$("finalOrderBtn");
  const buttonText=$("finalOrderBtnText");

  if(!method){
    button.disabled=true;
    buttonText.textContent="Choose payment method";
  }else if(method==="COD"){
    button.disabled=false;
    buttonText.textContent="Place COD Order";
  }else{
    button.disabled=!state.paymentMarkedPaid;
    buttonText.textContent=state.paymentMarkedPaid
      ?"Place Paid Order"
      :"Complete payment first";
  }
}

function buildUpiUri(total,orderCode){
  const params=new URLSearchParams({
    pa:LUQMA_CONFIG.upiId,
    pn:LUQMA_CONFIG.upiPayeeName,
    am:Number(total||0).toFixed(2),
    cu:"INR",
    tn:`LUQMA ${orderCode}`
  });
  return `upi://pay?${params.toString()}`;
}

function sendOrderToWhatsApp(e){
  e.preventDefault();

  if(!LUQMA_CONFIG.shopOpen){
    closeCheckout();
    toggleOverlay("closedOverlay",true);
    return;
  }

  const rows=cartRows();
  if(!rows.length)return;

  const name=$("customerName").value.trim();
  const phone=String($("customerPhone").value||"").replace(/\D/g,"");
  const address=$("customerAddress").value.trim();

  if(!name||!phone||!address)return;
  if(phone.length<10){
    alert("Please enter a valid phone number.");
    return;
  }
  if(!state.paymentMethod){
    alert("Please choose a payment method.");
    return;
  }
  if(state.paymentMethod==="UPI"&&!state.paymentMarkedPaid){
    alert("Please complete the UPI payment and tick the confirmation box, or choose Cash on Delivery.");
    return;
  }

  const total=rows.reduce((s,r)=>s+r.qty*Number(r.item.price||0),0);
  const orderId=state.orderCode||makeOrderCode();

  const paymentMethodText=state.paymentMethod==="UPI"?"UPI / Online":"Cash on Delivery";
  const paymentStatusText=state.paymentMethod==="UPI"
    ?"PAID — CUSTOMER MARKED PAID"
    :"PENDING — COD";

  const lines=[
    "🍽️ *LUQMA ORDER*",
    `*${LUQMA_CONFIG.menuName}*`,
    "",
    `*Order ID:* ${orderId}`,
    `*Name:* ${name}`,
    `*Phone:* ${phone}`,
    `*Address:* ${address}`,
    "",
    "*Order Details:*",
    ...rows.map(({item,qty})=>`• ${qty} × ${item.name} — ${moneyPlain(qty*Number(item.price||0))}`),
    "",
    `*Total:* ${moneyPlain(total)}`,
    "",
    `*Payment Method:* ${paymentMethodText}`,
    `*Payment Status:* ${paymentStatusText}`,
    "",
    "Please confirm my order. ❤️"
  ];

  const url=`https://wa.me/${LUQMA_CONFIG.orderWhatsApp}?text=${encodeURIComponent(lines.join("\n"))}`;
  window.open(url,"_blank","noopener");
}

function makeOrderCode(){
  const d=new Date();
  const date=`${String(d.getDate()).padStart(2,"0")}${String(d.getMonth()+1).padStart(2,"0")}${String(d.getFullYear()).slice(-2)}`;
  return `LQ-${date}-${Math.floor(100+Math.random()*900)}`;
}

function money(v){
  return new Intl.NumberFormat("en-IN",{
    style:"currency",
    currency:"INR",
    maximumFractionDigits:0
  }).format(Number(v||0));
}

function moneyPlain(v){return `₹${Number(v||0).toLocaleString("en-IN")}`;}

function dishEmoji(name=""){
  const n=name.toLowerCase();
  if(n.includes("biryani"))return"🍛";
  if(n.includes("kebab"))return"🍢";
  if(n.includes("malai")||n.includes("chicken"))return"🍗";
  if(n.includes("mutton"))return"🥘";
  if(n.includes("rice"))return"🍚";
  return"🍽️";
}

function esc(v=""){
  return String(v)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function safeJs(v=""){
  return String(v).replaceAll("\\","\\\\").replaceAll("'","\\'");
}
