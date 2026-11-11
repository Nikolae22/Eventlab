const EVENT_API = "http://localhost:8081/api/events";
const BOOKING_API = "http://localhost:8082/api/bookings";

let eventoCorrenteId=null;
let listaEventiGlobale=[]; // salviamo gli eventi per permettere il filtraggio instantaneo

//funzione per mostrare i feedback
function mostraMessaggio(testo, tipo) {
    const box = document.getElementById("messaggio");
    if (!box) return;

    if (tipo === "success") {
        box.className = "mb-6 p-4 rounded-xl text-sm font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-sm block";
    } else {
        box.className = "mb-6 p-4 rounded-xl text-sm font-medium bg-rose-50 text-rose-800 border border-rose-200 shadow-sm block";
    }

    box.textContent = testo;

    setTimeout(() => {
        box.classList.add("hidden");
    }, 4500);
}


// Mostra un errore specifico dentro la card dell'evento in cui si sta tentando la prenotazione
function mostraErroreCard(eventId, testo) {
    const errorBox = document.getElementById(`errore-form-${eventId}`);
    if (!errorBox) return;

    errorBox.textContent = testo;
    errorBox.classList.remove("hidden");

    setTimeout(() => {
        errorBox.classList.add("hidden");
    }, 6000);
}

// per nascondere il forum di inserire eventi
function toggleAreaOperatore(){
    const sezione=document.getElementById("sezioneOperatore");
    sezione.classList.toggle("hidden")
}

// per chiudere il modal -> lista dei partecipianti a un evento
function chiudiModal(){
    const modal=document.getElementById("modalPartecipianti");
    modal.classList.add("hidden")
}

async function postiResidui(evento) {
    if (evento.id == null) return 0;
    try {
        const risposta = await fetch(`${BOOKING_API}/event/${evento.id}/count`);
        if (!risposta.ok) return 0;
        const prenotati = await risposta.json();
        return evento.capienzaMassima - prenotati;
    }catch (e){
        return 0;
    }
}

// prenota cioe booking service -> la persoan al evento
async function prenota(eventId, nome, email) {
    const errorBox=document.getElementById(`errore-form-${event}`);
    if (errorBox) errorBox.classList.add("hidden")
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
        //estrazione dettaglaita dell errore dal backend Spring boot
        const dati = await risposta.json().catch(()=> ({}));
        let messaggioErrore= "Errore durante la prenotazione";
        if (dati.errore) {
            messaggioErrore = dati.errore;
        }else if (dati.message) {
            messaggioErrore=dati.message;
        } else if (typeof dati === 'object' && Object.keys(dati).length >0) {
            // Gestione errori di validazione dei campi (es. @Email, @NotBlank)
            mostraMessaggio(Object.values(dati).join(" "), "danger");
        } else {
            mostraMessaggio("Errore durante la prenotazione (es. e-mail già registrata o posti esauriti).", "danger");
        }
        //mosta lerrore direttamente dentro la catd dell eventi
        mostraErroreCard(eventId,messaggioErrore);
        return false;
    } catch (error) {
        mostraErroreCard(eventId, "Errore di connessione con il server delle prenotazioni.");
        return false;
    }
}


// crea evento  sono se hai password emmail del operatore
async function creaEvento(e) {
    e.preventDefault();
    const form = e.target;

    // Se non le abbiamo già salvate in memoria, le chiediamo con un prompt del browser
    if (!window.opUsername || !window.opPassword) {
        window.opUsername = prompt("Inserisci username operatore:");
        window.opPassword = prompt("Inserisci password operatore:");
    }

    if (!window.opUsername || !window.opPassword) {
        mostraMessaggio("Operazione annullata: credenziali mancanti.", "danger");
        return;
    }

    //dati dal forum
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
                //questo mi salva in memoria i dati e me gli riutilizza senza dover riscrivere fino al refesh delalp aggina
                "Authorization": "Basic " + btoa(window.opUsername + ":" + window.opPassword)
            },
            body: JSON.stringify(nuovoEvento)
        });

        if (risposta.status === 201 || risposta.ok) {
            mostraMessaggio("Evento creato con successo!", "success");
            form.reset();
            toggleAreaOperatore();
            await caricaEventi();
        } else if (risposta.status === 401 || risposta.status === 403) {
            // Se le credenziali sono errate, le azzeriamo così il prompt le richiede la prossima volta
            window.opUsername = null;
            window.opPassword = null;
            mostraMessaggio("Credenziali errate o non autorizzato (serve il ruolo OPERATORE).", "danger");
        } else {
            const dati = await risposta.json().catch(() => ({}));
            mostraMessaggio(dati.errore ?? "Errore nella creazione dell'evento.", "danger");
        }
    } catch (err) {
        mostraMessaggio("Errore di comunicazione con l'Event Service.", "danger");
    }
}

//elimina prenotazione da un booking solo se hai i dati del operatore
async function eliminaPrenotazione(bookingId) {
    if (!confirm("Sei sicuro di voler eliminare questa prenotazione? Il posto tornerà disponibile.")) return;

    // Chiediamo le credenziali se non sono già state inserite in questa sessione
    if (!window.opUsername || !window.opPassword) {
        window.opUsername = prompt("Inserisci username operatore per eliminare la prenotazione:");
        window.opPassword = prompt("Inserisci password operatore:");
    }

    if (!window.opUsername || !window.opPassword) {
        mostraMessaggio("Operazione annullata: credenziali mancanti.", "danger");
        return;
    }

    try {
        const risposta = await fetch(`${BOOKING_API}/${bookingId}`, {
            method: "DELETE",
            headers: {
                //questo mi salva in memoria i dati e me gli riutilizza senza dover riscrivere fino al refesh delalp aggina
                "Authorization": "Basic " + btoa(window.opUsername + ":" + window.opPassword)
            }
        });

        if (risposta.status === 204 || risposta.ok) {
            mostraMessaggio("Prenotazione eliminata con successo.", "success");
            await caricaEventi();
            if (eventoCorrenteId) {
                await apriElenco(eventoCorrenteId);
            }
        } else if (risposta.status === 401 || risposta.status === 403) {
            // Se le credenziali sono errate, le azzeriamo così il prompt le richiederà correttamente
            window.opUsername = null;
            window.opPassword = null;
            mostraMessaggio("Credenziali errate o non autorizzato (serve il ruolo OPERATORE).", "danger");
        } else {
            const dati = await risposta.json().catch(() => ({}));
            mostraMessaggio(dati.errore ?? "Errore durante l'eliminazione", "danger");
        }
    } catch (e) {
        mostraMessaggio("Errore di connessione durante l'eliminazione.", "danger");
    }
}


//card per ogni evento
function creaCard(evento, posti) {
    const dataEvento = new Date(evento.dataEvento);
    const oggi = new Date();

    // L'evento è disponibile SOLO SE ci sono posti > 0 E la data è nel futuro
    const eNelFuturo = dataEvento > oggi;
    const disponibile = (posti > 0) && eNelFuturo;

    // Testo dinamico per il badge di stato
    let testoStato = "Disponibile";
    let classeStato = "bg-indigo-50 text-indigo-600";

    if (!eNelFuturo) {
        testoStato = "Passato / Chiuso";
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
          <span class="px-3 py-1 text-xs font-semibold rounded-full ${classeStato}">
            ${testoStato}
          </span>
          <span class="text-xs font-medium text-slate-400">
            ${dataEvento.toLocaleDateString("it-IT", { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <h3 class="text-base font-bold text-slate-800 mb-1">${evento.titolo}</h3>
        <p class="text-slate-500 text-xs mb-3">📍 ${evento.luogo ?? "-"}</p>
        <p class="text-slate-600 text-xs mb-4 line-clamp-2">${evento.descrizione ?? "Nessuna descrizione disponibile."}</p>
      </div>
      
      <div>
        <div class="mb-4">
          <div class="flex justify-between text-xs font-semibold text-slate-600 mb-1">
            <span>Disponibilità</span>
            <span class="${disponibile ? 'text-slate-600' : 'text-slate-400 font-bold'}">
              ${eNelFuturo ? (posti > 0 ? `${posti} / ${evento.capienzaMassima} posti` : 'Esauriti') : 'Evento Concluso'}
            </span>
          </div>
          <div class="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div class="${eNelFuturo && posti > 0 ? 'bg-indigo-600' : 'bg-slate-400'} h-full rounded-full transition-all duration-500" style="width: ${percentuale}%"></div>
          </div>
        </div>

        ${disponibile ? `
          <button class="w-full py-2.5 px-4 bg-slate-900 hover:bg-indigo-600 text-white text-xs font-semibold rounded-xl transition-colors duration-200 mb-2 shadow-sm" onclick="apriForm(${evento.id})">
            Prenota il tuo posto
          </button>
          
          <!-- Box errore specifico della card -->
          <div id="errore-form-${evento.id}" class="hidden mb-2 p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-[11px] font-medium text-center"></div>

          <form id="form-${evento.id}" class="mt-2 hidden p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2" onsubmit="inviaForm(event, ${evento.id})">
            <input class="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500" name="nome" placeholder="Nome e cognome" required maxlength="100">
            <input class="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500" name="email" type="email" placeholder="Indirizzo e-mail" required>
            <button class="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors" type="submit">Conferma Prenotazione</button>
          </form>
        ` : `
          <div class="w-full py-2.5 px-4 bg-slate-100 text-slate-400 text-xs font-bold rounded-xl text-center mb-2 border border-slate-200 cursor-not-allowed">
            ${!eNelFuturo ? 'EVENTO CONCLUSO' : 'PRENOTAZIONI ESAURITE'}
          </div>
        `}

        <hr class="my-3 border-slate-100">
        <button class="w-full py-2 px-3 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-semibold rounded-xl transition-colors border border-slate-200" onclick="apriElenco(${evento.id})">
          📋 Gestisci partecipanti
        </button>
      </div>
    </div>`;
}

//apri il form booking per event id
function apriForm(eventId) {
    const form = document.getElementById(`form-${eventId}`);
    if (form) {
        form.classList.toggle("hidden");
    }
}

async function inviaForm(e, eventId) {
    e.preventDefault();
    const form = e.target;
    const nome = form.nome.value.trim();
    const email = form.email.value.trim();

    const ok = await prenota(eventId, nome, email);
    if (ok) {
        form.reset();
        form.classList.add("hidden");
        await caricaEventi();   // aggiorna i posti residui
    }
}

// funzione che mi serve per vedere lista dei prenotati con il tasto elimina e il tasto csv per scaricare
//richesta semrpe autorizazione
async function apriElenco(eventId){
    eventoCorrenteId = eventId;
    const bodyModal = document.getElementById("contenutoModalPartecipanti");

    // Controlliamo se abbiamo già le credenziali salvate, altrimenti le chiediamo
    if (!window.opUsername || !window.opPassword) {
        window.opUsername = prompt("Inserisci username operatore per visualizzare i partecipanti:");
        window.opPassword = prompt("Inserisci password operatore:");
    }

    if (!window.opUsername || !window.opPassword) {
        mostraMessaggio("Operazione annullata: credenziali mancanti.", "danger");
        return;
    }

    bodyModal.innerHTML = `<div class="text-center py-6"><div class="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div></div>`;

    const modal = document.getElementById('modalPartecipanti');
    modal.classList.remove("hidden");

    try {
        const risposta = await fetch(`${BOOKING_API}/event/${eventId}`, {
            method: "GET",
            headers: {
                //questo mi salva in memoria i dati e me gli riutilizza senza dover riscrivere fino al refesh delalp aggina
                "Authorization": "Basic " + btoa(window.opUsername + ":" + window.opPassword)
            }
        });

        if (risposta.status === 401 || risposta.status === 403) {
            window.opUsername = null;
            window.opPassword = null;
            chiudiModal();
            mostraMessaggio("Credenziali errate o non autorizzato.", "danger");
            return;
        }

        const prenotazioni = await risposta.json();

        // Aggiungiamo un pulsante per scaricare il CSV direttamente nel modale
        let htmlContent = `
            <div class="mb-4 flex justify-end">
                <button onclick="esportaCsv(${eventId})" class="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-xs font-semibold rounded-xl transition-colors border border-indigo-100">
                    📥 Scarica CSV Evento
                </button>
            </div>
            <div class="divide-y divide-slate-100">
        `;

        if (prenotazioni.length === 0) {
            bodyModal.innerHTML = `<p class="text-slate-400 text-center py-6 text-xs">Nessuna prenotazione registrata per questo evento.</p>`;
            return;
        }

        htmlContent += prenotazioni.map(p => `
            <div class="flex justify-between items-center py-3 px-1">
              <div>
                <div class="text-xs font-bold text-slate-800">${p.participantName}</div>
                <div class="text-[11px] text-slate-400">${p.participantEmail}</div>
              </div>
              <button class="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-semibold rounded-lg transition-colors border border-rose-100" onclick="eliminaPrenotazione(${p.id})">
                Elimina
              </button>
            </div>
        `).join('') + `</div>`;

        if (bodyModal) {
            bodyModal.innerHTML = htmlContent;
        }

    } catch (e) {
        if (bodyModal) {
            bodyModal.innerHTML = `<div class="p-4 bg-rose-50 text-rose-700 rounded-xl text-xs text-center">Errore nel caricamento dei partecipanti.</div>`;
        }
    }
}

//esporta csv file semrpre autorizato
async function esportaCsv(eventId) {
    if (!window.opUsername || !window.opPassword) {
        mostraMessaggio("Credenziali operatore mancanti.", "danger");
        return;
    }

    try {
        const risposta = await fetch(`${BOOKING_API}/event/${eventId}/export`, {
            method: "GET",
            headers: {
                "Authorization": "Basic " + btoa(window.opUsername + ":" + window.opPassword)
            }
        });

        if (!risposta.ok) {
            mostraMessaggio("Errore durante l'esportazione del CSV.", "danger");
            return;
        }

        // Creazione automatica del file da scaricare nel browser
        const blob = await risposta.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bookings_event_${eventId}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);

        mostraMessaggio("CSV esportato con successo!", "success");
    } catch (e) {
        mostraMessaggio("Errore di connessione durante l'esportazione.", "danger");
    }
}

// Funzione per filtrare gli eventi in tempo reale tramite la barra di ricerca
async function renderizzaEventi(eventiDaMostrare) {
    const contenitore = document.getElementById("eventi");
    contenitore.innerHTML = "";

    if (eventiDaMostrare.length === 0) {
        contenitore.innerHTML = `<div class="col-span-full text-center py-12 text-slate-400 text-sm">Nessun evento corrisponde alla ricerca.</div>`;
        return;
    }

    for (const evento of eventiDaMostrare) {
        const posti = await postiResidui(evento);
        contenitore.innerHTML += creaCard(evento, posti);
    }
}

function filtraEventi() {
    const query = document.getElementById("inputRicerca").value.toLowerCase();
    const dataDaStr = document.getElementById("filtroDataDa").value;
    const dataAStr = document.getElementById("filtroDataA").value;

    const dataDa = dataDaStr ? new Date(dataDaStr) : null;
    // Impostiamo l'ora alla fine della giornata per la data "A" così prende dentro anche l'ultimo giorno
    const dataA = dataAStr ? new Date(dataAStr + "T23:59:59") : null;

    const eventiFiltrati = listaEventiGlobale.filter(evento => {
        const matchTesto = evento.titolo.toLowerCase().includes(query) ||
            (evento.luogo && evento.luogo.toLowerCase().includes(query));

        const dataEvento = new Date(evento.dataEvento);

        // Controllo filtro data "Da"
        const matchDataDa = dataDa ? dataEvento >= dataDa : true;

        // Controllo filtro data "A"
        const matchDataA = dataA ? dataEvento <= dataA : true;

        return matchTesto && matchDataDa && matchDataA;
    });

    renderizzaEventi(eventiFiltrati);
}

async function caricaEventi() {
    try {
        const risposta = await fetch(EVENT_API);
        if (!risposta.ok) throw new Error("Errore nel recupero eventi");
        listaEventiGlobale = await risposta.json(); // Salviamo in memoria globale

        if (listaEventiGlobale.length === 0) {
            document.getElementById("eventi").innerHTML =
                `<div class="col-span-full text-center py-12 text-slate-400 text-sm">
                    Nessun evento presente. Usa il pulsante "Area Operatore" in alto per crearne uno.</div>`;
            return;
        }

        // Applichiamo subito il filtro (o mostriamo tutto se la barra è vuota)
        filtraEventi();
    } catch (e) {
        const contenitore = document.getElementById("eventi");
        if (contenitore) {
            contenitore.innerHTML = `<div class="col-span-full p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs text-center">Impossibile connettersi al server degli eventi su <strong>${EVENT_API}</strong>. Verifica che i microservizi Java siano attivi.</div>`;
        }
    }
}

// Avvio automatico al caricamento della pagina
caricaEventi();