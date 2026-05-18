# Security-Massnahmen in Pawsitters

Stand: 18.05.2026. Die Punkte sind aus dem aktuellen Code in `backend/` und `frontend/` abgeleitet.

## Legende

- `[Backend]`: Wird serverseitig erzwungen und ist die eigentliche Security-Grenze.
- `[Frontend]`: Unterstuetzt UX, Eingabequalitaet oder reduziert Angriffsoberflaeche im Browser; ersetzt keine Backend-Pruefung.
- `[Config/Infra]`: Laufzeit-, Deployment- oder Proxy-Konfiguration.
- `[Kontext/Risiko]`: Wichtige Einordnung oder offene Sicherheitspruefung.

## Backend

- `[Backend] Stateless Security-Konfiguration`
  - Quelle: `backend/src/main/java/com/pawsitters/security/SecurityConfig.java`
  - Spring Security ist aktiv (`@EnableWebSecurity`, `@EnableMethodSecurity`).
  - Sessions sind auf `STATELESS` gesetzt; Authentifizierung laeuft ueber JWT statt Server-Session.
  - Alle nicht explizit freigegebenen Requests brauchen Authentifizierung (`anyRequest().authenticated()`).
  - Oeffentliche Endpunkte sind bewusst markiert, z. B. Login/Register/Session, Marketplace-Lesen, Host-/User-GETs, Healthcheck, Upload-Auslieferung, WebSocket-Handshake und H2-Konsole.

- `[Backend] JWT-Authentifizierung`
  - Quellen: `backend/src/main/java/com/pawsitters/security/JwtService.java`, `JwtAuthFilter.java`, `JwtTokenResolver.java`
  - JWTs enthalten `subject` = E-Mail und Claim `role`.
  - Tokens werden signiert und mit Ablaufdatum erzeugt.
  - Gueltigkeit wird serverseitig ueber Signatur/Claims geprueft; ungueltige Tokens setzen keine Authentication.
  - Tokens koennen aus `Authorization: Bearer ...` oder aus dem Cookie `PAWSITTERS_AUTH_TOKEN` gelesen werden.
  - Gueltige Tokens werden in Spring Security als `ROLE_<role>` in den SecurityContext geschrieben.

- `[Backend] Auth-Cookie`
  - Quelle: `backend/src/main/java/com/pawsitters/security/AuthController.java`
  - Login und Registrierung setzen zusaetzlich zum JSON-Token ein Auth-Cookie.
  - Cookie ist `HttpOnly`, hat `path=/`, ein Max-Age passend zur JWT-Laufzeit und konfigurierbares `SameSite`.
  - `Secure` wird je nach `auth.cookie.secure-mode` gesetzt; `auto` erkennt HTTPS auch ueber Forwarded-Header.
  - Logout setzt ein abgelaufenes Cookie und entfernt dadurch den Browser-Cookie.

- `[Backend] Token-Revocation bei Logout`
  - Quellen: `backend/src/main/java/com/pawsitters/service/AuthService.java`, `backend/src/main/java/com/pawsitters/security/RevokedTokenService.java`
  - Logout nimmt ein gueltiges JWT entgegen und setzt es bis zu seinem Ablauf auf eine serverseitige Sperrliste.
  - Der JWT-Filter ignoriert gesperrte Tokens.
  - Ein Scheduled Cleanup entfernt abgelaufene Sperreintraege.

- `[Backend] Passwortspeicherung und Passwortpruefung`
  - Quellen: `backend/src/main/java/com/pawsitters/security/SecurityConfig.java`, `backend/src/main/java/com/pawsitters/service/UserService.java`, `backend/src/main/java/com/pawsitters/service/AuthService.java`
  - Passwoerter werden nicht im Klartext gespeichert, sondern mit `BCryptPasswordEncoder` gehasht.
  - Vor Hashing und Login-Vergleich wird das Passwort Unicode-normalisiert (`NFC`).
  - Beim Login wird immer eine generische Fehlermeldung fuer ungueltige Credentials verwendet.

- `[Backend] Passwort-Policy`
  - Quellen: `backend/src/main/java/com/pawsitters/validation/PasswordPolicy.java`, `PasswordRegistrationValidator.java`, `RegisterRequest.java`
  - Mindestlaenge: 15 Zeichen.
  - Maximale BCrypt-Eingabe: 72 Byte.
  - Blockiert bekannte schwache Passwoerter und einfache Varianten, z. B. mit Zahlenanhaengen oder Leetspeak.
  - Verhindert Passwortbestandteile aus E-Mail, Vorname und Nachname.
  - Registrierungsdaten werden per Bean Validation und Custom Validator geprueft.

- `[Backend] Login-Rate-Limiting`
  - Quellen: `backend/src/main/java/com/pawsitters/service/AuthenticationRateLimiter.java`, `backend/src/main/java/com/pawsitters/security/AuthController.java`
  - Nach 5 fehlgeschlagenen Login-Versuchen wird die Kombination aus E-Mail und Client-IP fuer 15 Minuten gesperrt.
  - Erfolgreiche Logins loeschen die gespeicherten Fehlversuche.
  - Die Client-IP wird aus `X-Forwarded-For` oder Remote-Adresse ermittelt.

- `[Backend] Rollen- und Rechtepruefung`
  - Quellen: `backend/src/main/java/com/pawsitters/controller/UserController.java`, `backend/src/main/java/com/pawsitters/service/UserService.java`
  - Rollen-Update ist mit `@PreAuthorize("hasRole('ADMIN')")` geschuetzt.
  - Registrierung mit Rolle `ADMIN` wird verhindert.
  - Normale User koennen sich selbst nicht per Profilupdate auf `ADMIN` setzen.
  - User duerfen eigenes Profil, eigenes Konto und eigenes Profilbild bearbeiten bzw. loeschen.

- `[Backend] Objektbezogene Autorisierung`
  - Quellen: `backend/src/main/java/com/pawsitters/service/PetService.java`, `OfferService.java`, `ChatService.java`, `BookingProposalService.java`, `AvailabilityService.java`, `ReviewService.java`
  - Haustiere: Lesen, Aendern, Loeschen und Bild-Upload sind an den authentifizierten Owner gebunden.
  - Angebote: Drafts, Publish/Withdraw und Bild-Upload laufen ueber das authentifizierte Host-Konto bzw. eigene Angebote.
  - Chats: Nur Host oder Requester eines Chats duerfen Nachrichten lesen/senden oder Attachments hochladen.
  - Buchungsangebote: Nur Chat-Teilnehmer duerfen Aktionen ausfuehren; Annehmen/Ablehnen nur durch Empfaenger, Zurueckziehen nur durch Sender.
  - Verfuegbarkeiten: Nur Hosts duerfen eigene Verfuegbarkeiten verwalten.
  - Bewertungen: Nur der Pet Owner einer abgeschlossenen Buchung darf den Host bewerten.

- `[Backend] WebSocket/STOMP-Schutz`
  - Quellen: `backend/src/main/java/com/pawsitters/config/WebSocketConfig.java`, `backend/src/main/java/com/pawsitters/service/ChatAuthorizationService.java`
  - WebSocket-Connect akzeptiert JWT aus `Authorization`-Header oder Auth-Cookie aus dem Handshake.
  - CONNECT validiert Token und Revocation.
  - SUBSCRIBE/SEND brauchen einen authentifizierten User.
  - Chat-Topics werden auf Chat-Teilnahme geprueft.

- `[Backend] Upload-Sicherheit`
  - Quellen: `backend/src/main/java/com/pawsitters/service/UserService.java`, `PetService.java`, `OfferService.java`, `ChatService.java`
  - Erlaubt sind nur Bild-Content-Types (`image/...`) und erlaubte Endungen wie `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`, `.bmp`.
  - Dateien werden mit `ImageIO` dekodiert; dadurch werden gefaelschte Bilddateien eher erkannt.
  - Dateinamen werden serverseitig mit IDs und UUIDs erzeugt, nicht aus User-Eingaben uebernommen.
  - Zielpfade werden normalisiert und gegen das erwartete Upload-Verzeichnis geprueft.
  - Groessenlimits sind eingebaut; Profil-, Angebots- und Chatbilder haben standardmaessig 5 MB.
  - Beim Ersetzen/Fehlerfall werden alte oder fehlgeschlagene Upload-Dateien best-effort aufgeraeumt.
  - Tierbilder erhalten einen SHA-256-Hash, um doppelte Bildzuordnungen zu erkennen.

- `[Backend] Einheitliche Fehlerantworten`
  - Quellen: `backend/src/main/java/com/pawsitters/controller/ApiExceptionHandler.java`, `ApiAuthenticationEntryPoint.java`, `ApiAccessDeniedHandler.java`
  - Validierungsfehler, fehlerhafte JSON-Bodies, Uploadfehler, Auth-Fehler, 403, 404, Konflikte und unerwartete Fehler werden in ein einheitliches API-Envelope gebracht.
  - Unerwartete Fehler liefern keine Stacktraces an Clients, sondern `INTERNAL_ERROR`.
  - Authentifizierungs- und Berechtigungsfehler haben stabile Codes wie `AUTH_REQUIRED`, `AUTH_INVALID_CREDENTIALS`, `ACCESS_DENIED`.

- `[Backend] Datenminimierung ueber DTOs`
  - Quellen: `backend/src/main/java/com/pawsitters/dto/UserResponse.java`, `backend/src/main/java/com/pawsitters/model/User.java`
  - Das Entity besitzt `passwordHash`, aber `UserResponse` uebernimmt dieses Feld nicht.
  - API-Controller geben DTOs bzw. Response-Envelopes zurueck statt ungefiltert das User-Entity.

- `[Config/Infra] CORS und Proxy-Kontext`
  - Quellen: `backend/src/main/java/com/pawsitters/config/WebConfig.java`, `backend/src/main/resources/application.properties`, `frontend/nginx.conf`
  - CORS ist fuer `/api/**` und `/actuator/**` konfigurierbar.
  - Default-Origin-Patterns sind fuer lokale Entwicklung (`localhost`/`127.0.0.1`) gedacht.
  - Credentials sind erlaubt, damit das HttpOnly Auth-Cookie bei API-Aufrufen mitgesendet werden kann.
  - Nginx leitet `X-Forwarded-For` und `X-Forwarded-Proto` weiter; das ist wichtig fuer Client-IP und Secure-Cookie-Erkennung.
  - `JWT_SECRET`, DB-Zugangsdaten, CORS und Cookie-Parameter sind per Environment Variable ueberschreibbar.

## Frontend

- `[Frontend] Cookie-basierte API-Aufrufe statt Token-Speicherung im Client`
  - Quelle: `frontend/src/js/site.js`
  - `apiFetch()` sendet `credentials: 'include'` nur fuer gleiche Origin und Pfade unter `/api/` oder `/actuator/`.
  - Das Frontend setzt keine eigenen `Authorization`-Header fuer normale Auth-Flows.
  - Auth-Status wird ueber `/api/auth/session` gelesen, nicht aus localStorage.
  - Session-relevante Requests verwenden `cache: 'no-store'`.

- `[Frontend] Login/Register-Flow`
  - Quellen: `frontend/src/templates/layout.html`, `frontend/src/templates/pages/register.html`, `frontend/src/js/site.js`
  - Login-Formular nutzt `autocomplete="username"` und `autocomplete="current-password"`.
  - Register- und Passwortaenderungsfelder nutzen `autocomplete="new-password"`.
  - Form-Submits laufen ueber Vue-Handler mit `@submit.prevent`, damit lokale Validierung und gezielte API-Calls genutzt werden.
  - Nach erfolgreicher Registrierung werden Passwortfelder im Frontend geleert.

- `[Frontend] Passwort-Policy als sofortiges Nutzerfeedback`
  - Quellen: `frontend/src/js/site.js`, `frontend/src/templates/pages/register.html`, `frontend/src/templates/pages/settings.html`
  - Frontend spiegelt die Backend-Regeln: 15 Zeichen, 72-Byte-Grenze, keine E-Mail-/Namensbestandteile, keine schwachen Passwortvarianten.
  - Kriterien werden live angezeigt und vor dem Submit geprueft.
  - Kontext: Die Backend-Policy bleibt entscheidend, weil Frontend-Validierung umgangen werden kann.

- `[Frontend] Route Guards fuer geschuetzte Seiten`
  - Quelle: `frontend/src/js/site.js`
  - Geschuetzte Bereiche wie Profil, eigene Haustiere, eigene Angebote und Einstellungen pruefen die Auth-Session.
  - Bei fehlendem Login werden entsprechende Zugriffe blockiert bzw. umgeleitet und mit Meldung erklaert.
  - Kontext: Das ist UX-Schutz; echte Zugriffskontrolle passiert im Backend.

- `[Frontend] XSS-arme Ausgabe dynamischer Daten`
  - Quellen: `frontend/src/templates/**/*.html`, `frontend/src/js/site.js`
  - Dynamische Texte werden sehr haeufig mit `th:text` oder Vue `v-text` ausgegeben.
  - Dadurch wird Text als Text gerendert statt als HTML interpretiert.
  - JS-Popups/Graph-Labels nutzen z. B. `sanitizePopupText()` oder `textContent`.
  - Es wurde keine Verwendung von `v-html` gefunden.

- `[Frontend] Eingabe- und Upload-Hilfen`
  - Quellen: `frontend/src/templates/partials/my-pets-modals.html`, `frontend/src/templates/layout.html`, `frontend/src/js/site.js`
  - Dateiinputs fuer Haustierbilder verwenden `accept="image/*"`.
  - Angebots- und Profilbild-Uploads laufen ueber Formularfelder im Frontend, werden aber serverseitig erneut validiert.
  - Postleitzahlen und Preisfelder werden clientseitig normalisiert bzw. eingeschraenkt (`pattern`, `inputmode`, Sanitizer-Funktionen).

- `[Frontend] Externe Links`
  - Quellen: `frontend/src/templates/layout.html`, `frontend/src/templates/pages/repository-git.html`, `frontend/src/templates/pages/repository-kanban.html`
  - Externe Links mit `target="_blank"` verwenden `rel="noopener noreferrer"` oder `rel="noreferrer"`.
  - Dadurch wird Tabnabbing ueber `window.opener` reduziert.

- `[Config/Infra] Nginx-Grenzen und No-Store fuer technische JSON-Endpunkte`
  - Quelle: `frontend/nginx.conf`
  - `client_max_body_size 6m` passt zu den Backend-Uploadlimits.
  - Statische JSON-Antworten fuer API-nahe Hilfsdaten setzen `Cache-Control: no-store`.
  - `/api/` wird an das Backend weitergeleitet und Forwarded-Header werden gesetzt.

## Wichtiger Kontext und offene Pruefpunkte

- `[Kontext/Risiko] CSRF`
  - Quelle: `backend/src/main/java/com/pawsitters/security/SecurityConfig.java`
  - CSRF ist deaktiviert, weil JWT genutzt wird.
  - Da das Frontend aber auch ein Cookie mit `credentials: include` nutzt, sollte fuer produktionsnahe Deployments bewusst entschieden werden, ob SameSite/CORS ausreichen oder ob CSRF-Tokens fuer zustandsveraendernde Requests ergaenzt werden.

- `[Kontext/Risiko] JWT im JSON-Body`
  - Quellen: `backend/src/main/java/com/pawsitters/security/AuthController.java`, `backend/src/main/java/com/pawsitters/dto/AuthResponse.java`
  - Login/Register geben den JWT auch im JSON-Body zurueck.
  - Das aktuelle Frontend persistiert ihn nicht als Auth-Token, aber JavaScript kann ihn bei Login/Register grundsaetzlich lesen.
  - Falls strikt nur HttpOnly-Cookie gewuenscht ist, sollte der Token nicht mehr im Response-Body ausgeliefert werden.

- `[Kontext/Risiko] Oeffentliche Upload-Auslieferung`
  - Quellen: `backend/src/main/java/com/pawsitters/security/SecurityConfig.java`, `backend/src/main/java/com/pawsitters/config/WebConfig.java`
  - `GET /uploads/**` ist oeffentlich erlaubt.
  - Das ist fuer Profil-/Angebotsbilder plausibel, kann aber fuer Chat-Attachments Datenschutzfragen aufwerfen, weil deren URLs unter `/uploads/messages/` ebenfalls statisch auslieferbar sind.

- `[Kontext/Risiko] Oeffentliche User-GETs`
  - Quellen: `backend/src/main/java/com/pawsitters/security/SecurityConfig.java`, `backend/src/main/java/com/pawsitters/dto/UserResponse.java`
  - `GET /api/users/**` ist oeffentlich erlaubt.
  - `UserResponse` enthaelt neben Namen auch E-Mail, Telefon, Geburtsdatum und Notfallkontakt.
  - Fuer Datenschutz/DSGVO sollte geprueft werden, ob fuer oeffentliche Profile ein reduziertes Public-DTO noetig ist.

- `[Kontext/Risiko] H2-Konsole`
  - Quelle: `backend/src/main/java/com/pawsitters/security/SecurityConfig.java`
  - `/h2-console/**` ist freigegeben.
  - Das ist fuer lokale Entwicklung praktisch, sollte aber ausserhalb von Dev-Profilen deaktiviert oder geschuetzt werden.

- `[Kontext/Risiko] Secrets und Produktivkonfiguration`
  - Quelle: `backend/src/main/resources/application.properties`
  - `JWT_SECRET` hat einen dev-only Default und muss in CI/Staging/Produktion zwingend ueberschrieben werden.
  - CORS-Origin-Patterns sollten produktiv explizit gesetzt werden, nicht als breite Localhost-Patterns.
  - Fuer getrennte Frontend-/Backend-Domains sind Cookie-Parameter (`SameSite=None`, `Secure=always`) bewusst zu konfigurieren.
