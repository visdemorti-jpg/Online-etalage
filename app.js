const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ-AiZSsevrWVln27kgIkvL65fD2FVzMQ_fnb850l-1kikcKIijx6Kpv51yQ7X-3tGJHq3lPdt7LTEZ/pub?output=csv";
let items = [];
let cart = JSON.parse(localStorage.getItem("h_botanica_cart")) || [];

fetch(SHEET_URL)
  .then(res => res.text())
  .then(text => {
    const rows = text.split("\n").map(r => r.split(","));
    const headers = rows[0].map(h => h.trim());
    items = rows.slice(1).map(r => {
      let obj = {};
      headers.forEach((h, i) => obj[h] = r[i] ? r[i].trim() : "");
      obj.actueleVoorraad = (parseInt(obj["op voorraad"]) || 0) - (parseInt(obj["gereserveerd"]) || 0);
      return obj;
    }).filter(i => i.id);
    renderShop("all");
    updateCartUI();
  });

function renderShop(filter) {
    const grid = document.getElementById("etalage");
    grid.innerHTML = "";
    items.forEach(item => {
        if (item.zichtbaar === "X" || item.actueleVoorraad <= 0) return;
        const div = document.createElement("div");
        div.className = "product-card";
        div.innerHTML = `<div class="product-image-wrapper"><img src="${item["video/foto"]}"></div>
                         <h2>${item.naam}</h2><div class="price">€ ${item.prijs}</div>`;
        div.onclick = () => openDetails(item);
        grid.appendChild(div);
    });
}

let tempQty = 1;
function openDetails(item) {
    tempQty = 1;
    const modal = document.getElementById("productModal");
    const body = document.getElementById("modalBody");
    body.innerHTML = `
        <div class="modal-image"><img src="${item["video/foto"]}" style="width:100%;"></div>
        <div class="modal-info">
            <h1>${item.naam}</h1><p>€ ${item.prijs}</p>
            <div class="qty-selector">
                <button onclick="updateTempQty(-1)">-</button><span id="qtyVal">1</span>
                <button onclick="updateTempQty(1, ${item.actueleVoorraad})">+</button>
            </div>
            <button class="btn-reserve" onclick="addToCart('${item.id}')">In winkelmand</button>
        </div>`;
    modal.style.display = "block";
}

function updateTempQty(c, m) { tempQty = Math.max(1, Math.min(tempQty + c, m)); document.getElementById("qtyVal").textContent = tempQty; }

function addToCart(id) {
    const item = items.find(i => i.id === id);
    const existing = cart.find(c => c.id === id);
    if (existing) existing.qty = Math.min(Number(existing.qty) + tempQty, item.actueleVoorraad);
    else cart.push({ ...item, qty: tempQty });
    saveAndUpdate();
    document.getElementById("productModal").style.display = "none";
}

function saveAndUpdate() { localStorage.setItem("h_botanica_cart", JSON.stringify(cart)); updateCartUI(); }
function updateCartUI() { 
    document.getElementById("cartCount").textContent = cart.reduce((s, i) => s + Number(i.qty), 0);
    const list = document.getElementById("cartItems");
    list.innerHTML = "";
    cart.forEach(i => list.innerHTML += `<div>${i.naam} (${i.qty}x)</div>`);
}
function toggleCart() { document.getElementById("cartDrawer").classList.toggle("open"); }
function goToCheckout() { window.location.href = "reserveren.html"; }
function closeModal() { document.getElementById("productModal").style.display = "none"; }
