const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz-3igsIdFYQzfRAt2ia67-7lXtvIZJaZ-8ZLJEKtA4pn33tBNVYS_3XEOMyHCXZ6Kr5A/exec";

const stolp = JSON.parse(localStorage.getItem("stolp"));
const container = document.getElementById("reservering");

if (!stolp) {
  container.innerHTML = "<p>Geen stolp geselecteerd.</p>";
} else {
  container.innerHTML = `
    <div class="stolp">
      <img src="${stolp["video/foto"]}">
      <h2>${stolp.naam}</h2>
      <div class="prijs">€${stolp.prijs}</div>
    </div>

    <form id="form">
      <input id="naam" placeholder="Naam" required>
      <input id="email" type="email" placeholder="E-mail" required>
      <button>Reserveer deze stolp 🦋</button>
    </form>
  `;

  document.getElementById("form").onsubmit = e => {
    e.preventDefault();

    fetch(SCRIPT_URL, {
      method: "POST",
      body: JSON.stringify({
        id: stolp.ID,
        naam: document.getElementById("naam").value,
        email: document.getElementById("email").value
      })
    }).then(() => {
      alert("Dank je wel 🦋 Je reservering is ontvangen.");
      localStorage.removeItem("stolp");
      window.location.href = "index.html";
    });
  };
}
