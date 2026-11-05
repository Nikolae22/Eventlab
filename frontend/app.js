const EVENT_API = "http://localhost:8081/api/events";

async function caricaEventi() {
    const risposta = await fetch(EVENT_API);
    const eventi = await risposta.json();

    const contenitore = document.getElementById("eventi");
    contenitore.innerHTML = "";

    eventi.forEach(evento => {
        const posti = evento.capienzaMassima; // i posti residui li calcoli dopo
        contenitore.innerHTML += `
      <div class="col-md-4">
        <div class="card h-100">
          <div class="card-body">
            <h5 class="card-title">${evento.titolo}</h5>
            <p class="card-text">${evento.descrizione ?? ""}</p>
            <p class="mb-1"><strong>Data:</strong> ${new Date(evento.dataEvento).toLocaleString("it-IT")}</p>
            <p class="mb-1"><strong>Luogo:</strong> ${evento.luogo ?? "-"}</p>
            <p><strong>Capienza:</strong> ${posti}</p>
          </div>
        </div>
      </div>`;
    });
}

caricaEventi();