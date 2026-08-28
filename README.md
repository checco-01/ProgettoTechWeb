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
- Maven viene scaricato automaticamente dal wrapper (`mvnw`)

## 1) Preparazione del database

Crea il database e l'utente MySQL (o usa il tuo utente root):

```sql
CREATE DATABASE roadtounina;
CREATE USER 'RoadToUnina'@'localhost' IDENTIFIED BY 'la_tua_password';
GRANT ALL PRIVILEGES ON roadtounina.* TO 'RoadToUnina'@'localhost';
FLUSH PRIVILEGES;
```

## 2) Configurazione del backend

> ⚠️ **Importante:** `roadToUninaBackend/src/main/resources/application.properties`
> è **escluso da Git** (contiene credenziali). Dopo un clone va creato dal template:

```bash
cd roadToUninaBackend/src/main/resources
cp application.properties.example application.properties
```

Poi apri il file e imposta **la password del tuo utente MySQL**
(`spring.datasource.password`). Il segreto JWT di default nel template è un dummy
valido per lo sviluppo locale: se vuoi cambiarlo, generane uno nuovo con:

```bash
openssl rand -base64 64
```

## 3) Seed (dati di esempio)

Gli script di seed si trovano in `roadToUninaBackend/sql/` e popolano il database
con **5 utenti** che hanno svolto **5 partite complete a testa** (25 in totale).

Prima di lanciarli, avvia il backend almeno una volta (sezione 4) così Hibernate
crea le tabelle, oppure assicurati che esistano già. Poi esegui, dalla cartella
`roadToUninaBackend/sql`:

```bash
mysql -u RoadToUnina -proadtounina < seed_all.sql
```

(Oppure, in alternativa, lancia in sequenza `00_reset_seed.sql`,
`01_seed_users.sql`, `02_seed_games.sql`, `03_seed_game_steps.sql`.)

Utenti creati (password per tutti: `Password1!`):

| Username | Partite |
|---|---|
| mario.rossi | 5 completate |
| lucia.bianchi | 5 completate |
| giulia.verdi | 5 completate |
| francesco.esposito | 5 completate |
| anna.russo | 5 completate |

Ogni partita termina sull'obiettivo del gioco (`Università_degli_Studi_di_Napoli_Federico_II`)
con percorsi realistici su Wikipedia (da 1 a 5 passi).

## 4) Avvio del backend

```bash
cd roadToUninaBackend
./mvnw spring-boot:run
```

Il server parte su `http://localhost:8080`. Verifica:

```bash
curl http://localhost:8080/api/game/leaderboard
```

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

## Troubleshooting

| Problema | Soluzione |
|---|---|
| `Cannot connect to MySQL` / `Communications link failure` | MySQL non è attivo o credenziali sbagliate in `application.properties` |
| Errore all'avvio su `app.jwt.secret` | Imposta un segreto di almeno 32 byte in `application.properties` (sezione 2) |
| Errore CORS nella console del browser | Frontend e backend devono essere su `localhost:4200` e `localhost:8080` |
| Porta 8080/4200 già occupata | Chiudi il processo precedente (`lsof -i :8080`) o cambia `server.port` |
| Seed: `Table 'roadtounina.users' doesn't exist` | Avvia prima il backend (Hibernate crea le tabelle) e poi lancia `seed_all.sql` |
