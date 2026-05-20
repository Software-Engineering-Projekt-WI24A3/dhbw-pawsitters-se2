# Testdokumentation

Stand: 2026-05-19

Diese Datei dokumentiert umfassend den aktuell im Repository vorhandenen und aktiv ausgeführten Testbestand. Sie dient als zentrale Übersichts- und Nachweisquelle für alle automatisierten Prüfprozesse der Pawsitters-Plattform.

## 1. Einleitung und Zielsetzung

### Warum wir testen
Automatisierte Tests sind ein essenzieller Bestandteil der Pawsitters-Architektur. Sie stellen sicher, dass:
1. **Kernfunktionen stabil bleiben:** Benutzerflüsse (Registrierung, Buchungen, Chat) müssen bei Code-Erweiterungen funktionstüchtig bleiben (Vermeidung von Regressionen).
2. **Sicherheit gewährleistet ist:** Penetrations-Szenarien, Brute-Force-Versuche (Rate Limiting) und Autorisierungs-Checks werden kontinuierlich durch das System verifiziert, sodass kein unautorisierter Zugriff stattfinden kann.
3. **Edge Cases behandelt werden:** Unerwartetes Benutzerverhalten oder fehlerhafte Datenformate (z. B. extrem große Bilder, kaputtes JSON) dürfen nicht zum Systemabsturz führen.

### Scope und Ausführung
* **Backend-Tests:** JUnit-Tests (Unit & Integration), angesiedelt unter `backend/src/test/java` (Ausnahme: `JWTServiceTest.java`).
* **Frontend-Tests:** E2E-Tests via Playwright (unter `frontend/tests/e2e` als `*.e2e.spec.js`) sowie Datentests via Node Test Runner. 

> *Hinweis:* Inaktive oder veraltete Test-Kopien (z. B. `*.spec 2.js`) sind bewusst von dieser Dokumentation ausgeschlossen.

---

## 2. Test-Übersicht (Zusammenfassung)

Das Projekt verfügt aktuell über insgesamt **165** aktive automatisierte Tests.

### Backend-Tests (Gesamt: 131)

| Bereich | Testklasse | Anzahl Tests |
| --- | --- | ---: |
| Authentifizierung / Security | `AuthIntegrationTest` | 29 |
| User Management | `UserServiceTest` | 23 |
| User API | `UserIntegrationTest` | 18 |
| Chat API | `ChatIntegrationTest` | 18 |
| Marketplace API | `MarketplaceIntegrationTest` | 8 |
| Offer API | `OfferIntegrationTest` | 7 |
| Chat Realtime Events | `ChatRealtimeServiceTest` | 6 |
| Host Profile API | `HostIntegrationTest` | 4 |
| Token / JWT Generierung | `JWTServiceTest` | 4 |
| Verfügbarkeiten | `AvailabilityIntegrationTest` | 4 |
| Pet API | `PetIntegrationTest` | 3 |
| Buchungsanfragen | `RequestServiceTest` | 3 |
| Chat Autorisierung | `ChatAuthorizationServiceTest` | 2 |
| Pet Management | `PetServiceTest` | 2 |

### Frontend-Tests (Gesamt: 34)

| Bereich | Testdatei | Art des Tests | Anzahl Tests |
| --- | --- | --- | ---: |
| Graph Data Parsing | `repository-graph-data.test.mjs` | Unit | 7 |
| Lokalisierung | `auth-locale.e2e.spec.js` | E2E | 3 |
| Repository Git | `repository-git.e2e.spec.js` | E2E | 3 |
| Repository Live Snapshot | `repository-live.test.mjs` | Unit | 3 |
| Authentifizierungs-Flow | `auth-flows.e2e.spec.js` | E2E | 2 |
| Home Offers Carousel | `home-offers-carousel.e2e.spec.js` | E2E | 2 |
| My Offers Create Flow | `my-offers-create-flow.e2e.spec.js` | E2E | 2 |
| Repository Loading | `repository-loading.e2e.spec.js` | E2E | 2 |
| Repository Playwright UI | `repository-playwright.e2e.spec.js` | E2E | 2 |
| Backend Enumerationen | `search-data.test.mjs` | Unit | 2 |
| Header-Menüs | `header-dropdown-exclusive.e2e.spec.js` | E2E | 1 |
| Home Search Results | `home-search-results.e2e.spec.js` | E2E | 1 |
| My Offers Card Design | `my-offers-card-background.e2e.spec.js` | E2E | 1 |
| Repository Kanban | `repository-kanban.e2e.spec.js` | E2E | 1 |
| Segment-Indicator | `segmented-indicator-alignment.e2e.spec.js` | E2E | 1 |
| Startseite | `shell-home.e2e.spec.js` | E2E | 1 |

---

## 3. Detaillierte Backend-Tests

### `AuthIntegrationTest`
Prüft den Auth-Flow, Session-Management, Passwortvalidierung, Cookies, CORS und Fehlerszenarien (Security).

| Test | Was wird getestet? | Erwartetes Ergebnis | Falltyp |
| --- | --- | --- | --- |
| `sessionWithoutTokenReturnsLoggedInFalse` | Session-Abfrage ohne Token | HTTP 200, loggedIn=false | Edge Case |
| `sessionWithInvalidTokenReturnsLoggedInFalse` | Session-Abfrage mit ungültigem JWT | HTTP 200, loggedIn=false | Edge Case |
| `loginWithUppercaseEmailSucceedsAfterRegister` | Login mit Großbuchstaben-Email | HTTP 200, Login erfolgreich | Edge Case |
| `loginUsesUnicodeNormalizedPassword` | Login mit Unicode-normalisiertem Passwort | HTTP 200, Login erfolgreich | Edge Case |
| `registerDuplicateEmailDifferentCaseReturnsBadRequest` | Registrierung einer bereits vorhandenen E-Mail mit anderer Groß-/Kleinschreibung | HTTP 400 | Edge Case |
| `loginWithWrongPasswordReturnsInvalidCredentialsEnvelope` | Login mit falschem Passwort | HTTP 401 | Edge Case |
| `repeatedFailedLoginAttemptsAreRateLimited` | Mehrere fehlgeschlagene Logins hintereinander (Rate Limiting / Brute-Force Schutz) | HTTP 429 Too Many Requests | Edge Case |
| `malformedJsonReturnsMalformedRequestEnvelope` | Kaputtes JSON im Login | HTTP 400 | Edge Case |
| `registerValidationFailureReturnsFieldDetails` | Registrierung mit invaliden Daten | HTTP 400 mit Fehlerdetails | Edge Case |
| `registerWithTooShortPasswordReturnsPasswordValidationError` | Passwort unterhalb der Mindestlänge | HTTP 400 | Edge Case |
| `registerWithNistStylePassphraseWithoutCharacterMixSucceeds` | Passphrase nach NIST-Standard ohne Zeichenmischung | HTTP 200 | Normalfall |
| `registerWithPasswordContainingEmailLocalPartReturnsPasswordValidationError` | Passwort enthält E-Mail-Präfix | HTTP 400 | Edge Case |
| `registerWithPasswordLongerThanBcryptLimitReturnsPasswordValidationError` | Passwort länger als Bcrypt-Obergrenze erlaubt | HTTP 400 | Edge Case |
| `registerWithProjectNamePasswordVariantReturnsPasswordValidationError` | Passwort enthält den Projektnamen ("Pawsitters") | HTTP 400 | Edge Case |
| `registerWithPasswordContainingFirstNameReturnsPasswordValidationError` | Passwort enthält eigenen Vornamen | HTTP 400 | Edge Case |
| `registerWithSequentialPasswordReturnsPasswordValidationError` | Passwort ist eine offensichtliche Sequenz (z. B. 12345) | HTTP 400 | Edge Case |
| `registerWithLongRepetitionPasswordReturnsPasswordValidationError` | Passwort mit zu langen, sich wiederholenden Zeichen | HTTP 400 | Edge Case |
| `mailExistsReturnsTrueForExistingEmailWithoutToken` | E-Mail-Existenzprüfung für eine bekannte Mail-Adresse | HTTP 200, exists=true | Normalfall |
| `mailExistsReturnsFalseForUnknownEmailWithoutToken` | E-Mail-Existenzprüfung für eine unbekannte Mail-Adresse | HTTP 200, exists=false | Normalfall |
| `actuatorHealthIsPublicForDeploymentChecks` | Oeffentlicher Health-Endpoint Aufruf (Deployment Health Check) | HTTP 200, Status UP | Normalfall |
| `sessionWithValidJwtReturnsLoggedInTrue` | Session-Abfrage mit gültigem JWT im Header | HTTP 200, loggedIn=true | Normalfall |
| `sessionWithValidJwtCookieReturnsLoggedInTrue` | Session-Abfrage mit gültigem JWT-Cookie | HTTP 200, loggedIn=true | Normalfall |
| `sessionAfterRegisterUsesAuthCookie` | Cookie wird direkt nach Registrierung gesetzt und genutzt | HTTP 200 | Normalfall |
| `sessionAfterLoginUsesAuthCookie` | Cookie wird direkt nach dem Login gesetzt und genutzt | HTTP 200 | Normalfall |
| `loginSetsSecureCookieWhenForwardedProtoIsHttps` | Secure-Cookie Flag wird bei HTTPS im Load Balancer korrekt gesetzt | Cookie besitzt 'Secure' Flag | Edge Case |
| `loginSetsSecureCookieWhenStandardForwardedProtoIsHttps` | Secure-Cookie Flag bei Standard-HTTPS-Forwarding Header | Cookie besitzt 'Secure' Flag | Edge Case |
| `corsPreflightForSessionAllowsConfiguredLocalOrigin` | CORS-Preflight Prüfung für lokale Origins | Lokaler Frontend-Origin wird zugelassen | Edge Case |
| `sessionWithRawAuthorizationTokenReturnsLoggedInTrue` | Session-Abfrage mit Token ohne klassisches 'Bearer'-Prefix | HTTP 200, loggedIn=true | Edge Case |
| `logoutInvalidatesTokenForSessionCheck` | Logout annulliert den JWT Token für weitere Aufrufe | Token ist nach Logout sofort ungültig | Normalfall |

### `UserServiceTest`
Unit-Tests für die User-Logik: Erstellung, Rollenwechsel, Profilbildbezug und Aktualisierungen.

| Test | Was wird getestet? | Erwartetes Ergebnis | Falltyp |
| --- | --- | --- | --- |
| `whenValidUser_thenUserIsSavedSuccessfully` | Speicherung eines Users mit korrekten Daten | User erfolgreich in Repository gespeichert | Normalfall |
| `whenValidHost_thenEmptyHostProfileIsCreated` | Automatische Erstellung eines Host-Profils bei Host-Registrierung | Leeres Host-Profil ist vorhanden | Normalfall |
| `whenDuplicateEmail_thenThrowException` | Speicherung mit einer doppelt vergebenen E-Mail | IllegalArgumentException | Edge Case |
| `whenLoginEmailHasDifferentCase_thenFindByEmailStillReturnsUser` | User-Suche ist case-insensitive | User wird unabhängig von Groß-/Kleinschreibung gefunden | Edge Case |
| `whenDuplicateEmailWithDifferentCase_thenCreateUserThrowsException` | Registrierung mit existierender E-Mail in anderer Schreibweise | IllegalArgumentException | Edge Case |
| `whenUserNotFound_thenGetUserByIdThrowsException` | User-Suche nach ungültiger ID | NotFoundException | Edge Case |
| `whenEmailNotFound_thenFindByEmailThrowsException` | User-Suche nach ungültiger E-Mail | NotFoundException | Edge Case |
| `whenEmailExists_thenExistsByEmailReturnsTrue` | Existenzprüfung für vorhandene Mail | true | Normalfall |
| `whenEmailNotExists_thenExistsByEmailReturnsFalse` | Existenzprüfung für nicht vorhandene Mail | false | Normalfall |
| `whenOwnerUpdatesUser_thenUserIsSaved` | User ändert seine eigenen Daten | Aktualisierter User gespeichert | Normalfall |
| `whenWrongEmailUpdatesUser_thenThrowsException` | Versuch, einen fremden User zu ändern | ForbiddenException | Edge Case |
| `whenNullFieldsPatched_thenFieldsRemainUnchanged` | Patch-Anfrage, die nur Null-Werte enthält | Bisherige Werte bleiben unverändert erhalten | Edge Case |
| `whenNonNullFieldsPatched_thenFieldsAreUpdated` | Patch-Anfrage mit neuen Werten | Betroffene Felder werden aktualisiert | Normalfall |
| `whenWrongEmailPatches_thenThrowsException` | Fremder User sendet Patch-Anfrage | ForbiddenException | Edge Case |
| `whenOwnerPatchesPassword_thenPasswordHashIsUpdated` | Passwort wird per Patch-Endpunkt aktualisiert | Neuer Passwort-Hash wird gespeichert | Normalfall |
| `whenNonAdminPatchesRoleToAdmin_thenThrowsForbidden` | Normaler User versucht seine eigene Rolle auf Admin zu ändern | ForbiddenException | Edge Case |
| `whenRegisteringWithAdminRole_thenThrowException` | Bei Neuregistrierung wird direkt Admin-Rolle übergeben | Exception wird geworfen | Edge Case |
| `whenOwnerDeletes_thenUserIsDeleted` | User löscht sich selbst (Recht auf Vergessenwerden) | User erfolgreich gelöscht | Normalfall |
| `whenWrongEmailDeletes_thenThrowsException` | User versucht anderen User zu löschen | ForbiddenException | Edge Case |
| `whenAdminUpdatesRole_thenRoleIsChanged` | Administrator ändert die Rolle eines Nutzers | Rolle erfolgreich geändert | Normalfall |
| `whenUserNotFoundForRoleUpdate_thenThrowsException` | Admin ändert Rolle für ungültige User-ID | NotFoundException | Edge Case |
| `whenOwnerUpdatesProfileImage_thenProfilePictureIsUpdated` | Eigenes Profilbild wird hochgeladen | Bild-URL wird im Nutzerprofil gespeichert | Normalfall |
| `whenWrongEmailUpdatesProfileImage_thenThrowsException` | User versucht Profilbild für Fremden hochzuladen | ForbiddenException | Edge Case |

### `UserIntegrationTest`
Integrationstests für User-Controller, Rollenregeln, Patch-Flows und Multipart-Image-Uploads.

| Test | Was wird getestet? | Erwartetes Ergebnis | Falltyp |
| --- | --- | --- | --- |
| `currentUserResponseContainsPublicFieldsOnly` | Abruf `/users/me` Endpoint | Enthält keine sensiblen Felder (wie passwordHash) | Normalfall |
| `deleteUserReturnsEnvelopeWithDeleteResponse` | User-Löschung über die API | HTTP 200, Standard Response-Envelope geliefert | Normalfall |
| `protectedEndpointWithoutTokenReturnsAuthRequiredEnvelope` | Geschützter API-Endpoint Aufruf ohne JWT | HTTP 401 Auth Required | Edge Case |
| `invalidMailExistsQueryReturnsValidationEnvelope` | Mail-Existenz Check mit syntaktisch ungültiger E-Mail | HTTP 400 Validation Error | Edge Case |
| `nonAdminCannotUpdateRoles` | Rolle über Controller durch Nicht-Admin ändern | HTTP 403 Forbidden | Edge Case |
| `missingUserReturnsNotFoundEnvelope` | User-Abruf für eine nicht vergebene ID | HTTP 404 | Edge Case |
| `userByIdEndpointIsPublicWithoutToken` | `/users/{id}` öffentlich (als Gast) aufrufen | HTTP 200, Basis-User-Profil ist öffentlich einsehbar | Normalfall |
| `usersRegisterEndpointIsPublicAndCreatesUser` | API-Aufruf Registrierung (öffentlich) | HTTP 200, User wird in Datenbank angelegt | Normalfall |
| `usersRegisterEndpointRejectsAdminRole` | Bei API-Registrierung Rolle ADMIN übergeben | Blockiert, Rolle wird nicht auf Admin gesetzt | Edge Case |
| `patchUserSupportsRegistrationFieldsAndPasswordUpdate` | User Patch Request für unterschiedliche Felder inkl. Passwort | Alle betroffenen Felder werden in der DB aktualisiert | Normalfall |
| `patchUserRoleToAdminIsForbiddenForNonAdmins` | Rolle durch Patch via API auf Admin ändern | HTTP 403 Forbidden | Edge Case |
| `profileImageUploadAcceptsImageFieldAndReturnsPublicPath` | Bild via Multipart/Form-Data hochladen | Public Pfad zur Datei wird in Response zurückgegeben | Normalfall |
| `registrationWithoutProfilePictureUsesDefaultPlaceholder` | Registrierung ohne Bildangabe | System setzt korrekten internen Placeholder | Normalfall |
| `profileImageCanBeUploadedReplacedAndDeleted` | Profilbild Lifecycle | Kann nacheinander hochgeladen, ersetzt und gelöscht werden | Normalfall |
| `profileImageUploadAcceptsValidWebp` | Image-Upload eines validen WebP-Bildes | Wird erfolgreich verarbeitet und akzeptiert | Normalfall |
| `profileImageUploadRejectsInvalidFiles` | Upload eines ungültigen Dateiformats (z. B. .txt) | HTTP 400 Validation Error | Edge Case |
| `profileImageUploadRejectsOversizedFilesWithPayloadTooLargeEnvelope` | Datei ist größer als erlaubtes Max-Limit | HTTP 413 Payload Too Large | Edge Case |
| `onlyOwnerCanUploadOrDeleteProfileImage` | Fremdes Profilbild modifizieren oder löschen | HTTP 403 Forbidden | Edge Case |

### `ChatIntegrationTest`
Prüft den kompletten Chat-Lifecycle, Nachrichtenhistorie, Attachments und Booking-Proposals.

| Test | Was wird getestet? | Erwartetes Ergebnis | Falltyp |
| --- | --- | --- | --- |
| `messagesAreReturnedChronologicallyAndOnlyParticipantsCanReadThem` | Abruf von Chat-Nachrichten | Chronologische Reihenfolge, unbeteiligte Dritte erhalten HTTP 403 | Normalfall |
| `imageAttachmentUploadReturnsFetchableUrlAndRejectsInvalidFiles` | Bild im Chat als Anhang hochladen | Bild-URL zurückgegeben, invalide Dateien werden abgelehnt | Normalfall |
| `attachmentUploadIsRestrictedToChatParticipants` | Attachment-Upload durch Unbeteiligten | HTTP 403 | Edge Case |
| `bookingProposalFromPetOwnerCanBeAcceptedByHostAndAppearsInChat` | Pet Owner sendet Proposal an Host | Host akzeptiert, taucht als spezielle Card-Nachricht auf | Normalfall |
| `acceptedBookingCanBeCompletedAndMovesFromActiveToHistory` | Buchung über Chat erfolgreich abschließen | Booking wandert vom Status "Active" in die "History" | Normalfall |
| `bookingProposalAllowsSingleDayAtOfferAvailabilityStart` | Proposal für genau einen Tag (Start = Ende) | Wird problemlos verarbeitet | Edge Case |
| `bookingProposalFromHostCanBeAcceptedOnlyByPetOwner` | Host schlägt umgekehrt dem Owner etwas vor | Pet Owner muss den Vorschlag akzeptieren | Edge Case |
| `newBookingProposalAutomaticallyDeclinesPreviousPendingProposal` | Neues Proposal im selben Chat | Das vorherige wartende Proposal wird automatisch auf 'declined' gesetzt | Normalfall |
| `manualDeclineSetsManualReasonAndInvalidProposalRequestsAreRejected` | Manuelles Ablehnen eines Proposals | Ablehnungsgrund ist in der DB gespeichert | Normalfall |
| `withdrawingProposalUpdatesExistingProposalCardWithoutCreatingExtraChatMessage` | Eigenes Proposal zurückziehen | Chat-Nachricht (Card) wird aktualisiert, um Spam zu vermeiden | Normalfall |
| `bookingProposalRequiresPetCountAtLeastPetSpeciesCount` | Validierung: Pet Count vs. Species Count | Konsistenz zwischen Tieren und Gattungen wird gewahrt | Edge Case |
| `acceptingOverlappingAcceptedBookingReturnsConflict` | Host akzeptiert Buchung, die sich mit bestätigter Buchung überschneidet | HTTP 409 Conflict | Edge Case |
| `bookingProposalsCannotBeCreatedOrAcceptedAfterOfferIsWithdrawn` | Proposal für ein vom Host zurückgezogenes Offer | System blockiert die Anfrage | Edge Case |
| `participantsCanCloseChatAndClosedChatBlocksFurtherMutations` | Chat durch Beteiligten schließen | Chat wird komplett schreibgeschützt (read-only) | Normalfall |
| `acceptedProposalClosesChatAndParticipantsCanReopenIt` | Proposal-Akzeptanz schließt Chat -> wird wieder geöffnet | Erfolgreich wieder zum Schreiben freigegeben | Normalfall |
| `expiredClosedChatIsDeletedByCleanup` | Alter Chat (Retention Period) wird vom System-Cleanup erfasst | Chat inklusive Historie wird aus der Datenbank gelöscht | Normalfall |
| `reopenedThenClosedAgainChatUsesFreshDeleteWindow` | Chat wird geschlossen, geöffnet und neu geschlossen | Frist für automatisches Cleanup startet von vorn | Edge Case |
| `closingChatIsRestrictedToParticipants` | Unbeteiligter Nutzer versucht Chat zu schließen | HTTP 403 Forbidden | Edge Case |

### `MarketplaceIntegrationTest`
Testet den öffentlichen Marketplace, Host-Listings und Filter-Logiken.

| Test | Was wird getestet? | Erwartetes Ergebnis | Falltyp |
| --- | --- | --- | --- |
| `getHostsReturnsHostOverviewEnvelope` | Host-Übersicht abrufen | Liste von Hosts wird zurückgegeben | Normalfall |
| `searchHostsBySpeciesAndPostalCodeReturnsMatchingHostsOnly` | Host Suche nach Kriterien (Tierart & PLZ) | Nur genau passende Hosts werden zurückgegeben | Normalfall |
| `filtersReturnAvailableMarketplaceOptionsDynamically` | Filter-Optionen für UI abrufen | Backend liefert Liste verfügbarer dynamischer Filter-Werte | Normalfall |
| `getOffersIsAccessibleWithoutAuthentication` | Offer-Liste öffentlich aufrufen | HTTP 200 ohne benötigten Token | Normalfall |
| `searchOffersIsAccessibleWithoutAuthentication` | Offer-Suche öffentlich aufrufen | HTTP 200 ohne benötigten Token | Normalfall |
| `latestOffersReturnsNewestTenByDefaultAndSortedDescendingById` | "Neueste Offers" abrufen (Startseite) | Liefert exakt die 10 neuesten Offers, absteigend sortiert | Normalfall |
| `latestOffersCanExcludeHostIdAndStillReturnRequestedLimit` | Abruf der "Neuesten Offers", aber exklusive eigener Offers (Host) | Füllt das Limit von 10 mit fremden Offers auf | Edge Case |
| `searchOffersSplitsMatchingAndAlternativeDatesByFilters` | Offers Suche nach bestimmten Daten/Tierarten | API liefert zwei sortierte Listen (exakte Treffer & sinnvolle Alternativen) | Edge Case |

### `OfferIntegrationTest`
Lifecycle der Service-Pakete (Offers), Rollen-Upgrades.

| Test | Was wird getestet? | Erwartetes Ergebnis | Falltyp |
| --- | --- | --- | --- |
| `offerCanMoveBetweenDraftAndPublishedAndMarketplaceShowsOnlyPublishedOffers` | Offer Lifecycle (Draft -> Published -> Withdrawn) | Nur Angebote im "Published"-Status tauchen im Marktplatz auf | Normalfall |
| `hostCanUpdateDraftOfferButNotPublishedOffer` | Host versucht ein bereits veröffentlichtes Angebot zu verändern | Wird verhindert/Fehlermeldung | Edge Case |
| `hostCannotCreateOfferWithPastAvailabilityDates` | Angebot in der Vergangenheit erstellen | Request wird blockiert | Edge Case |
| `hostCannotUpdateDraftOfferWithPastAvailabilityDates` | Angebot mit vergangenen Daten updaten | Request wird blockiert | Edge Case |
| `petOwnerCanCreateOfferAndIsPromotedToHost` | Pet Owner Rolle erstellt sein erstes Angebot | System stuft den User automatisch in die Rolle 'HOST' hoch | Normalfall |
| `profileOffersEndpointShowsOnlyPublishedOffers` | Offers auf dem öffentlichen Profil abrufen | Entwürfe (Drafts) bleiben verborgen | Normalfall |
| `offerImageCanBeUploadedReplacedAndPersisted` | Vorschaubild für Angebot hochladen und ändern | Bild wird korrekt abgespeichert und aktualisiert | Normalfall |

### `ChatRealtimeServiceTest`
Prüft die asynchrone WebSocket/Event-Logik für Live-Chats.

| Test | Was wird getestet? | Erwartetes Ergebnis | Falltyp |
| --- | --- | --- | --- |
| `publishesMessageCreatedToChatTopicAndParticipantQueues` | Senden einer neuen Nachricht | Event wird auf dem WebSocket Topic und den User-Queues publiziert | Normalfall |
| `publishesAttachmentAddedWithUpdatedMessagePayload` | Neues Attachment im Chat | Event mit angehängter URL/Payload wird publiziert | Normalfall |
| `publishesBookingEventWithProvidedType` | Status-Update eines Proposals (z.B. Akzeptiert) | Spezial-Event zur Live-Kartenaktualisierung wird publiziert | Normalfall |
| `publishesChatClosedEventWithProvidedPayload` | Chat wird geschlossen | Event sperrt das UI für andere Teilnehmer in Echtzeit | Normalfall |
| `publishesChatReopenedEventWithProvidedPayload` | Chat wird wiedereröffnet | Event entsperrt das UI für andere Teilnehmer | Normalfall |
| `publishesChatDeletedListEvent` | Chat wird endgültig vom Server gelöscht | Lösch-Event verschwindet Chat aus der Liste der Teilnehmer | Normalfall |

### `HostIntegrationTest`
| Test | Was wird getestet? | Erwartetes Ergebnis | Falltyp |
| --- | --- | --- | --- |
| `hostRegistrationCreatesEmptyHostProfileImmediately` | Host registriert sich initial | Leeres Host-Profil ist sofort in der DB verknüpft | Normalfall |
| `hostProfileCanBeCreatedReadAndExtendedWithGalleryImage` | Host-Profil Lifecycle inkl. Galeriebilder | Erfolgreich angelegt und auslesbar | Normalfall |
| `hostStatsReturnAveragesCalculatedFromReviews` | Host-Bewertungs-Statistiken abrufen | Mathematischer Durchschnitt wird korrekt aus Reviews errechnet | Normalfall |
| `petOwnerCannotCreateHostProfile` | Pet Owner versucht aktiv ein Host-Profil ohne Offer anzulegen | HTTP 403 Forbidden | Edge Case |

### `AvailabilityIntegrationTest`
| Test | Was wird getestet? | Erwartetes Ergebnis | Falltyp |
| --- | --- | --- | --- |
| `hostCanManageSingleAndRecurringAvailabilityWithOverlapValidation` | Verfügbarkeit eintragen (inkl. potenzieller Kalender-Überschneidung) | Erfolgreich gespeichert / Überschneidungen werden validiert & blockiert | Normalfall |
| `petOwnerCannotCreateAvailability` | Pet Owner versucht Verfügbarkeit im Kalender anzulegen | HTTP 403 Forbidden | Edge Case |
| `bookingProposalOutsideHostCalendarReturnsFeedback` | Buchungsanfrage außerhalb der Host-Verfügbarkeit | Anfrage abgelehnt oder liefert Feedback an den User | Edge Case |
| `bookingProposalHonorsRecurringAvailability` | Anfrage für ein wiederkehrendes Verfügbarkeits-Fenster | Buchung wird korrekt für diesen Slot akzeptiert | Normalfall |

### Weitere Controller / Services (Pet, Request, JWT, Authorization)
*(Eine Auswahl der wichtigsten Tests)*

| Testbereich | Test | Was wird getestet? | Erwartetes Ergebnis | Falltyp |
| --- | --- | --- | --- | --- |
| **Pet API** | `petProfileCanBeCreatedReadAndUpdated` | Lifecycle eines Haustiers | Profil wird gespeichert, ausgelesen und überschrieben | Normalfall |
| **Pet API** | `imageMustBeUniqueAcrossPets` | Gleiches Bild für zwei unterschiedliche Pets hochladen | HTTP 400 (Wird zwecks Redundanz geblockt) | Edge Case |
| **Pet API** | `petResponseIncludesFallbackImagePath` | Pet hat kein eigenes Bild | System liefert korrektes Gattungs-Fallback-Bild | Normalfall |
| **Request Service** | `whenValidData_thenRequestIsCreatedWithStatusOpen` | Erstellung einer Betreuungs-Anfrage | Anfrage erhält korrekt initialen Status 'OPEN' | Normalfall |
| **Request Service** | `whenEndDateBeforeStartDate_thenThrowException` | Anfrage mit unmöglichem Zeitraum (Ende < Start) | Exception | Edge Case |
| **JWT Service** | `whenValidCredentials_thenTokenIsGenerated` | Token-Erzeugung nach korrektem Login | Signierter JWT-Token generiert | Normalfall |
| **Chat Auth** | `allowsHostAndRequesterCaseInsensitively` | Chat Zugriff für Teilnehmer (mit Groß-/Kleinschreibung Mail) | Erlaubt | Normalfall |

---

## 4. Detaillierte Frontend-Tests

Das Frontend wird intensiv mit **End-to-End (E2E) Tests** via Playwright geprüft, die echte Benutzerklicks in einem "headless" Chromium-Browser ausführen. Zudem existieren Unit-Tests für kritische Daten-Transformationen.

### E2E Tests (Playwright)

| Testdatei | Test | Was wird getestet? | Erwartetes Ergebnis | Falltyp |
| --- | --- | --- | --- | --- |
| `auth-flows.e2e.spec.js` | `completes full registration flow and redirects from /register to home` | Kompletter Formular-Flow zur Neuregistrierung | Nutzer wird erfolgreich registriert und auf Startseite navigiert | Normalfall |
| `auth-flows.e2e.spec.js` | `completes full modal login flow with mail check and hides login button when authenticated` | Popup-Login-Flow inklusive Hintergrund-Mail-Prüfung | Login klappt, Auth-Button in Navigationsleiste verschwindet | Normalfall |
| `auth-locale.e2e.spec.js` | `should open login modal in English and switch back to German` | Sprachumschaltung im Login-Fenster (EN -> DE) | Texte ändern sich korrekt (i18n funktioniert) | Normalfall |
| `auth-locale.e2e.spec.js` | `should open the login modal when clicking a legacy /login link` | Klick auf einen alten, eigentlich ungültigen `/login` URL-Link | Frontend wirft keinen 404, sondern öffnet gnädigerweise das Login-Modal | Edge Case |
| `header-dropdown-exclusive.e2e.spec.js` | `should keep only one corporate header dropdown open at a time` | Menü-Interaktion: Gleichzeitiges Öffnen mehrerer Dropdowns | Älteres Dropdown schließt sich, UI bleibt "sauber" | Normalfall |
| `home-offers-carousel.e2e.spec.js` | `excludes own published offers when logged in and supports species filter plus center modal` | Carousel "Neueste Angebote" auf Startseite für eingeloggte User | Zeigt keine Angebote des Users selbst, Filter funktioniert | Normalfall |
| `home-offers-carousel.e2e.spec.js` | `shows all published offers when user is not logged in` | Carousel "Neueste Angebote" für unregistrierte Gäste | Alle Inserate sichtbar | Normalfall |
| `home-search-results.e2e.spec.js` | `redirects to /search/{parameter} and renders matching plus alternative carousels` | Suchleisten-Flow auf Startseite | Weiterleitung zur Suchseite mit genauen Ergebnissen & Alternativen | Normalfall |
| `my-offers-card-background.e2e.spec.js` | `uses gray fallback without image and a darkened image background when available` | Optische Darstellung der Angebots-Karten im Dashboard | Karte nutzt korrekte Farb-Styles je nach Bild-Präsenz | Normalfall |
| `my-offers-create-flow.e2e.spec.js` | `uses setup step for title, period and optional image before the offer details step` | Multi-Step-Formular zur Angebots-Erstellung | Navigation zum 2. Schritt funktioniert fehlerfrei | Normalfall |
| `my-offers-create-flow.e2e.spec.js` | `keeps notifications above the create modal when create request fails` | UI-Fehlerbehandlung bei fehlgeschlagener Erstellung (Z-Index Test) | Error-Banner legt sich **über** das Modal, nicht darunter | Edge Case |
| `repository-git.e2e.spec.js` | `should render git activity and timeline interactions from live data` | Repository UI: Timeline der Entwickler | Chronologische Github-Events laden Live | Normalfall |
| `repository-git.e2e.spec.js` | `should render distinct heights for top activity bars` | Repository UI: Balkendiagramm der Commits | Balken weisen unterschiedliche, korrekte CSS-Höhen auf | Normalfall |
| `repository-kanban.e2e.spec.js` | `should keep exactly one active board column and render matching cards` | Repository UI: Kanban-Board für Projekt-Management | Nur angeklickte Kanban-Spalte klappt aus | Normalfall |
| `repository-loading.e2e.spec.js` | `should keep git and kanban content pending until live data resolves` | Wartezustand der Graphen (Asynchrone Ladezeit) | Optischer Spinner rotiert, bis Backend antwortet | Normalfall |
| `repository-playwright.e2e.spec.js` | `should render a minimal start state, run tests, and show completion notification` | Interne Tooling UI | Testergebnisse werden als Notification zurückgespielt | Normalfall |
| `segmented-indicator-alignment.e2e.spec.js` | `keeps segmented indicator width and position correct after overflow scrolling and resize` | Responsive Design des Segment-Reiters | Unterstrichener Balken verrutscht beim Resize/Scroll nicht | Edge Case |
| `shell-home.e2e.spec.js` | `should render the global start page without repository graph content` | Initiale Startseite ohne gewählte Repository-Widgets | Weißer Frame lädt flüssig ohne Konsole-Errors | Normalfall |

### Unit- und Daten-Tests (Node)

| Testdatei | Test | Was wird getestet? | Erwartetes Ergebnis | Falltyp |
| --- | --- | --- | --- | --- |
| `repository-graph-data.test.mjs` | `parseCommitImport keeps only parent links that exist in payload` | Parsing des Git-Graphen mit fehlenden Parent-Nodes | "Geister-Links" werden sicher entfernt | Edge Case |
| `repository-graph-data.test.mjs` | `parseBranchCommits does not map by author display name` | Zuweisung von Commits zu Autoren | E-Mail-Identifikation statt Display-Name, verhindert Verwechslungen | Edge Case |
| `repository-graph-data.test.mjs` | `parseAuthorContributionStats counts commits and changed lines per author` | Aggregation von Zeilen-Ergänzungen/Löschungen | Rechnet mathematisch exakt | Normalfall |
| `repository-graph-data.test.mjs` | `parseAuthorContributionStats ignores malformed and binary numstat entries` | Parsing kaputter oder binärer Git-Stats | System stürzt nicht ab, Einträge werden übersprungen | Edge Case |
| `repository-graph-data.test.mjs` | `createActivitySeries applies tie-breaking for duplicate max counts` | Graphen-Darstellung bei gleichem Max-Commit-Count | Tie-Breaker greift, Balken werden korrekt skaliert | Edge Case |
| `repository-graph-data.test.mjs` | `parseOpenApiYamlSnapshot extracts dynamic operations and tags` | Automatisches Parsing des Swagger/OpenAPI Yaml | Liefert Endpunkt-Pfade und Methoden | Normalfall |
| `repository-live.test.mjs` | `repository pages do not embed static snapshot payloads` | Test auf Produktions-Reife der HTML-Templates | Keine großen JSON-Payloads hart kodiert ins HTML | Edge Case |
| `repository-live.test.mjs` | `fresh repository snapshots rebuild and replace the in-memory cache` | In-Memory Cache des Frontends | Neuladen triggert Update, Cache wird invalide | Normalfall |
| `search-data.test.mjs` | `loadPetChoices reads and normalizes values from backend enum when backend is available` | Tiere aus Java Enum laden | Übersetzt "DOG" sauber in Frontend-Nutzerformat | Normalfall |
| `search-data.test.mjs` | `loadPetChoices falls back to frontend assets data when backend source is unavailable` | Verhalten des UI bei Serverausfall (Graceful Degradation) | UI nutzt statisches lokales Backup-JSON für Filter | Edge Case |
