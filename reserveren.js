const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwcPrlEMrSccYCTfgjELqwUZQu_FWar2HaecDvm7-qH9iz18Mi6QCqoQWokcpWEihWfKg/exec"; 
let cart = JSON.parse(localStorage.getItem("h_botanica_cart")) || [];

function renderCheckout() {
    const container = document.getElementById("checkoutItems");
    const totalEl = document.getElementById("checkoutTotal");
    
    if (cart.length === 0) {
        container.innerHTML = "<p style='color:var(--muted); text-align:center;'>Uw winkelmand is leeg.</p>";
        totalEl.innerHTML = "";
        return;
    }

    container.innerHTML = "";
    let totaalPrijs = 0;

    cart.forEach((item, index) => {
        const subtotaal = parseFloat(item.prijs.replace(',', '.')) * item.qty;
        totaalPrijs += subtotaal;

        // We gebruiken hier item.actueleVoorraad die we vanuit app.js hebben meegegeven aan het mandje
        container.innerHTML += `
            <div style="display: flex; gap: 1.5rem; align-items: center; margin-bottom: 1.5rem; padding-bottom: 1.5rem; border-bottom: 1px dashed var(--line);">
                <img src="${item["video/foto"]}" style="width: 90px; height: 90px; object-fit: cover; background: #eee; border-radius: 2px;">
                <div style="flex: 1;">
                    <h3 style="font-size: 0.85rem; margin: 0; text-transform: uppercase; letter-spacing: 0.05em;">${item.naam}</h3>
                    <p style="font-size: 0.8rem; color: var(--muted); margin: 5px 0;">€ ${item.prijs} p.st.</p>
                    
                    <p style="font-size: 0.7rem; color: #888; margin-bottom: 8px;">Beschikbaar: ${item.actueleVoorraad}</p>
                    
                    <div class="qty-selector" style="margin: 0; transform: scale(0.85); transform-origin: left;">
                        <button onclick="changeQty(${index}, -1)">-</button>
                        <span>${item.qty}</span>
                        <button onclick="changeQty(${index}, 1, ${item.actueleVoorraad})">+</button>
                    </div>
                </div>
                <div style="font-size: 0.9rem; font-weight: 500;">€ ${subtotaal.toFixed(2).replace('.', ',')}</div>
                <button onclick="removeItem(${index})" style="background:none; border:none; color:var(--muted); cursor:pointer; font-size:1.4rem; padding-left: 10px;">&times;</button>
            </div>
        `;
    });

    totalEl.innerHTML = `Totaal: <span style="float: right;">€ ${totaalPrijs.toFixed(2).replace('.', ',')}</span>`;
}

// De rest van de functies (changeQty, removeItem, etc.) blijven hetzelfde zoals in het vorige bericht...

window.changeQty = function(index, delta, max) {
    cart[index].qty = Math.max(1, Math.min(cart[index].qty + delta, max || 99));
    saveAndRefresh();
};

window.removeItem = function(index) {
    cart.splice(index, 1);
    saveAndRefresh();
};

function saveAndRefresh() {
    localStorage.setItem("h_botanica_cart", JSON.stringify(cart));
    renderCheckout();
}

// Voeg hier de rest van je 'submit' event listener toe met de SCRIPT_URL
