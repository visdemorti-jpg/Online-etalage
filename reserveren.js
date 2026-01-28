const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbx19AFBjjGD5Q1U7eknRI47RE3BSewQTip9a8rAlN-9TmPIQSqW-Py4qQ0SbOzU-M-D3Q/exec";
const STORAGE_KEY = "h_botanica_cart";
let cart = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

function renderCheckout() {
    const container = document.getElementById("checkoutItems");
    const totalEl = document.getElementById("checkoutTotal");
    if(!container) return;
    container.innerHTML = "";
    let totaal = 0;
    cart.forEach((item) => {
        const prijs = parseFloat(String(item.prijs).replace(',', '.')) || 0;
        totaal += prijs * item.qty;
        container.innerHTML += `<div style="display:flex; justify-content:space-between; margin-bottom:1rem;">
            <div>${item.naam} (${item.qty}x)</div>
            <div>€ ${(prijs * item.qty).toFixed(2).replace('.', ',')}</div>
        </div>`;
    });
    totalEl.innerHTML = `Totaal: € ${totaal.toFixed(2).replace('.', ',')}`;
}

document.getElementById("reserveerForm").addEventListener("submit", async function(e) {
    e.preventDefault();
    const btn = document.getElementById("submitBtn");
    btn.disabled = true;
    btn.innerText = "Bezig met verwerken...";

    const orderNr = "HB-" + Math.floor(Date.now() / 1000).toString().slice(-4);
    const klantNaam = document.getElementById("naam").value;
    const klantEmail = document.getElementById("email").value;
    const productenTekst = cart.map(i => `${i.naam} (${i.qty}x)`).join(", ");
    const totaalBedrag = document.getElementById("checkoutTotal").innerText;

    try {
        // 1. Google Sheets update
        fetch(SCRIPT_URL, {
            method: "POST",
            mode: "no-cors",
            body: JSON.stringify({
                klant: klantNaam,
                email: klantEmail,
                items: cart,
                orderNr: orderNr
            })
        });

        // 2. Email verzenden via EmailJS (met jouw IDs)
        await emailjs.send("service_50mriqo", "template_h6htw8f", {
            order_nr: orderNr,
            klant_naam: klantNaam,
            klant_email: klantEmail,
            producten: productenTekst,
            totaal: totaalBedrag,
            bericht: document.getElementById("bericht").value
        });

        alert("Gelukt! Je reservatie is verwerkt en je ontvangt een bevestiging per e-mail.");
        localStorage.removeItem(STORAGE_KEY);
        window.location.href = "index.html";

    } catch (error) {
        console.error("Fout:", error);
        alert("Er is een fout opgetreden bij het verzenden.");
        btn.disabled = false;
        btn.innerText = "Aanvraag Verzenden";
    }
});

renderCheckout();
