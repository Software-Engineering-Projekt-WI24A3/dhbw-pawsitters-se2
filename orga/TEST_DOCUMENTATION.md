
# Testdokumentation

Diese Datei dokumentiert alle aktuell vorhandenen automatisierten Tests im Backend und Frontend. Pro Test ist festgehalten, was geprüft wird, welches Ergebnis erwartet wird und ob der Test einen normalen Fall oder einen Edge Case abdeckt.

Hinweis: `JWTServiceTest.java` liegt aktuell unter `backend/src/main/java/com/pawsitters/security`, ist aber inhaltlich eine Backend-Testklasse.

## Übersicht Backend

| Bereich | Testklasse | Anzahl Tests |
| --- | --- | ---: |
| Authentifizierung und Security | `AuthIntegrationTest` | 26 |
| JWT-Service | `JWTServiceTest` | 4 |
| User-Service | `UserServiceTest` | 19 |
| Pet-Service | `PetServiceTest` | 2 |
| Request-Service | `RequestServiceTest` | 3 |
| Marketplace-Controller | `MarketplaceIntegrationTest` | 3 |
| Pet-Controller | `PetIntegrationTest` | 3 |
| Offer-Controller | `OfferIntegrationTest` | 2 |
| User-Controller | `UserIntegrationTest` | 6 |
| **Gesamt Backend** |  | **68** |

## Übersicht Frontend

| Bereich | Testdatei | Anzahl Tests |
| --- | --- | ---: |
| Authentifizierung (E2E) | `auth-flows.e2e.spec.js` | 2 |
| Lokalisierung (E2E) | `auth-locale.e2e.spec.js` | 3 |
| Repository Git (E2E) | `repository-git.e2e.spec.js` | 3 |
| Repository Kanban (E2E) | `repository-kanban.e2e.spec.js` | 1 |
| Repository Loading (E2E) | `repository-loading.e2e.spec.js` | 2 |
| Repository Playwright (E2E) | `repository-playwright.e2e.spec.js` | 2 |
| Startseite (E2E) | `shell-home.e2e.spec.js` | 1 |
| Graph Data Parsing (Unit) | `repository-graph-data.test.mjs` | 7 |
| Repository Snapshot (Unit) | `repository-live.test.mjs` | 3 |
| Suchdaten & Enums (Unit) | `search-data.test.mjs` | 2 |
| **Gesamt Frontend** |  | **26** |

## `AuthIntegrationTest`

Integrationstests fuer Authentifizierung, Session-Handling, Passwortvalidierung, Rate Limiting und oeffentliche Health-/Mail-Endpunkte.

| Test | Was wird getestet? | Erwartetes Ergebnis | Falltyp |
| --- | --- | --- | --- |
| `sessionWithoutTokenReturnsLoggedInFalse` | Session-Abfrage ohne Token. | HTTP 200, `success=true`, `loggedIn=false`, `email=null`. | Edge Case |
| `sessionWithInvalidTokenReturnsLoggedInFalse` | Session-Abfrage mit manipuliertem JWT. | HTTP 200, `success=true`, `loggedIn=false`, `email=null`. | Edge Case |
| `loginWithUppercaseEmailSucceedsAfterRegister` | Login nach Registrierung, wenn die E-Mail beim Login in Grossbuchstaben uebergeben wird. | HTTP 200, Token wird geliefert, Rolle ist `PET_OWNER`, `passwordChangeRequired=false`. | Edge Case |
| `loginUsesUnicodeNormalizedPassword` | Login mit Unicode-normalisiertem Passwort, z. B. zusammengesetztes und vorkomponiertes `e` mit Akzent. | HTTP 200, Login ist erfolgreich und ein Token wird geliefert. | Edge Case |
| `registerDuplicateEmailDifferentCaseReturnsBadRequest` | Registrierung einer bereits existierenden E-Mail mit anderer Gross-/Kleinschreibung. | HTTP 400, `success=false`, Fehlercode `BAD_REQUEST`. | Edge Case |
| `loginWithWrongPasswordReturnsInvalidCredentialsEnvelope` | Login mit falschem Passwort. | HTTP 401, `success=false`, `data=null`, Fehlercode `AUTH_INVALID_CREDENTIALS`. | Edge Case |
| `repeatedFailedLoginAttemptsAreRateLimited` | Mehrere fehlgeschlagene Login-Versuche hintereinander. | Die ersten 5 Versuche liefern HTTP 401; der naechste Versuch liefert HTTP 429 mit Fehlercode `TOO_MANY_REQUESTS`. | Edge Case |
| `malformedJsonReturnsMalformedRequestEnvelope` | Login-Request mit syntaktisch kaputtem JSON. | HTTP 400, Fehlercode `MALFORMED_REQUEST`, Detailfeld `request`. | Edge Case |
| `registerValidationFailureReturnsFieldDetails` | Registrierung mit ungueltiger E-Mail und zu kurzem Passwort. | HTTP 400, Fehlercode `VALIDATION_FAILED`, Fehlerdetails sind vorhanden. | Edge Case |
| `registerWithTooShortPasswordReturnsPasswordValidationError` | Registrierung mit einem Passwort unterhalb der Mindestlaenge. | HTTP 400, Fehlercode `VALIDATION_FAILED`, Feldfehler fuer `password`. | Edge Case |
| `registerWithNistStylePassphraseWithoutCharacterMixSucceeds` | Registrierung mit langer Passphrase ohne klassische Zeichenmischung. | HTTP 200, `success=true`, Token wird geliefert. | Normalfall |
| `registerWithPasswordContainingEmailLocalPartReturnsPasswordValidationError` | Passwort enthaelt den lokalen Teil der E-Mail-Adresse. | HTTP 400, Fehlercode `VALIDATION_FAILED`, Feldfehler fuer `password`. | Edge Case |
| `registerWithPasswordLongerThanBcryptLimitReturnsPasswordValidationError` | Passwort ist laenger als das Bcrypt-Limit. | HTTP 400, Fehlercode `VALIDATION_FAILED`, Feldfehler fuer `password`. | Edge Case |
| `registerWithProjectNamePasswordVariantReturnsPasswordValidationError` | Passwort enthaelt eine Variante des Projektnamens. | HTTP 400, Fehlercode `VALIDATION_FAILED`, Feldfehler fuer `password`. | Edge Case |
| `registerWithPasswordContainingFirstNameReturnsPasswordValidationError` | Passwort enthaelt den Vornamen des Users. | HTTP 400, Fehlercode `VALIDATION_FAILED`, Feldfehler fuer `password`. | Edge Case |
| `registerWithSequentialPasswordReturnsPasswordValidationError` | Passwort enthaelt auffaellige Zeichen-/Zahlenfolgen. | HTTP 400, Fehlercode `VALIDATION_FAILED`, Feldfehler fuer `password`. | Edge Case |
| `registerWithLongRepetitionPasswordReturnsPasswordValidationError` | Passwort enthaelt lange Wiederholungen gleicher Zeichen. | HTTP 400, Fehlercode `VALIDATION_FAILED`, Feldfehler fuer `password`. | Edge Case |
| `mailExistsReturnsTrueForExistingEmailWithoutToken` | Oeffentliche Pruefung, ob eine registrierte E-Mail existiert; E-Mail wird in anderer Gross-/Kleinschreibung abgefragt. | HTTP 200, `success=true`, `data.exists=true`. | Normalfall |
| `mailExistsReturnsFalseForUnknownEmailWithoutToken` | Oeffentliche Pruefung einer unbekannten E-Mail. | HTTP 200, `success=true`, `data.exists=false`. | Normalfall |
| `actuatorHealthIsPublicForDeploymentChecks` | Oeffentlicher Health-Endpoint fuer Deployment-Checks. | HTTP 200, Status `UP`. | Normalfall |
| `sessionWithValidJwtReturnsLoggedInTrue` | Session-Abfrage mit gueltigem JWT im Authorization-Header. | HTTP 200, `loggedIn=true`, E-Mail entspricht dem registrierten User. | Normalfall |
| `sessionWithValidJwtCookieReturnsLoggedInTrue` | Session-Abfrage mit gueltigem JWT aus Auth-Cookie. | HTTP 200, `loggedIn=true`, E-Mail entspricht dem registrierten User. | Normalfall |
| `sessionAfterRegisterUsesAuthCookie` | Registrierung setzt ein Auth-Cookie, das danach fuer die Session-Abfrage genutzt wird. | HTTP 200 bei Registrierung; anschliessend `loggedIn=true` mit der registrierten E-Mail. | Normalfall |
| `sessionAfterLoginUsesAuthCookie` | Login setzt ein Auth-Cookie, das danach fuer die Session-Abfrage genutzt wird. | HTTP 200 beim Login; anschliessend `loggedIn=true` mit der registrierten E-Mail. | Normalfall |
| `sessionWithRawAuthorizationTokenReturnsLoggedInTrue` | Session-Abfrage akzeptiert einen rohen Token im Authorization-Header ohne `Bearer`-Praefix. | HTTP 200, `loggedIn=true`, E-Mail entspricht dem registrierten User. | Edge Case |
| `logoutInvalidatesTokenForSessionCheck` | Logout widerruft den Token fuer spaetere Session-Abfragen. | Logout liefert HTTP 200; anschliessende Session-Abfrage mit demselben Token liefert `loggedIn=false`, `email=null`. | Normalfall |

## `JWTServiceTest`

Unit-Tests fuer die JWT-Erzeugung, Claim-Auslesung und Tokenvalidierung.

| Test | Was wird getestet? | Erwartetes Ergebnis | Falltyp |
| --- | --- | --- | --- |
| `whenValidCredentials_thenTokenIsGenerated` | Token-Erzeugung mit gueltiger E-Mail und Rolle. | Token ist nicht `null` und nicht leer. | Normalfall |
| `whenValidToken_thenEmailAndRoleAreExtractedCorrectly` | Auslesen von E-Mail und Rolle aus einem gueltigen Token. | Extrahierte E-Mail ist `max@test.de`, Rolle ist `PET_OWNER`. | Normalfall |
| `whenInvalidToken_thenIsTokenValidReturnsFalse` | Validierung eines manipulierten JWT. | `isTokenValid` gibt `false` zurueck. | Edge Case |
| `whenExpiredToken_thenIsTokenValidReturnsFalse` | Validierung eines sofort abgelaufenen Tokens. | `isTokenValid` gibt `false` zurueck. | Edge Case |

## `UserServiceTest`

Unit-Tests fuer User-Erstellung, Suche, Aktualisierung, Loeschung, Rollenwechsel und Profilbild-Update.

| Test | Was wird getestet? | Erwartetes Ergebnis | Falltyp |
| --- | --- | --- | --- |
| `whenValidUser_thenUserIsSavedSuccessfully` | Erstellung eines Users mit gueltigen Daten. | User wird gespeichert, E-Mail und Rolle bleiben erhalten, Passwort wird gehasht. | Normalfall |
| `whenDuplicateEmail_thenThrowException` | Erstellung eines Users mit bereits vorhandener E-Mail. | `IllegalArgumentException`; Repository-`save` wird nicht aufgerufen. | Edge Case |
| `whenLoginEmailHasDifferentCase_thenFindByEmailStillReturnsUser` | E-Mail-Suche ist case-insensitive. | User wird trotz anderer Gross-/Kleinschreibung gefunden. | Edge Case |
| `whenDuplicateEmailWithDifferentCase_thenCreateUserThrowsException` | Duplikaterkennung ist case-insensitive. | `IllegalArgumentException`; User wird nicht gespeichert. | Edge Case |
| `whenUserNotFound_thenGetUserByIdThrowsException` | Abruf eines nicht existierenden Users per ID. | `NotFoundException`. | Edge Case |
| `whenEmailNotFound_thenFindByEmailThrowsException` | Abruf eines nicht existierenden Users per E-Mail. | `NotFoundException`. | Edge Case |
| `whenEmailExists_thenExistsByEmailReturnsTrue` | Existenzpruefung fuer vorhandene E-Mail. | Ergebnis ist `true`. | Normalfall |
| `whenEmailNotExists_thenExistsByEmailReturnsFalse` | Existenzpruefung fuer nicht vorhandene E-Mail. | Ergebnis ist `false`. | Normalfall |
| `whenOwnerUpdatesUser_thenUserIsSaved` | Eigentuemer aktualisiert sein eigenes User-Profil vollstaendig. | Neue Felder werden gesetzt, User wird gespeichert. | Normalfall |
| `whenWrongEmailUpdatesUser_thenThrowsException` | Fremder User versucht ein Profil zu aktualisieren. | `ForbiddenException`; User wird nicht gespeichert. | Edge Case |
| `whenNullFieldsPatched_thenFieldsRemainUnchanged` | Patch-Update mit ausschliesslich `null`-Feldern. | Bestehende Werte bleiben unveraendert. | Edge Case |
| `whenNonNullFieldsPatched_thenFieldsAreUpdated` | Patch-Update mit einem nicht-null Feld. | Das uebergebene Feld wird aktualisiert. | Normalfall |
| `whenWrongEmailPatches_thenThrowsException` | Fremder User versucht ein Profil per Patch zu aendern. | `ForbiddenException`; User wird nicht gespeichert. | Edge Case |
| `whenOwnerDeletes_thenUserIsDeleted` | Eigentuemer loescht sein eigenes User-Profil. | `deleteById` wird mit der User-ID aufgerufen. | Normalfall |
| `whenWrongEmailDeletes_thenThrowsException` | Fremder User versucht ein Profil zu loeschen. | `ForbiddenException`; `deleteById` wird nicht aufgerufen. | Edge Case |
| `whenAdminUpdatesRole_thenRoleIsChanged` | Rollenwechsel eines Users ueber den Service. | Rolle wird auf `HOST` gesetzt, User wird gespeichert. | Normalfall |
| `whenUserNotFoundForRoleUpdate_thenThrowsException` | Rollenwechsel fuer nicht existierenden User. | `NotFoundException`. | Edge Case |
| `whenOwnerUpdatesProfileImage_thenProfilePictureIsUpdated` | Eigentuemer aktualisiert sein Profilbild. | Profilbildpfad wird gesetzt, User wird gespeichert. | Normalfall |
| `whenWrongEmailUpdatesProfileImage_thenThrowsException` | Fremder User versucht das Profilbild zu aktualisieren. | `ForbiddenException`; User wird nicht gespeichert. | Edge Case |

## `PetServiceTest`

Unit-Tests fuer das Anlegen von Haustieren.

| Test | Was wird getestet? | Erwartetes Ergebnis | Falltyp |
| --- | --- | --- | --- |
| `whenValidOwner_thenPetIsSavedSuccessfully` | Haustier wird fuer einen existierenden Owner erstellt. | Pet ist nicht `null`, Name ist gesetzt, Owner ist zugeordnet, Pet wird gespeichert. | Normalfall |
| `whenOwnerNotFound_thenThrowException` | Haustier-Erstellung fuer nicht existierenden Owner. | `IllegalArgumentException`; Pet wird nicht gespeichert. | Edge Case |

## `RequestServiceTest`

Unit-Tests fuer das Erstellen von Betreuungsanfragen.

| Test | Was wird getestet? | Erwartetes Ergebnis | Falltyp |
| --- | --- | --- | --- |
| `whenValidData_thenRequestIsCreatedWithStatusOpen` | Anfrage wird mit existierendem Owner, passendem Pet und gueltigem Zeitraum erstellt. | Request ist nicht `null`, Status ist `OPEN`, Pet Owner ist gesetzt, Request wird gespeichert. | Normalfall |
| `whenEndDateBeforeStartDate_thenThrowException` | Anfrage mit Enddatum vor Startdatum. | `IllegalArgumentException`; Request wird nicht gespeichert. | Edge Case |
| `whenPetDoesNotBelongToOwner_thenThrowException` | Anfrage fuer ein Pet, das einem anderen Owner gehoert. | `IllegalArgumentException`; Request wird nicht gespeichert. | Edge Case |

## `MarketplaceIntegrationTest`

Integrationstests fuer Marketplace-Hostlisten, Suche und Filteroptionen.

| Test | Was wird getestet? | Erwartetes Ergebnis | Falltyp |
| --- | --- | --- | --- |
| `getHostsReturnsHostOverviewEnvelope` | Abruf der Host-Uebersicht ueber `/api/marketplace/hosts`. | HTTP 200, API-Envelope erfolgreich, `meta.total=3`, drei Hosts, Hostdaten enthalten erwartete Felder und keinen `passwordHash`. | Normalfall |
| `searchHostsBySpeciesAndPostalCodeReturnsMatchingHostsOnly` | Suche nach Hosts anhand Tierart `DOG` und Postleitzahl `68159`. | HTTP 200, zwei Treffer, alle Treffer haben Postleitzahl `68159` und akzeptieren `DOG`. | Normalfall |
| `filtersReturnAvailableMarketplaceOptionsDynamically` | Abruf dynamischer Filteroptionen fuer den Marketplace. | HTTP 200, Optionen enthalten u. a. `DOG`, `CAT`, `68159` und `Mannheim`. | Normalfall |

## `PetIntegrationTest`

Integrationstests fuer Pet-Endpunkte, Pet-Antworten und Bild-Upload-Regeln.

| Test | Was wird getestet? | Erwartetes Ergebnis | Falltyp |
| --- | --- | --- | --- |
| `petProfileCanBeCreatedReadAndUpdated` | Pet-Profil wird erstellt, gelesen und aktualisiert. | Erstellung erfolgreich; Abruf zeigt genau ein Pet mit erwarteten Feldern; Update aendert Rasse, Alter und Special Needs; Fallback-Bildpfad bleibt korrekt. | Normalfall |
| `imageMustBeUniqueAcrossPets` | Dieselbe Bilddatei darf nicht fuer mehrere Pets verwendet werden. | Erster Upload erfolgreich; Upload derselben Bildbytes fuer ein anderes Pet liefert HTTP 400; ein anderes Bild fuer das zweite Pet ist erfolgreich. | Edge Case |
| `petResponseIncludesFallbackImagePath` | Pet-Antworten enthalten passende Fallback-Bildpfade fuer verschiedene Tierarten. | Jedes Pet hat einen nicht-leeren `defaultImagePath`; `CAT` nutzt `/images/pet_images/cat/`, `BUDGIE` nutzt `/images/pet_images/budgie/`. | Normalfall |

## `OfferIntegrationTest`

Integrationstests fuer Offer-Lifecycle und Rollenberechtigungen.

| Test | Was wird getestet? | Erwartetes Ergebnis | Falltyp |
| --- | --- | --- | --- |
| `offerCanMoveBetweenDraftAndPublishedAndMarketplaceShowsOnlyPublishedOffers` | Offer wird erstellt, gelesen, veroeffentlicht, im Marketplace sichtbar gemacht und wieder zurueckgezogen. | Neue Offer startet als `DRAFT`; Draft erscheint nicht im Marketplace; nach Publish erscheint sie als `PUBLISHED`; nach Withdraw ist sie wieder `DRAFT` und nicht mehr im Marketplace. | Normalfall |
| `petOwnerCannotCreateOffer` | Ein User mit Rolle `PET_OWNER` versucht eine Offer zu erstellen. | HTTP 403, `success=false`, Fehlercode `FORBIDDEN`. | Edge Case |

## `UserIntegrationTest`

Integrationstests fuer User-Endpunkte, Fehler-Envelopes und Rollenberechtigungen.

| Test | Was wird getestet? | Erwartetes Ergebnis | Falltyp |
| --- | --- | --- | --- |
| `currentUserResponseContainsPublicFieldsOnly` | Abruf des aktuellen Users ueber `/api/users/me`. | HTTP 200, erwartete oeffentliche Felder sind vorhanden, `pets` ist leer, `passwordHash` fehlt. | Normalfall |
| `deleteUserReturnsEnvelopeWithDeleteResponse` | Loeschen des eigenen Users. | HTTP 200, `success=true`, `data.deleted=true`, geloeschte ID entspricht dem User. | Normalfall |
| `protectedEndpointWithoutTokenReturnsAuthRequiredEnvelope` | Geschuetzter Endpoint ohne Token. | HTTP 401, `success=false`, Fehlercode `AUTH_REQUIRED`. | Edge Case |
| `invalidMailExistsQueryReturnsValidationEnvelope` | `mailExists`-Abfrage mit ungueltiger E-Mail. | HTTP 400, Fehlercode `VALIDATION_FAILED`, Fehlerdetails sind vorhanden. | Edge Case |
| `nonAdminCannotUpdateRoles` | Nicht-Admin versucht seine Rolle zu aendern. | HTTP 403, `success=false`, Fehlercode `ACCESS_DENIED`. | Edge Case |
| `missingUserReturnsNotFoundEnvelope` | Abruf eines nicht existierenden Users. | HTTP 404, `success=false`, Fehlercode `NOT_FOUND`. | Edge Case |

## Frontend-Tests

### `auth-flows.e2e.spec.js` (End-to-End)

Integrationstests für die Authentifizierungs-Flows im Frontend (Login & Registrierung).

| Test | Was wird getestet? | Erwartetes Ergebnis | Falltyp |
| --- | --- | --- | --- |
| `completes full registration flow and redirects from /register to home` | Kompletter Registrierungs-Flow inkl. Navigation und Ausfüllen des Formulars. | Erfolgreiche Registrierung, Token wird gespeichert und der User wird auf die Startseite weitergeleitet. | Normalfall |
| `completes full modal login flow with mail check and hides login button when authenticated` | Login-Flow über das Modal inklusive vorheriger Prüfung der E-Mail-Existenz. | Login ist erfolgreich und der Login-Button verschwindet nach erfolgreicher Anmeldung. | Normalfall |

### `auth-locale.e2e.spec.js` (End-to-End)

Tests für die korrekte Lokalisierung und Spracheinstellungen in den Auth-Modals.

| Test | Was wird getestet? | Erwartetes Ergebnis | Falltyp |
| --- | --- | --- | --- |
| `should open login modal in English and switch back to German` | Öffnen des Login-Modals und Wechseln der Sprache von Englisch zu Deutsch. | Modal wird in der korrekten Sprache angezeigt und lässt sich erfolgreich umschalten. | Normalfall |
| `should open login modal from register page and switch locale to English` | Öffnen des Login-Modals von der Registrierungsseite aus und Wechsel auf Englisch. | Die Sprache wird korrekt auf Englisch umgestellt. | Normalfall |
| `should open the login modal when clicking a legacy /login link` | Klick auf einen alten bzw. ungültigen `/login`-Link. | Das Login-Modal öffnet sich anstatt einen 404-Fehler zu werfen. | Edge Case |

### `repository-git.e2e.spec.js` (End-to-End)

Tests für die Darstellung der Git-Historie und Aktivitäten.

| Test | Was wird getestet? | Erwartetes Ergebnis | Falltyp |
| --- | --- | --- | --- |
| `should render git activity and timeline interactions from live data` | Darstellung der Git-Aktivität und Interaktionen in der Timeline mit Live-Daten. | Timeline und Aktivitäten werden fehlerfrei geladen und gerendert. | Normalfall |
| `should render distinct heights for top activity bars` | Darstellung der Aktivitäts-Balken. | Die Balken haben unterschiedliche, an die Anzahl der Commits angepasste Höhen. | Normalfall |
| `should reload timeline after manual repository refresh` | Aktualisierung der Timeline nach manuellem Refresh. | Die Timeline wird mit den neuesten Daten neu geladen. | Normalfall |

### `repository-kanban.e2e.spec.js` (End-to-End)

Tests für das Kanban-Board.

| Test | Was wird getestet? | Erwartetes Ergebnis | Falltyp |
| --- | --- | --- | --- |
| `should keep exactly one active board column and render matching cards` | Rendering und Verhalten der Spalten im Kanban-Board. | Es ist stets genau eine Spalte aktiv und zeigt die jeweils dazugehörigen Karten an. | Normalfall |

### `repository-loading.e2e.spec.js` (End-to-End)

Tests für das Verhalten bei Ladevorgängen von Repository-Daten.

| Test | Was wird getestet? | Erwartetes Ergebnis | Falltyp |
| --- | --- | --- | --- |
| `should keep git and kanban content pending until live data resolves` | Anzeige während des initialen Ladevorgangs. | Lade-Indikatoren bleiben sichtbar, bis alle Daten vollständig geladen wurden. | Normalfall |
| `should request a fresh snapshot when the refresh action is triggered` | Verhalten bei manuellem Refresh. | Es wird ein neuer Snapshot vom Server angefragt. | Normalfall |

### `repository-playwright.e2e.spec.js` (End-to-End)

Tests für die Playwright-Test-UI im Frontend.

| Test | Was wird getestet? | Erwartetes Ergebnis | Falltyp |
| --- | --- | --- | --- |
| `should render a minimal start state, run tests, and show completion notification` | Testausführung in der Playwright-UI. | Minimaler Startzustand wird gerendert, Tests laufen durch und es erscheint eine Erfolgsmeldung. | Normalfall |
| `should expose consistent repository switch navigation targets` | Navigation zwischen verschiedenen Repositories. | Die Navigationsziele sind konsistent und die Navigation funktioniert korrekt. | Normalfall |

### `shell-home.e2e.spec.js` (End-to-End)

Tests für die Startseite.

| Test | Was wird getestet? | Erwartetes Ergebnis | Falltyp |
| --- | --- | --- | --- |
| `should render the global start page without repository graph content` | Rendern der globalen Startseite. | Seite wird fehlerfrei und ohne spezifische Repository-Graphen dargestellt. | Normalfall |

### `repository-graph-data.test.mjs` (Unit)

Unit-Tests für die Verarbeitung von Commit- und Graphendaten.

| Test | Was wird getestet? | Erwartetes Ergebnis | Falltyp |
| --- | --- | --- | --- |
| `parseCommitImport keeps only parent links that exist in payload` | Filtern von in der Payload nicht vorhandenen Parent-Commits. | Es werden nur existierende Parent-Commits behalten. | Normalfall |
| `parseCommitImport preserves existing commit metadata` | Verarbeitung von Commit-Metadaten. | Metadaten (Hash, Autor, Datum etc.) bleiben unversehrt. | Normalfall |
| `parseBranchCommits does not map by author display name` | Zuweisung von Commits zu Autoren. | Autoren werden nicht fehlerhaft über den reinen Anzeigenamen (Display Name) gemappt. | Edge Case |
| `parseAuthorContributionStats counts commits and changed lines per author` | Aggregation von Commits und Codezeilen-Änderungen pro Autor. | Statistiken pro Autor werden korrekt summiert. | Normalfall |
| `parseAuthorContributionStats ignores malformed and binary numstat entries` | Verarbeitung defekter oder binärer Statistik-Einträge. | Solche Einträge werden ignoriert und führen nicht zu Berechnungsfehlern. | Edge Case |
| `createActivitySeries applies tie-breaking for duplicate max counts` | Erstellung der Aktivitätsserien bei gleichen Max-Werten (Tie-Break). | Bei gleichen Werten wird ein konsistenter Tie-Break angewandt. | Edge Case |
| `parseOpenApiYamlSnapshot extracts dynamic operations and tags` | Extrahieren von dynamischen Operationen und Tags aus einer OpenAPI-YAML. | Die Daten werden vollständig und korrekt geparst. | Normalfall |

### `repository-live.test.mjs` (Unit)

Unit-Tests für das Laden und Validieren der Live-Snapshots.

| Test | Was wird getestet? | Erwartetes Ergebnis | Falltyp |
| --- | --- | --- | --- |
| `live repository snapshot exposes real git and board data` | Bereitstellung von tatsächlichen Git- und Kanban-Daten über den Snapshot. | Es werden valide Daten mit den korrekten Feldern geliefert. | Normalfall |
| `repository pages do not embed static snapshot payloads` | Überprüfung auf ungewollte feste Snapshots in den HTML-Templates. | Die Templates enthalten keine hardcodierten JSON-Snapshots. | Edge Case |
| `fresh repository snapshots rebuild and replace the in-memory cache` | Erneuerung des Caches beim Anfordern eines frischen Snapshots. | Der In-Memory-Cache wird korrekt aktualisiert. | Normalfall |

### `search-data.test.mjs` (Unit)

Unit-Tests für das Auslesen von Suchdaten (z. B. Tierarten).

| Test | Was wird getestet? | Erwartetes Ergebnis | Falltyp |
| --- | --- | --- | --- |
| `loadPetChoices reads and normalizes values from backend enum when backend is available` | Auslesen der Tierarten aus dem Java-Backend (Enum `PetChoice.java`). | Optionen werden ausgelesen, normalisiert (z. B. `DOG`) und zurückgegeben. | Normalfall |
| `loadPetChoices falls back to frontend assets data when backend source is unavailable` | Verhalten, wenn das Backend nicht erreichbar ist. | Es wird auf eine statische JSON-Datei im Frontend zurückgegriffen. | Edge Case |
