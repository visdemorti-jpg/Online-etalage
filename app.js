const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ-AiZSsevrWVln27kgIkvL65fD2FVzMQ_fnb850l-1kikcKIijx6Kpv51yQ7X-3tGJHq3lPdt7LTEZ/pub?output=csv";
let items = [];

// Data ophalen uit Google Sheets
fetch(SHEET_URL)
  .then(response => response.text())
  .then(csvText => {
    const rows = csvText.split("\n").map(r => r.split(","));
    const headers = rows[0].map(h => h.trim());

    items = rows.slice(1).map(r => {
      let obj = {};
      headers.forEach((h, i) => {
        obj[h] = r[i] ? r[i].trim() : "";
      });
      return obj;
    }).filter(i => i.id); // Sla lege rijen over

    initFilters();
    renderShop("all");
  })
  .catch(err => console.error("Fout bij laden van de sheet:", err));

// Filters opbouwen
function initFilters() {
  const select = document.getElementById("categorieFilter");
  const categories = [...new Set(items.map(i => i.categorie))].filter(Boolean);
  
  categories.forEach(cat => {
    const opt = document.createElement("option");
    opt.value = opt.textContent = cat;
    select.appendChild(opt);
  });

  select.onchange = (e) => renderShop(e.target.value);
}

// Producten tonen in het grid
function renderShop(filter) {
  const grid = document.getElementById("etalage");
  grid.innerHTML = "";

  items.forEach(item => {
    // Regels voor zichtbaarheid
    if (item.zichtbaar === "X" || item.gereserveerd === "JA") return;
    if (parseInt(item["op voorraad"]) <= 0) return;
    if (filter !== "all" && item.categorie !== filter) return;

    const article = document.createElement("div");
    article.className = "product-card";
    article.innerHTML = `
      <div class="product-image-wrapper">
        <img src="${item["video/foto"]}" loading="lazy">
      </div>
      <h2>${item.naam}</h2>
      <div class="price">€ ${item.prijs}</div>
    `;
    article.onclick = () => openDetails(item);
    grid.appendChild(article);
  });
}

// Detail venster openen
function openDetails(item) {
  const modal = document.getElementById("productModal");
  const body = document.getElementById("modalBody");
  
  body.innerHTML = `
    <div class="modal-image">
      <img src="${item["video/foto"]}" style="width:100%; display:block;">
    </div>
    <div class="modal-info">
      <p class="tagline">${item.categorie}</p>
      <h1>${item.naam}</h1>
      <p class="price" style="font-size:1.4rem;">€ ${item.prijs}</p>
      <div class="modal-description">${item.beschrijving || 'Handgemaakt kunstwerk van Huisje Botanica.'}</div>
      <p style="font-size:0.8rem; color:#888;">Beschikbaar: ${item["op voorraad"]} stuk(s)</p>
      <button class="btn-reserve" onclick="reserveer('${item.id}')">Reserveer dit werk</button>
    </div>
  `;
  modal.style.display = "block";
  document.body.style.overflow = "hidden";
}

function closeModal() {
  document.getElementById("productModal").style.display = "none";
  document.body.style.overflow = "auto";
}

function reserveer(id) {
  const item = items.find(i => i.id === id);
  localStorage.setItem("stolp", JSON.stringify(item));
  window.location.href = "reserveren.html";
}q
