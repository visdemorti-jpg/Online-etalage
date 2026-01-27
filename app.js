const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ-AiZSsevrWVln27kgIkvL65fD2FVzMQ_fnb850l-1kikcKIijx6Kpv51yQ7X-3tGJHq3lPdt7LTEZ/pub?output=csv";

fetch(SHEET_URL)
  .then(res => res.text())
  .then(text => {
    const rows = text.split("\n").map(r => r.split(","));
    const headers = rows[0];
    const etalage = document.getElementById("etalage");

    rows.slice(1).forEach(r => {
      const item = Object.fromEntries(headers.map((h, i) => [h, r[i]]));

      if (item.zichtbaar === "X") return;

      const div = document.createElement("div");
      div.className = "stolp";
      div.innerHTML = `
        <h2>${item.naam}</h2>
        <img src="${item["video/foto"]}">
        <p>€${item.prijs}</p>
      `;

      etalage.appendChild(div);
    });
  });
