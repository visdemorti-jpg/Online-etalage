const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ-AiZSsevrWVln27kgIkvL65fD2FVzMQ_fnb850l-1kikcKIijx6Kpv51yQ7X-3tGJHq3lPdt7LTEZ/pub?output=csv";
let items = [];
let cart = JSON.parse(localStorage.getItem("h_botanica_cart")) || [];

// 1. Start: Data Ophalen en Verwerken
fetch(SHEET_URL)
  .then(res => res.text())
  .then(text => {
    const lines = text.split(/\r?\n/); // Split op nieuwe regels
    const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
    
    items = lines.slice(1).map(line => {
      // CSV parsing die komma's binnen quotes aankan (simpele versie)
      const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
      let obj = {};
      
      headers.forEach((h, i) => {
        let val = values[i] ? values[i].trim() : "";
        obj[h] = val.replace(/^"|"$/g, ''); // Verwijder quotes indien aanwezig
      });

      // Berekening actuele voorraad
      const opVoorraad = parseInt(obj["op voorraad"]) || 0;
      const gereserveerd = parseInt(obj["gereserveerd"]) || 0;
      obj.actueleVoorraad = opVoorraad - gereserveerd;
      
      return obj;
    }).filter(i => i.id && i.naam); // Filter lege rijen weg

    renderShop();
    updateCartUI();
  });

// 2. Toon Producten in de Etalage
function renderShop() {
    const grid = document.getElementById("etalage");
    if (!grid) return;
    grid.innerHTML = "";

    items.forEach(item => {
        // Alleen tonen als zichtbaar niet 'X' is én er voorraad is
        if (item.zichtbaar === "X" || item.actueleVoorraad <= 0) return;

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

// 3. Modal (Detailvenster) Logica
let tempQty = 1;

window.openDetails = function(item) {
    tempQty = 1;
    const modal = document.getElementById("productModal");
    const body = document.getElementById("modalBody");
    
    // Check hoeveel de gebruiker nog mag toevoegen (Voorraad - wat al in mandje zit)
    const inMandje = cart.find(c => c.id === item.id)?.qty || 0;
    const maxToevoegen = item.actueleVoorraad - inMandje;

    if (maxToevoegen <= 0) {
        alert("Je hebt de maximale voorraad van dit item al in je mandje.");
        return;
    }

    body.innerHTML = `
        <div class="modal-image">
            <img src="${item["video/foto"]}" style="width:100%; border-radius:4px;">
        </div>
        <div class="modal-info">
            <h1 style="margin-top:0;">${item.naam}</h1>
            <p style="color:var(--muted); font-size:0.9rem; line-height:1.6;">${item.beschrijving || "Geen beschrijving beschikbaar."}</p>
            <p class="price" style="font-size:1.2rem; font-weight:bold; margin:1rem 0;">${formatPrice(item.prijs)}</p>
            
            <div class="qty-selector">
                <button onclick="window.updateTempQty(-1)">-</button>
                <span id="qtyVal">1</span>
                <button onclick="window.updateTempQty(1, ${maxToevoegen})">+</button>
            </div>
            
            <button class="btn-reserve" onclick="window.addToCart('${item.id}')">In winkelmand plaatsen</button>
        </div>`;
    
    modal.style.display = "block";
};

window.updateTempQty = function(change, max) {
    // Als max niet is meegegeven, is het 99 (voor omlaag klikken)
    const limiet = max !== undefined ? max : 99;
    tempQty = Math.max(1, Math.min(tempQty + change, limiet));
    const el = document.getElementById("qtyVal");
    if(el) el.textContent = tempQty;
};

window.closeModal = function() {
    document.getElementById("productModal").style.display = "none";
};

// 4. Winkelwagen Kernfuncties
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
    // UX: Open direct het mandje ter bevestiging
    document.getElementById("cartDrawer").classList.add("open");
};

// Functie voor + en - in de zijbalk
window.updateCartQty = function(index, change) {
    const item = cart[index];
    const originalItem = items.find(i => i.id === item.id);
    const maxStock = originalItem ? originalItem.actueleVoorraad : 99;

    let newQty = item.qty + change;
    
    // Niet lager dan 1, niet hoger dan actuele voorraad
    if (newQty >= 1 && newQty <= maxStock) {
        item.qty = newQty;
        saveCart();
    } else if (newQty > maxStock) {
        alert("Helaas, meer is er niet op voorraad.");
    }
};

window.removeFromCart = function(index) {
    if(confirm("Weet je zeker dat je dit item wilt verwijderen?")) {
        cart.splice(index, 1);
        saveCart();
    }
};

function saveCart() {
    localStorage.setItem("h_botanica_cart", JSON.stringify(cart));
    updateCartUI();
}

// 5. Winkelwagen UI (Zijbalk en Tellers)
function updateCartUI() {
    // Update het bolletje op de knop
    const countEl = document.getElementById("cartCount");
    const totalItems = cart.reduce((sum, item) => sum + Number(item.qty), 0);
    if(countEl) countEl.textContent = totalItems;

    // Update de lijst in de zijbalk
    const list = document.getElementById("cartItems");
    const totalFooter = document.getElementById("cartTotal"); // Zorg dat dit ID bestaat in index.html footer
    
    if (!list) return;

    if (cart.length === 0) {
        list.innerHTML = "<div style='text-align:center; padding:2rem; color:#999;'>Je mandje is nog leeg.</div>";
        if(totalFooter) totalFooter.innerHTML = "€ 0,00";
        return;
    }

    let totalPrice = 0;
    list.innerHTML = cart.map((item, index) => {
        const itemPrice = parseFloat(String(item.prijs).replace(',', '.')) || 0;
        totalPrice += itemPrice * item.qty;

        return `
        <div style="display: flex; gap: 15px; padding: 15px 0; border-bottom: 1px solid #f0f0f0;">
            <img src="${item["video/foto"]}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 4px;">
            <div style="flex: 1;">
                <h4 style="margin: 0 0 5px 0; font-size: 0.9rem; text-transform:uppercase;">${item.naam}</h4>
                <div style="color: #666; font-size: 0.85rem;">${formatPrice(item.prijs)}</div>
                
                <div class="qty-selector" style="margin-top: 8px; transform: scale(0.9); transform-origin: left;">
                    <button onclick="window.updateCartQty(${index}, -1)">-</button>
                    <span style="min-width: 20px; text-align: center;">${item.qty}</span>
                    <button onclick="window.updateCartQty(${index}, 1)">+</button>
                </div>
            </div>
            <div style="display: flex; flex-direction: column; justify-content: space-between; align-items: flex-end;">
                 <button onclick="window.removeFromCart(${index})" style="background: none; border: none; font-size: 1.2rem; color: #999; cursor: pointer;">&times;</button>
                 <div style="font-weight: bold; font-size: 0.9rem;">${formatPrice(itemPrice * item.qty)}</div>
            </div>
        </div>
        `;
    }).join("");

    if(totalFooter) totalFooter.innerHTML = formatPrice(totalPrice);
}

// Helper: Prijs mooi formatteren
function formatPrice(amount) {
    // Zorg dat input een nummer is, vervang komma door punt indien string
    const num = typeof amount === 'string' ? parseFloat(amount.replace(',', '.')) : amount;
    return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(num || 0);
}

// 6. Navigatie
window.toggleCart = () => document.getElementById("cartDrawer").classList.toggle("open");
window.goToCheckout = () => {
    if (cart.length > 0) window.location.href = "reserveren.html";
    else alert("Je winkelmand is leeg!");
};

// Sluit modal als je ernaast klikt
window.onclick = function(event) {
    const modal = document.getElementById("productModal");
    if (event.target == modal) {
        closeModal();
    }
};
