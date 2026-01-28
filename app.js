const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ-AiZSsevrWVln27kgIkvL65fD2FVzMQ_fnb850l-1kikcKIijx6Kpv51yQ7X-3tGJHq3lPdt7LTEZ/pub?output=csv";
let items = [];
let cart = JSON.parse(localStorage.getItem("h_botanica_cart")) || [];

// 1. Data Inladen
fetch(SHEET_URL)
  .then(res => res.text())
  .then(text => {
    const lines = text.split(/\r?\n/);
    const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
    
    items = lines.slice(1).map(line => {
      const values = line.split(",");
      let obj = {};
      headers.forEach((h, i) => obj[h] = values[i] ? values[i].trim() : "");
      
      const voorraad = parseInt(obj["op voorraad"]) || 0;
      const gereserveerd = parseInt(obj["gereserveerd"]) || 0;
      obj.actueleVoorraad = voorraad - gereserveerd;
      
      return obj;
    }).filter(i => i.id);

    renderShop();
    updateCartUI();
  });

// 2. Shop Renderen
function renderShop() {
    const grid = document.getElementById("etalage");
    if (!grid) return;
    grid.innerHTML = "";

    items.forEach(item => {
        if (item.actueleVoorraad <= 0 || item.zichtbaar === "X") return;
        
        const div = document.createElement("div");
        div.className = "product-card";
        div.innerHTML = `
            <div class="product-image-wrapper">
                <img src="${item["video/foto"]}" alt="${item.naam}">
            </div>
            <h2>${item.naam}</h2>
            <div class="price">€ ${item.prijs}</div>
        `;
        div.onclick = () => window.openDetails(item);
        grid.appendChild(div);
    });
}

// 3. Modal & Qty Logica
let tempQty = 1;

window.openDetails = function(item) {
    tempQty = 1;
    const modal = document.getElementById("productModal");
    const body = document.getElementById("modalBody");
    
    body.innerHTML = `
        <div class="modal-image">
            <img src="${item["video/foto"]}" style="width:100%;">
        </div>
        <div class="modal-info">
            <h1>${item.naam}</h1>
            <p style="color:var(--muted); font-size:0.9rem; margin:1rem 0;">${item.beschrijving || ""}</p>
            <p class="price">€ ${item.prijs}</p>
            <div class="qty-selector">
                <button onclick="window.updateQty(-1, ${item.actueleVoorraad})">-</button>
                <span id="qtyVal">1</span>
                <button onclick="window.updateQty(1, ${item.actueleVoorraad})">+</button>
            </div>
            <button class="btn-reserve" onclick="window.addToCart('${item.id}')">Toevoegen aan mandje</button>
        </div>`;
    modal.style.display = "block";
};

window.updateQty = function(change, max) {
    tempQty = Math.max(1, Math.min(tempQty + change, max));
    const valEl = document.getElementById("qtyVal");
    if(valEl) valEl.textContent = tempQty;
};

// 4. Winkelmand Logica
window.addToCart = function(id) {
    const item = items.find(i => i.id === id);
    const existing = cart.find(c => c.id === id);
    
    if (existing) {
        existing.qty = Math.min(Number(existing.qty) + tempQty, item.actueleVoorraad);
    } else {
        cart.push({ ...item, qty: tempQty });
    }
    
    localStorage.setItem("h_botanica_cart", JSON.stringify(cart));
    updateCartUI();
    window.closeModal();
};

function updateCartUI() {
    const count = document.getElementById("cartCount");
    if (count) count.textContent = cart.reduce((s, i) => s + Number(i.qty), 0);
}

// 5. Navigatie
window.toggleCart = () => document.getElementById("cartDrawer").classList.toggle("open");
window.closeModal = () => document.getElementById("productModal").style.display = "none";
window.goToCheckout = () => {
    if (cart.length > 0) window.location.href = "reserveren.html";
};
