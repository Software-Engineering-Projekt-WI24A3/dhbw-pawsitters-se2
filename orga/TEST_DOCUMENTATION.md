
# Backend-Testdokumentation

Diese Datei dokumentiert alle aktuell vorhandenen Backend-Tests. Pro Test ist festgehalten, was geprueft wird, welches Ergebnis erwartet wird und ob der Test einen normalen Fall oder einen Edge Case abdeckt.

Hinweis: `JWTServiceTest.java` liegt aktuell unter `backend/src/main/java/com/pawsitters/security`, ist aber inhaltlich eine Backend-Testklasse.

## Uebersicht

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
| **Gesamt** |  | **68** |

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
