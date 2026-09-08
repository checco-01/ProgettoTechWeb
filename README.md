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

Nel file `application.properties.example` il segreto JWT di default nel template è un dummy, generane uno nuovo con:

**Bash / Git Bash / cmd:**
```bash
openssl rand -base64 64
```

**PowerShell (se OpenSSL non è installato):**
```powershell
$bytes = New-Object byte[] 64
[System.Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
[Convert]::ToBase64String($bytes)
```

Dopo averlo generato, rinomina il file in `application.properties` e sostituisci il valore `TuoJWTSecret` con quello appena generato.

## 3) Avvio del backend

**Bash / Git Bash:**
```bash
cd roadToUninaBackend
./mvnw spring-boot:run
```

**PowerShell / cmd:**
```powershell
cd roadToUninaBackend
.\mvnw.cmd spring-boot:run
```


## 4) Seed (dati di esempio)

Gli script di seed si trovano in `roadToUninaBackend/sql/` e popolano il database
con **5 utenti** che hanno svolto **5 partite complete a testa** (25 in totale).

Prima di lanciarli, avvia il backend almeno una volta così Hibernate
crea le tabelle, oppure assicurati che esistano già. Poi esegui, dalla cartella
`roadToUninaBackend/sql`:

**Bash / Git Bash / cmd:**
```bash
mysql -u TuoUtente -pTuaPassword < seed_all.sql
```

**PowerShell:**
```powershell
cmd /c "mysql -u TuoUtente -pTuaPassword < seed_all.sql"
```
oppure:
```powershell
Get-Content seed_all.sql | mysql -u TuoUtente -pTuaPassword
```

5 Utenti creati (password per tutti: `Password1!`):



Il server parte su `http://localhost:8080`. Verifica:

## 5) Avvio del frontend

Al primo avvio, installa le dipendenze dalla cartella `roadToUninaFrontend`:

**Bash / PowerShell:**
```bash
cd roadToUninaFrontend
npm install
```

Poi avvia il frontend:

**Bash / PowerShell:**
```bash
cd roadToUninaFrontend
npm start
```

Apri il browser su **http://localhost:4200**.

## Test

**Bash / Git Bash:**
```bash
# Backend: test di contesto Spring
cd roadToUninaBackend && ./mvnw test

# Frontend: unit test (Vitest)
cd roadToUninaFrontend && npm test

# Frontend: test E2E (Playwright, backend e Wikipedia mappati, nessun servizio esterno)
cd roadToUninaFrontend && npm run test:e2e
```

**PowerShell / cmd:**
```powershell
# Backend: test di contesto Spring
cd roadToUninaBackend
.\mvnw.cmd test

# Frontend: unit test (Vitest)
cd roadToUninaFrontend
npm test

# Frontend: test E2E (Playwright, backend e Wikipedia mappati, nessun servizio esterno)
cd roadToUninaFrontend
npm run test:e2e
```
