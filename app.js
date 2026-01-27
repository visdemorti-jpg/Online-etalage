const SHEET_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ-AiZSsevrWVln27kgIkvL65fD2FVzMQ_fnb850l-1kikcKIijx6Kpv51yQ7X-3tGJHq3lPdt7LTEZ/pub?output=csv";

let items = [];
let geselecteerd = null;

fetch(SHEET_URL)
  .then(r => r.text())
  .then(text => {
    const rows = text.split("\n").map(r => r.split(","));
    const headers = rows[0].map(h => h.trim());

    items = rows.slice(1).map(r =>
      Object.fromEntries(headers.map((h, i) => [h, r[i]?.trim()]))
    );

    initFilters();
    render("all");
  });

function initFilters() {
  const select = document.getElementById("categorieFilter");
  [...new Set(items.map(i => i.categorie))].forEach(cat => {
    const o = document.createElement("option");
    o.value = cat;
    o.textContent = cat;
    select.appendChild(o);
  });
  select.onchange = () => render(select.value);
}

function render(cat) {
  const grid = document.getElementById("etalage");
  const actie = document.getElementById("actie");
  grid.innerHTML = "";
  actie.innerHTML = "";

  items.forEach(item => {
    if (item.zichtbaar === "X") return;
    if (Number(item["op voorraad"]) <= 0) return;
    if (cat !== "all" && item.categorie !== cat) return;

    const card = document.createElement("article");
    card.className = "product";
    card.innerHTML = `
      <img src="${item["video/foto"]}">
      <h2>${item.naam}</h2>
      <div class="product-meta">${item.categorie}</div>
      <div class="product-price">€${item.prijs}</div>
    `;

    card.onclick = () => {
      document.querySelectorAll(".product").forEach(p => p.classList.remove("selected"));
      card.classList.add("selected");
      geselecteerd = item;
      toonActie();
    };

    grid.appendChild(card);
  });
}

function toonActie() {
  const actie = document.getElementById("actie");
  actie.innerHTML = "";

  const btn = document.createElement("button");
  btn.textContent = "Ga verder naar reserveren 🦋";
  btn.onclick = () => {
    localStorage.setItem("stolp", JSON.stringify(geselecteerd));
    window.location.href = "reserveren.html";
  };

  actie.appendChild(btn);
}
