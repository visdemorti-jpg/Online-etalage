let cart = JSON.parse(localStorage.getItem("h_botanica_cart")) || [];

function renderCheckout() {
    const container = document.getElementById("checkoutItems");
    const totalEl = document.getElementById("checkoutTotal");
    
    if (cart.length === 0) {
        container.innerHTML = "<p style='color:var(--muted);'>Uw winkelmand is leeg.</p>";
        totalEl.innerHTML = "";
        return;
    }

    container.innerHTML = "";
    let totaalPrijs = 0;

    cart.forEach((item, index) => {
        const subtotaal = parseFloat(item.prijs.replace(',', '.')) * item.qty;
        totaalPrijs += subtotaal;

        container.innerHTML += `
            <div style="display: flex; gap: 1.5rem; align-items: center; margin-bottom: 1.5rem; padding-bottom: 1.5rem; border-bottom: 1px dashed var(--line);">
                <img src="${item["video/foto"]}" style="width: 90px; height: 90px; object-fit: cover; background: #eee;">
                <div style="flex: 1;">
                    <h3 style="font-size: 0.85rem; margin: 0; text-transform: uppercase; letter-spacing: 0.05em;">${item.naam}</h3>
                    <p style="font-size: 0.8rem; color: var(--muted); margin: 5px 0;">€ ${item.prijs} per stuk</p>
                    <div class="qty-selector" style="margin: 10px 0 0 0; transform: scale(0.85); transform-origin: left;">
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

window.changeQty = function(index, delta, max) {
    cart[index].qty = Math.max(1, Math.min(cart[index].qty + delta, max || 99));
    saveAndRefresh();
};

window.removeItem = function(index) {
    if(confirm("Wilt u dit item verwijderen?")) {
        cart.splice(index, 1);
        saveAndRefresh();
    }
};

function saveAndRefresh() {
    localStorage.setItem("h_botanica_cart", JSON.stringify(cart));
    renderCheckout();
}

// Formulier afhandeling (E-mail link methode)
document.getElementById("reserveerForm").addEventListener("submit", function(e) {
    e.preventDefault();

    const naam = document.getElementById("naam").value;
    const email = document.getElementById("email").value;
    const bericht = document.getElementById("bericht").value;
    
    let productLijst = cart.map(i => `- ${i.naam} (${i.qty}x)`).join("%0D%0A"); // %0D%0A is een nieuwe regel in e-mail
    let totaal = document.getElementById("checkoutTotal").innerText;

    const mailTo = "huisjebotanica@outlook.com"; // VERVANG DIT DOOR JOUW E-MAILADRES
    const subject = `Reservering aanvraag: ${naam}`;
    const body = `Beste Huisje Botanica,%0D%0A%0D%0AIk zou graag de volgende items willen reserveren:%0D%0A%0D%0A${productLijst}%0D%0A%0D%0A${totaal}%0D%0A%0D%0AGegevens klant:%0D%0ANaam: ${naam}%0D%0AE-mail: ${email}%0D%0A%0D%0ABericht:%0D%0A${bericht}`;

    // Open de e-mail client
    window.location.href = `mailto:${mailTo}?subject=${subject}&body=${body}`;

    // Optioneel: Maak mandje leeg na verzenden
    // localStorage.removeItem("h_botanica_cart");
});

renderCheckout();
