<h1 align="center">Pawsitters | Deployed: <a>https://pawsitters.justus.software </a> </h1>

Herzlich willkommen bei dem Software-Engineering Projekt von Justus Krahl, Raphael Buller & Niklas Ulbrich für die Vorlesung "Software Engineering" im Kurs WI24A3 bei Dr. Ana-Maria Nicolaescu

<p align="center">
  <img src="https://freesvg.org/img/Tiere-lineart.png" alt="Japan" />
</p>

<h2 align="center">Projektstruktur</h2>

- `frontend/` enthält das komplette Frontend mit HTML, CSS, JavaScript, Vue, Tailwind und Playwright-E2E-Tests.
- `backend/` enthält das Backend mit Spring Boot und den API-/Server-Komponenten.

<h2 align="center">Entwicklung</h2>

### Frontend

```bash
cd frontend
npm i
npm run dev
```

Produktionsbuild:

```bash
cd frontend
npm run build
```

### Backend

```bash
docker compose up -d mysql
cd backend
mvn spring-boot:run
```

Das Backend nutzt standardmaessig MySQL unter `localhost:3306` mit Datenbank/User/Passwort `pawsitters`.
Die Daten liegen persistent im Docker-Volume `pawsitters_mysql_data`.
Ueberschreiben geht per `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` und optional `JPA_DDL_AUTO`.

<h2 align="center">Hinweise</h2>

- Die zentrale `.gitignore` liegt im Projekt-Root und gilt gemeinsam für Frontend und Backend.
- Frontend und Backend bleiben technisch getrennt, werden aber gemeinsam in diesem Repository verwaltet.
