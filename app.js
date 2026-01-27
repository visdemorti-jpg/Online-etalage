const SHEET_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ-AiZSsevrWVln27kgIkvL65fD2FVzMQ_fnb850l-1kikcKIijx6Kpv51yQ7X-3tGJHq3lPdt7LTEZ/pub?output=csv";

let items = [];
let geselecteerdID = null;

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
  const cats = [...new Set(items.map(i => i.categorie))];

  cats.forEach(c => {
    const o = document.createElement("option");
    o.value = c;
    o.textContent = c;
    select.appendChild(o);
  });

  select.onchange = () => render(select.value);
}

function render(cat) {
  const etalage = document.getElementById("etalage");
  etalage.innerHTML = "";
  document.getElementById("actie").innerHTML = "";

  items.forEach(item => {
    if (item.zichtbaar === "X") return;
    if (cat !== "all" && item.categorie !== cat) return;
    if (item.gereserveerd === "JA") return;

    const div = document.createElement("div");
    div.className = "stolp";
    div.innerHTML = `
      <img src="${item["video/foto"]}">
      <h2>${item.naam}</h2>
      <div class="prijs">€${item.prijs}</div>
      <div class="beschrijving">${item.beschrijving}</div>
    `;

    div.onclick = () => {
      document.querySelectorAll(".stolp").forEach(s => s.classList.remove("selected"));
      div.classList.add("selected");
      geselecteerdID = item.ID;
      toonKnop();
    };

    etalage.appendChild(div);
  });
}

function toonKnop() {
  const actie = document.getElementById("actie");
  actie.innerHTML = "";

  const btn = document.createElement("button");
  btn.textContent = "Verder met reserveren 🦋";

  btn.onclick = () => {
    const stolp = items.find(i => i.ID === geselecteerdID);
    localStorage.setItem("stolp", JSON.stringify(stolp));
    window.location.href = "reserveren.html";
  };

  actie.appendChild(btn);
}
