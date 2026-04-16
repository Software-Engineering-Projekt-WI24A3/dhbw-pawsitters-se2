# Architekturbeschreibung – Pawsitters

## 1. Gewählte Architektur

Das Pawsitters-Projekt verwendet eine **klassische MVC-Schichtenarchitektur** (Model–View–Controller) auf Basis des **Spring Boot Frameworks (v3.1.5)** mit Java 17.

---

## 2. Begründung der Architekturentscheidung

### Warum MVC-Schichtenarchitektur?

Die Entscheidung fiel bewusst gegen eine Microservice-Architektur und für die klassische MVC-Schichtenarchitektur aus folgenden Gründen:

| Kriterium | MVC-Schichtenarchitektur ✅ | Microservices ❌ |
|---|---|---|
| **Teamgröße** | Optimal für 3-Personen-Team | Erfordert verteilte Expertise |
| **Komplexität** | Klar trennbare Aufgaben (UI, Logik, Daten) | Deployment- und Netzwerkkomplexität ohne Mehrwert |
| **Testbarkeit** | Schichten isoliert testbar | Erfordert aufwändiges Integrations-Testing |
| **Entwicklungsgeschwindigkeit** | Schnelle Iteration möglich | Hoher Initialaufwand für Infrastruktur |
| **Scope** | Passt zur Projektgröße | Over-Engineering für diesen Umfang |

Eine Microservice-Architektur würde für diesen Projektumfang unnötige Deployment-Komplexität (z. B. Service Discovery, API Gateway, Inter-Service-Kommunikation) erzeugen, ohne einen praktischen Mehrwert zu liefern.

---

## 3. Schichtenaufbau

```
┌──────────────────────────────────────────────┐
│              Presentation Layer              │
│       (Thymeleaf Templates / REST API)        │
├──────────────────────────────────────────────┤
│               Controller Layer               │
│         (Spring MVC @Controller / REST)       │
├──────────────────────────────────────────────┤
│               Service Layer                  │
│          (Business Logic / Use Cases)         │
├──────────────────────────────────────────────┤
│              Repository Layer                │
│       (Spring Data JPA / @Repository)         │
├──────────────────────────────────────────────┤
│               Model / Domain Layer           │
│      (JPA-Entities: User, Pet, Request)       │
├──────────────────────────────────────────────┤
│                 Datenbank                    │
│              (H2 In-Memory DB)                │
└──────────────────────────────────────────────┘
```

### Schichtenbeschreibung

| Schicht | Verantwortung | Technologie |
|---|---|---|
| **Presentation** | Darstellung der UI, Template-Rendering | Thymeleaf, HTML/CSS |
| **Controller** | Entgegennahme von HTTP-Requests, Weiterleitung an Services, Rückgabe von Responses | Spring MVC (`@Controller`, `@RestController`) |
| **Service** | Fachliche Geschäftslogik, Koordination zwischen Controllern und Repositories | Spring (`@Service`) |
| **Repository** | Datenbankzugriff über JPA-Interfaces | Spring Data JPA (`@Repository`) |
| **Model / Domain** | Datenbankentitäten, Enums, Domänenobjekte | Jakarta Persistence (JPA), `@Entity` |
| **Datenbank** | Persistierung aller Entitäten | H2 In-Memory (Entwicklung) |

---

## 4. Konkretes Beispiel – „Buchungsanfrage erstellen"

```
Browser (POST /requests)
  → Controller      // nimmt HTTP-Request entgegen, validiert Eingabe
  → Service         // setzt Status auf OPEN (Geschäftslogik)
  → Repository      // speichert Request in der Datenbank (JPA)
  → H2-Datenbank    // persistiert den Datensatz

← Repository        // gibt gespeichertes Objekt zurück
← Service           // reicht Objekt weiter
← Controller        // antwortet mit HTTP 201 Created + gespeichertem Objekt
← Browser
```

> Jede Schicht kennt nur die direkt darunter liegende – nie umgekehrt, nie übersprungen.

---






## 5. Domänenmodell (Entitäten)

Das Projekt definiert folgende JPA-Entitäten im Package `com.pawsitters.model`:

- **`User`** – Benutzer der Plattform (Tierhalter oder Gastgeber), inkl. Profilinformationen und Rolle (`UserRole`)
- **`Pet`** – Haustier, das einem `User` zugeordnet ist
- **`Request`** – Buchungsanfrage eines Tierhalters für ein Haustier, mit Zeitraum, Preis und Status (`RequestStatus`)

**Enums:**
- `UserRole`: `PET_OWNER` | `HOST`
- `RequestStatus`: `OPEN` | `FULFILLED` | `CANCELLED`

---

## 6. Kommunikation

Die Kommunikation zwischen den Schichten erfolgt **intern über Java-Methodenaufrufe** (Dependency Injection via Spring). Nach außen bietet die Anwendung eine **REST API** an, über die das Frontend (bzw. externe Clients) mit dem Backend kommuniziert. Die Schnittstellenbeschreibung erfolgt konform zu REST-Konventionen (HTTP-Verben: `GET`, `POST`, `PUT`, `DELETE`).

---

## 7. Verwendete Technologien & Abhängigkeiten

| Technologie | Version | Zweck |
|---|---|---|
| Java | 17 | Programmiersprache |
| Spring Boot | 3.1.5 | Application Framework |
| Spring MVC | (inkl.) | Controller- & REST-Schicht |
| Spring Data JPA | (inkl.) | Datenbankzugriff via Repository |
| Spring Security | (inkl.) | Authentifizierung & Autorisierung |
| Thymeleaf | (inkl.) | Server-seitiges Template Rendering |
| H2 Database | (inkl.) | In-Memory-Datenbank (Entwicklung) |
| Bean Validation | (inkl.) | Eingabevalidierung (`@Valid`) |
| Maven | – | Build-Management |

---

## 8. Fazit

Die MVC-Schichtenarchitektur bietet für das Pawsitters-Projekt die optimale Balance zwischen **Strukturklarheit**, **Testbarkeit** und **Entwicklungsgeschwindigkeit**. Die klare Trennung in Presentation, Controller, Service und Repository-Schicht ermöglicht es dem 3-Personen-Team, parallel und unabhängig voneinander an verschiedenen Schichten zu arbeiten, ohne Konflikte zu erzeugen. Die Architekturentscheidungen sind nachvollziehbar durch den Projektscope und die Teamgröße begründet.
