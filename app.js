const SHEET_URL = "JOUW_CSV_URL_HIER";
let items = [];

async function loadShop() {
    const response = await fetch(SHEET_URL);
    const text = await response.text();
    
    // Betere parsing voor velden met komma's
    const rows = text.split("\n").map(line => line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g));
    const headers = rows[0].map(h => h.trim().replace(/"/g, ''));

    items = rows.slice(1).map(r => {
        if (!r) return null;
        return Object.fromEntries(headers.map((h, i) => [h, r[i]?.replace(/"/g, '').trim()]));
    }).filter(i => i && i.id);

    render();
    fillFilters();
}

function render(filter = "all") {
    const grid = document.getElementById("etalage");
    grid.innerHTML = "";

    items.forEach(item => {
        if (item.zichtbaar === "X" || Number(item["op voorraad"]) <= 0) return;
        if (filter !== "all" && item.categorie !== filter) return;

        const el = document.createElement("article");
        el.className = "product";
        el.innerHTML = `
            <div class="product-image-wrapper">
                <img src="${item["video/foto"]}" loading="lazy">
            </div>
            <h2>${item.naam}</h2>
            <div class="product-price">€ ${item.prijs}</div>
        `;
        el.onclick = () => showDetails(item);
        grid.appendChild(el);
    });
}

function showDetails(item) {
    const modal = document.getElementById("productModal");
    const content = document.getElementById("modalContent");
    
    content.innerHTML = `
        <div class="product-image-wrapper">
            <img src="${item["video/foto"]}">
        </div>
        <div>
            <h1 style="font-size: 2rem; margin-bottom: 1rem;">${item.naam}</h1>
            <p style="color: var(--muted); margin-bottom: 2rem;">${item.categorie}</p>
            <div style="font-size: 1.5rem; margin-bottom: 2rem;">€ ${item.prijs}</div>
            <p style="margin-bottom: 2rem; white-space: pre-line;">${item.beschrijving || 'Geen beschrijving beschikbaar.'}</p>
            <button class="primary" onclick="goToReserve('${item.id}')">Reserveer dit werk</button>
            <p style="font-size: 0.75rem; color: var(--muted); margin-top: 1rem;">
                Beschikbaar: ${item["op voorraad"]} exemplaar/exemplaren
            </p>
        </div>
    `;
    modal.style.display = "block";
    document.body.style.overflow = "hidden"; // Geen scroll in de achtergrond
}

function closeModal() {
    document.getElementById("productModal").style.display = "none";
    document.body.style.overflow = "auto";
}

function goToReserve(id) {
    const item = items.find(i => i.id === id);
    localStorage.setItem("selected_product", JSON.stringify(item));
    window.location.href = "reserveren.html";
}

loadShop();
