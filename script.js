const state={cart:new Map()};
const $=id=>document.getElementById(id);

document.addEventListener("DOMContentLoaded",()=>{setupPage();bindEvents();renderMenu();renderCart();});

function setupPage(){
  const c=LUQMA_CONFIG;
  $("menuTitle").textContent=c.menuName;
  $("menuNameHero").textContent=c.menuName;
  $("statusText").textContent=c.shopOpen?"Orders Open":"Orders Closed";
  $("statusPill").classList.toggle("closed",!c.shopOpen);
  $("closedBanner").classList.toggle("hidden",c.shopOpen);
  if(c.whatsappGroupLink&&c.whatsappGroupLink.trim()){
    ["groupLinkTop","groupLinkBottom"].forEach(id=>{$(id).href=c.whatsappGroupLink.trim();$(id).classList.remove("hidden");});
  }
}
function bindEvents(){
  $("openCartBtn").onclick=openCheckout;
  $("closeCheckoutBtn").onclick=closeCheckout;
  $("checkoutOverlay").onclick=e=>{if(e.target===$("checkoutOverlay"))closeCheckout();};
  $("orderForm").addEventListener("submit",sendOrderToWhatsApp);
  $("closeClosedModal").onclick=()=>toggleOverlay("closedOverlay",false);
  $("closedOverlay").onclick=e=>{if(e.target===$("closedOverlay"))toggleOverlay("closedOverlay",false);};
}
function activeItems(){return LUQMA_CONFIG.items.filter(i=>i.active);}
function renderMenu(){
  const items=activeItems();
  $("noMenu").classList.toggle("hidden",items.length>0);
  $("menuGrid").innerHTML=items.map(item=>{
    const qty=state.cart.get(item.id)||0, available=Number(item.quantity||0), sold=available<=0, low=available>0&&available<=3;
    return `<article class="dish-card"><div class="dish-visual">${dishEmoji(item.name)}</div><div class="dish-body"><div class="dish-top"><h3 class="dish-title">${esc(item.name)}</h3><span class="price">${money(item.price)}</span></div><p class="dish-desc">${esc(item.description||"")}</p><div class="dish-bottom"><span class="stock ${sold?"sold":low?"low":""}">${sold?"Sold out":low?`Only ${available} left`:`${available} plates available`}</span>${sold?`<span class="sold-badge">SOLD OUT</span>`:`<div class="qty-control"><button type="button" onclick="changeQty('${safeJs(item.id)}',-1)" ${qty<=0?"disabled":""}>−</button><span class="qty-number">${qty}</span><button type="button" onclick="changeQty('${safeJs(item.id)}',1)" ${qty>=available||!LUQMA_CONFIG.shopOpen?"disabled":""}>+</button></div>`}</div></div></article>`;
  }).join("");
}
window.changeQty=(id,delta)=>{
  if(!LUQMA_CONFIG.shopOpen){toggleOverlay("closedOverlay",true);return;}
  const item=LUQMA_CONFIG.items.find(x=>x.id===id); if(!item||!item.active)return;
  const current=state.cart.get(id)||0, max=Number(item.quantity||0), next=Math.max(0,Math.min(max,current+delta));
  next?state.cart.set(id,next):state.cart.delete(id);
  renderMenu();renderCart();
};
function cartRows(){return [...state.cart.entries()].map(([id,qty])=>{const item=LUQMA_CONFIG.items.find(x=>x.id===id);return item?{item,qty}:null}).filter(Boolean);}
function renderCart(){
  const rows=cartRows(), count=rows.reduce((s,r)=>s+r.qty,0), total=rows.reduce((s,r)=>s+r.qty*Number(r.item.price||0),0);
  $("cartCount").textContent=`${count} item${count===1?"":"s"}`;$("cartTotal").textContent=money(total);$("checkoutTotal").textContent=money(total);
  $("cartBar").classList.toggle("visible",count>0&&LUQMA_CONFIG.shopOpen);
  $("orderLines").innerHTML=rows.length?rows.map(({item,qty})=>`<div class="order-line"><div><strong>${esc(item.name)}</strong><small>${qty} × ${money(item.price)}</small></div><strong>${money(qty*Number(item.price||0))}</strong></div>`).join(""):`<p>Your cart is empty.</p>`;
}
function openCheckout(){if(!LUQMA_CONFIG.shopOpen){toggleOverlay("closedOverlay",true);return;}if(cartRows().length)toggleOverlay("checkoutOverlay",true);}
function closeCheckout(){toggleOverlay("checkoutOverlay",false);}
function toggleOverlay(id,show){$(id).classList.toggle("hidden",!show);$(id).setAttribute("aria-hidden",show?"false":"true");document.body.classList.toggle("no-scroll",show);}
function sendOrderToWhatsApp(e){
  e.preventDefault();
  if(!LUQMA_CONFIG.shopOpen){closeCheckout();toggleOverlay("closedOverlay",true);return;}
  const rows=cartRows();if(!rows.length)return;
  const name=$("customerName").value.trim(), phone=String($("customerPhone").value||"").replace(/\D/g,""), address=$("customerAddress").value.trim();
  if(phone.length<10){alert("Please enter a valid phone number.");return;}
  const total=rows.reduce((s,r)=>s+r.qty*Number(r.item.price||0),0), orderId=makeOrderCode();
  const lines=["🍽️ *LUQMA ORDER*",`*${LUQMA_CONFIG.menuName}*`,"",`*Order ID:* ${orderId}`,`*Name:* ${name}`,`*Phone:* ${phone}`,`*Address:* ${address}`,"","*Order Details:*",...rows.map(({item,qty})=>`• ${qty} × ${item.name} — ${moneyPlain(qty*Number(item.price||0))}`),"",`*Total:* ${moneyPlain(total)}`,"","Please confirm my order. ❤️"];
  const url=`https://wa.me/${LUQMA_CONFIG.orderWhatsApp}?text=${encodeURIComponent(lines.join("\n"))}`;
  window.open(url,"_blank","noopener");
}
function makeOrderCode(){const d=new Date();const date=`${String(d.getDate()).padStart(2,"0")}${String(d.getMonth()+1).padStart(2,"0")}${String(d.getFullYear()).slice(-2)}`;return `LQ-${date}-${Math.floor(100+Math.random()*900)}`;}
function money(v){return new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(Number(v||0));}
function moneyPlain(v){return `₹${Number(v||0).toLocaleString("en-IN")}`;}
function dishEmoji(name=""){const n=name.toLowerCase();if(n.includes("biryani"))return"🍛";if(n.includes("kebab"))return"🍢";if(n.includes("malai")||n.includes("chicken"))return"🍗";if(n.includes("mutton"))return"🥘";if(n.includes("rice"))return"🍚";return"🍽️";}
function esc(v=""){return String(v).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");}
function safeJs(v=""){return String(v).replaceAll("\\","\\\\").replaceAll("'","\\'");}
