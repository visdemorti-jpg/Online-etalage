const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ-AiZSsevrWVln27kgIkvL65fD2FVzMQ_fnb850l-1kikcKIijx6Kpv51yQ7X-3tGJHq3lPdt7LTEZ/pub?output=csv";
let items = [];

// Robuuste CSV parser die rekening houdt met komma's in teksten (zoals beschrijvingen)
function parseCSV(text) {
    const lines = text.split(/\r?\n/);
    if (lines.length === 0) return [];
    
    // Pak de headers en maak ze schoon
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    
    return lines.slice(1).map(line => {
        // Deze regex splitst op komma's, maar negeert komma's binnen aanhalingstekens
        const values = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
        if (!values || values.length < headers.length) return null;
        
        const obj = {};
        headers.forEach((header, i) => {
            let val = values[i] ? values[i].trim().replace(/^"|"$/g, '') : "";
            obj[header] = val;
        });
        return obj;
    }).filter(item => item !== null && item.id);
}

async function initApp() {
    try {
        const response = await fetch(SHEET_URL);
        const csvText = await response.text();
        items = parseCSV(csvText);
        
        renderShop("all");
        populateCategories();
    } catch (error) {
        console.error("Fout bij laden shop:", error);
    }
}

function populateCategories() {
    const select = document.getElementById("categorieFilter");
    const categories = [...new Set(items.map(i => i.categorie))].filter(Boolean);
    
    categories.forEach(cat => {
        const opt = document.createElement("option");
        opt.value = cat;
        opt.textContent = cat;
        select.appendChild(opt);
    });

    select.onchange = (e) => renderShop(e.target.value);
}

function renderShop(filter) {
    const grid = document.getElementById("etalage");
    grid.innerHTML = "";

    items.forEach(item => {
        // Filters: niet zichtbaar of geen voorraad = niet tonen
        if (item.zichtbaar === "X" || item.gereserveerd === "JA") return;
        if (parseInt(item["op voorraad"]) <= 0) return;
        if (filter !== "all" && item.categorie !== filter) return;

        const card = document.createElement("article");
        card.className = "product";
        card.innerHTML = `
            <div class="product-image-wrapper">
                <img src="${item["video/foto"]}" alt="${item.naam}" loading="lazy">
            </div>
            <div class="product-info">
                <h2>${item.naam}</h2>
                <div class="product-price">€ ${item.prijs}</div>
            </div>
        `;
        card.onclick = () => openProduct(item);
        grid.appendChild(card);
    });
}

function openProduct(item) {
    const modal = document.getElementById("productModal");
    const content = document.getElementById("modalContent");
    
    content.innerHTML = `
        <div class="modal-media">
            <img src="${item["video/foto"]}" alt="${item.naam}">
        </div>
        <div class="modal-details">
            <span class="category-label">${item.categorie}</span>
            <h1>${item.naam}</h1>
            <div class="price-large">€ ${item.prijs}</div>
            <div class="description">${item.beschrijving || 'Geen beschrijving beschikbaar.'}</div>
            
            <div class="stock-info">Beschikbaar: ${item["op voorraad"]} stuk(s)</div>
            
            <button class="primary" onclick="startReservation('${item.id}')">
                Reserveer dit object
            </button>
        </div>
    `;
    modal.style.display = "block";
    document.body.style.overflow = "hidden";
}

function closeModal() {
    document.getElementById("productModal").style.display = "none";
    document.body.style.overflow = "auto";
}

function startReservation(id) {
    const item = items.find(i => i.id === id);
    localStorage.setItem("selected_product", JSON.stringify(item));
    window.location.href = "reserveren.html";
}

// Start de app
initApp();
