# Road to Unina 🎓

Gioco web "crawler" su Wikipedia: si parte da un articolo casuale e si deve arrivare
alla pagina obiettivo (**Università degli Studi di Napoli Federico II**) nel minor
numero di passi possibile.

Progetto d'esame di **Tecnologie Web** — pensato per girare in **locale**.

## Architettura

| Componente | Tecnologia | Porta |
|---|---|---|
| `roadToUninaBackend` | Spring Boot 4 (Java 25), Spring Security + JWT, JPA/Hibernate, MySQL | `8080` |
| `roadToUninaFrontend` | Angular 21 + Angular SSR (Express) | `4200` |

- Autenticazione: JWT in **cookie httpOnly + SameSite=Lax**; password salvate con **BCrypt**.
- Il frontend chiama il backend su `http://localhost:8080` (URL hardcoded, CORS già configurato).

## Prerequisiti

- **JDK 25** (consigliato: Corretto 25)
- **Node.js ≥ 20** e **npm** (testato con Node 22)
- **MySQL 8+** avviato in locale

## 1) Preparazione del database

Assicurati di avere un utente MySQL con i permessi di creazione, sostitusci `TuoUtente` e `TuaPassword` con i tuoi valori
nel file application properties.example.


## 2) Configurazione del backend

```bash
cd roadToUninaBackend/src/main/resources
```

Nel file application.properities.example Il segreto JWT di default nel template è un dummy, generane uno nuovo con:
```bash
openssl rand -base64 64
```
Dopo averlo generato, rinomina il file in `application.properties` e sostituisci il valore TuoJWTSecret con quello appena generato.

## 3) Seed (dati di esempio)

Gli script di seed si trovano in `roadToUninaBackend/sql/` e popolano il database
con **5 utenti** che hanno svolto **5 partite complete a testa** (25 in totale).

Prima di lanciarli, avvia il backend almeno una volta (sezione 4) così Hibernate
crea le tabelle, oppure assicurati che esistano già. Poi esegui, dalla cartella
`roadToUninaBackend/sql`:

```bash
mysql -u TuoUtente -pTuaPassword < seed_all.sql
```
5 Utenti creati (password per tutti: `Password1!`):


## 4) Avvio del backend

```bash
cd roadToUninaBackend
./mvnw spring-boot:run
```

Il server parte su `http://localhost:8080`. Verifica:

## 5) Avvio del frontend

```bash
cd roadToUninaFrontend
npm install
npm start
```

Apri il browser su **http://localhost:4200**.

## Test

```bash
# Backend: test di contesto Spring
cd roadToUninaBackend && ./mvnw test

# Frontend: unit test (Vitest)
cd roadToUninaFrontend && npm test

# Frontend: test E2E (Playwright, backend e Wikipedia mappati, nessun servizio esterno)
cd roadToUninaFrontend && npm run test:e2e
```
