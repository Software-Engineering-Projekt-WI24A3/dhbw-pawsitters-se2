# Testdokumentation

Diese Datei dokumentiert alle aktuell vorhandenen automatisierten Tests im Backend und Frontend. Jeder Test ist in einer Tabelle aufgeführt mit Name, Input, erwartetem Output und Einordnung als Normalfall oder Edge Case.

Hinweis: `JWTServiceTest.java` liegt aktuell unter `backend/src/main/java/com/pawsitters/security`, ist aber inhaltlich eine Backend-Testklasse.

## Gesamtübersicht

| Bereich | Anzahl Tests |
| --- | ---: |
| Backend | 124 |
| Frontend | 34 |
| **Gesamt** | **158** |

## Übersicht Backend

| Bereich | Testklasse | Anzahl Tests |
| --- | --- | ---: |
| Authentifizierung und Security | `AuthIntegrationTest` | 29 |
| JWT-Service | `JWTServiceTest` | 4 |
| User-Service | `UserServiceTest` | 23 |
| Pet-Service | `PetServiceTest` | 2 |
| Request-Service | `RequestServiceTest` | 3 |
| Chat-Autorisierung | `ChatAuthorizationServiceTest` | 2 |
| Chat-Realtime | `ChatRealtimeServiceTest` | 3 |
| Availability-Controller | `AvailabilityIntegrationTest` | 4 |
| Chat-Controller | `ChatIntegrationTest` | 12 |
| Host-Controller | `HostIntegrationTest` | 4 |
| Marketplace-Controller | `MarketplaceIntegrationTest` | 8 |
| Offer-Controller | `OfferIntegrationTest` | 7 |
| Pet-Controller | `PetIntegrationTest` | 3 |
| Review-Controller | `ReviewIntegrationTest` | 2 |
| User-Controller | `UserIntegrationTest` | 18 |
| **Gesamt Backend** |  | **124** |

## Übersicht Frontend

| Bereich | Testdatei | Anzahl Tests |
| --- | --- | ---: |
| Authentifizierung (E2E) | `auth-flows.e2e.spec.js` | 2 |
| Lokalisierung (E2E) | `auth-locale.e2e.spec.js` | 3 |
| Header-Dropdowns (E2E) | `header-dropdown-exclusive.e2e.spec.js` | 1 |
| Home-Angebote (E2E) | `home-offers-carousel.e2e.spec.js` | 2 |
| Home-Suche (E2E) | `home-search-results.e2e.spec.js` | 1 |
| Eigene Angebote: Karten (E2E) | `my-offers-card-background.e2e.spec.js` | 1 |
| Eigene Angebote: Erstellung (E2E) | `my-offers-create-flow.e2e.spec.js` | 2 |
| Repository Git (E2E) | `repository-git.e2e.spec.js` | 3 |
| Repository Kanban (E2E) | `repository-kanban.e2e.spec.js` | 1 |
| Repository Loading (E2E) | `repository-loading.e2e.spec.js` | 2 |
| Repository Playwright (E2E) | `repository-playwright.e2e.spec.js` | 2 |
| Segmentierte Navigation (E2E) | `segmented-indicator-alignment.e2e.spec.js` | 1 |
| Startseite (E2E) | `shell-home.e2e.spec.js` | 1 |
| Graph Data Parsing (Unit) | `repository-graph-data.test.mjs` | 7 |
| Repository Snapshot (Unit) | `repository-live.test.mjs` | 3 |
| Suchdaten & Enums (Unit) | `search-data.test.mjs` | 2 |
| **Gesamt Frontend** |  | **34** |

Hinweis: Die versionierten Dateien mit dem Muster `*.spec 2.js` enthalten zwar `test(...)`-Blöcke, werden aber mit der aktuellen Playwright-Konfiguration nicht vom Standard-Testlauf erfasst. Sie sind deshalb nicht in der Summe der aktiven automatisierten Tests enthalten.

## Backend-Tests

### `AuthIntegrationTest`

Integrationstests für Authentifizierung, Session-Handling, Passwortvalidierung, Rate Limiting, Cookie-Sicherheit, CORS und öffentliche Health-/Mail-Endpunkte.

| Name | Input | Erwarteter Output | Edge Case / Normalfall |
| --- | --- | --- | --- |
| `sessionWithoutTokenReturnsLoggedInFalse` | `GET /api/auth/session` ohne Token. | HTTP 200, `success=true`, `loggedIn=false`, `email=null`. | Edge Case |
| `sessionWithInvalidTokenReturnsLoggedInFalse` | `GET /api/auth/session` mit manipuliertem JWT. | HTTP 200, `success=true`, `loggedIn=false`, `email=null`. | Edge Case |
| `loginWithUppercaseEmailSucceedsAfterRegister` | Registrierung mit E-Mail, danach Login mit derselben E-Mail in Großbuchstaben. | HTTP 200, Token vorhanden, Rolle `PET_OWNER`, `passwordChangeRequired=false`. | Edge Case |
| `loginUsesUnicodeNormalizedPassword` | Registrierung und Login mit Unicode-äquivalenten Passwortvarianten. | HTTP 200, Login erfolgreich, Token vorhanden. | Edge Case |
| `registerDuplicateEmailDifferentCaseReturnsBadRequest` | Zwei Registrierungen mit gleicher E-Mail in unterschiedlicher Groß-/Kleinschreibung. | Zweite Registrierung liefert HTTP 400, `success=false`, Fehlercode `BAD_REQUEST`. | Edge Case |
| `loginWithWrongPasswordReturnsInvalidCredentialsEnvelope` | Login mit existierender E-Mail und falschem Passwort. | HTTP 401, `success=false`, `data=null`, Fehlercode `AUTH_INVALID_CREDENTIALS`. | Edge Case |
| `repeatedFailedLoginAttemptsAreRateLimited` | Mehrere fehlgeschlagene Login-Versuche hintereinander. | Erste 5 Versuche HTTP 401, danach HTTP 429 mit Fehlercode `TOO_MANY_REQUESTS`. | Edge Case |
| `malformedJsonReturnsMalformedRequestEnvelope` | Login-Request mit syntaktisch ungültigem JSON. | HTTP 400, Fehlercode `MALFORMED_REQUEST`, Detailfeld `request`. | Edge Case |
| `registerValidationFailureReturnsFieldDetails` | Registrierung mit ungültiger E-Mail und zu kurzem Passwort. | HTTP 400, Fehlercode `VALIDATION_FAILED`, Fehlerdetails vorhanden. | Edge Case |
| `registerWithTooShortPasswordReturnsPasswordValidationError` | Registrierung mit Passwort unter Mindestlänge. | HTTP 400, Fehlercode `VALIDATION_FAILED`, Feldfehler für `password`. | Edge Case |
| `registerWithNistStylePassphraseWithoutCharacterMixSucceeds` | Registrierung mit langer Passphrase ohne klassische Zeichenmischung. | HTTP 200, `success=true`, Token vorhanden. | Normalfall |
| `registerWithPasswordContainingEmailLocalPartReturnsPasswordValidationError` | Registrierung mit Passwort, das den lokalen E-Mail-Teil enthält. | HTTP 400, Fehlercode `VALIDATION_FAILED`, Feldfehler für `password`. | Edge Case |
| `registerWithPasswordLongerThanBcryptLimitReturnsPasswordValidationError` | Registrierung mit Passwort über dem Bcrypt-Limit. | HTTP 400, Fehlercode `VALIDATION_FAILED`, Feldfehler für `password`. | Edge Case |
| `registerWithProjectNamePasswordVariantReturnsPasswordValidationError` | Registrierung mit Passwort, das eine Variante von `Pawsitters` enthält. | HTTP 400, Fehlercode `VALIDATION_FAILED`, Feldfehler für `password`. | Edge Case |
| `registerWithPasswordContainingFirstNameReturnsPasswordValidationError` | Registrierung mit Passwort, das den Vornamen enthält. | HTTP 400, Fehlercode `VALIDATION_FAILED`, Feldfehler für `password`. | Edge Case |
| `registerWithSequentialPasswordReturnsPasswordValidationError` | Registrierung mit auffälliger Zeichen-/Zahlenfolge im Passwort. | HTTP 400, Fehlercode `VALIDATION_FAILED`, Feldfehler für `password`. | Edge Case |
| `registerWithLongRepetitionPasswordReturnsPasswordValidationError` | Registrierung mit langer Wiederholung gleicher Zeichen im Passwort. | HTTP 400, Fehlercode `VALIDATION_FAILED`, Feldfehler für `password`. | Edge Case |
| `mailExistsReturnsTrueForExistingEmailWithoutToken` | Öffentliche `mailExists`-Abfrage für vorhandene E-Mail in anderer Schreibweise. | HTTP 200, `success=true`, `data.exists=true`. | Normalfall |
| `mailExistsReturnsFalseForUnknownEmailWithoutToken` | Öffentliche `mailExists`-Abfrage für unbekannte E-Mail. | HTTP 200, `success=true`, `data.exists=false`. | Normalfall |
| `actuatorHealthIsPublicForDeploymentChecks` | `GET /actuator/health` ohne Authentifizierung. | HTTP 200, Health-Status `UP`. | Normalfall |
| `sessionWithValidJwtReturnsLoggedInTrue` | `GET /api/auth/session` mit gültigem JWT im Authorization-Header. | HTTP 200, `loggedIn=true`, E-Mail entspricht registriertem User. | Normalfall |
| `sessionWithValidJwtCookieReturnsLoggedInTrue` | `GET /api/auth/session` mit gültigem JWT aus Auth-Cookie. | HTTP 200, `loggedIn=true`, E-Mail entspricht registriertem User. | Normalfall |
| `sessionAfterRegisterUsesAuthCookie` | Registrierung, danach Session-Abfrage mit gesetztem Auth-Cookie. | Registrierung HTTP 200, danach `loggedIn=true` mit registrierter E-Mail. | Normalfall |
| `sessionAfterLoginUsesAuthCookie` | Login, danach Session-Abfrage mit gesetztem Auth-Cookie. | Login HTTP 200, danach `loggedIn=true` mit registrierter E-Mail. | Normalfall |
| `loginSetsSecureCookieWhenForwardedProtoIsHttps` | Login mit Header `X-Forwarded-Proto: https`. | Auth-Cookie wird mit `Secure`-Attribut gesetzt. | Normalfall |
| `loginSetsSecureCookieWhenStandardForwardedProtoIsHttps` | Login mit standardisiertem `Forwarded`-Header für HTTPS. | Auth-Cookie wird mit `Secure`-Attribut gesetzt. | Normalfall |
| `corsPreflightForSessionAllowsConfiguredLocalOrigin` | CORS-Preflight auf Session-Endpunkt mit konfiguriertem lokalen Origin. | Preflight wird erlaubt und liefert passende CORS-Header. | Normalfall |
| `sessionWithRawAuthorizationTokenReturnsLoggedInTrue` | Session-Abfrage mit rohem Token ohne `Bearer`-Präfix. | HTTP 200, `loggedIn=true`, E-Mail entspricht registriertem User. | Edge Case |
| `logoutInvalidatesTokenForSessionCheck` | Logout mit gültigem Token, danach Session-Abfrage mit demselben Token. | Logout HTTP 200, danach `loggedIn=false`, `email=null`. | Normalfall |

### `JWTServiceTest`

Unit-Tests für JWT-Erzeugung, Claim-Auslesung und Tokenvalidierung.

| Name | Input | Erwarteter Output | Edge Case / Normalfall |
| --- | --- | --- | --- |
| `whenValidCredentials_thenTokenIsGenerated` | E-Mail `max@test.de` und Rolle `PET_OWNER`. | Token ist nicht `null` und nicht leer. | Normalfall |
| `whenValidToken_thenEmailAndRoleAreExtractedCorrectly` | Gültiger Token mit E-Mail und Rolle. | Extrahierte E-Mail ist `max@test.de`, Rolle ist `PET_OWNER`. | Normalfall |
| `whenInvalidToken_thenIsTokenValidReturnsFalse` | Manipulierter oder ungültiger JWT-String. | `isTokenValid` gibt `false` zurück. | Edge Case |
| `whenExpiredToken_thenIsTokenValidReturnsFalse` | Sofort abgelaufener Token. | `isTokenValid` gibt `false` zurück. | Edge Case |

### `UserServiceTest`

Unit-Tests für User-Erstellung, Host-Profilanlage, Suche, Aktualisierung, Löschung, Rollenwechsel, Passwort- und Profilbild-Updates.

| Name | Input | Erwarteter Output | Edge Case / Normalfall |
| --- | --- | --- | --- |
| `whenValidUser_thenUserIsSavedSuccessfully` | Gültiger User mit E-Mail, Passwort und Rolle. | User wird gespeichert, E-Mail/Rolle bleiben erhalten, Passwort wird gehasht. | Normalfall |
| `whenValidHost_thenEmptyHostProfileIsCreated` | Gültiger User mit Rolle `HOST`. | User wird gespeichert und ein leeres Host-Profil wird angelegt. | Normalfall |
| `whenDuplicateEmail_thenThrowException` | Erstellung eines Users mit bereits vorhandener E-Mail. | `IllegalArgumentException`, Repository-`save` wird nicht aufgerufen. | Edge Case |
| `whenLoginEmailHasDifferentCase_thenFindByEmailStillReturnsUser` | E-Mail-Suche mit anderer Groß-/Kleinschreibung. | User wird case-insensitive gefunden. | Edge Case |
| `whenDuplicateEmailWithDifferentCase_thenCreateUserThrowsException` | Duplikat-E-Mail mit anderer Groß-/Kleinschreibung. | `IllegalArgumentException`, User wird nicht gespeichert. | Edge Case |
| `whenUserNotFound_thenGetUserByIdThrowsException` | Abruf einer nicht existierenden User-ID. | `NotFoundException`. | Edge Case |
| `whenEmailNotFound_thenFindByEmailThrowsException` | Abruf einer nicht existierenden E-Mail. | `NotFoundException`. | Edge Case |
| `whenEmailExists_thenExistsByEmailReturnsTrue` | Existenzprüfung für vorhandene E-Mail. | Ergebnis ist `true`. | Normalfall |
| `whenEmailNotExists_thenExistsByEmailReturnsFalse` | Existenzprüfung für unbekannte E-Mail. | Ergebnis ist `false`. | Normalfall |
| `whenOwnerUpdatesUser_thenUserIsSaved` | Eigentümer aktualisiert vollständiges User-Profil. | Neue Felder werden gesetzt und User wird gespeichert. | Normalfall |
| `whenWrongEmailUpdatesUser_thenThrowsException` | Fremder User versucht ein Profil zu aktualisieren. | `ForbiddenException`, User wird nicht gespeichert. | Edge Case |
| `whenNullFieldsPatched_thenFieldsRemainUnchanged` | Patch-Update mit ausschließlich `null`-Feldern. | Bestehende Werte bleiben unverändert. | Edge Case |
| `whenNonNullFieldsPatched_thenFieldsAreUpdated` | Patch-Update mit nicht-null Feldern. | Übergebene Felder werden aktualisiert. | Normalfall |
| `whenWrongEmailPatches_thenThrowsException` | Fremder User versucht ein Profil per Patch zu ändern. | `ForbiddenException`, User wird nicht gespeichert. | Edge Case |
| `whenOwnerPatchesPassword_thenPasswordHashIsUpdated` | Eigentümer patcht ein neues Passwort. | Passwort-Hash ändert sich und User wird gespeichert. | Normalfall |
| `whenNonAdminPatchesRoleToAdmin_thenThrowsForbidden` | Nicht-Admin versucht per Patch Rolle `ADMIN` zu setzen. | `ForbiddenException`, Rolle wird nicht geändert. | Edge Case |
| `whenRegisteringWithAdminRole_thenThrowException` | Registrierung mit Rolle `ADMIN`. | `IllegalArgumentException`, User wird nicht gespeichert. | Edge Case |
| `whenOwnerDeletes_thenUserIsDeleted` | Eigentümer löscht eigenes User-Profil. | `deleteById` wird mit der User-ID aufgerufen. | Normalfall |
| `whenWrongEmailDeletes_thenThrowsException` | Fremder User versucht ein Profil zu löschen. | `ForbiddenException`, `deleteById` wird nicht aufgerufen. | Edge Case |
| `whenAdminUpdatesRole_thenRoleIsChanged` | Admin aktualisiert Rolle eines Users. | Rolle wird auf `HOST` gesetzt und User wird gespeichert. | Normalfall |
| `whenUserNotFoundForRoleUpdate_thenThrowsException` | Rollenwechsel für nicht existierenden User. | `NotFoundException`. | Edge Case |
| `whenOwnerUpdatesProfileImage_thenProfilePictureIsUpdated` | Eigentümer aktualisiert Profilbildpfad. | Profilbildpfad wird gesetzt und User wird gespeichert. | Normalfall |
| `whenWrongEmailUpdatesProfileImage_thenThrowsException` | Fremder User versucht das Profilbild zu ändern. | `ForbiddenException`, User wird nicht gespeichert. | Edge Case |

### `PetServiceTest`

Unit-Tests für das Anlegen von Haustieren.

| Name | Input | Erwarteter Output | Edge Case / Normalfall |
| --- | --- | --- | --- |
| `whenValidOwner_thenPetIsSavedSuccessfully` | Pet-Daten mit existierendem Owner. | Pet ist nicht `null`, Name ist gesetzt, Owner ist zugeordnet, Pet wird gespeichert. | Normalfall |
| `whenOwnerNotFound_thenThrowException` | Pet-Erstellung für nicht existierenden Owner. | `IllegalArgumentException`, Pet wird nicht gespeichert. | Edge Case |

### `RequestServiceTest`

Unit-Tests für das Erstellen von Betreuungsanfragen.

| Name | Input | Erwarteter Output | Edge Case / Normalfall |
| --- | --- | --- | --- |
| `whenValidData_thenRequestIsCreatedWithStatusOpen` | Existierender Owner, passendes Pet und gültiger Zeitraum. | Request wird erstellt, Status ist `OPEN`, Pet Owner ist gesetzt. | Normalfall |
| `whenEndDateBeforeStartDate_thenThrowException` | Anfrage mit Enddatum vor Startdatum. | `IllegalArgumentException`, Request wird nicht gespeichert. | Edge Case |
| `whenPetDoesNotBelongToOwner_thenThrowException` | Anfrage für ein Pet eines anderen Owners. | `IllegalArgumentException`, Request wird nicht gespeichert. | Edge Case |

### `ChatAuthorizationServiceTest`

Unit-Tests für Teilnehmerprüfung bei Chats.

| Name | Input | Erwarteter Output | Edge Case / Normalfall |
| --- | --- | --- | --- |
| `allowsHostAndRequesterCaseInsensitively` | Chat `7`, Host-E-Mail in Großbuchstaben und Requester-E-Mail. | Beide Teilnehmer werden ohne Exception akzeptiert. | Normalfall |
| `rejectsStrangersAndMissingChats` | Fremde E-Mail für existierenden Chat sowie fehlender Chat `99`. | Jeweils `AccessDeniedException`. | Edge Case |

### `ChatRealtimeServiceTest`

Unit-Tests für WebSocket-/Realtime-Publishing über `SimpMessagingTemplate`.

| Name | Input | Erwarteter Output | Edge Case / Normalfall |
| --- | --- | --- | --- |
| `publishesMessageCreatedToChatTopicAndParticipantQueues` | Neue Chatnachricht plus Chatlisten-Payload und zwei Teilnehmer-E-Mails. | Event `message.created` an `/topic/chats/{id}/messages`, `chat.updated` an beide User-Queues. | Normalfall |
| `publishesAttachmentAddedWithUpdatedMessagePayload` | Nachricht mit Attachment-Update und Chatdaten. | Event `message.attachment_added` wird an Chat-Topic gesendet. | Normalfall |
| `publishesBookingEventWithProvidedType` | Booking-Nachricht mit Eventtyp `booking.proposal_created`. | Genau dieser Eventtyp wird an das Chat-Topic gesendet. | Normalfall |

### `AvailabilityIntegrationTest`

Integrationstests für Host-Verfügbarkeit, wiederkehrende Termine und Kalenderprüfung bei Booking-Proposals.

| Name | Input | Erwarteter Output | Edge Case / Normalfall |
| --- | --- | --- | --- |
| `hostCanManageSingleAndRecurringAvailabilityWithOverlapValidation` | Host erstellt Einzeltermin, überlappenden Termin, wiederkehrende Wochenend-Verfügbarkeit, liest und löscht Eintrag. | Gültige Einträge HTTP 200, Überschneidungen HTTP 409 `CONFLICT`, Liste schrumpft nach Delete. | Normalfall + Edge Case |
| `petOwnerCannotCreateAvailability` | `PET_OWNER` sendet `POST /api/availability`. | HTTP 403, `success=false`, Fehlercode `FORBIDDEN`. | Edge Case |
| `bookingProposalOutsideHostCalendarReturnsFeedback` | Booking-Proposal über zwei Tage, obwohl Host nur einen Tag im Kalender frei hat. | Konflikt mit Hinweis auf fehlende Verfügbarkeit; eintägiges Proposal ist danach erfolgreich. | Edge Case |
| `bookingProposalHonorsRecurringAvailability` | Wiederkehrende Wochenend-Verfügbarkeit und Booking-Proposals für Montag bzw. Wochenende. | Montag wird abgelehnt, Wochenende erzeugt `PENDING` Proposal. | Edge Case |

### `ChatIntegrationTest`

Integrationstests für Chatnachrichten, Anhänge, Booking-Proposals, Annahme/Ablehnung und Booking-Historie.

| Name | Input | Erwarteter Output | Edge Case / Normalfall |
| --- | --- | --- | --- |
| `messagesAreReturnedChronologicallyAndOnlyParticipantsCanReadThem` | Chat mit mehreren Nachrichten, Abruf durch Teilnehmer und fremden User. | Teilnehmer sehen Nachrichten chronologisch, fremder User erhält Zugriff verweigert. | Normalfall + Edge Case |
| `imageAttachmentUploadReturnsFetchableUrlAndRejectsInvalidFiles` | Upload gültiger Bilddatei sowie ungültiger Datei in Chat. | Gültiger Upload liefert abrufbare URL, ungültige Datei wird abgelehnt. | Normalfall + Edge Case |
| `attachmentUploadIsRestrictedToChatParticipants` | Attachment-Upload durch Nicht-Teilnehmer. | Request wird mit Zugriffsschutz abgelehnt. | Edge Case |
| `bookingProposalFromPetOwnerCanBeAcceptedByHostAndAppearsInChat` | Pet Owner erstellt Booking-Proposal im Chat, Host akzeptiert. | Proposal erscheint im Chat und Status wird `ACCEPTED`. | Normalfall |
| `acceptedBookingCanBeCompletedAndMovesFromActiveToHistory` | Akzeptiertes Booking wird abgeschlossen. | Booking wechselt von aktiver Liste in Historie mit Status `COMPLETED`. | Normalfall |
| `bookingProposalAllowsSingleDayAtOfferAvailabilityStart` | Eintägiges Booking am ersten Verfügbarkeitstag des Offers. | Proposal wird akzeptiert bzw. als gültig behandelt. | Edge Case |
| `bookingProposalFromHostCanBeAcceptedOnlyByPetOwner` | Host sendet Proposal, Host und Pet Owner versuchen Annahme. | Nur Pet Owner darf akzeptieren; falsche Partei wird abgelehnt. | Edge Case |
| `newBookingProposalAutomaticallyDeclinesPreviousPendingProposal` | Neues Proposal wird gesendet, während ein altes noch `PENDING` ist. | Altes Proposal wird automatisch `DECLINED`, neues bleibt aktiv. | Edge Case |
| `manualDeclineSetsManualReasonAndInvalidProposalRequestsAreRejected` | Manuelle Ablehnung sowie ungültige Proposal-Requests. | Manuelle Ablehnung setzt Grund; ungültige Requests werden per Fehler-Envelope abgelehnt. | Edge Case |
| `bookingProposalRequiresPetCountAtLeastPetSpeciesCount` | Proposal mit weniger Tieren als angegebene Tierarten. | Request wird abgelehnt, weil `petCount` nicht zu `petSpecies` passt. | Edge Case |
| `acceptingOverlappingAcceptedBookingReturnsConflict` | Zwei sich überschneidende akzeptierte Bookings für denselben Zeitraum. | Zweite Annahme liefert Konflikt statt Doppelbuchung. | Edge Case |
| `bookingProposalsCannotBeCreatedOrAcceptedAfterOfferIsWithdrawn` | Offer wird zurückgezogen, danach Proposal-Erstellung oder Annahme. | Erstellung bzw. Annahme wird verweigert. | Edge Case |

### `HostIntegrationTest`

Integrationstests für Host-Registrierung, Host-Profil, Galerie und Statistikberechnung.

| Name | Input | Erwarteter Output | Edge Case / Normalfall |
| --- | --- | --- | --- |
| `hostRegistrationCreatesEmptyHostProfileImmediately` | Registrierung mit Rolle `HOST`, danach `GET /api/hosts/{id}`. | Leeres Host-Profil existiert sofort, Galerie leer, Review-Count `0`. | Normalfall |
| `hostProfileCanBeCreatedReadAndExtendedWithGalleryImage` | Host-Profilpayload mit Erfahrungen, Tierarten und anschließend Galerie-Bild. | Profil wird gespeichert, gelesen und Galerie enthält Uploadpfad unter `/uploads/hosts/{id}/gallery/`. | Normalfall |
| `hostStatsReturnAveragesCalculatedFromReviews` | Zwei gespeicherte Host-Reviews mit Ratingwerten. | Stats-Endpunkt liefert Review-Count `2` und korrekte Durchschnittswerte. | Normalfall |
| `petOwnerCannotCreateHostProfile` | `PET_OWNER` sendet `POST /api/hosts`. | HTTP 403, `success=false`. | Edge Case |

### `MarketplaceIntegrationTest`

Integrationstests für Marketplace-Hostlisten, Suchfilter, öffentliche Offer-Endpunkte und Sortierung der neuesten Angebote.

| Name | Input | Erwarteter Output | Edge Case / Normalfall |
| --- | --- | --- | --- |
| `getHostsReturnsHostOverviewEnvelope` | `GET /api/marketplace/hosts` mit Token. | HTTP 200, API-Envelope, mindestens drei Hosts, erwartete Felder, kein `passwordHash`. | Normalfall |
| `searchHostsBySpeciesAndPostalCodeReturnsMatchingHostsOnly` | Suche nach Tierart `DOG` und PLZ `68159`. | HTTP 200, zwei Treffer, alle mit PLZ `68159` und `DOG`. | Normalfall |
| `filtersReturnAvailableMarketplaceOptionsDynamically` | `GET /api/marketplace/filters`. | Optionen enthalten u. a. `DOG`, `CAT`, `68159` und `Mannheim`. | Normalfall |
| `getOffersIsAccessibleWithoutAuthentication` | `GET /api/marketplace/offers` ohne Token. | HTTP 200, `success=true`, Datenarray vorhanden. | Normalfall |
| `searchOffersIsAccessibleWithoutAuthentication` | `GET /api/marketplace/offers/search` ohne Token. | HTTP 200, `matchingOffers` und `alternativeDateOffers` als Arrays. | Normalfall |
| `latestOffersReturnsNewestTenByDefaultAndSortedDescendingById` | 12 neu veröffentlichte Offers, danach `GET /latest`. | Genau 10 neueste Offers, nach ID absteigend sortiert. | Normalfall |
| `latestOffersCanExcludeHostIdAndStillReturnRequestedLimit` | Latest-Request mit `limit=10` und `excludeHostId`. | 10 Offers ohne ausgeschlossenen Host, weiterhin absteigend sortiert. | Edge Case |
| `searchOffersSplitsMatchingAndAlternativeDatesByFilters` | Offer-Suche mit Tierart, Stadt, PLZ und Datumsbereich. | Passende Angebote im `matchingOffers`-Array, zeitlich abweichende im `alternativeDateOffers`-Array. | Normalfall |

### `OfferIntegrationTest`

Integrationstests für Offer-Lifecycle, Rollenwechsel, Validierung von Zeiträumen, öffentliche Profilangebote und Offer-Bilder.

| Name | Input | Erwarteter Output | Edge Case / Normalfall |
| --- | --- | --- | --- |
| `offerCanMoveBetweenDraftAndPublishedAndMarketplaceShowsOnlyPublishedOffers` | Host erstellt Offer, liest sie, publiziert sie, prüft Marketplace, zieht sie zurück. | Draft ist nicht im Marketplace, Published ist sichtbar, Withdraw setzt zurück auf `DRAFT`. | Normalfall |
| `hostCanUpdateDraftOfferButNotPublishedOffer` | Host aktualisiert Draft-Offer und versucht danach Update einer veröffentlichten Offer. | Draft-Update HTTP 200, Update nach Publish HTTP 400 `BAD_REQUEST`. | Normalfall + Edge Case |
| `hostCannotCreateOfferWithPastAvailabilityDates` | Offer-Erstellung mit `availableFrom` in der Vergangenheit. | HTTP 400, `success=false`, Fehlercode `BAD_REQUEST`. | Edge Case |
| `hostCannotUpdateDraftOfferWithPastAvailabilityDates` | Draft-Offer wird auf vergangenen Zeitraum gepatcht. | HTTP 400, `success=false`, Fehlercode `BAD_REQUEST`. | Edge Case |
| `petOwnerCanCreateOfferAndIsPromotedToHost` | `PET_OWNER` erstellt eine Offer. | Offer wird als `DRAFT` erstellt und User-Rolle wechselt zu `HOST`. | Normalfall |
| `profileOffersEndpointShowsOnlyPublishedOffers` | Profilangebote eines Hosts als Owner, anderer User und anonym vor/nach Publish. | Drafts bleiben unsichtbar, veröffentlichte Offers sind für andere und anonym sichtbar. | Normalfall + Edge Case |
| `offerImageCanBeUploadedReplacedAndPersisted` | Zwei Bilduploads für dieselbe Offer, danach Abruf über Detail- und Listenendpunkt. | Neuer Bildpfad wird gespeichert, alter Upload gelöscht, Pfad persistiert. | Normalfall |

### `PetIntegrationTest`

Integrationstests für Pet-Endpunkte, Pet-Antworten und Bild-Upload-Regeln.

| Name | Input | Erwarteter Output | Edge Case / Normalfall |
| --- | --- | --- | --- |
| `petProfileCanBeCreatedReadAndUpdated` | Pet wird erstellt, gelesen und aktualisiert. | Erstellung erfolgreich, Abruf zeigt erwartete Felder, Update ändert Rasse, Alter und Special Needs. | Normalfall |
| `imageMustBeUniqueAcrossPets` | Dieselbe Bilddatei wird für zwei Pets hochgeladen. | Erster Upload erfolgreich, zweiter mit gleichen Bytes HTTP 400, anderes Bild erfolgreich. | Edge Case |
| `petResponseIncludesFallbackImagePath` | Pet-Antworten für unterschiedliche Tierarten. | `defaultImagePath` ist gesetzt, z. B. CAT nutzt Cat-Pfad und BUDGIE nutzt Budgie-Pfad. | Normalfall |

### `ReviewIntegrationTest`

Integrationstests für Reviews nach abgeschlossener Buchung und Ratingvalidierung.

| Name | Input | Erwarteter Output | Edge Case / Normalfall |
| --- | --- | --- | --- |
| `completedBookingCanBeReviewedAndAffectsHostProfileStats` | Akzeptiertes Booking, Review vor und nach Abschluss, Host versucht Review, doppeltes Review. | Vor Abschluss HTTP 400, Host HTTP 403, Pet Owner erstellt Review HTTP 201, Stats und Marketplace-Rating werden aktualisiert, Duplikat HTTP 409. | Normalfall + Edge Case |
| `reviewRatingMustBeBetweenOneAndFive` | Review mit Rating `6` nach abgeschlossenem Booking. | HTTP 400, Fehlercode `VALIDATION_FAILED`. | Edge Case |

### `UserIntegrationTest`

Integrationstests für User-Endpunkte, Fehler-Envelopes, Rollenberechtigungen, öffentliche Profile und Profilbild-Uploads.

| Name | Input | Erwarteter Output | Edge Case / Normalfall |
| --- | --- | --- | --- |
| `currentUserResponseContainsPublicFieldsOnly` | Registrierter User ruft `GET /api/users/me` auf. | HTTP 200, öffentliche Felder vorhanden, `pets` leer, kein `passwordHash`. | Normalfall |
| `deleteUserReturnsEnvelopeWithDeleteResponse` | Registrierter User löscht eigene User-ID. | HTTP 200, `success=true`, `data.deleted=true`, ID stimmt. | Normalfall |
| `protectedEndpointWithoutTokenReturnsAuthRequiredEnvelope` | `GET /api/users/me` ohne Token. | HTTP 401, Fehlercode `AUTH_REQUIRED`. | Edge Case |
| `invalidMailExistsQueryReturnsValidationEnvelope` | `GET /api/users/mailExists?mail=not-an-email`. | HTTP 400, Fehlercode `VALIDATION_FAILED`, Detailsarray vorhanden. | Edge Case |
| `nonAdminCannotUpdateRoles` | Nicht-Admin ruft Rollen-Endpunkt mit `role=HOST` auf. | HTTP 403, Fehlercode `ACCESS_DENIED`. | Edge Case |
| `missingUserReturnsNotFoundEnvelope` | Abruf nicht existierender User-ID mit Token. | HTTP 404, Fehlercode `NOT_FOUND`. | Edge Case |
| `userByIdEndpointIsPublicWithoutToken` | `GET /api/users/{id}` ohne Token für existierenden User. | HTTP 200, User-ID und E-Mail werden geliefert. | Normalfall |
| `usersRegisterEndpointIsPublicAndCreatesUser` | Öffentlicher `POST /api/users/register` mit gültigem Payload. | HTTP 200, User-ID und E-Mail vorhanden, kein `passwordHash`. | Normalfall |
| `usersRegisterEndpointRejectsAdminRole` | Öffentlicher Register-Endpunkt mit Rolle `ADMIN`. | HTTP 400, Fehlercode `BAD_REQUEST`. | Edge Case |
| `patchUserSupportsRegistrationFieldsAndPasswordUpdate` | User patcht Profilfelder, Rolle `HOST`, Tierarten und neues Passwort. | Felder werden aktualisiert, alter Login schlägt fehl, neuer Login funktioniert. | Normalfall |
| `patchUserRoleToAdminIsForbiddenForNonAdmins` | Nicht-Admin patcht eigene Rolle auf `ADMIN`. | HTTP 403, Fehlercode `ACCESS_DENIED`. | Edge Case |
| `profileImageUploadAcceptsImageFieldAndReturnsPublicPath` | Multipart-Upload eines PNGs im Feld `image`. | HTTP 200, `profilePicture` beginnt mit `/uploads/profiles/`. | Normalfall |
| `registrationWithoutProfilePictureUsesDefaultPlaceholder` | Registrierung ohne `profilePicture`. | Profil nutzt `UserService.DEFAULT_PROFILE_PICTURE`. | Edge Case |
| `profileImageCanBeUploadedReplacedAndDeleted` | Profilbild wird hochgeladen, ersetzt und gelöscht. | Neuer Upload ersetzt alten, alte Datei wird gelöscht, Delete setzt Default-Placeholder. | Normalfall |
| `profileImageUploadAcceptsValidWebp` | Upload einer gültigen WebP-Datei. | HTTP 200, Pfad endet auf `.webp`, Datei existiert. | Normalfall |
| `profileImageUploadRejectsInvalidFiles` | Leere Datei, falscher Content-Type, ungültige Bildbytes und falsche Dateiendung. | Jeweils HTTP 400, Fehlercode `BAD_REQUEST`. | Edge Case |
| `profileImageUploadRejectsOversizedFilesWithPayloadTooLargeEnvelope` | Profilbild größer als 5 MB. | HTTP 413, Fehlercode `PAYLOAD_TOO_LARGE`. | Edge Case |
| `onlyOwnerCanUploadOrDeleteProfileImage` | Fremder User versucht Upload und Delete am Profilbild eines anderen Users. | Beide Requests HTTP 403, Fehlercode `ACCESS_DENIED`. | Edge Case |

## Frontend-Tests

### `auth-flows.e2e.spec.js`

End-to-End-Tests für Login und Registrierung im Frontend.

| Name | Input | Erwarteter Output | Edge Case / Normalfall |
| --- | --- | --- | --- |
| `completes full registration flow and redirects from /register to home` | Nutzer öffnet `/register`, füllt Formular aus und sendet Registrierung. | Registrierung erfolgreich, Token wird gespeichert, Weiterleitung zur Startseite. | Normalfall |
| `completes full modal login flow with mail check and hides login button when authenticated` | Nutzer öffnet Login-Modal, E-Mail-Check und Login mit gültigen Daten. | Login erfolgreich, Auth-State gesetzt, Login-Button verschwindet. | Normalfall |

### `auth-locale.e2e.spec.js`

End-to-End-Tests für Sprachumschaltung in Auth-Modals.

| Name | Input | Erwarteter Output | Edge Case / Normalfall |
| --- | --- | --- | --- |
| `should open login modal in English and switch back to German` | Login-Modal öffnen, Locale auf Englisch und zurück auf Deutsch wechseln. | Texte erscheinen in der jeweils gewählten Sprache. | Normalfall |
| `should open login modal from register page and switch locale to English` | Von der Registrierungsseite aus Login-Modal öffnen und Locale wechseln. | Modal öffnet korrekt, Sprache wird auf Englisch umgestellt. | Normalfall |
| `should open the login modal when clicking a legacy /login link` | Klick auf Legacy-Link `/login`. | Login-Modal öffnet statt 404-Seite. | Edge Case |

### `header-dropdown-exclusive.e2e.spec.js`

End-to-End-Test für Header-Menüs.

| Name | Input | Erwarteter Output | Edge Case / Normalfall |
| --- | --- | --- | --- |
| `should keep only one corporate header dropdown open at a time` | Authentifizierter User klickt Locale-Menü und User-Menü abwechselnd. | Es ist immer nur ein Dropdown geöffnet, das andere wird geschlossen. | Normalfall |

### `home-offers-carousel.e2e.spec.js`

End-to-End-Tests für Angebotskarussells auf der Startseite.

| Name | Input | Erwarteter Output | Edge Case / Normalfall |
| --- | --- | --- | --- |
| `excludes own published offers when logged in and supports species filter plus center modal` | Eingeloggter User mit eigenen und fremden Offers, Species-Filter und Center-Modal. | Eigene Offers werden ausgeblendet, Filter funktioniert, Modal/Carousel bleiben bedienbar. | Normalfall |
| `shows all published offers when user is not logged in` | Nicht eingeloggter User sieht veröffentlichte Marketplace-Offers. | Alle veröffentlichten Offers werden angezeigt. | Normalfall |

### `home-search-results.e2e.spec.js`

End-to-End-Test für Home-Suchergebnisse.

| Name | Input | Erwarteter Output | Edge Case / Normalfall |
| --- | --- | --- | --- |
| `shows white loading screen and renders search carousels with matching and alternative offers` | Nutzer startet Suche mit gemockten passenden und alternativen Angeboten. | Weißer Ladezustand erscheint, danach Matching- und Alternativ-Carousels mit korrekten Angeboten. | Normalfall |

### `my-offers-card-background.e2e.spec.js`

End-to-End-Test für Kartenhintergründe in eigenen Angeboten.

| Name | Input | Erwarteter Output | Edge Case / Normalfall |
| --- | --- | --- | --- |
| `uses gray fallback without image and a darkened image background when available` | Eigene Offers einmal ohne `imagePath`, einmal mit `imagePath`. | Karte ohne Bild nutzt grauen Fallback, Karte mit Bild nutzt abgedunkelten Bildhintergrund. | Normalfall |

### `my-offers-create-flow.e2e.spec.js`

End-to-End-Tests für den Erstellprozess eigener Angebote.

| Name | Input | Erwarteter Output | Edge Case / Normalfall |
| --- | --- | --- | --- |
| `uses setup step for title, period and optional image before the offer details step` | Host füllt Setup-Schritt mit Titel, Zeitraum und optionalem Bild, danach Details. | Create-Request enthält erwartete Daten, optionales Bild wird hochgeladen, Flow endet erfolgreich. | Normalfall |
| `keeps notifications above the create modal when create request fails` | Offer-Erstellung wird per API-Fehler abgelehnt. | Fehlermeldung/Notification bleibt sichtbar über dem Modal. | Edge Case |

### `repository-git.e2e.spec.js`

End-to-End-Tests für Git-Historie und Repository-Aktivitäten.

| Name | Input | Erwarteter Output | Edge Case / Normalfall |
| --- | --- | --- | --- |
| `should render git activity and timeline interactions from live data` | Repository-Git-Seite mit Live-Snapshot-Daten. | Timeline und Aktivitäten werden geladen und interaktiv gerendert. | Normalfall |
| `should render distinct heights for top activity bars` | Aktivitätsdaten mit unterschiedlichen Commit-Anzahlen. | Aktivitätsbalken haben unterscheidbare, datenabhängige Höhen. | Normalfall |
| `should reload timeline after manual repository refresh` | Nutzer löst manuellen Repository-Refresh aus. | Timeline lädt frische Daten und aktualisiert die Ansicht. | Normalfall |

### `repository-kanban.e2e.spec.js`

End-to-End-Test für das Kanban-Board.

| Name | Input | Erwarteter Output | Edge Case / Normalfall |
| --- | --- | --- | --- |
| `should keep exactly one active board column and render matching cards` | Nutzer wechselt aktive Kanban-Spalten. | Genau eine Spalte ist aktiv und zeigt passende Karten. | Normalfall |

### `repository-loading.e2e.spec.js`

End-to-End-Tests für Ladeverhalten bei Repository-Daten.

| Name | Input | Erwarteter Output | Edge Case / Normalfall |
| --- | --- | --- | --- |
| `should keep git and kanban content pending until live data resolves` | Verzögerte Snapshot-Antworten für Git/Kanban. | Ladezustand bleibt sichtbar, bis Daten vollständig geladen sind. | Normalfall |
| `should request a fresh snapshot when the refresh action is triggered` | Nutzer klickt Refresh-Aktion. | Frontend fordert einen frischen Snapshot an. | Normalfall |

### `repository-playwright.e2e.spec.js`

End-to-End-Tests für die Playwright-Test-UI im Frontend.

| Name | Input | Erwarteter Output | Edge Case / Normalfall |
| --- | --- | --- | --- |
| `should render a minimal start state, run tests, and show completion notification` | Playwright-UI wird geöffnet und Testlauf gestartet. | Startzustand erscheint, Tests laufen durch, Abschlussmeldung wird angezeigt. | Normalfall |
| `should expose consistent repository switch navigation targets` | Nutzer prüft Repository-Wechselnavigation. | Navigationsziele sind konsistent und klickbar. | Normalfall |

### `segmented-indicator-alignment.e2e.spec.js`

End-to-End-Test für die segmentierte Navigation bei kleiner Viewportbreite.

| Name | Input | Erwarteter Output | Edge Case / Normalfall |
| --- | --- | --- | --- |
| `keeps segmented indicator width and position correct after overflow scrolling and resize` | Mobiler Viewport, horizontales Scrollen und Resize-Event. | Segment-Indikator bleibt in Breite und Position am aktiven Button ausgerichtet. | Edge Case |

### `shell-home.e2e.spec.js`

End-to-End-Test für die globale Startseite.

| Name | Input | Erwarteter Output | Edge Case / Normalfall |
| --- | --- | --- | --- |
| `should render the global start page without repository graph content` | Aufruf der globalen Startseite. | Seite rendert ohne Repository-Graph-Inhalte. | Normalfall |

### `repository-graph-data.test.mjs`

Unit-Tests für Commit-, Autor-, Aktivitäts- und OpenAPI-Datenverarbeitung.

| Name | Input | Erwarteter Output | Edge Case / Normalfall |
| --- | --- | --- | --- |
| `parseCommitImport keeps only parent links that exist in payload` | Commit-Import mit Parent-Referenzen, von denen nicht alle im Payload existieren. | Nur vorhandene Parent-Links bleiben erhalten. | Normalfall |
| `parseCommitImport preserves existing commit metadata` | Commit-Payload mit Hash, Autor, Datum und Metadaten. | Metadaten bleiben unverändert erhalten. | Normalfall |
| `parseBranchCommits does not map by author display name` | Branch-Commit-Daten mit gleichen/ähnlichen Anzeigenamen. | Mapping erfolgt nicht fehlerhaft über Display Name. | Edge Case |
| `parseAuthorContributionStats counts commits and changed lines per author` | Numstat-/Commitdaten mehrerer Autoren. | Commits und geänderte Zeilen werden pro Autor korrekt summiert. | Normalfall |
| `parseAuthorContributionStats ignores malformed and binary numstat entries` | Defekte oder binäre Numstat-Einträge. | Einträge werden ignoriert und verursachen keine falschen Summen. | Edge Case |
| `createActivitySeries applies tie-breaking for duplicate max counts` | Aktivitätsdaten mit gleichen Maximalwerten. | Tie-Breaking ist konsistent und stabil. | Edge Case |
| `parseOpenApiYamlSnapshot extracts dynamic operations and tags` | OpenAPI-YAML-Snapshot mit Tags und Operations. | Operationen und Tags werden vollständig extrahiert. | Normalfall |

### `repository-live.test.mjs`

Unit-Tests für Live-Snapshots und Cache-Verhalten.

| Name | Input | Erwarteter Output | Edge Case / Normalfall |
| --- | --- | --- | --- |
| `live repository snapshot exposes real git and board data` | Live-Snapshot des Repository-Dashboards. | Valide Git- und Boarddaten mit erwarteten Feldern werden geliefert. | Normalfall |
| `repository pages do not embed static snapshot payloads` | HTML-Templates der Repository-Seiten. | Keine hardcodierten JSON-Snapshots sind eingebettet. | Edge Case |
| `fresh repository snapshots rebuild and replace the in-memory cache` | Frischer Snapshot-Request. | In-Memory-Cache wird neu aufgebaut und ersetzt. | Normalfall |

### `search-data.test.mjs`

Unit-Tests für Suchdaten und Tierarten-Fallbacks.

| Name | Input | Erwarteter Output | Edge Case / Normalfall |
| --- | --- | --- | --- |
| `loadPetChoices reads and normalizes values from backend enum when backend is available` | Zugriff auf Backend-Enum `PetChoice.java`. | Tierarten werden gelesen, normalisiert und zurückgegeben. | Normalfall |
| `loadPetChoices falls back to frontend assets data when backend source is unavailable` | Backend-Quelle ist nicht verfügbar. | Frontend nutzt statische Asset-Daten als Fallback. | Edge Case |
