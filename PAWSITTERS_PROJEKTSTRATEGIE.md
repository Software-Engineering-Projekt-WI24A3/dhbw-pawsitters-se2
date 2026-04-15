# 🐾 Pawsitters – Umfassende Projektstrategie
**Senior Software Architect & Project Manager Perspective**
> Ziel: Maximale Punktzahl in allen 5 Bewertungsbereichen (Code · Architektur · Testing · Security · CI/Teamarbeit)

---

## 📊 Bewertungsübersicht & Strategie-Fokus

| Bereich | Gewicht | Schlüsselmaßnahme |
|---|---|---|
| Code (Qualität & Funktionalität) | 20% | Saubere Schichtenarchitektur, JavaDoc, alle Features |
| Architektur & Dokumentation | 20% | ADRs, Klassen-/Sequenzdiagramme, begründete Entscheidungen |
| Testing | 20% | 10+ Unit-Tests + Integrationstests + TEST_DOCUMENTATION.md |
| Security-Verständnis | 20% | Security-Konzept + Spring Security Implementierung + Shift Left |
| Versionskontrolle, Teamarbeit & CI | 20% | Klare Commits aller 3 Personen, Branches, CI-Pipeline |

**Präsentation zählt 33% der Endnote** – jedes Mitglied muss seinen Code erklären können!

---

## 👥 Sprint-Übersicht (4 Wochen)

```
Sprint 0 (Tag 1-2):   Setup, Rollen, Architektur-Design
Sprint 1 (Woche 1):   Core Entities, User/Pet Management
Sprint 2 (Woche 2):   Request/Offer Workflow, Security
Sprint 3 (Woche 3):   Testing, CI-Pipeline, Security-Konzept
Sprint 4 (Woche 4):   Dokumentation, Bugfixes, Präsentation
```

---

## 👤 Sprint 0: Setup & Rollenverteilung

### Rollenverteilung für 3 Personen

> **Wichtig:** Alle 3 müssen im Git-Log **sichtbar** beitragen. Die Rollen bestimmen die *Hauptverantwortung*, aber jeder committed in allen Bereichen.

**Person A – Lead Backend / Domain Model**
- Hauptverantwortung: Entitäten (`User`, `Pet`, `Request`, `Offer`), Repository-Layer, Datenbankschema
- Schreibt: Unit-Tests für Services (mind. 4 Tests)
- Dokumentiert: Architektur-Entscheidungen (ADRs), Klassendiagramm

**Person B – Backend Services / Security**
- Hauptverantwortung: Service-Layer (Business Logic), Spring Security Konfiguration, Security-Konzept
- Schreibt: Unit-Tests für Controller (mind. 3 Tests), `SECURITY_CONCEPT.md`
- Dokumentiert: Security-Konzept, `KI_PROMPTS.md` pflegen

**Person C – Web / CI / Testing**
- Hauptverantwortung: Thymeleaf-Views, Controller-Layer, CI-Pipeline (GitHub Actions)
- Schreibt: Integrationstests (Bonus!), `TEST_DOCUMENTATION.md`
- Dokumentiert: Entwicklungsprozess-Dokument, `README.md`

### Tag-1 Setup-Checkliste

```bash
# 1. Repository anlegen (GitHub empfohlen für gratis CI)
# 2. Dozentin als Contributor hinzufügen: ana.nicolaescu@heilbronn.dhbw.de
# 3. Spring Boot Projekt initialisieren
# 4. Folgende Dateien SOFORT anlegen:
touch README.md
touch KI_PROMPTS.md
touch TEST_DOCUMENTATION.md
touch SECURITY_CONCEPT.md
touch ARCHITECTURE.md
touch DEVELOPMENT_PROCESS.md
```

### Spring Boot Projekt-Setup (`pom.xml` Dependencies)

```xml
<dependencies>
    <!-- Core -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-thymeleaf</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-jpa</artifactId>
    </dependency>

    <!-- Security (Bonuspunkte!) -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-security</artifactId>
    </dependency>
    <dependency>
        <groupId>org.thymeleaf.extras</groupId>
        <artifactId>thymeleaf-extras-springsecurity6</artifactId>
    </dependency>

    <!-- Datenbank -->
    <dependency>
        <groupId>com.h2database</groupId>
        <artifactId>h2</artifactId>
        <scope>runtime</scope>
    </dependency>

    <!-- Validation (DSGVO-Input-Validierung) -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-validation</artifactId>
    </dependency>

    <!-- Testing -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-test</artifactId>
        <scope>test</scope>
    </dependency>
    <dependency>
        <groupId>org.springframework.security</groupId>
        <artifactId>spring-security-test</artifactId>
        <scope>test</scope>
    </dependency>
</dependencies>
```

---

## 🏛️ Sprint 0+1: Architektur-Plan

### Gewählte Architektur: MVC-Schichtenarchitektur (Empfehlung)

**Begründung für Dozentin (wichtig für 20% Architekturnote!):**
> „Wir wählen die klassische MVC-Schichtenarchitektur, da sie für ein 3-Personen-Team mit klar trennbaren Aufgaben (UI, Business Logic, Datenzugriff) optimal geeignet ist. Die klare Trennung der Schichten erhöht die Testbarkeit und Wartbarkeit. Eine Microservice-Architektur wäre für diesen Scope über-engineered und würde Deployment-Komplexität ohne Mehrwert erzeugen."

### Projektstruktur

```
src/
├── main/
│   ├── java/com/pawsitters/
│   │   ├── PawsittersApplication.java
│   │   ├── controller/          ← Person C
│   │   │   ├── UserController.java
│   │   │   ├── PetController.java
│   │   │   ├── RequestController.java
│   │   │   └── OfferController.java
│   │   ├── service/             ← Person B
│   │   │   ├── UserService.java
│   │   │   ├── PetService.java
│   │   │   ├── RequestService.java
│   │   │   └── OfferService.java
│   │   ├── repository/          ← Person A
│   │   │   ├── UserRepository.java
│   │   │   ├── PetRepository.java
│   │   │   ├── RequestRepository.java
│   │   │   └── OfferRepository.java
│   │   ├── model/               ← Person A
│   │   │   ├── User.java
│   │   │   ├── Pet.java
│   │   │   ├── Request.java
│   │   │   └── Offer.java
│   │   ├── security/            ← Person B
│   │   │   └── SecurityConfig.java
│   │   └── dto/                 ← alle
│   │       ├── UserRegistrationDto.java
│   │       └── OfferDto.java
│   └── resources/
│       ├── templates/           ← Person C (Thymeleaf)
│       │   ├── index.html
│       │   ├── register.html
│       │   ├── login.html
│       │   ├── pet/
│       │   ├── request/
│       │   └── offer/
│       └── application.properties
└── test/
    └── java/com/pawsitters/
        ├── service/             ← Person A + B
        └── controller/         ← Person C
```

### Kern-Entitäten (Entity Design)

```java
// ============ USER.java ============
@Entity
@Table(name = "users")  // "user" ist SQL-Reservedword!
public class User {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    @Email  // DSGVO: Validierung vor Speicherung
    private String email;

    @Column(nullable = false)
    private String passwordHash;  // NIEMALS Klartext speichern!

    @Column(nullable = false)
    private String firstName;

    @Column(nullable = false)
    private String lastName;

    @Column(nullable = false)
    private String phone;

    @Enumerated(EnumType.STRING)
    private UserRole role;  // PET_OWNER, HOST, ADMIN

    @OneToMany(mappedBy = "owner", cascade = CascadeType.ALL)
    private List<Pet> pets = new ArrayList<>();

    // Getter/Setter + JavaDoc...
}

// ============ PET.java ============
@Entity
public class Pet {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String species;  // Hund, Katze, Vogel...

    private String breed;
    private int ageInYears;
    private String specialNeeds;

    @ManyToOne @JoinColumn(name = "owner_id", nullable = false)
    private User owner;
}

// ============ REQUEST.java ============
@Entity
public class Request {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne @JoinColumn(name = "pet_owner_id")
    private User petOwner;

    @ManyToOne @JoinColumn(name = "pet_id")
    private Pet pet;

    @Column(nullable = false)
    private LocalDate startDate;

    @Column(nullable = false)
    private LocalDate endDate;

    @Enumerated(EnumType.STRING)
    private RequestStatus status;  // OPEN, FULFILLED, CANCELLED

    @OneToMany(mappedBy = "request")
    private List<Offer> offers = new ArrayList<>();
}

// ============ OFFER.java ============
@Entity
public class Offer {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne @JoinColumn(name = "host_id")
    private User host;

    @ManyToOne @JoinColumn(name = "request_id")
    private Request request;

    @Column(nullable = false)
    private BigDecimal pricePerWeek;

    private String message;

    @Enumerated(EnumType.STRING)
    private OfferStatus status;  // PENDING, ACCEPTED, REJECTED

    @Column(nullable = false)
    private LocalDateTime createdAt;
}
```

### Architektur-Diagramm (für ARCHITECTURE.md)

```
┌─────────────────────────────────────────────────────────┐
│                    PRÄSENTATIONSSCHICHT                  │
│           Thymeleaf Templates + Controller               │
│   UserController | PetController | RequestController     │
│                  | OfferController                       │
└──────────────────────┬──────────────────────────────────┘
                       │ ruft auf
┌──────────────────────▼──────────────────────────────────┐
│                    SERVICE-SCHICHT                       │
│              Business Logic + Validierung                │
│    UserService | PetService | RequestService             │
│                | OfferService                            │
└──────────────────────┬──────────────────────────────────┘
                       │ ruft auf
┌──────────────────────▼──────────────────────────────────┐
│                  REPOSITORY-SCHICHT                      │
│            Spring Data JPA Repositories                  │
│  UserRepo | PetRepo | RequestRepo | OfferRepo            │
└──────────────────────┬──────────────────────────────────┘
                       │ persistiert
┌──────────────────────▼──────────────────────────────────┐
│                    DATENBANK (H2)                        │
│         users | pets | requests | offers                 │
└─────────────────────────────────────────────────────────┘

Querschnittsfunktionen (Crosscutting Concerns):
  ├── Spring Security (Auth + Autorisierung)
  ├── Bean Validation (@Valid, @NotNull, @Email)
  └── Logging (SLF4J)
```

---

## 🧪 Sprint 3: Testing-Strategie

### Die 10 verpflichtenden Unit-Tests – konkreter Plan

Verteilung: **Person A (4 Tests) + Person B (3 Tests) + Person C (3 Tests)**

```java
// ===== PERSON A: Service-Tests =====

// Test 1: UserService – Erfolgreiche Registrierung
@Test
void whenValidUser_thenRegistrationSucceeds() { ... }
// Typ: Normalfall | Testet: UserService.register()

// Test 2: UserService – Duplikat-E-Mail wird abgelehnt
@Test
void whenDuplicateEmail_thenThrowException() { ... }
// Typ: Edge Case | Testet: Unique-Constraint-Logik

// Test 3: PetService – Tier wird korrekt gespeichert
@Test
void whenValidPet_thenPetIsSavedWithOwner() { ... }
// Typ: Normalfall | Testet: PetService.registerPet()

// Test 4: RequestService – Anfrage mit ungültigem Datum abgelehnt
@Test
void whenEndDateBeforeStartDate_thenThrowException() { ... }
// Typ: Edge Case | Testet: Datumsvalidierung

// ===== PERSON B: Service/Security-Tests =====

// Test 5: OfferService – Angebot für eigene Anfrage nicht möglich
@Test
void whenHostOffersOnOwnRequest_thenThrowException() { ... }
// Typ: Edge Case / Security | Testet: Business Rule

// Test 6: RequestService – Nur ein Angebot kann akzeptiert werden
@Test
void whenOfferAccepted_thenAllOtherOffersRejected() { ... }
// Typ: Normalfall | Testet: RequestService.acceptOffer()

// Test 7: OfferService – Angebotspreis muss positiv sein
@Test
void whenNegativePrice_thenThrowException() { ... }
// Typ: Edge Case | Testet: Eingabevalidierung

// ===== PERSON C: Controller-Tests =====

// Test 8: UserController – GET /register gibt 200 zurück
@Test
void getRegisterPage_returns200() { ... }
// Typ: Normalfall | Testet: Controller-Endpunkt

// Test 9: UserController – POST mit invaliden Daten gibt 400
@Test
void postInvalidRegistration_returns400() { ... }
// Typ: Edge Case | Testet: Validierungs-Feedback

// Test 10: RequestController – Unauthentizierter Zugriff wird geblockt
@Test
@WithAnonymousUser
void createRequest_unauthenticated_redirectsToLogin() { ... }
// Typ: Security / Edge Case | Testet: Spring Security
```

### Konkretes Test-Beispiel (copy-paste ready)

```java
// RequestServiceTest.java
@ExtendWith(MockitoExtension.class)
class RequestServiceTest {

    @Mock
    private RequestRepository requestRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private RequestService requestService;

    /**
     * TEST 4: Anfrage mit EndDate vor StartDate soll Exception werfen.
     * Typ: Edge Case
     */
    @Test
    void whenEndDateBeforeStartDate_thenThrowIllegalArgumentException() {
        // GIVEN
        Long userId = 1L;
        Long petId = 1L;
        LocalDate startDate = LocalDate.of(2025, 8, 10);
        LocalDate endDate = LocalDate.of(2025, 8, 5); // BEFORE start!

        // WHEN & THEN
        assertThrows(
            IllegalArgumentException.class,
            () -> requestService.createRequest(userId, petId, startDate, endDate),
            "EndDate vor StartDate sollte IllegalArgumentException werfen"
        );

        // Repository darf NICHT aufgerufen werden
        verify(requestRepository, never()).save(any());
    }
}
```

### TEST_DOCUMENTATION.md – Vorlage

```markdown
# TEST_DOCUMENTATION.md – Pawsitters

## Übersicht
| Test-ID | Klasse | Methode | Typ | Autor | Status |
|---------|--------|---------|-----|-------|--------|
| T-01 | UserServiceTest | whenValidUser_thenRegistrationSucceeds | Normalfall | Person A | ✅ |
| T-02 | UserServiceTest | whenDuplicateEmail_thenThrowException | Edge Case | Person A | ✅ |
| ... | ... | ... | ... | ... | ... |

## Detailbeschreibungen

### T-01: Erfolgreiche Benutzerregistrierung
**Testet:** `UserService.register(UserRegistrationDto)`
**Vorbedingung:** Keine User mit dieser E-Mail in der DB
**Eingabe:** Gültige E-Mail, Passwort ≥ 8 Zeichen, Vorname, Nachname
**Erwartetes Ergebnis:** User-Objekt mit gehashtem Passwort wird gespeichert
**Typ:** Normalfall (Happy Path)
**Begründung:** Kernfunktionalität der Plattform – Registrierung muss immer funktionieren

---
### T-02: Doppelte E-Mail-Adresse
**Testet:** `UserService.register()` bei bereits existierender E-Mail
**Vorbedingung:** User mit email@test.de existiert bereits
**Eingabe:** Registrierungsversuch mit gleicher E-Mail
**Erwartetes Ergebnis:** `DuplicateEmailException` wird geworfen
**Typ:** Edge Case
**Begründung:** Datenintegrität + klare Fehlermeldung für Nutzer wichtig
```

---

## 🔒 Sprint 2+3: Security (Shift Left)

### Was bedeutet "Shift Security Left" in Pawsitters?

> Security wird **von Anfang an** in jede Entwicklungsphase integriert, nicht erst am Ende als Nachgedanke.

### SECURITY_CONCEPT.md – vollständige Vorlage

```markdown
# Security-Konzept: Pawsitters

## 1. Sensible Daten (DSGVO-relevant)

| Datenkategorie | Klasse | Risiko | Schutzmaßnahme |
|---|---|---|---|
| E-Mail-Adressen | User.email | Hoch | Verschlüsselte Übertragung (HTTPS), kein Logging |
| Passwörter | User.passwordHash | Kritisch | BCrypt-Hashing, niemals im Log |
| Telefonnummern | User.phone | Mittel | Zugriffsbeschränkung (nur eigenes Profil) |
| Zahlungsinformationen | Offer.pricePerWeek | Mittel | Nur autorisierte Nutzer sehen eigene Angebote |
| Tierdaten | Pet.* | Niedrig | Nur Besitzer hat Schreibzugriff |

## 2. Identifizierte Risiken

### R-01: Broken Access Control (OWASP #1)
**Risiko:** Tierhalter sieht Angebote anderer Tierhalter
**Maßnahme:** @PreAuthorize in Services, Query-Filter nach User-ID

### R-02: Injection (OWASP #3)
**Risiko:** SQL-Injection via Sucheingaben
**Maßnahme:** Spring Data JPA (PreparedStatements per Default), keine nativen Queries mit Konkatenation

### R-03: Schwache Passwörter
**Risiko:** Brute-Force-Angriffe
**Maßnahme:** Passwortvalidierung (@Size(min=8)), BCrypt mit Strength 12

### R-04: Session Hijacking
**Risiko:** Gestohlenes Session-Cookie
**Maßnahme:** CSRF-Protection (Spring Security Default), HttpOnly-Cookies

## 3. Shift Security Left – Angewandte Maßnahmen

### In der Planungsphase:
- Threat Modeling durchgeführt (diese Tabelle)
- Sensible Daten identifiziert BEVOR Code geschrieben wurde

### Im Code (bereits implementiert):
- Passwörter werden mit BCryptPasswordEncoder gehashed
- Spring Security mit konfigurierter URL-Autorisierung
- Bean Validation auf allen Eingabefeldern (@Email, @NotBlank, @Size)
- CSRF-Protection aktiviert

### Nicht implementiert (Begründung + Roadmap):
- HTTPS: In Entwicklung H2, in Produktion würde SSL-Zertifikat konfiguriert
- Rate Limiting: Wäre nächster Sprint mit Bucket4j
- Audit Logging: Komplex, würde Spring Audit Events nutzen

## 4. Spring Security Konfiguration
```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/", "/register", "/login", "/css/**").permitAll()
                .requestMatchers("/admin/**").hasRole("ADMIN")
                .anyRequest().authenticated()
            )
            .formLogin(form -> form
                .loginPage("/login")
                .defaultSuccessUrl("/dashboard")
                .permitAll()
            )
            .logout(logout -> logout
                .logoutSuccessUrl("/")
                .permitAll()
            )
            .csrf(Customizer.withDefaults()); // CSRF aktiviert!
        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12); // Strength 12
    }
}
```
```

---

## 🔄 Sprint 0+1: CI/CD & Git-Workflow

### Branching-Strategie (Feature Branch Workflow)

```
main
  └── develop
        ├── feature/person-a/user-entity        ← Person A
        ├── feature/person-a/pet-service
        ├── feature/person-b/security-config     ← Person B
        ├── feature/person-b/offer-service
        └── feature/person-c/thymeleaf-views     ← Person C
            feature/person-c/ci-pipeline
```

**Commit-Konvention (für klare Nachvollziehbarkeit!):**
```
feat(user): add BCrypt password hashing in UserService
test(request): add edge case test for invalid date range
fix(offer): prevent host from accepting own request
docs(security): add DSGVO risk analysis to SECURITY_CONCEPT.md
ci: add GitHub Actions pipeline for Maven tests
```

### GitHub Actions CI-Pipeline (`.github/workflows/ci.yml`)

```yaml
name: Pawsitters CI Pipeline

on:
  push:
    branches: [ main, develop, 'feature/**' ]
  pull_request:
    branches: [ main, develop ]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    name: Build & Run Tests

    steps:
      - name: 📥 Checkout Repository
        uses: actions/checkout@v4

      - name: ☕ Set up Java 21
        uses: actions/setup-java@v4
        with:
          java-version: '21'
          distribution: 'temurin'
          cache: maven

      - name: 🔨 Build with Maven
        run: mvn clean compile --no-transfer-progress

      - name: 🧪 Run Unit Tests
        run: mvn test --no-transfer-progress

      - name: 📊 Generate Test Report
        uses: dorny/test-reporter@v1
        if: always()
        with:
          name: JUnit Test Results
          path: target/surefire-reports/*.xml
          reporter: java-junit

      - name: ✅ Check Test Count
        run: |
          TESTS=$(grep -r "@Test" src/test --include="*.java" | wc -l)
          echo "Gefundene Tests: $TESTS"
          if [ "$TESTS" -lt 10 ]; then
            echo "❌ FEHLER: Weniger als 10 Tests! Aktuell: $TESTS"
            exit 1
          fi
          echo "✅ Testanzahl OK: $TESTS Tests gefunden"
```

**Warum diese Pipeline?**
- Läuft bei **jedem Push** und jedem **Pull Request**
- Scheitert, wenn weniger als 10 Tests vorhanden sind (Fail-Fast)
- Zeigt Test-Report direkt in GitHub an
- Kostenlos für öffentliche Repos

---

## 🤖 Sprint 0: KI-Dokumentationssystem

### KI_PROMPTS.md – Vorlage und System

**Goldene Regel:** Direkt nach jedem KI-Einsatz (max. 5 Min.) dokumentieren!

```markdown
# KI_PROMPTS.md – Dokumentation des KI-Einsatzes

## Verwendete Tools
| Tool | Modell/Version | Zweck |
|------|---------------|-------|
| Claude (claude.ai) | Claude Sonnet 4.6 | Architekturberatung, Code-Reviews, Dokumentation |
| GitHub Copilot | GPT-4o | Inline-Code-Completion |

---

## Einträge (chronologisch)

### Eintrag #001
**Datum:** 2025-04-15
**Tool:** Claude (claude.ai) / Claude Sonnet 4.6
**Autor:** Person B
**Aufgabe:** Projektstrategie und initiale Architekturentscheidung

**Prompt:**
```
Rolle: Handle als Senior Software Architekt und erfahrener Projektmanager.
Kontext: Wir sind ein Team von 3 Studierenden und entwickeln die Java-Plattform
„Pawsitters" mit Spring Boot. [...]
```

**Generiertes Ergebnis:** Vollständige Projektstrategie mit Sprints, Entitäten,
Testing-Plan, Security-Konzept und CI-Pipeline-Konfiguration.

**Überprüfung & Anpassung:**
- ✅ Architektur-Entscheidung MVC vs. Microservices übernommen und im
  Teamgespräch begründet
- ✅ Entity-Design angepasst: `UserRole`-Enum um GUEST_HOST ergänzt
- ✅ CI-Pipeline eigenständig auf unser Repository angepasst
- ❌ Test-Beispielcode nicht 1:1 übernommen – eigene Implementierung

**Eigenständige Teile:** Test-Implementierung, Thymeleaf-Templates, finales
Entity-Mapping

---

### Eintrag #002
**Datum:** [Datum]
**Tool:** [Tool]
**Autor:** [Person X]
**Aufgabe:** [Kurzbeschreibung]

**Prompt:**
```
[Exakter Prompt]
```

**Generiertes Ergebnis:** [Beschreibung]

**Überprüfung & Anpassung:** [Was wurde geprüft, verändert, abgelehnt?]

**Eigenständige Teile:** [Was wurde selbst entwickelt?]

---

## Reflexion: KI-Einsatz in der Softwareentwicklung

### Vorteile
- Schnelle Generierung von Boilerplate-Code (Entities, DTOs)
- Hilfe bei unbekannten APIs (Spring Security-Konfiguration)
- Dokumentationsvorlagen sparen Zeit

### Risiken
- KI kann veraltete API-Versionen verwenden → immer gegen offizielle Doku prüfen
- Generierter Code kann Security-Lücken enthalten → Code-Review zwingend
- Alle Mitglieder müssen den Code verstehen können → kein blindes Kopieren

### Einfluss auf Testing & Security
- KI-generierte Tests müssen auf tatsächliches Verhalten geprüft werden
- Security-Konzept wurde KI-gestützt erstellt, aber fachlich validiert
- Jeder Commit wurde vom Autor persönlich verstanden und committed
```

### Schnell-Vorlage für jeden KI-Einsatz (30-Sekunden-Template)

```markdown
### Eintrag #00X
**Datum:** YYYY-MM-DD | **Tool:** Claude | **Autor:** Person X
**Aufgabe:** [1 Satz]
**Prompt-Zusammenfassung:** [2-3 Sätze was gefragt wurde]
**Übernommen:** [Was 1:1 genutzt wurde]
**Angepasst:** [Was verändert wurde]
**Selbst gemacht:** [Was eigenständig entstand]
```

---

## 📋 Abgabe-Checkliste (Sprint 4)

### Pflichtartefakte

- [ ] Vollständiger Quellcode im Repository
- [ ] `README.md` mit Setup-Anleitung (`mvn spring-boot:run`)
- [ ] `ARCHITECTURE.md` mit Klassendiagramm und begründeten Entscheidungen
- [ ] `TEST_DOCUMENTATION.md` mit allen 10+ Tests beschrieben
- [ ] `SECURITY_CONCEPT.md` mit Shift-Security-Left-Analyse
- [ ] `DEVELOPMENT_PROCESS.md` (Aufgabenteilung, Kanban/Sprints, Git-Nutzung)
- [ ] `KI_PROMPTS.md` mit allen KI-Einsätzen dokumentiert
- [ ] CI-Pipeline in `.github/workflows/ci.yml`
- [ ] Präsentation mit Demo vorbereitet

### Code-Qualitäts-Checkliste

- [ ] Alle Controller haben JavaDoc-Kommentare
- [ ] Alle Services haben JavaDoc-Kommentare
- [ ] Keine Passwörter oder Secrets im Code (`.gitignore` prüfen!)
- [ ] `application.properties` enthält keine echten Credentials
- [ ] Mindestens 10 Unit-Tests laufen grün (`mvn test`)
- [ ] CI-Pipeline ist grün auf `main`-Branch
- [ ] Commits von allen 3 Personen sichtbar im `git log`

### .gitignore (wichtig für Security!)

```gitignore
# Maven
target/
*.class

# IDE
.idea/
*.iml
.vscode/

# NIEMALS committen:
*.env
application-secret.properties
application-prod.properties
secrets.yml
```

---

## 🚀 Bonus-Maßnahmen für Extra-Punkte

### Integrationstests (Testing-Bonus)
```java
@SpringBootTest
@AutoConfigureMockMvc
class OfferIntegrationTest {
    @Autowired MockMvc mockMvc;

    @Test
    @WithMockUser(roles = "HOST")
    void createOffer_asHost_returns302Redirect() throws Exception {
        mockMvc.perform(post("/offers/create")
                .param("requestId", "1")
                .param("pricePerWeek", "150.00")
                .with(csrf()))
            .andExpect(status().is3xxRedirection());
    }
}
```

### Sinnvolle Erweiterungen (Kreativitäts-Bonus)
- Bewertungssystem (Host kann nach Betreuung bewertet werden)
- E-Mail-Benachrichtigung bei neuem Angebot (Spring Mail)
- Such-/Filtermaske für verfügbare Hosts nach Tierart

---

## 📅 Sprint-Zusammenfassung

| Sprint | Dauer | Ergebnis |
|--------|-------|---------|
| Sprint 0 | Tag 1-2 | Repo, Struktur, `pom.xml`, alle .md Dateien angelegt, Rollen klar |
| Sprint 1 | Woche 1 | Entitäten, Repositories, erste Services, H2-DB läuft |
| Sprint 2 | Woche 2 | Alle Features fertig (Request/Offer-Workflow), Spring Security aktiv, Thymeleaf-Views |
| Sprint 3 | Woche 3 | 10+ Tests grün, CI-Pipeline läuft, Security-Konzept fertig |
| Sprint 4 | Woche 4 | Dokumentation vollständig, Bugs gefixt, Präsentation geprobt |

---

*Erstellt mit Unterstützung von Claude (Anthropic) – Eintrag #001 in KI_PROMPTS.md dokumentieren!*
