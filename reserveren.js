const stolp = JSON.parse(localStorage.getItem("geselecteerdeStolp"));
const container = document.getElementById("reservering");

if (!stolp) {
  container.innerHTML = "<p>Geen stolp geselecteerd.</p>";
} else {
  container.innerHTML = `
    <div class="stolp">
      <h2>${stolp.naam}</h2>
      <img src="${stolp["video/foto"]}">
      <p>€${stolp.prijs}</p>
    </div>

    <form id="formulier">
      <input type="text" id="naam" placeholder="Naam" required>
      <input type="email" id="email" placeholder="E-mail" required>
      <button type="submit">Bevestig reservering</button>
    </form>
  `;

  document.getElementById("formulier").addEventListener("submit", e => {
    e.preventDefault();
    verstuurReservering(stolp.ID);
  });
}

function verstuurReservering(id) {
  const naam = document.getElementById("naam").value;
  const email = document.getElementById("email").value;

  fetch("PLAK_HIER_JE_APPS_SCRIPT_URL", {
    method: "POST",
    body: JSON.stringify({ id, naam, email })
  }).then(() => {
    alert("Reservering succesvol ✨");
    localStorage.removeItem("geselecteerdeStolp");
    window.location.href = "index.html";
  });
}
