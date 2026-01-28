const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwcPrlEMrSccYCTfgjELqwUZQu_FWar2HaecDvm7-qH9iz18Mi6QCqoQWokcpWEihWfKg/exec"; // Gebruik de ALLERNIEUWSTE URL!

document.getElementById("reserveerForm").addEventListener("submit", async function(e) {
    e.preventDefault();
    const btn = document.getElementById("submitBtn");
    btn.disabled = true;
    btn.innerText = "Bezig met verwerken...";

    const klantNaam = document.getElementById("naam").value;
    const klantEmail = document.getElementById("email").value;
    const klantBericht = document.getElementById("bericht").value;
    const totaalTekst = document.getElementById("checkoutTotal").innerText;

    // We maken een lijst met alle verzoeken die we tegelijk gaan sturen
    const promises = cart.map(item => {
        return fetch(SCRIPT_URL, {
            method: "POST",
            mode: "no-cors", // Behoud no-cors voor Google
            cache: "no-cache",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                id: item.id,
                aantal: item.qty,
                klant: klantNaam,
                email: klantEmail
            })
        });
    });

    try {
        // Wacht tot alle items naar Google zijn gestuurd
        await Promise.all(promises);

        // Stel e-mail samen
        let productLijst = cart.map(i => `- ${i.naam} (${i.qty}x)`).join("%0D%0A");
        const mailTo = "info@huisjebotanica.be"; 
        const subject = `Nieuwe Reservatie: ${klantNaam}`;
        const body = `Beste Huisje Botanica,%0D%0A%0D%0AEr is een nieuwe reservatie geplaatst.%0D%0A%0D%0AItems:%0D%0A${productLijst}%0D%0A%0D%0A${totaalTekst}%0D%0A%0D%0AKlantgegevens:%0D%0ANaam: ${klantNaam}%0D%0AE-mail: ${klantEmail}%0D%0A%0D%0ABericht:%0D%0A${klantBericht}`;

        // Open e-mail app
        window.location.href = `mailto:${mailTo}?subject=${subject}&body=${body}`;

        alert("De voorraad wordt bijgewerkt in de database! Klik nu op 'Verzenden' in je e-mail programma.");
        
        localStorage.removeItem("h_botanica_cart");
        setTimeout(() => { window.location.href = "index.html"; }, 2000);

    } catch (error) {
        console.error("Fout:", error);
        alert("Er kon geen verbinding worden gemaakt met de database. De e-mail wordt wel geopend.");
        btn.disabled = false;
    }
});
