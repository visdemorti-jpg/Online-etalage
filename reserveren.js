const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbx3qdHpa5rby_h5pg6UN_90RFIVTOQ1eXee4mod51TeKnsBJxNC_jli0cT92YTsk9ieJA/exec"; // Plak hier je URL van de Google Script-implementatie
const STORAGE_KEY = "h_botanica_cart";

let cart = [];

// 1. Initialiseer de pagina
function initCheckout() {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
        try {
            cart = JSON.parse(savedData);
            // Extra check: zorg dat alle qty's in het mandje getallen zijn
            cart = cart.map(item => {
                item.qty = Number(item.qty) || 1;
                return item;
            });
        } catch (e) {
            console.error("Fout bij laden mandje:", e);
            cart = [];
        }
    }
    renderCheckout();
}

// 2. Teken de winkelmand op het scherm
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
        // Berekeningen met harde nummer-conversie om NaN te voorkomen
        const prijsSchoon = parseFloat(String(item.prijs).replace(',', '.')) || 0;
        const aantalSchoon = Number(item.qty) || 1;
        const subtotaal = prijsSchoon * aantalSchoon;
        totaalPrijs += subtotaal;

        // Voorraad bepalen
        const maxVoorraad = Number(item.actueleVoorraad) || Number(item['op voorraad']) || 99;

        container.innerHTML += `
            <div style="display: flex; gap: 1.5rem; align-items: center; margin-bottom: 1.5rem; padding-bottom: 1.5rem; border-bottom: 1px dashed var(--line);">
                <img src="${item["video/foto"]}" style="width: 90px; height: 90px; object-fit: cover; background: #eee; border-radius: 2px;">
                <div style="flex: 1;">
                    <h3 style="font-size: 0.85rem; margin: 0; text-transform: uppercase; letter-spacing: 0.05em;">${item.naam}</h3>
                    <p style="font-size: 0.8rem; color: var(--muted); margin: 5px 0;">€ ${item.prijs} p.st.</p>
                    <p style="font-size: 0.7rem; color: #888; margin-bottom: 8px;">Nog beschikbaar: ${maxVoorraad}</p>
                    <div class="qty-selector" style="margin: 0; transform: scale(0.85); transform-origin: left;">
                        <button type="button" onclick="window.changeQty(${index}, -1, ${maxVoorraad})">-</button>
                        <span style="min-width: 30px; display: inline-block; text-align: center;">${aantalSchoon}</span>
                        <button type="button" onclick="window.changeQty(${index}, 1, ${maxVoorraad})">+</button>
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

// 3. Aantallen aanpassen (De "NaN-killer" functie)
window.changeQty = function(index, delta, max) {
    // Forceer huidige qty naar een echt nummer
    let huidigeQty = Number(cart[index].qty);
    
    // Als het geen nummer is, herstellen naar 1
    if (isNaN(huidigeQty)) huidigeQty = 1;

    let nieuweQty = huidigeQty + delta;
    
    // Grenzen bewaken
    const limit = Number(max) || 99;
    if (nieuweQty < 1) nieuweQty = 1;
    if (nieuweQty > limit) nieuweQty = limit;
    
    // Opslaan als puur nummer
    cart[index].qty = nieuweQty;
    
    saveAndRefresh();
};

// 4. Verwijderen
window.removeItem = function(index) {
    cart.splice(index, 1);
    saveAndRefresh();
};

// 5. Opslaan in browsergeheugen
function saveAndRefresh() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    renderCheckout();
}

// 6. Formulier verzenden naar Google en Mail
const reserveerForm = document.getElementById("reserveerForm");
if (reserveerForm) {
    reserveerForm.addEventListener("submit", async function(e) {
        e.preventDefault();
        const btn = document.getElementById("submitBtn");
        btn.disabled = true;
        btn.innerText = "Bezig met verwerken...";

        const klantNaam = document.getElementById("naam").value;
        const klantEmail = document.getElementById("email").value;
        const klantBericht = document.getElementById("bericht").value;
        const totaalTekst = document.getElementById("checkoutTotal") ? document.getElementById("checkoutTotal").innerText : "";

        try {
            // Lus door alle items voor Google Sheets update
            for (const item of cart) {
                await fetch(SCRIPT_URL, {
                    method: "POST",
                    mode: "no-cors",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        id: item.id,
                        aantal: Number(item.qty),
                        klant: klantNaam,
                        email: klantEmail
                    })
                });
            }

            // Mailto link opbouwen
            let productLijst = cart.map(i => `- ${i.naam} (${i.qty}x)`).join("%0D%0A");
            const mailTo = "info@huisjebotanica.be"; 
            const subject = `Nieuwe Reservatie: ${klantNaam}`;
            const body = `Beste Huisje Botanica,%0D%0A%0D%0AEr is een nieuwe reservatie geplaatst via de website.%0D%0A%0D%0AItems:%0D%0A${productLijst}%0D%0A%0D%0A${totaalTekst}%0D%0A%0D%0AKlantgegevens:%0D%0ANaam: ${klantNaam}%0D%0AE-mail: ${klantEmail}%0D%0A%0D%0ABericht:%0D%0A${klantBericht}`;

            window.location.href = `mailto:${mailTo}?subject=${subject}&body=${body}`;

            alert("De voorraad is bijgewerkt! Klik op OK en verstuur daarna de e-mail die wordt geopend.");
            localStorage.removeItem(STORAGE_KEY);
            window.location.href = "index.html";

        } catch (error) {
            console.error("Fout bij verzenden:", error);
            alert("Verbinding mislukt, maar u kunt de e-mail nog handmatig verzenden.");
            btn.disabled = false;
            btn.innerText = "Opnieuw proberen";
        }
    });
}

// Start de boel
document.addEventListener("DOMContentLoaded", initCheckout);
