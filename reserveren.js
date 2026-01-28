// VUL DEZE 3 DINGEN IN:
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycby3V_kygxORwQdB_wzcl4Sj4ZUUedfVh5yjy-Z3qY7qf7TnXOHjIr6pkRKB7a8bIlYPAg/execN";
const EMAILJS_SERVICE = "service_50mriqo";
const EMAILJS_TEMPLATE = "template_h6htw8f";

const STORAGE_KEY = "h_botanica_cart";
let cart = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

// 1. Render Checkout Lijst
function renderCheckout() {
    const container = document.getElementById("checkoutItems");
    const totalEl = document.getElementById("checkoutTotal");
    if(!container) return;
    
    container.innerHTML = "";
    let totaal = 0;
    
    cart.forEach((item) => {
        const prijs = parseFloat(String(item.prijs).replace(',', '.')) || 0;
        const sub = prijs * item.qty;
        totaal += sub;
        
        container.innerHTML += `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; padding-bottom:1rem; border-bottom:1px dashed #eee;">
                <div>
                    <div style="font-weight:500;">${item.naam}</div>
                    <small style="color:#888;">${item.qty} x € ${item.prijs}</small>
                </div>
                <div>€ ${sub.toFixed(2).replace('.', ',')}</div>
            </div>`;
    });
    
    if(totalEl) totalEl.innerHTML = `Totaal: € ${totaal.toFixed(2).replace('.', ',')}`;
}

// 2. Formulier Afhandeling
document.getElementById("reserveerForm").addEventListener("submit", async function(e) {
    e.preventDefault();
    const btn = document.getElementById("submitBtn");
    btn.disabled = true;
    btn.innerText = "Bezig met verwerken...";

    const orderNr = "HB-" + Math.floor(Date.now() / 1000).toString().slice(-4);
    const klantNaam = document.getElementById("naam").value;
    const klantEmail = document.getElementById("email").value;
    const bericht = document.getElementById("bericht").value;
    const productenTekst = cart.map(i => `${i.naam} (${i.qty}x)`).join(", ");
    const totaalBedrag = document.getElementById("checkoutTotal").innerText;

    try {
        // A. Data naar Google Sheets sturen
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

        // B. E-mail verzenden via EmailJS
        await emailjs.send(EMAILJS_SERVICE, EMAILJS_TEMPLATE, {
            order_nr: orderNr,
            klant_naam: klantNaam,
            klant_email: klantEmail,
            producten: productenTekst,
            totaal: totaalBedrag,
            bericht: bericht
        });

        // C. Afronden
        alert(`Bedankt ${klantNaam}! Uw reservatie (${orderNr}) is ontvangen. U ontvangt een bevestiging per mail.`);
        localStorage.removeItem(STORAGE_KEY);
        window.location.href = "index.html";

    } catch (error) {
        console.error(error);
        alert("Er ging iets mis. Controleer uw internetverbinding.");
        btn.disabled = false;
        btn.innerText = "Bevestig Reservatie";
    }
});

renderCheckout();
