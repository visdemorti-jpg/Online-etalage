// Gebruik exact dezelfde naam als in app.js
const STORAGE_KEY = "h_botanica_cart";
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwcPrlEMrSccYCTfgjELqwUZQu_FWar2HaecDvm7-qH9iz18Mi6QCqoQWokcpWEihWfKg/exec"; 

let cart = [];

// Functie om de data in te laden
function initCheckout() {
    const savedData = localStorage.getItem(STORAGE_KEY);
    
    if (savedData) {
        cart = JSON.parse(savedData);
        console.log("Data gevonden:", cart);
    } else {
        console.log("Geen data gevonden in localStorage onder key:", STORAGE_KEY);
    }
    
    renderCheckout();
}

function renderCheckout() {
    const container = document.getElementById("checkoutItems");
    const totalEl = document.getElementById("checkoutTotal");
    
    if (!container) return; // Beveiliging als element niet bestaat

    if (cart.length === 0) {
        container.innerHTML = "<p style='color:var(--muted); text-align:center;'>Uw winkelmand is leeg.</p>";
        if (totalEl) totalEl.innerHTML = "";
        return;
    }

    container.innerHTML = "";
    let totaalPrijs = 0;

    cart.forEach((item, index) => {
        // We zorgen dat prijs altijd als getal behandeld wordt, ook als er een komma in staat
        const prijsGetal = parseFloat(item.prijs.toString().replace(',', '.'));
        const subtotaal = prijsGetal * item.qty;
        totaalPrijs += subtotaal;

        container.innerHTML += `
            <div style="display: flex; gap: 1.5rem; align-items: center; margin-bottom: 1.5rem; padding-bottom: 1.5rem; border-bottom: 1px dashed var(--line);">
                <img src="${item["video/foto"]}" style="width: 90px; height: 90px; object-fit: cover; background: #eee; border-radius: 2px;">
                <div style="flex: 1;">
                    <h3 style="font-size: 0.85rem; margin: 0; text-transform: uppercase; letter-spacing: 0.05em;">${item.naam}</h3>
                    <p style="font-size: 0.8rem; color: var(--muted); margin: 5px 0;">€ ${item.prijs} p.st.</p>
                    <p style="font-size: 0.7rem; color: #888; margin-bottom: 8px;">Beschikbaar: ${item.actueleVoorraad || item['op voorraad']}</p>
                    <div class="qty-selector" style="margin: 0; transform: scale(0.85); transform-origin: left;">
                        <button onclick="changeQty(${index}, -1)">-</button>
                        <span>${item.qty}</span>
                        <button onclick="changeQty(${index}, 1, ${item.actueleVoorraad || 99})">+</button>
                    </div>
                </div>
                <div style="font-size: 0.9rem; font-weight: 500;">€ ${subtotaal.toFixed(2).replace('.', ',')}</div>
                <button onclick="removeItem(${index})" style="background:none; border:none; color:var(--muted); cursor:pointer; font-size:1.4rem; padding-left: 10px;">&times;</button>
            </div>
        `;
    });

    if (totalEl) {
        totalEl.innerHTML = `Totaal: <span style="float: right;">€ ${totaalPrijs.toFixed(2).replace('.', ',')}</span>`;
    }
}

// Global functions voor de knoppen
window.changeQty = function(index, delta, max) {
    cart[index].qty = Math.max(1, Math.min(cart[index].qty + delta, max));
    saveAndRefresh();
};

window.removeItem = function(index) {
    cart.splice(index, 1);
    saveAndRefresh();
};

function saveAndRefresh() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    renderCheckout();
}

// Luister naar het formulier
const form = document.getElementById("reserveerForm");
if (form) {
    form.addEventListener("submit", async function(e) {
        e.preventDefault();
        const btn = document.getElementById("submitBtn");
        btn.disabled = true;
        btn.innerText = "Bezig met verwerken...";

        // ... Hier de rest van je SCRIPT_URL fetch logica en mailto ...
        // (Zoals in het vorige bericht)
        
        alert("Bestelling verwerkt!");
        localStorage.removeItem(STORAGE_KEY);
        window.location.href = "index.html";
    });
}

// DIT IS DE BELANGRIJKSTE REGEL: Wacht tot de pagina geladen is
document.addEventListener("DOMContentLoaded", initCheckout);
