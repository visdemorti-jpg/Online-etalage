// reserveren.js
console.log("Script geladen...");

document.addEventListener("DOMContentLoaded", function() {
    console.log("Pagina geladen, mandje ophalen...");
    
    const rawData = localStorage.getItem("h_botanica_cart");
    console.log("Raw data uit storage:", rawData);

    if (!rawData || rawData === "[]") {
        document.getElementById("checkoutItems").innerHTML = "<p>Uw winkelmand is leeg (geen data gevonden).</p>";
        return;
    }

    try {
        const cart = JSON.parse(rawData);
        const container = document.getElementById("checkoutItems");
        let totaal = 0;

        container.innerHTML = ""; // Maak leeg

        cart.forEach((item, index) => {
            console.log("Item verwerken:", item.naam);
            // We vangen fouten op per item
            const prijs = parseFloat(item.prijs.toString().replace(',', '.')) || 0;
            const subtotaal = prijs * item.qty;
            totaal += subtotaal;

            container.innerHTML += `
                <div style="border-bottom:1px solid #eee; padding:10px; display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <strong>${item.naam}</strong><br>
                        ${item.qty} x € ${item.prijs}
                    </div>
                    <div>€ ${subtotaal.toFixed(2)}</div>
                </div>
            `;
        });

        document.getElementById("checkoutTotal").innerHTML = "Totaal: € " + totaal.toFixed(2).replace('.', ',');

    } catch (err) {
        console.error("Fout bij het verwerken van mandje:", err);
        document.getElementById("checkoutItems").innerHTML = "<p>Er ging iets mis bij het laden: " + err.message + "</p>";
    }
});
