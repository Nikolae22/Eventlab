const EVENT_API = "http://localhost:8081/api/events";
const BOOKING_API = "http://localhost:8082/api/bookings";

let eventoCorrenteId = null;
let listaEventiGlobale = [];

// ---------- Messaggi ----------

function mostraMessaggio(testo, tipo) {
    const box = document.getElementById("messaggio");
    if (!box) return;
    box.className = tipo === "success"
        ? "mb-6 p-4 rounded-xl text-sm font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-sm block"
        : "mb-6 p-4 rounded-xl text-sm font-medium bg-rose-50 text-rose-800 border border-rose-200 shadow-sm block";
    box.textContent = testo;
    setTimeout(() => box.classList.add("hidden"), 4500);
}

function mostraErroreForm(idBox, testo) {
    const box = document.getElementById(idBox);
    if (!box) return;
    box.textContent = testo;
    box.classList.remove("hidden");
}

function nascondiErroreForm(idBox) {
    const box = document.getElementById(idBox);
    if (box) box.classList.add("hidden");
}

function messaggioErroreGentile(testo) {
    const t = (testo || "").toLowerCase();
    if (t.includes("già") || t.includes("gia") || t.includes("registrazione") || t.includes("duplicat"))
        return "Questa e-mail risulta già prenotata per questo evento. Usa un altro indirizzo.";
    if (t.includes("completo") || t.includes("esaurit"))
        return "Spiacenti, i posti per questo evento sono esauriti.";
    if (t.includes("passato") || t.includes("finit"))
        return "Questo evento si è già svolto: non è più possibile prenotarsi.";
    if (t.includes("non trovato"))
        return "L'evento non è più disponibile.";
    return testo || "Non è stato possibile completare la prenotazione.";
}

// ---------- Pannelli ----------

function toggleAreaOperatore() {
    document.getElementById("sezioneOperatore").classList.toggle("hidden");
}

function chiudiModal() {
    document.getElementById("modalPartecipanti").classList.add("hidden");
}

document.getElementById("modalPartecipanti").addEventListener("click", (e) => {
    if (e.target.id === "modalPartecipanti") chiudiModal();
});

document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") chiudiModal();
});

// ---------- Credenziali operatore (solo in memoria, per la pagina) ----------

function chiediCredenziali() {
    if (!window.opUsername || !window.opPassword) {
        const u = prompt("Username operatore:");
        if (!u) return false;
        const p = prompt("Password operatore:");
        if (!p) return false;
        window.opUsername = u;
        window.opPassword = p;
    }
    return true;
}

function authHeader() {
    return "Basic " + btoa(window.opUsername + ":" + window.opPassword);
}

function resetCredenziali() {
    window.opUsername = null;
    window.opPassword = null;
}

// ---------- Posti e prenotazioni ----------

async function postiResidui(evento) {
    if (evento.id == null) return 0;
    try {
        const risposta = await fetch(`${BOOKING_API}/event/${evento.id}/count`);
        if (!risposta.ok) return 0;
        const prenotati = await risposta.json();
        return evento.capienzaMassima - prenotati;
    } catch (e) {
        return 0;
    }
}

async function prenota(eventId, nome, email) {
    try {
        const risposta = await fetch(BOOKING_API, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ eventId, participantName: nome, participantEmail: email })
        });

        if (risposta.status === 201 || risposta.ok) {
            mostraMessaggio("Prenotazione confermata con successo!", "success");
            return true;
        }

        const dati = await risposta.json().catch(() => ({}));
        let testo = dati.errore ?? dati.message ?? null;
        if (!testo && Object.keys(dati).length > 0) {
            testo = Object.values(dati).join(" ");
        }
        mostraErroreForm(`errore-form-${eventId}`, messaggioErroreGentile(testo));
        return false;
    } catch (error) {
        mostraErroreForm(`errore-form-${eventId}`, "Impossibile contattare il servizio prenotazioni. Riprova tra poco.");
        return false;
    }
}

async function inviaForm(e, eventId) {
    e.preventDefault();
    const form = e.target;
    const idErr = `errore-form-${eventId}`;
    nascondiErroreForm(idErr);

    const nome = form.nome.value.trim();
    const email = form.email.value.trim();

    if (!nome) {
        mostraErroreForm(idErr, "Il nome e cognome è obbligatorio.");
        form.nome.focus();
        return;
    }
    if (!email) {
        mostraErroreForm(idErr, "L'indirizzo e-mail è obbligatorio.");
        form.email.focus();
        return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        mostraErroreForm(idErr, "L'e-mail non sembra valida, controllala.");
        form.email.focus();
        return;
    }

    const ok = await prenota(eventId, nome, email);
    if (ok) {
        form.reset();
        form.classList.add("hidden");
        await caricaEventi();
    }
}

function apriForm(eventId) {
    const form = document.getElementById(`form-${eventId}`);
    if (form) form.classList.toggle("hidden");
}

// ---------- Partecipanti (solo operatore) ----------

async function apriElenco(eventId) {
    eventoCorrenteId = eventId;
    if (!chiediCredenziali()) {
        mostraMessaggio("Operazione annullata: credenziali mancanti.", "danger");
        return;
    }

    const bodyModal = document.getElementById("contenutoModalPartecipanti");
    bodyModal.innerHTML = `<div class="text-center py-6"><div class="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div></div>`;
    document.getElementById("modalPartecipanti").classList.remove("hidden");

    try {
        const risposta = await fetch(`${BOOKING_API}/event/${eventId}`, {
            headers: { "Authorization": authHeader() }
        });

        if (risposta.status === 401 || risposta.status === 403) {
            resetCredenziali();
            chiudiModal();
            mostraMessaggio("Credenziali errate o permessi insufficienti.", "danger");
            return;
        }

        const prenotazioni = await risposta.json();

        if (prenotazioni.length === 0) {
            bodyModal.innerHTML = `<p class="text-slate-400 text-center py-6 text-xs">Nessuna prenotazione registrata per questo evento.</p>`;
            return;
        }

        bodyModal.innerHTML = `
            <div class="mb-4 flex justify-end">
                <button onclick="esportaCsv(${eventId})" class="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-xs font-semibold rounded-xl border border-indigo-100">
                    📥 Scarica CSV
                </button>
            </div>
            ${prenotazioni.map(p => `
                <div class="flex justify-between items-center py-3 px-1">
                    <div>
                        <div class="text-xs font-bold text-slate-800">${p.participantName}</div>
                        <div class="text-[11px] text-slate-400">${p.participantEmail}</div>
                    </div>
                    <button class="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-semibold rounded-lg border border-rose-100"
                            onclick="eliminaPrenotazione(${p.id})">Elimina</button>
                </div>`).join("")}`;
    } catch (e) {
        bodyModal.innerHTML = `<div class="p-4 bg-rose-50 text-rose-700 rounded-xl text-xs text-center">Errore nel caricamento dei partecipanti.</div>`;
    }
}

async function eliminaPrenotazione(bookingId) {
    if (!confirm("Eliminare questa prenotazione? Il posto tornerà disponibile.")) return;
    if (!chiediCredenziali()) {
        mostraMessaggio("Operazione annullata: credenziali mancanti.", "danger");
        return;
    }

    try {
        const risposta = await fetch(`${BOOKING_API}/${bookingId}`, {
            method: "DELETE",
            headers: { "Authorization": authHeader() }
        });

        if (risposta.status === 204 || risposta.ok) {
            mostraMessaggio("Prenotazione eliminata.", "success");
            await caricaEventi();
            if (eventoCorrenteId) await apriElenco(eventoCorrenteId);
        } else if (risposta.status === 401 || risposta.status === 403) {
            resetCredenziali();
            mostraMessaggio("Credenziali errate o permessi insufficienti.", "danger");
        } else {
            const dati = await risposta.json().catch(() => ({}));
            mostraMessaggio(dati.errore ?? "Errore durante l'eliminazione.", "danger");
        }
    } catch (e) {
        mostraMessaggio("Impossibile contattare il servizio prenotazioni.", "danger");
    }
}

async function esportaCsv(eventId) {
    if (!chiediCredenziali()) return;

    try {
        const risposta = await fetch(`${BOOKING_API}/event/${eventId}/export`, {
            headers: { "Authorization": authHeader() }
        });
        if (!risposta.ok) {
            mostraMessaggio("Errore durante l'esportazione del CSV.", "danger");
            return;
        }
        const blob = await risposta.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `bookings_event_${eventId}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    } catch (e) {
        mostraMessaggio("Errore di connessione durante l'esportazione.", "danger");
    }
}

// ---------- Creazione evento (solo operatore) ----------

async function creaEvento(e) {
    e.preventDefault();
    const form = e.target;
    const ID_ERR = "errore-nuovo-evento";
    nascondiErroreForm(ID_ERR);

    const controlli = [
        { campo: "titolo", messaggio: "Inserisci il titolo dell'evento." },
        { campo: "dataEvento", messaggio: "Scegli la data e l'ora dell'evento." },
        { campo: "capienzaMassima", messaggio: "Indica la capienza massima." }
    ];
    for (const c of controlli) {
        if (!form[c.campo].value.trim()) {
            mostraErroreForm(ID_ERR, c.messaggio);
            form[c.campo].focus();
            return;
        }
    }
    if (parseInt(form.capienzaMassima.value) < 1) {
        mostraErroreForm(ID_ERR, "La capienza deve essere almeno 1.");
        form.capienzaMassima.focus();
        return;
    }
    if (new Date(form.dataEvento.value) <= new Date()) {
        mostraErroreForm(ID_ERR, "La data dell'evento deve essere nel futuro.");
        form.dataEvento.focus();
        return;
    }

    if (!chiediCredenziali()) {
        mostraErroreForm(ID_ERR, "Credenziali mancanti: operazione annullata.");
        return;
    }

    const nuovoEvento = {
        titolo: form.titolo.value.trim(),
        descrizione: form.descrizione.value.trim(),
        dataEvento: new Date(form.dataEvento.value).toISOString(),
        luogo: form.luogo.value.trim(),
        capienzaMassima: parseInt(form.capienzaMassima.value)
    };

    try {
        const risposta = await fetch(EVENT_API, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": authHeader()
            },
            body: JSON.stringify(nuovoEvento)
        });

        if (risposta.ok) {
            form.reset();
            toggleAreaOperatore();
            mostraMessaggio("Evento pubblicato con successo!", "success");
            await caricaEventi();
        } else if (risposta.status === 401 || risposta.status === 403) {
            resetCredenziali();
            mostraErroreForm(ID_ERR, "Credenziali errate o permessi insufficienti.");
        } else {
            const dati = await risposta.json().catch(() => ({}));
            const testo = dati.errore ?? (Object.values(dati).length
                ? Object.values(dati).join(" ")
                : "Non è stato possibile creare l'evento.");
            mostraErroreForm(ID_ERR, testo);
        }
    } catch (err) {
        mostraErroreForm(ID_ERR, "Impossibile contattare il servizio eventi. Riprova tra poco.");
    }
}

// ---------- Card e rendering ----------

function creaCard(evento, posti) {
    const dataEvento = new Date(evento.dataEvento);
    const eNelFuturo = dataEvento > new Date();
    const disponibile = posti > 0 && eNelFuturo;

    let testoStato = "Disponibile";
    let classeStato = "bg-indigo-50 text-indigo-600";
    if (!eNelFuturo) {
        testoStato = "Concluso";
        classeStato = "bg-slate-100 text-slate-500 border border-slate-200";
    } else if (posti <= 0) {
        testoStato = "Sold Out";
        classeStato = "bg-rose-50 text-rose-600 border border-rose-100";
    }

    const postiOccupati = evento.capienzaMassima - Math.max(posti, 0);
    const percentuale = Math.min(Math.round((postiOccupati / evento.capienzaMassima) * 100), 100);

    return `
    <div class="bg-white rounded-2xl p-6 border border-slate-100 shadow-xl shadow-slate-100 hover:shadow-2xl transition-all duration-300 flex flex-col justify-between">
      <div>
        <div class="flex justify-between items-start mb-3">
          <span class="px-3 py-1 text-xs font-semibold rounded-full ${classeStato}">${testoStato}</span>
          <span class="text-xs font-medium text-slate-400">
            ${dataEvento.toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
        <h3 class="text-base font-bold text-slate-800 mb-1">${evento.titolo}</h3>
        <p class="text-slate-500 text-xs mb-3">📍 ${evento.luogo ?? "-"}</p>
        <p class="text-slate-600 text-xs mb-4">${evento.descrizione ?? "Nessuna descrizione disponibile."}</p>
      </div>

      <div>
        <div class="mb-4">
          <div class="flex justify-between text-xs font-semibold text-slate-600 mb-1">
            <span>Disponibilità</span>
            <span>${eNelFuturo ? (posti > 0 ? `${posti} / ${evento.capienzaMassima} posti` : "Esauriti") : "Evento concluso"}</span>
          </div>
          <div class="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div class="${disponibile ? "bg-indigo-600" : "bg-slate-400"} h-full rounded-full transition-all duration-500" style="width: ${percentuale}%"></div>
          </div>
        </div>

        ${disponibile ? `
          <button class="w-full py-2.5 px-4 bg-slate-900 hover:bg-indigo-600 text-white text-xs font-semibold rounded-xl transition-colors mb-2 shadow-sm"
                  onclick="apriForm(${evento.id})">Prenota il tuo posto</button>

          <div id="errore-form-${evento.id}" class="hidden mb-2 p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-[11px] font-medium text-center"></div>

          <form id="form-${evento.id}" novalidate class="mt-2 hidden p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2"
                onsubmit="inviaForm(event, ${evento.id})">
            <input class="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                   name="nome" placeholder="Nome e cognome" maxlength="100">
            <input class="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                   name="email" type="email" placeholder="Indirizzo e-mail">
            <button class="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors" type="submit">
                Conferma prenotazione
            </button>
          </form>
        ` : `
          <div class="w-full py-2.5 px-4 bg-slate-100 text-slate-400 text-xs font-bold rounded-xl text-center mb-2 border border-slate-200">
            ${!eNelFuturo ? "EVENTO CONCLUSO" : "PRENOTAZIONI ESAURITE"}
          </div>
        `}

        <hr class="my-3 border-slate-100">
        <button class="w-full py-2 px-3 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-semibold rounded-xl border border-slate-200"
                onclick="apriElenco(${evento.id})">📋 Gestisci partecipanti</button>
      </div>
    </div>`;
}

function renderizzaEventi(eventiDaMostrare) {
    const contenitore = document.getElementById("eventi");

    if (eventiDaMostrare.length === 0) {
        contenitore.innerHTML = `<div class="col-span-full text-center py-12 text-slate-400 text-sm">Nessun evento corrisponde alla ricerca.</div>`;
        return;
    }

    Promise.all(eventiDaMostrare.map(async evento => {
        const posti = await postiResidui(evento);
        return creaCard(evento, posti);
    })).then(card => {
        contenitore.innerHTML = card.join("");
    });
}

function filtraEventi() {
    const query = document.getElementById("inputRicerca").value.toLowerCase();
    const dataDaStr = document.getElementById("filtroDataDa").value;
    const dataAStr = document.getElementById("filtroDataA").value;

    const dataDa = dataDaStr ? new Date(dataDaStr) : null;
    const dataA = dataAStr ? new Date(dataAStr + "T23:59:59") : null;

    const filtrati = listaEventiGlobale.filter(evento => {
        const matchTesto = evento.titolo.toLowerCase().includes(query) ||
            (evento.luogo && evento.luogo.toLowerCase().includes(query));
        const dataEvento = new Date(evento.dataEvento);
        const matchDa = dataDa ? dataEvento >= dataDa : true;
        const matchA = dataA ? dataEvento <= dataA : true;
        return matchTesto && matchDa && matchA;
    });

    renderizzaEventi(filtrati);
}

async function caricaEventi() {
    const contenitore = document.getElementById("eventi");
    try {
        const risposta = await fetch(EVENT_API);
        if (!risposta.ok) throw new Error();
        listaEventiGlobale = await risposta.json();

        if (listaEventiGlobale.length === 0) {
            contenitore.innerHTML = `<div class="col-span-full text-center py-12 text-slate-400 text-sm">
                Nessun evento presente. Usa "Area Operatore" in alto per crearne uno.</div>`;
            return;
        }
        filtraEventi();
    } catch (e) {
        contenitore.innerHTML = `<div class="col-span-full p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs text-center">
            Impossibile connettersi al server degli eventi. Verifica che i servizi Java siano attivi.</div>`;
    }
}

caricaEventi();