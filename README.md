# EventLab

Mini piattaforma per la gestione di eventi gratuiti e prenotazioni.

**Java 21 • Spring Boot 4 • MySQL 8 • REST • Docker**

Un operatore pubblica gli eventi, i visitatori si prenotano e il sistema impedisce di superare la capienza. Il progetto è composto da due microservizi Spring Boot indipendenti, un database MySQL e una pagina web essenziale.

---

## Indice

1. [Avvio rapido](#avvio-rapido)
2. [Indirizzi e credenziali demo](#indirizzi-e-credenziali-demo)
3. [Swagger e API](#swagger-e-api)
4. [Architettura](#architettura)
5. [Personalizzare la configurazione](#personalizzare-la-configurazione)
6. [Avvio senza Docker (sviluppo locale)](#avvio-senza-docker-sviluppo-locale)
7. [Sicurezza](#sicurezza)
8. [Test](#test)
9. [Struttura del repository](#struttura-del-repository)
10. [Flusso di lavoro con Git](#flusso-di-lavoro-con-git)
11. [Limitazioni note](#limitazioni-note)

---

## Avvio rapido

**Prerequisito: solo Docker** (con Docker Compose). Non servono Java, Maven, MySQL o Node installati.

```bash
git clone https://github.com/Nikolae22/Eventlab.git
cd Eventlab
docker compose up --build
```

Il primo avvio può richiedere alcuni minuti: Docker scarica le immagini e compila i due servizi. Quando nei log compaiono `Started EventServiceApplication` e `Started BookingServiceApplication`, apri:

**http://localhost:3000**

Il database parte già con **eventi e prenotazioni di esempio**, quindi puoi provare subito tutto il flusso:

1. vedi l'elenco degli eventi con i posti disponibili
2. ti prenoti a un evento
3. i posti residui si aggiornano
4. dall'**Area Operatore** crei un evento e gestisci i partecipanti

Per fermare tutto:

```bash
docker compose down
```

> I dati **non sono salvati in un volume**: a ogni `docker compose down` il database si azzera e al prossimo `up` riparte con i dati di esempio. È pensato per una demo ripetibile.

---

## Indirizzi e credenziali demo

| Cosa | Indirizzo |
|---|---|
| Frontend | http://localhost:3000 |
| Event Service (API) | http://localhost:8081 |
| Booking Service (API) | http://localhost:8082 |
| Swagger Event Service | http://localhost:8081/swagger-ui.html |
| Swagger Booking Service | http://localhost:8082/swagger-ui.html |
| Adminer (gestione DB) | http://localhost:8080 |

**Credenziali operatore (dimostrative)**

| Utente | Password |
|---|---|
| `operatore` | `test1234` |

**Adminer**: sistema `MySQL`, server `db`, utente `eventlab`, password `eventlab`, database `eventlab_events` o `eventlab_bookings`.

> Sono credenziali di esempio per la demo. Non usarle in un ambiente reale (vedi [Personalizzare la configurazione](#personalizzare-la-configurazione)).

---

## Swagger e API

Ogni servizio espone la propria documentazione interattiva con Swagger UI:

- Event Service: http://localhost:8081/swagger-ui.html
- Booking Service: http://localhost:8082/swagger-ui.html

La pagina Swagger è libera, mentre le API riservate richiedono le credenziali: clicca **Authorize** in alto a destra e inserisci utente e password dell'operatore (HTTP Basic).

### Event Service (porta 8081)

| Metodo | Endpoint | Funzione | Accesso |
|---|---|---|---|
| GET | `/api/events` | Elenco eventi | Pubblico |
| GET | `/api/events/{id}` | Dettaglio evento e capienza | Pubblico |
| POST | `/api/events` | Crea un evento | Operatore |
| PUT | `/api/events/{id}` | Aggiorna un evento | Operatore |

### Booking Service (porta 8082)

| Metodo | Endpoint | Funzione | Accesso |
|---|---|---|---|
| POST | `/api/bookings` | Prenota un posto | Pubblico |
| GET | `/api/bookings/event/{eventId}/count` | Numero prenotazioni dell'evento | Pubblico |
| GET | `/api/bookings/event/{eventId}` | Elenco prenotazioni dell'evento | Operatore |
| DELETE | `/api/bookings/{id}` | Annulla una prenotazione | Operatore |
| GET | `/api/bookings/event/{eventId}/export` | Esporta elenco prenotazioni in CSV | Operatore |

### Esempi con curl

```bash
# Elenco eventi (pubblico)
curl http://localhost:8081/api/events

# Prenotazione (pubblica)
curl -i -X POST http://localhost:8082/api/bookings \
  -H "Content-Type: application/json" \
  -d '{"eventId":2,"participantName":"Mario Rossi","participantEmail":"mario@esempio.it"}'

# Creazione evento (operatore)
curl -i -u operatore:test1234 -X POST http://localhost:8081/api/events \
  -H "Content-Type: application/json" \
  -d '{"titolo":"Nuovo evento","descrizione":"Prova","dataEvento":"2030-01-15T18:00:00","luogo":"Aula 1","capienzaMassima":20}'

# Elenco prenotazioni di un evento (operatore)
curl -u operatore:test1234 http://localhost:8082/api/bookings/event/1

# Annullamento prenotazione (operatore)
curl -i -u operatore:test1234 -X DELETE http://localhost:8082/api/bookings/1
```

### Codici di risposta principali

| Codice | Significato |
|---|---|
| 200 / 201 / 204 | Operazione riuscita |
| 400 | Dati non validi (campi mancanti, e-mail errata, evento passato) |
| 401 | Credenziali mancanti o errate |
| 403 | Utente autenticato ma senza permessi |
| 404 | Evento o prenotazione non trovati |
| 409 | E-mail già prenotata per l'evento oppure evento al completo |
| 503 | Event Service non raggiungibile |

---

## Architettura

```
┌──────────────────────┐
│   Frontend (nginx)   │  HTML + CSS + JavaScript
└──────────┬───────────┘
           │  REST / JSON
   ┌───────┴────────┐
   ▼                ▼
┌──────────────┐  GET /api/events/{id}  ┌────────────────┐
│Event Service │◄───────────────────────│ Booking Service│
│   :8081      │                        │     :8082      │
└──────┬───────┘                        └───────┬────────┘
       │                                        │
       └───────────────┬────────────────────────┘
                       ▼
               ┌────────────────┐
               │   MySQL 8.0    │
               │ eventlab_events│
               │ eventlab_bookings│
               └────────────────┘
```

- **Event Service**: crea, modifica e consulta gli eventi (data, luogo, capienza).
- **Booking Service**: registra, elenca e annulla le prenotazioni. Per prenotare chiede i dati dell'evento all'Event Service con una chiamata REST (`GET /api/events/{id}`) e verifica che l'evento esista, non sia passato e abbia posti liberi.
- **Database**: un solo server MySQL con **due schemi separati**. Ogni servizio legge e scrive solo nel proprio e nella tabella `booking` l'evento è identificato solo dal suo numero (`event_id`), senza chiave esterna verso l'altro schema.
- **Posti disponibili** = capienza massima − prenotazioni attive. Annullando una prenotazione il posto torna libero, senza altri passaggi.

Il Booking Service legge anche quando l'Event Service è spento (elenco, conteggio, annullamento). Solo la creazione di una prenotazione fallisce, con un errore chiaro `503`.

**Tecnologie:** Java 21, Spring Boot 4, Spring Web, Spring Data JPA / Hibernate, Spring Security (HTTP Basic), Bean Validation, springdoc-openapi (Swagger), MySQL 8, JUnit 5, Docker e Docker Compose, nginx.

---

## Personalizzare la configurazione

Tutta la configurazione si cambia **senza toccare il codice**, con variabili d'ambiente. Il `docker-compose.yml` ha valori di default, quindi tutto funziona anche senza file `.env`.

### 1. Creare il proprio file `.env`

Nella radice del repository (accanto a `docker-compose.yml`) crea un file `.env`. Il file **non viene caricato su Git**.

```env
MYSQL_ROOT_PASSWORD=una_password_root
MYSQL_USER=eventlab
MYSQL_PASSWORD=una_password_database
OPERATORE_USERNAME=mio_operatore
OPERATORE_PASSWORD=una_password_lunga_e_segreta
```

Puoi partire da `.env.example`:

```bash
cp .env.example .env
```

### 2. Variabili disponibili

| Variabile | Default | Cosa controlla |
|---|---|---|
| `MYSQL_ROOT_PASSWORD` | `rootpass` | Password dell'utente root di MySQL |
| `MYSQL_USER` | `eventlab` | Utente MySQL usato dai due servizi |
| `MYSQL_PASSWORD` | `eventlab` | Password dell'utente MySQL |
| `OPERATORE_USERNAME` | `operatore` | Username dell'operatore (API riservate) |
| `OPERATORE_PASSWORD` | `test1234` | Password dell'operatore |

Variabili lette dai due servizi (impostate nel `docker-compose.yml`):

| Variabile | Servizio | Cosa controlla |
|---|---|---|
| `DB_HOST`, `DB_PORT`, `DB_NAME` | entrambi | Host, porta e schema del database |
| `EVENT_SERVICE_URL` | Booking Service | Indirizzo dell'Event Service (nel compose: `http://event-service:8081`) |

### 3. Dopo aver cambiato le credenziali

Se cambi `MYSQL_USER`, ricorda che lo script `database/01-init.sql` assegna i permessi a un utente con quel nome: aggiorna anche lo script, altrimenti i servizi ricevono `Access denied`.

Dopo ogni modifica alle variabili o agli script SQL, ricrea i container da zero (gli script SQL girano solo al primo avvio con database vuoto):

```bash
docker compose down -v
docker compose up --build
```

### 4. Cambiare le porte

Nel `docker-compose.yml`, nella sezione `ports` di ogni servizio, il formato è `"porta_sul_tuo_pc:porta_nel_container"`. Per esempio, se la 3306 è occupata da un MySQL già installato:

```yaml
ports:
  - "3307:3306"
```

Se cambi la porta del frontend o dei servizi, aggiorna anche:

- **`frontend/app.js`**: le costanti `EVENT_API` e `BOOKING_API` in cima al file
- **CORS** dei due servizi (`SecurityConfig`): l'origine consentita deve coincidere con l'indirizzo da cui apri il frontend

### 5. Cambiare i dati di esempio

Gli script in `database/` vengono eseguiti in ordine alfabetico al primo avvio:

| File | Contenuto |
|---|---|
| `01-init.sql` | Crea i due schemi e assegna i permessi |
| `02-events-schema.sql` | Tabella `event` |
| `03-events-demo.sql` | Eventi di esempio |
| `04-bookings-schema.sql` | Tabella `booking` con vincolo di e-mail unica per evento |
| `05-bookings-demo.sql` | Prenotazioni di esempio |

Modifica `03` e `05` per avere i tuoi dati, oppure eliminali per partire con un database vuoto.

### 6. Rendere persistenti i dati

Per default i dati si perdono a ogni `docker compose down`. Per conservarli, aggiungi un volume al servizio `db`:

```yaml
services:
  db:
    volumes:
      - ./database:/docker-entrypoint-initdb.d
      - mysql_data:/var/lib/mysql

volumes:
  mysql_data:
```

Con il volume gli script SQL girano solo la prima volta. Per ripartire da zero usa `docker compose down -v`.

### 7. Usare una produzione vera

Per un ambiente reale:

- usa password lunghe e diverse dai default, passate solo tramite variabili d'ambiente
- non lasciare i valori demo `operatore` / `test1234`
- limita il CORS al dominio reale del frontend
- valuta `spring.jpa.hibernate.ddl-auto=validate` insieme agli script SQL, al posto di `update`

---

## Avvio senza Docker (sviluppo locale)

Servono **Java 21**, **Maven** (o il wrapper `./mvnw` incluso) e Docker per il solo database.

**1. Database**

```bash
docker compose up -d db
```

**2. Event Service** (terminale 1)

```bash
cd event-service
./mvnw spring-boot:run
```

**3. Booking Service** (terminale 2)

```bash
cd booking-service
./mvnw spring-boot:run
```

**4. Frontend** (terminale 3)

```bash
cd frontend
npx serve -l 3000
```

Apri http://localhost:3000.

I servizi usano `localhost` e i default di `application.yml`, quindi non serve impostare variabili. Se vuoi usare password diverse, esportale prima dell'avvio:

```bash
export MYSQL_PASSWORD=la_tua_password
export OPERATORE_PASSWORD=la_tua_password
```

---

## Sicurezza

La sicurezza usa Spring Security con **autenticazione HTTP Basic** e un **unico operatore** definito in configurazione (nessun utente salvato nel database).

- La consultazione degli eventi è pubblica.
- La prenotazione e il conteggio dei posti sono pubblici.
- Creazione e modifica eventi, elenco prenotazioni e annullamento richiedono il ruolo `OPERATORE`.
- Senza credenziali o con credenziali errate la risposta è `401`, senza permessi `403`.
- CSRF è disattivato perché le API sono stateless e non usano cookie di sessione.
- Il CORS è configurato per accettare l'origine del frontend (`http://localhost:3000`).

Nel frontend le credenziali dell'operatore vengono chieste con una finestra del browser e tenute solo in memoria finché la pagina resta aperta. Non vengono salvate.

---

## Test

I test usano JUnit 5. Dentro la cartella di ogni servizio:

```bash
./mvnw test
```

Casi coperti dal piano di test:

- creazione evento con dati validi
- evento senza titolo, rifiutato
- dettaglio di un evento inesistente, `404`
- prenotazione con dati validi
- seconda prenotazione con la stessa e-mail, rifiutata
- prenotazione con posti esauriti, rifiutata
- annullamento prenotazione, il posto torna disponibile
- accesso non autorizzato alla modifica evento, rifiutato

---

## Struttura del repository

```
Eventlab/
├── event-service/        Servizio eventi (Spring Boot, porta 8081)
│   ├── src/main/java/com/eventlab/
│   │   ├── controller/
│   │   ├── service/
│   │   ├── repository/
│   │   ├── entity/
│   │   ├── dto/
│   │   ├── exception/
│   │   └── security/
│   ├── Dockerfile
│   └── pom.xml
├── booking-service/      Servizio prenotazioni (Spring Boot, porta 8082)
│   └── (stessa struttura, più il package client)
├── frontend/             Pagina web (HTML, CSS, JavaScript)
│   ├── index.html
│   ├── app.js
│   └── Dockerfile
├── database/             Script SQL di inizializzazione e dati demo
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## Flusso di lavoro con Git

- `main`: versione stabile e consegnabile
- `develop`: integrazione delle funzioni completate
- `feature/...`: un branch per funzione (`feature/events`, `feature/booking`, `feature/docker`, `feature/frontend`)

Messaggi di commit nel formato `tipo: descrizione` (`feat`, `fix`, `chore`, `test`).

---

## Limitazioni note

- Il controllo dei posti non è atomico: due prenotazioni simultanee sull'ultimo posto potrebbero superare la capienza. Per un uso reale servirebbe un blocco a livello di database.
- L'operatore è unico e definito in configurazione: non è prevista la registrazione di utenti.
- La chiamata tra i due servizi usa un indirizzo fisso (nessuna service discovery).
- I dati demo si azzerano a ogni `docker compose down`, se non si aggiunge un volume.
- Non sono previsti pagamenti, e-mail automatiche o ruoli multipli.

---

## Uso di strumenti AI

Il progetto è stato sviluppato con il supporto di strumenti AI per spiegazioni di errori, esempi di codice e revisione. Ogni suggerimento è stato letto, adattato, eseguito e verificato prima di essere inserito nel progetto.