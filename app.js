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
      // CSV parsing die komma's binnen quotes aankan
      const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
      let obj = {};
      headers.forEach((h, i) => {
        let val = values[i] ? values[i].trim() : "";
        obj[h] = val.replace(/^"|"$/g, '');
      });
      
      const voorraad = parseInt(obj["op voorraad"]) || 0;
      const gereserveerd = parseInt(obj["gereserveerd"]) || 0;
      obj.actueleVoorraad = voorraad - gereserveerd;
      
      return obj;
    }).filter(i => i.id && i.naam); // Lege regels filteren

    initCategories();
    renderShop();
    updateCartUI();
  });

// 2. Categorieën Initialiseren
function initCategories() {
    const select = document.getElementById("categorieFilter");
    if (!select) return;

    // Unieke categorieën ophalen
    const categories = [...new Set(items.map(i => i.categorie).filter(c => c))];
    
    categories.forEach(cat => {
        const option = document.createElement("option");
        option.value = cat;
        option.textContent = cat;
        select.appendChild(option);
    });

    // Event listener voor filteren
    select.addEventListener("change", () => renderShop());
}

// 3. Shop Renderen (met filter)
function renderShop() {
    const grid = document.getElementById("etalage");
    const filterVal = document.getElementById("categorieFilter")?.value || "all";
    if (!grid) return;
    
    grid.innerHTML = "";

    items.forEach(item => {
        // Filter checks: 1. Zichtbaarheid, 2. Voorraad, 3. Categorie
        if (item.zichtbaar === "X") return;
        if (item.actueleVoorraad <= 0) return;
        if (filterVal !== "all" && item.categorie !== filterVal) return;
        
        const div = document.createElement("div");
        div.className = "product-card";
        div.innerHTML = `
            <div class="product-image-wrapper">
                <img src="${item["video/foto"]}" alt="${item.naam}" loading="lazy">
            </div>
            <h2>${item.naam}</h2>
            <div class="price">${formatPrice(item.prijs)}</div>
        `;
        div.onclick = () => window.openDetails(item);
        grid.appendChild(div);
    });
}

// 4. Modal Logica
let tempQty = 1;

window.openDetails = function(item) {
    tempQty = 1;
    const modal = document.getElementById("productModal");
    const body = document.getElementById("modalBody");
    
    // Check huidige voorraad minus wat al in mandje zit
    const inMandje = cart.find(c => c.id === item.id)?.qty || 0;
    const max = item.actueleVoorraad - inMandje;

    if (max <= 0) {
        alert("Je hebt de maximale voorraad van dit item al in je mandje.");
        return;
    }

    body.innerHTML = `
        <div class="modal-image">
            <img src="${item["video/foto"]}" style="width:100%; border-radius:2px;">
        </div>
        <div class="modal-info">
            <h1 style="margin-top:0; text-transform: uppercase;">${item.naam}</h1>
            <p style="color:var(--muted); font-size:0.9rem;">${item.beschrijving || ""}</p>
            <p class="price" style="font-size:1.2rem; margin: 1rem 0;">${formatPrice(item.prijs)}</p>
            
            <div class="qty-selector">
                <button onclick="window.updateTempQty(-1)">-</button>
                <span id="qtyVal">1</span>
                <button onclick="window.updateTempQty(1, ${max})">+</button>
            </div>
            
            <button class="btn-reserve" onclick="window.addToCart('${item.id}')">In Winkelmand</button>
        </div>`;
    modal.style.display = "block";
};

window.updateTempQty = (change, max = 99) => {
    tempQty = Math.max(1, Math.min(tempQty + change, max));
    const el = document.getElementById("qtyVal");
    if(el) el.textContent = tempQty;
};

// 5. Winkelwagen Logica
window.addToCart = function(id) {
    const item = items.find(i => i.id === id);
    const existing = cart.find(c => c.id === id);
    
    if (existing) {
        existing.qty += tempQty;
    } else {
        cart.push({ ...item, qty: tempQty });
    }
    
    saveCart();
    window.closeModal();
    document.getElementById("cartDrawer").classList.add("open"); // Open mandje direct
};

window.updateCartQty = function(index, change) {
    const item = cart[index];
    const original = items.find(i => i.id === item.id);
    const max = original ? original.actueleVoorraad : 99;
    
    let newQty = item.qty + change;
    
    if (newQty >= 1 && newQty <= max) {
        item.qty = newQty;
        saveCart();
    } else if (newQty > max) {
        alert("Niet genoeg voorraad beschikbaar.");
    }
};

window.removeFromCart = function(index) {
    cart.splice(index, 1);
    saveCart();
};

function saveCart() {
    localStorage.setItem("h_botanica_cart", JSON.stringify(cart));
    updateCartUI();
}

function updateCartUI() {
    const count = document.getElementById("cartCount");
    const list = document.getElementById("cartItems");
    const totalEl = document.getElementById("cartTotal");

    const totalQty = cart.reduce((s, i) => s + Number(i.qty), 0);
    if(count) count.textContent = totalQty;
    
    if (!list) return;

    if (cart.length === 0) {
        list.innerHTML = "<p style='text-align:center; color:#999; margin-top:2rem;'>Je mandje is leeg.</p>";
        if(totalEl) totalEl.textContent = "€ 0,00";
        return;
    }

    let totalPrice = 0;
    list.innerHTML = cart.map((item, index) => {
        const price = parseFloat(String(item.prijs).replace(',', '.')) || 0;
        totalPrice += price * item.qty;
        
        return `
        <div style="display:flex; gap:15px; padding:15px 0; border-bottom:1px solid #f0f0f0;">
            <img src="${item["video/foto"]}" style="width:60px; height:60px; object-fit:cover; border-radius:2px;">
            <div style="flex:1;">
                <h4 style="margin:0 0 5px 0; font-size:0.85rem; text-transform:uppercase;">${item.naam}</h4>
                <div style="color:#666; font-size:0.8rem;">${formatPrice(item.prijs)}</div>
                <div class="qty-selector" style="margin: 8px 0 0; transform: scale(0.9); transform-origin: left;">
                    <button onclick="window.updateCartQty(${index}, -1)">-</button>
                    <span>${item.qty}</span>
                    <button onclick="window.updateCartQty(${index}, 1)">+</button>
                </div>
            </div>
            <div style="text-align:right;">
                <button onclick="window.removeFromCart(${index})" style="background:none; border:none; font-size:1.4rem; color:#ccc; cursor:pointer;">&times;</button>
                <div style="margin-top:auto; font-weight:bold; font-size:0.9rem;">${formatPrice(price * item.qty)}</div>
            </div>
        </div>`;
    }).join("");

    if(totalEl) totalEl.textContent = formatPrice(totalPrice);
}

function formatPrice(val) {
    const num = typeof val === 'string' ? parseFloat(val.replace(',', '.')) : val;
    return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(num || 0);
}

// 6. Global Nav
window.toggleCart = () => document.getElementById("cartDrawer").classList.toggle("open");
window.closeModal = () => document.getElementById("productModal").style.display = "none";
window.goToCheckout = () => {
    if(cart.length > 0) window.location.href = "reserveren.html";
    else alert("Je winkelmand is leeg.");
};
