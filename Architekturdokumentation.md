# Architekturdokumentation: Pawsitters

Im Folgenden wird die Softwarearchitektur des Pawsitters-Projekts detailliert analysiert. Die Dokumentation deckt den Technologie-Stack, die Architekturmuster, das Datenmodell, den Datenfluss, angewandte Prinzipien sowie Anforderungen und Verbesserungspotenziale ab.

---

## 1. Systemübersicht & Stack

Das System besteht aus einer klassischen Web-Applikation, die als Backend-API mit einem Frontend zur Nutzerinteraktion konzipiert ist.

*   **Spring Boot (Java)**: Dient als zentrales Backend-Framework. Es stellt die REST-API bereit, verwaltet die Geschäftslogik und kümmert sich um die Infrastruktur (z.B. Dependency Injection, Security, Transaktionsverwaltung).
*   **Thymeleaf**: Serverseitige Template-Engine. Wird im Projekt genutzt, um die grundsätzlichen HTML-Strukturen, Layouts und Fragmente serverseitig zu rendern, bevor sie an den Browser gesendet werden.
*   **Vue.js**: Dient als Frontend-Framework zur Realisierung dynamischer UI-Komponenten (in der `package.json` als Dependency hinterlegt). Vue.js wird Client-seitig geladen und ergänzt das von Thymeleaf generierte HTML um reaktive und dynamische Verhaltensweisen, ohne dass für jede Aktion ein Page-Reload nötig ist.
*   **Tailwind CSS**: Ein Utility-First CSS-Framework. Es sorgt für das responsive und moderne Styling der Oberfläche und wird über einen Build-Prozess in statische CSS-Dateien überführt.
*   **H2 / Spring Data JPA (Hibernate)**: Die relationale Datenbank (aktuell In-Memory H2 für die Entwicklung) wird durch Hibernate als ORM (Object-Relational Mapping) angebunden, das durch Spring Data JPA abstrahiert wird.
*   **Spring Security & JWT**: Das System ist Stateless konzipiert. Die Authentifizierung erfolgt über JSON Web Tokens (JWT), die bei einem erfolgreichen Login erstellt, verschlüsselt und sicher in HttpOnly-Cookies gespeichert werden.

---

## 2. Struktur der Anwendung (Schichtenarchitektur)

Die Backend-Applikation folgt strikt dem Architekturmuster der **Schichtenarchitektur (Layered Architecture)**. Dies fördert Separation of Concerns (Trennung von Zuständigkeiten):

*   **Controller (`com.pawsitters.controller`)**: Empfängt HTTP-Requests (REST API), validiert eingehende Payload-Daten (mittels `@Valid` und DTOs) und leitet die Anfragen an die Services weiter. Liefert formatierte JSON-Antworten (via `ApiResponse`) an das Frontend zurück.
*   **Service (`com.pawsitters.service`)**: Das Herzstück der Anwendung. Hier liegt die reine Geschäftslogik. Die Services überprüfen Geschäftsregeln (z.B. "Gehört das zu löschende Tier auch wirklich diesem User?"), bereiten Daten auf und interagieren mit den Repositories.
*   **Repository (`com.pawsitters.repository`)**: Interfaces, die von Spring Data `JpaRepository` erben. Sie abstrahieren den Datenbankzugriff und ermöglichen simple CRUD-Operationen sowie komplexe Abfragen via `@Query` oder `@EntityGraph`.
*   **DTO (`com.pawsitters.dto`)**: Data Transfer Objects. Sie dienen als einfache Datenträger zwischen API-Endpunkten (Frontend) und Backend. Im Projekt werden sie modern als unveränderliche Java `Records` umgesetzt.
*   **Model/Entity (`com.pawsitters.model`)**: Java-Klassen, die via JPA-Annotationen (wie `@Entity`) auf Datenbanktabellen gemappt werden.

---

## 3. Datenmodell & Persistenz

Das relationale Datenmodell wird direkt aus den Entity-Klassen generiert. Die wichtigsten Entitäten und ihre Verknüpfungen:

*   **User**: Die zentrale Entität des Systems. 
    *   Hat eine **1:n-Beziehung** zu `Pet` (Ein Besitzer kann viele Haustiere haben).
    *   Hat eine **1:n-Beziehung** zu `Offer` (Ein Gastgeber kann mehrere Angebote erstellen).
    *   Nutzt eine Element-Collection für `PetChoice` (Tierarten, die der User aufnehmen möchte).
*   **Pet**: Repräsentiert ein Haustier. Beinhaltet eine **n:1-Beziehung** (`@ManyToOne`) als Rückreferenz auf den Eigentümer (`User`).
*   **Offer**: Ein Betreuungsangebot eines Hosts. Verknüpft einen Host (`User`) und enthält weitere Eigenschaften wie Preise sowie Listen für Zusatzservices und erlaubte Tierarten.
*   **Request**: Repräsentiert eine konkrete Anfrage/Buchung. Es verbindet den pet-owner (`User`) mit einem zu betreuenden `Pet` und speichert Randdaten wie Zeitraum und Preis.

**Nutzung von Hibernate/JPA**: JPA wandelt diese Klassen automatisch in Tabellen um und generiert Foreign Keys. Beispielsweise wird die `@ElementCollection` von `PetChoice` im User-Modell durch Hibernate automatisch in eine Join-Table `user_accepted_pet_species` ausgelagert.

---

## 4. Business Logik & Datenfluss

Der Datenfluss durch das System dient der strikten Entkopplung von Datenbankschema und API-Schnittstelle.

**Beispielhafter Datenfluss am Use Case "Neues Haustier anlegen":**
1. Das Frontend sendet einen POST-Request an `/api/pets` mit den Tierdaten im JSON-Format.
2. Der `PetController` fängt die Anfrage über ein `PetRequest` DTO ab. Spring validiert dieses automatisch (z.B. `@NotBlank` beim Namen).
3. Der Controller extrahiert die ID oder E-Mail des angemeldeten Users aus dem Security-Kontext (JWT) und ruft `petService.createPetForOwnerEmail(...)` auf.
4. Der `PetService` holt das echte `User`-Objekt aus dem Repository, führt notwendige Logik aus, instanziiert ein neues `Pet`-Entity und speichert es über das `PetRepository`.
5. Der Service gibt das `Pet`-Entity an den Controller zurück.
6. Der Controller konvertiert die Entity mittels `PetResponse.from(pet)` zurück in ein DTO, kapselt es in eine einheitliche `ApiResponse` und sendet es via HTTP 200 an den Client.

**Einsatz von DTOs:** Entities enthalten sensible Daten (z.B. den Passwort-Hash des Users) oder weitreichende Relationen (Lazy Loading). Das Übertragen roher Entities würde zu Sicherheitslücken oder Endlosschleifen bei der Serialisierung führen. DTOs lösen dieses Problem, indem sie exakt definieren, welche Daten nach außen gegeben (oder von dort erwartet) werden.

---

## 5. Design Patterns & Prinzipien

Im Quellcode lassen sich klare Software Engineering Prinzipien und Muster erkennen:

*   **Dependency Injection (DI)**: In Spring allgegenwärtig. Die Controller und Services erzeugen ihre Abhängigkeiten (wie Repositories) nicht selbst über `new`, sondern bekommen sie von Springs IoC-Container in den Konstruktor injiziert.
*   **Singleton Pattern**: Die Spring-Komponenten (Services, Controller) sind standardmäßig Singletons. Es existiert laufzeitübergreifend nur eine Instanz.
*   **Data Transfer Object (DTO) Pattern**: Wie oben beschrieben exzessiv genutzt zur Datenkapselung.
*   **Factory Pattern**: Die `ApiResponse`-Klasse nutzt statische Factory-Methoden wie `ApiResponse.success(...)` und `ApiResponse.failure(...)`, um standardisierte Objekte koordiniert zu generieren.
*   **SOLID-Prinzipien**:
    *   *Single Responsibility Principle (SRP)*: Der `UserController` kümmert sich nur um HTTP, der `UserService` nur um Logik, das `UserRepository` nur um die Datenbank.
    *   *Dependency Inversion Principle*: Services und Controller hängen von Interfaces ab (z.B. `JpaRepository`), nicht von der konkreten Datenbankimplementierung.
*   **DRY (Don't Repeat Yourself)**: Die globale Fehlerbehandlung über den `ApiExceptionHandler` (`@RestControllerAdvice`). Alle im Code geworfenen Exceptions (z.B. `NotFoundException`) werden zentral abgefangen und in standardisierte JSON-Errors übersetzt, wodurch sich redundante `try-catch`-Blöcke in Controllern erübrigen.

---

## 6. Anforderungen (Features & ISO 25010)

**Funktionale Kern-Features:**
*   **Account-Management**: Registrierung, Login, Session-Management via JWT und Profilverwaltung (inklusive Profilbild-Upload).
*   **Haustier-Verwaltung**: CRUD-Operationen für eigene Tiere inkl. Bild-Hashing (SHA-256) zur Vermeidung von Bild-Duplikaten.
*   **Marketplace & Suche**: Suchen, Filtern (nach Postleitzahl, Tierart) und Listen von verifizierten Hosts.
*   **Angebotserstellung (Offers)**: Hosts können detaillierte Betreuungsangebote erstellen, verwalten und veröffentlichen.
*   **Buchungsanfragen (Requests)**: Pet-Owner können konkrete Betreuungsanfragen für definierte Zeiträume stellen.

**Unterstützte Nicht-Funktionale Anforderungen (nach ISO 25010):**
1.  **Security (Sicherheit)**: Schutz der API durch Stateless JWT-Authentifizierung, Speicherung von JWTs in HttpOnly-Cookies (Schutz vor XSS) und das Hashen von Passwörtern via BCrypt (`PasswordEncoder`). Autorisation auf URL- und Methodenebene.
2.  **Maintainability (Wartbarkeit)**: Die strikte Trennung durch Schichtenarchitektur und DTOs (mittels Java Records) macht den Code sehr gut les- und wartbar. Globale Exception-Handler erleichtern das Hinzufügen künftiger Features.
3.  **Reliability (Zuverlässigkeit)**: Solide Input-Validierung (Jakarta Validation API) direkt am Endpunkt verhindert ungültige States in der DB. Die Nutzung von `@Transactional` bei allen verändernden Service-Methoden sorgt für konsistente ACID-Eigenschaften der Datenbank.

---

## 7. Fehlendes & Verbesserungspotenzial (Further Improvements)

Auch wenn die Architektur eine solide Basis bietet, existieren noch Bereiche mit Optimierungspotenzial:

*   **Paging und Sorting**: Die Listen-Abfragen (z.B. für Hosts im Marketplace oder Offers) laden aktuell teilweise alle Datensätze auf einmal aus der Datenbank. Bei wachsenden Nutzerzahlen führt das zu Performance- und Speicherproblemen. Dies sollte mit Spring Data's `Pageable` und `Page<T>` in Kombination mit Lazy-Loading optimiert werden.
*   **Mapping Frameworks (z.B. MapStruct)**: Das Mapping zwischen Entities und DTOs passiert aktuell manuell in Factory-Methoden (z.B. `PetResponse.from(pet)`). Ein Mapping-Framework wie MapStruct würde den Boilerplate-Code drastisch reduzieren und ist robuster bei Änderungen am Datenmodell.
*   **Datenbank für Produktion (Profile)**: Aktuell läuft eine H2 In-Memory Datenbank (`create-drop`), welche bei jedem Neustart geleert wird. Für Produktion sollte die `application.properties` durch Spring-Profile (z.B. `application-prod.properties`) ergänzt werden, um eine echte relationale Datenbank wie PostgreSQL oder MySQL anzubinden.
*   **Datenbank-Migrationen**: Es existiert zwar ein `data.sql` Skript für Init-Daten, jedoch fehlt ein ordentliches Datenbank-Migrationstool wie *Flyway* oder *Liquibase*. Dies wird essentiell, sobald sich das Entity-Schema während der laufenden Entwicklung ändert und Produktionsdaten iterativ migriert werden müssen.
*   **Test-Coverage (Unit- & Integrationstests)**: Es ist nur ein isolierter Security-Test sichtbar. Um langfristig regressionsfrei Features ergänzen zu können, sollten Service-Schichten umfassend mit Unit-Tests (via JUnit und Mockito) und Controller über `@WebMvcTest` abgedeckt werden.
