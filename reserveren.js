const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwcPrlEMrSccYCTfgjELqwUZQu_FWar2HaecDvm7-qH9iz18Mi6QCqoQWokcpWEihWfKg/exec"; // Plak hier je URL van de Google Script-implementatie
const STORAGE_KEY = "h_botanica_cart";

let cart = [];

function initCheckout() {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
        cart = JSON.parse(savedData);
    }
    renderCheckout();
}

function renderCheckout() {
    const container = document.getElementById("checkoutItems");
    const totalEl = document.getElementById("checkoutTotal");
    
    if (!container) return;

    if (cart.length === 0) {
        container.innerHTML = "<p style='color:var(--muted); text-align:center;'>Uw winkelmand is leeg.</p>";
        if (totalEl) totalEl.innerHTML = "";
        return;
    }

    container.innerHTML = "";
    let totaalPrijs = 0;

    cart.forEach((item, index) => {
        // Zorg dat prijs en qty altijd getallen zijn voor de berekening
        const prijsGetal = parseFloat(item.prijs.toString().replace(',', '.')) || 0;
        const aantalGekozen = parseInt(item.qty) || 1;
        const subtotaal = prijsGetal * aantalGekozen;
        totaalPrijs += subtotaal;

        // Bepaal de maximale voorraad (gebruik de berekende waarde uit app.js)
        const maxVoorraad = parseInt(item.actueleVoorraad) || 99;

        container.innerHTML += `
            <div style="display: flex; gap: 1.5rem; align-items: center; margin-bottom: 1.5rem; padding-bottom: 1.5rem; border-bottom: 1px dashed var(--line);">
                <img src="${item["video/foto"]}" style="width: 90px; height: 90px; object-fit: cover; background: #eee; border-radius: 2px;">
                <div style="flex: 1;">
                    <h3 style="font-size: 0.85rem; margin: 0; text-transform: uppercase; letter-spacing: 0.05em;">${item.naam}</h3>
                    <p style="font-size: 0.8rem; color: var(--muted); margin: 5px 0;">€ ${item.prijs} p.st.</p>
                    <p style="font-size: 0.7rem; color: #888; margin-bottom: 8px;">Nog beschikbaar: ${maxVoorraad}</p>
                    <div class="qty-selector" style="margin: 0; transform: scale(0.85); transform-origin: left;">
                        <button type="button" onclick="changeQty(${index}, -1)">-</button>
                        <span>${aantalGekozen}</span>
                        <button type="button" onclick="changeQty(${index}, 1, ${maxVoorraad})">+</button>
                    </div>
                </div>
                <div style="font-size: 0.9rem; font-weight: 500;">€ ${subtotaal.toFixed(2).replace('.', ',')}</div>
                <button type="button" onclick="removeItem(${index})" style="background:none; border:none; color:var(--muted); cursor:pointer; font-size:1.4rem; padding-left: 10px;">&times;</button>
            </div>
        `;
    });

    if (totalEl) {
        totalEl.innerHTML = `Totaal: <span style="float: right;">€ ${totaalPrijs.toFixed(2).replace('.', ',')}</span>`;
    }
}

window.changeQty = function(index, delta, max) {
    let huidigeQty = parseInt(cart[index].qty) || 1;
    let nieuweQty = huidigeQty + delta;
    
    // Beveiliging: nooit minder dan 1, nooit meer dan de voorraad
    if (nieuweQty < 1) nieuweQty = 1;
    if (nieuweQty > max) nieuweQty = max;
    
    cart[index].qty = nieuweQty;
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

// Formulier verzenden
document.getElementById("reserveerForm").addEventListener("submit", async function(e) {
    e.preventDefault();
    const btn = document.getElementById("submitBtn");
    btn.disabled = true;
    btn.innerText = "Bezig met verwerken...";

    const klantNaam = document.getElementById("naam").value;
    const klantEmail = document.getElementById("email").value;
    const klantBericht = document.getElementById("bericht").value;
    const totaalTekst = document.getElementById("checkoutTotal").innerText;

    try {
        // Verzend elk item naar Google Sheets voor voorraad-update
        for (const item of cart) {
            await fetch(SCRIPT_URL, {
                method: "POST",
                mode: "no-cors",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: item.id,
                    aantal: item.qty,
                    klant: klantNaam,
                    email: klantEmail
                })
            });
        }

        // Maak Mailto link
        let productLijst = cart.map(i => `- ${i.naam} (${i.qty}x)`).join("%0D%0A");
        const mailTo = "info@huisjebotanica.be"; 
        const subject = `Nieuwe Reservatie: ${klantNaam}`;
        const body = `Beste Huisje Botanica,%0D%0A%0D%0AEr is een nieuwe reservatie geplaatst via de website.%0D%0A%0D%0AItems:%0D%0A${productLijst}%0D%0A%0D%0A${totaalTekst}%0D%0A%0D%0AKlantgegevens:%0D%0ANaam: ${klantNaam}%0D%0AE-mail: ${klantEmail}%0D%0A%0D%0ABericht:%0D%0A${klantBericht}`;

        window.location.href = `mailto:${mailTo}?subject=${subject}&body=${body}`;

        alert("De voorraad is bijgewerkt! Verstuur nu nog de e-mail die wordt geopend.");
        localStorage.removeItem(STORAGE_KEY);
        window.location.href = "index.html";

    } catch (error) {
        console.error("Fout:", error);
        alert("Er kon geen verbinding worden gemaakt met de database. De e-mail wordt wel geopend.");
        btn.disabled = false;
        btn.innerText = "Aanvraag Verzenden via E-mail";
    }
});

document.addEventListener("DOMContentLoaded", initCheckout);
