const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ-AiZSsevrWVln27kgIkvL65fD2FVzMQ_fnb850l-1kikcKIijx6Kpv51yQ7X-3tGJHq3lPdt7LTEZ/pub?output=csv";
let items = [];
let cart = JSON.parse(localStorage.getItem("h_botanica_cart")) || [];

// Data inladen
fetch(SHEET_URL)
  .then(res => res.text())
  .then(text => {
    const rows = text.split("\n").map(r => r.split(","));
    const headers = rows[0].map(h => h.trim());
    items = rows.slice(1).map(r => {
      let obj = {};
      headers.forEach((h, i) => obj[h] = r[i] ? r[i].trim() : "");
      return obj;
    }).filter(i => i.id);

    initFilters();
    renderShop("all");
    updateCartUI();
  });

function initFilters() {
    const select = document.getElementById("categorieFilter");
    const categories = [...new Set(items.map(i => i.categorie))].filter(Boolean);
    categories.forEach(cat => {
        const opt = document.createElement("option");
        opt.value = opt.textContent = cat;
        select.appendChild(opt);
    });
    select.onchange = (e) => renderShop(e.target.value);
}

function renderShop(filter) {
    const grid = document.getElementById("etalage");
    grid.innerHTML = "";
    items.forEach(item => {
        if (item.zichtbaar === "X" || item.gereserveerd === "JA") return;
        if (parseInt(item["op voorraad"]) <= 0) return;
        if (filter !== "all" && item.categorie !== filter) return;

        const div = document.createElement("div");
        div.className = "product-card";
        div.innerHTML = `
          <div class="product-image-wrapper"><img src="${item["video/foto"]}" loading="lazy"></div>
          <h2>${item.naam}</h2>
          <div class="price">€ ${item.prijs}</div>
        `;
        div.onclick = () => openDetails(item);
        grid.appendChild(div);
    });
}

let tempQty = 1;
function openDetails(item) {
    tempQty = 1;
    const modal = document.getElementById("productModal");
    const body = document.getElementById("modalBody");
    const maxStock = parseInt(item["op voorraad"]);

    body.innerHTML = `
      <div class="modal-image"><img src="${item["video/foto"]}" style="width:100%;"></div>
      <div class="modal-info">
        <p style="text-transform:uppercase; font-size:0.65rem; color:gray; letter-spacing:0.1em;">${item.categorie}</p>
        <h1 style="font-weight:400; margin-top:0;">${item.naam}</h1>
        <p style="font-size:1.3rem; margin-bottom:2rem;">€ ${item.prijs}</p>
        <div style="margin: 2rem 0; font-size:0.9rem; color:#444; line-height:1.8;">${item.beschrijving}</div>
        
        <p style="font-size:0.75rem; text-transform:uppercase; letter-spacing:0.05em;">Aantal (Beschikbaar: ${maxStock})</p>
        <div class="qty-selector">
          <button onclick="updateTempQty(-1)">-</button>
          <span id="qtyVal">1</span>
          <button onclick="updateTempQty(1, ${maxStock})">+</button>
        </div>
        
        <button class="btn-reserve" onclick="addToCart('${item.id}')">In winkelmand</button>
      </div>
    `;
    modal.style.display = "block";
    document.body.style.overflow = "hidden";
}

function updateTempQty(change, max) {
    tempQty = Math.max(1, Math.min(tempQty + change, max || 99));
    document.getElementById("qtyVal").textContent = tempQty;
}

function addToCart(id) {
    const item = items.find(i => i.id === id);
    const existing = cart.find(c => c.id === id);
    const maxStock = parseInt(item["op voorraad"]);

    if (existing) {
        existing.qty = Math.min(existing.qty + tempQty, maxStock);
    } else {
        cart.push({ ...item, qty: tempQty });
    }

    saveAndUpdate();
    closeModal();
    toggleCart(true); 
}

function saveAndUpdate() {
    localStorage.setItem("h_botanica_cart", JSON.stringify(cart));
    updateCartUI();
}

function updateCartUI() {
    const list = document.getElementById("cartItems");
    const count = document.getElementById("cartCount");
    const totalEl = document.getElementById("cartTotal");
    
    list.innerHTML = "";
    let total = 0;
    let itemsCount = 0;

    cart.forEach((item, index) => {
        const itemTotal = parseFloat(item.prijs) * item.qty;
        total += itemTotal;
        itemsCount += item.qty;

        list.innerHTML += `
          <div style="margin-bottom: 2rem; display: flex; gap: 1.5rem; align-items: center;">
            <img src="${item["video/foto"]}" style="width:70px; height:70px; object-fit:cover;">
            <div style="flex:1">
              <div style="font-size:0.8rem; text-transform:uppercase; letter-spacing:0.05em; font-weight:500;">${item.naam}</div>
              <div style="font-size:0.8rem; color:gray;">${item.qty} x € ${item.prijs}</div>
            </div>
            <button onclick="removeFromCart(${index})" style="background:none; border:none; cursor:pointer; font-size:0.65rem; color:#cc0000; text-transform:uppercase;">Wis</button>
          </div>
        `;
    });

    count.textContent = itemsCount;
    totalEl.textContent = `€ ${total.toFixed(2).replace('.', ',')}`;
}

function removeFromCart(index) {
    cart.splice(index, 1);
    saveAndUpdate();
}

function toggleCart(forceOpen) {
    const drawer = document.getElementById("cartDrawer");
    if (forceOpen) drawer.classList.add("open");
    else drawer.classList.toggle("open");
}

function closeModal() {
    document.getElementById("productModal").style.display = "none";
    document.body.style.overflow = "auto";
}

function goToCheckout() {
    if (cart.length === 0) return alert("Je winkelmand is leeg.");
    window.location.href = "reserveren.html";
}
