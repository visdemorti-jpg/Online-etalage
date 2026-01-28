const SCRIPT_URL = "JOUW_NIEUWE_SCRIPT_URL"; 
const STORAGE_KEY = "h_botanica_cart";
let cart = [];

function initCheckout() {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
        cart = JSON.parse(savedData).map(item => {
            item.qty = Number(item.qty) || 1;
            return item;
        });
    }
    renderCheckout();
}

function renderCheckout() {
    const container = document.getElementById("checkoutItems");
    const totalEl = document.getElementById("checkoutTotal");
    if (!container) return;

    if (cart.length === 0) {
        container.innerHTML = "<p style='text-align:center;'>Uw winkelmand is leeg.</p>";
        if (totalEl) totalEl.innerHTML = "";
        return;
    }

    container.innerHTML = "";
    let totaalPrijs = 0;

    cart.forEach((item, index) => {
        const prijsSchoon = parseFloat(String(item.prijs).replace(',', '.')) || 0;
        const subtotaal = prijsSchoon * item.qty;
        totaalPrijs += subtotaal;
        const maxStock = Number(item.actueleVoorraad) || 99;

        container.innerHTML += `
            <div style="display: flex; gap: 1.5rem; align-items: center; margin-bottom: 1.5rem; padding-bottom: 1.5rem; border-bottom: 1px dashed var(--line);">
                <img src="${item["video/foto"]}" style="width: 90px; height: 90px; object-fit: cover;">
                <div style="flex: 1;">
                    <h3 style="font-size: 0.85rem; margin: 0; text-transform: uppercase;">${item.naam}</h3>
                    <p style="font-size: 0.8rem; color: var(--muted); margin: 5px 0;">€ ${item.prijs} p.st.</p>
                    <div class="qty-selector" style="transform: scale(0.85); transform-origin: left;">
                        <button type="button" onclick="window.changeQty(${index}, -1, ${maxStock})">-</button>
                        <span>${item.qty}</span>
                        <button type="button" onclick="window.changeQty(${index}, 1, ${maxStock})">+</button>
                    </div>
                </div>
                <div style="font-size: 0.9rem;">€ ${subtotaal.toFixed(2).replace('.', ',')}</div>
                <button type="button" onclick="removeItem(${index})" style="background:none; border:none; cursor:pointer;">&times;</button>
            </div>`;
    });

    if (totalEl) totalEl.innerHTML = `Totaal: <span style="float: right;">€ ${totaalPrijs.toFixed(2).replace('.', ',')}</span>`;
}

window.changeQty = function(index, delta, max) {
    let nieuweQty = Number(cart[index].qty) + delta;
    cart[index].qty = Math.max(1, Math.min(nieuweQty, max));
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

document.getElementById("reserveerForm").addEventListener("submit", async function(e) {
    e.preventDefault();
    const btn = document.getElementById("submitBtn");
    btn.disabled = true;
    btn.innerText = "Verwerken...";

    const klantNaam = document.getElementById("naam").value;
    const klantEmail = document.getElementById("email").value;
    const orderNr = "HB-" + Math.floor(Date.now() / 1000).toString().slice(-4);

    try {
        await fetch(SCRIPT_URL, {
            method: "POST",
            mode: "no-cors",
            body: JSON.stringify({
                klant: klantNaam,
                email: klantEmail,
                items: cart,
                orderNr: orderNr
            })
        });

        let productLijst = cart.map(i => `- ${i.naam} (${i.qty}x)`).join("%0D%0A");
        const body = `Ordernummer: ${orderNr}%0D%0A%0D%0AItems:%0D%0A${productLijst}%0D%0A%0D%0ANaam: ${klantNaam}%0D%0ABericht: ${document.getElementById("bericht").value}`;
        
        window.location.href = `mailto:info@huisjebotanica.be?subject=Reservatie ${orderNr}&body=${body}`;
        
        alert("Bestelling geregistreerd onder nummer " + orderNr);
        localStorage.removeItem(STORAGE_KEY);
        window.location.href = "index.html";
    } catch (error) {
        alert("Fout bij verzenden. Probeer opnieuw.");
        btn.disabled = false;
    }
});

document.addEventListener("DOMContentLoaded", initCheckout);
