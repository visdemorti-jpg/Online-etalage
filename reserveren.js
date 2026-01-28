const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbywLWy0OnqAs3G1gvyHU33hrGLJ8NVqZuA854oanjy6uxfW9NgOtlPYKWlK5WAhNiSfqg/execN"; 
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

        container.innerHTML += `
            <div style="display: flex; gap: 1.5rem; align-items: center; margin-bottom: 1.5rem; padding-bottom: 1.5rem; border-bottom: 1px dashed var(--line);">
                <img src="${item["video/foto"]}" style="width: 90px; height: 90px; object-fit: cover; background: #eee; border-radius: 2px;">
                <div style="flex: 1;">
                    <h3 style="font-size: 0.85rem; margin: 0; text-transform: uppercase; letter-spacing: 0.05em;">${item.naam}</h3>
                    <p style="font-size: 0.8rem; color: var(--muted); margin: 5px 0;">€ ${item.prijs} p.st.</p>
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
    cart.splice(index, 1);
    saveAndRefresh();
};

function saveAndRefresh() {
    localStorage.setItem("h_botanica_cart", JSON.stringify(cart));
    renderCheckout();
}

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
        // We sturen de data naar Google
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

        // E-mail opstellen
        let productLijst = cart.map(i => `- ${i.naam} (${i.qty}x)`).join("%0D%0A");
        const mailTo = "info@huisjebotanica.be"; 
        const subject = `Nieuwe Reservatie: ${klantNaam}`;
        const body = `Beste Huisje Botanica,%0D%0A%0D%0AEr is een nieuwe reservatie geplaatst.%0D%0A%0D%0AItems:%0D%0A${productLijst}%0D%0A%0D%0A${totaalTekst}%0D%0A%0D%0AKlantgegevens:%0D%0ANaam: ${klantNaam}%0D%0AE-mail: ${klantEmail}%0D%0A%0D%0ABericht:%0D%0A${klantBericht}`;

        window.location.href = `mailto:${mailTo}?subject=${subject}&body=${body}`;

        alert("De voorraad is bijgewerkt! Verstuur nu nog de e-mail die wordt geopend.");
        localStorage.removeItem("h_botanica_cart");
        window.location.href = "index.html";

    } catch (error) {
        console.error("Fout:", error);
        alert("Er kon geen verbinding worden gemaakt met de database. De e-mail wordt wel geopend.");
        btn.disabled = false;
    }
});

renderCheckout();
