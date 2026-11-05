const EVENT_API = "http://localhost:8081/api/events";
const BOOKING_API = "http://localhost:8082/api/bookings";

function mostraMessaggio(testo, tipo) {
    const box = document.getElementById("messaggio");
    box.className = `alert alert-${tipo}`;
    box.textContent = testo;
}

async function postiResidui(evento) {
    const risposta = await fetch(`${BOOKING_API}/event/${evento.id}/count`);
    const prenotati = await risposta.json();
    return evento.capienzaMassima - prenotati;
}

async function prenota(eventId, nome, email) {
    const risposta = await fetch(BOOKING_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, participantName: nome, participantEmail: email })
    });

    const dati = await risposta.json();

    console.log("Body inviato:", { eventId, participantName: nome, participantEmail: email },
        "Status:", risposta.status, "Risposta:", dati);

    if (risposta.status === 201) {
        mostraMessaggio("Prenotazione confermata!", "success");
        return true;
    }
    if (dati.errore) {
        mostraMessaggio(dati.errore, "danger");
    } else {
        mostraMessaggio(Object.values(dati).join(" "), "danger");
    }
    return false;
}

function creaCard(evento, posti) {
    const disponibile = posti > 0;
    return `
    <div class="col-md-4">
      <div class="card h-100">
        <div class="card-body">
          <h5 class="card-title">${evento.titolo}</h5>
          <p class="card-text">${evento.descrizione ?? ""}</p>
          <p class="mb-1"><strong>Data:</strong> ${new Date(evento.dataEvento).toLocaleString("it-IT")}</p>
          <p class="mb-1"><strong>Luogo:</strong> ${evento.luogo ?? "-"}</p>
          <p class="mb-3"><strong>Posti disponibili:</strong> ${Math.max(posti, 0)} / ${evento.capienzaMassima}</p>

          ${disponibile ? `
            <button class="btn btn-primary btn-sm" onclick="apriForm(${evento.id})">Prenota</button>
            <form id="form-${evento.id}" class="mt-3 d-none" onsubmit="inviaForm(event, ${evento.id})">
              <input class="form-control mb-2" name="nome" placeholder="Nome e cognome" required maxlength="100">
              <input class="form-control mb-2" name="email" type="email" placeholder="Email" required>
              <button class="btn btn-success btn-sm" type="submit">Conferma</button>
            </form>
          ` : `<span class="badge bg-danger">Completo</span>`}
        </div>
      </div>
    </div>`;
}

function apriForm(eventId) {
    document.getElementById(`form-${eventId}`).classList.toggle("d-none");
}

async function inviaForm(e, eventId) {
    e.preventDefault();
    const form = e.target;
    const nome = form.nome.value.trim();
    const email = form.email.value.trim();

    const ok = await prenota(eventId, nome, email);
    if (ok) {
        await caricaEventi();   // aggiorna i posti residui
    }
}

async function caricaEventi() {
    const risposta = await fetch(EVENT_API);
    const eventi = await risposta.json();

    const contenitore = document.getElementById("eventi");
    contenitore.innerHTML = "";

    for (const evento of eventi) {
        const posti = await postiResidui(evento);
        contenitore.innerHTML += creaCard(evento, posti);
    }
}

caricaEventi();