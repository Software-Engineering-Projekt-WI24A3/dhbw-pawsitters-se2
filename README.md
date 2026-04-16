# Pawsitters

Software-Engineering Projekt von Justus Krahl, Raphael Buller & Niklas Ulbrich  
Kurs WI24A3 bei Dr. Ana-Maria Nicolaescu

![Japan](https://github.com/user-attachments/assets/49667f7b-60a7-4f34-aa31-27685d84e30c)

## Projektstruktur

- `frontend/` enthält das komplette Frontend mit HTML, CSS, JavaScript, Vue, Tailwind und Playwright-E2E-Tests.
- `backend/` enthält das Backend mit Spring Boot und den API-/Server-Komponenten.

## Entwicklung

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
cd backend
mvn spring-boot:run
```

## Hinweise

- Die zentrale `.gitignore` liegt im Projekt-Root und gilt gemeinsam für Frontend und Backend.
- Frontend und Backend bleiben technisch getrennt, werden aber gemeinsam in diesem Repository verwaltet.

