const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ-AiZSsevrWVln27kgIkvL65fD2FVzMQ_fnb850l-1kikcKIijx6Kpv51yQ7X-3tGJHq3lPdt7LTEZ/pub?output=csv";
let items = [];

// Data ophalen met de eenvoudige methode
fetch(SHEET_URL)
  .then(res => res.text())
  .then(text => {
    const rows = text.split("\n").map(r => r.split(","));
    const headers = rows[0].map(h => h.trim());

    items = rows.slice(1).map(r => {
      let obj = {};
      headers.forEach((h, i) => {
        obj[h] = r[i] ? r[i].trim() : "";
      });
      return obj;
    }).filter(i => i.id); // Filter lege rijen

    initFilters();
    render("all");
  });

function initFilters() {
  const select = document.getElementById("categorieFilter");
  const cats = [...new Set(items.map(i => i.categorie))].filter(Boolean);
  cats.forEach(c => {
    const o = document.createElement("option");
    o.value = o.textContent = c;
    select.appendChild(o);
  });
  select.onchange = () => render(select.value);
}

function render(filter) {
  const grid = document.getElementById("etalage");
  grid.innerHTML = "";

  items.forEach(item => {
    if (item.zichtbaar === "X" || item.gereserveerd === "JA") return;
    if (parseInt(item["op voorraad"]) <= 0) return;
    if (filter !== "all" && item.categorie !== filter) return;

    const div = document.createElement("div");
    div.className = "product-card";
    div.innerHTML = `
      <img src="${item["video/foto"]}" loading="lazy">
      <h2>${item.naam}</h2>
      <div class="price">€ ${item.prijs}</div>
    `;
    div.onclick = () => openDetails(item);
    grid.appendChild(div);
  });
}

function openDetails(item) {
  const modal = document.getElementById("productModal");
  const body = document.getElementById("modalBody");
  
  body.innerHTML = `
    <div class="modal-image">
      <img src="${item["video/foto"]}" style="width:100%;">
    </div>
    <div class="modal-info">
      <p class="tagline">${item.categorie}</p>
      <h1>${item.naam}</h1>
      <p class="price" style="font-size:1.5rem;">€ ${item.prijs}</p>
      <div class="modal-description">${item.beschrijving}</div>
      <p style="font-size:0.8rem; color:gray;">Beschikbaar: ${item["op voorraad"]}</p>
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
}
