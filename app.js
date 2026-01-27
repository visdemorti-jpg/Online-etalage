const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ-AiZSsevrWVln27kgIkvL65fD2FVzMQ_fnb850l-1kikcKIijx6Kpv51yQ7X-3tGJHq3lPdt7LTEZ/pub?output=csv";
let items = [];

// Stap 1: Data ophalen
fetch(SHEET_URL)
  .then(response => response.text())
  .then(text => {
    console.log("Data ontvangen van Google Sheets");
    parseData(text);
  })
  .catch(err => console.error("Fout bij ophalen Sheet:", err));

// Stap 2: Data verwerken (eenvoudige maar sterke parser)
function parseData(text) {
  const rows = text.split(/\r?\n/).map(row => row.split(","));
  const headers = rows[0].map(h => h.trim().toLowerCase()); // We maken alles kleine letters voor de zekerheid

  items = rows.slice(1).map(row => {
    const obj = {};
    headers.forEach((header, i) => {
      obj[header] = row[i] ? row[i].trim().replace(/^"|"$/g, '') : "";
    });
    return obj;
  }).filter(item => item.id); // Alleen items met een ID tonen

  console.log("Geparste items:", items);
  renderShop("all");
  initFilters();
}

// Stap 3: Filters instellen
function initFilters() {
  const select = document.getElementById("categorieFilter");
  if (!select) return;

  const categories = [...new Set(items.map(i => i.categorie))].filter(Boolean);
  categories.forEach(cat => {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = cat;
    select.appendChild(opt);
  });
  select.onchange = () => renderShop(select.value);
}

// Stap 4: Producten op het scherm zetten
function renderShop(filter) {
  const grid = document.getElementById("etalage");
  if (!grid) return;
  grid.innerHTML = "";

  items.forEach(item => {
    // Check of item getoond moet worden
    if (item.zichtbaar === "X") return;
    if (item.gereserveerd === "JA") return;
    if (parseInt(item["op voorraad"]) <= 0) return;
    if (filter !== "all" && item.categorie !== filter) return;

    const article = document.createElement("article");
    article.className = "product";
    article.innerHTML = `
      <div class="product-image-wrapper">
        <img src="${item["video/foto"]}" alt="${item.naam}" onerror="this.src='https://via.placeholder.com/400x500?text=Afbeelding+niet+gevonden'">
      </div>
      <div class="product-info">
        <h2>${item.naam}</h2>
        <div class="product-price">€ ${item.prijs}</div>
      </div>
    `;
    
    article.onclick = () => openModal(item);
    grid.appendChild(article);
  });
}

// Stap 5: Modal (Detailweergave)
function openModal(item) {
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
        <div class="description">${item.beschrijving || 'Handgemaakt natuurkunstwerk van Huisje Botanica.'}</div>
        <div class="stock-info">Voorraad: ${item["op voorraad"]}</div>
        <button class="primary" onclick="reserveer('${item.id}')">Reserveer dit werk</button>
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
  const geselecteerd = items.find(i => i.id === id);
  localStorage.setItem("stolp", JSON.stringify(geselecteerd));
  window.location.href = "reserveren.html";
}
