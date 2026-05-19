# Testdokumentation

Stand: 2026-05-19

Diese Datei dokumentiert den aktuell im Repository vorhandenen und aktiv ausgefuehrten Testbestand in Frontend und Backend.

## Scope und Ausfuehrung

Backend:
- JUnit-Tests mit `@Test` unter `backend/src/test/java`.
- Zusaetzlich liegt `JWTServiceTest.java` weiterhin unter `backend/src/main/java/com/pawsitters/security` und wird hier bewusst mitgezaehlt.

Frontend:
- E2E-Tests mit Playwright unter `frontend/tests/e2e` und Dateimuster `*.e2e.spec.js`.
- Datentests via Node Test Runner gemaess `frontend/package.json` (`repository-live.test.mjs`, `repository-graph-data.test.mjs`, `search-data.test.mjs`).

Wichtig:
- In `frontend/tests/e2e` existieren zusaetzliche Dateien mit Namensschema `*.spec 2.js`.
- Diese Dateien matchen das aktive Playwright-Muster nicht und sind daher nicht Teil der unten stehenden aktiven Testzahlen.

## Aenderungen seit der vorherigen Version

Backend:
- Gesamt von 68 auf 131 Tests (+63).
- Neue Testklassen:
  - `AvailabilityIntegrationTest` (4)
  - `HostIntegrationTest` (4)
  - `ChatIntegrationTest` (18)
  - `ChatAuthorizationServiceTest` (2)
  - `ChatRealtimeServiceTest` (6)
- Erweiterte Testklassen:
  - `AuthIntegrationTest` von 26 auf 29
  - `UserServiceTest` von 19 auf 23
  - `MarketplaceIntegrationTest` von 3 auf 8
  - `OfferIntegrationTest` von 2 auf 7
  - `UserIntegrationTest` von 6 auf 18
- Wichtige inhaltliche Aenderung:
  - Das fruehere Verhalten "Pet Owner darf kein Offer erstellen" ist nicht mehr aktuell. Stattdessen prueft `petOwnerCanCreateOfferAndIsPromotedToHost`, dass PET_OWNER ein Offer erstellen darf und auf HOST hochgestuft wird.

Frontend:
- Gesamt von 26 auf 34 aktive Tests (+8).
- Neue aktive E2E-Dateien:
  - `header-dropdown-exclusive.e2e.spec.js` (1)
  - `home-offers-carousel.e2e.spec.js` (2)
  - `home-search-results.e2e.spec.js` (1)
  - `my-offers-card-background.e2e.spec.js` (1)
  - `my-offers-create-flow.e2e.spec.js` (2)
  - `segmented-indicator-alignment.e2e.spec.js` (1)
- Bereits vorhandene Testdateien sind weiterhin aktiv.

## Uebersicht Backend

| Bereich | Testklasse | Anzahl Tests |
| --- | --- | ---: |
| Authentifizierung und Security | `AuthIntegrationTest` | 29 |
| JWT-Service | `JWTServiceTest` | 4 |
| User-Service | `UserServiceTest` | 23 |
| Pet-Service | `PetServiceTest` | 2 |
| Request-Service | `RequestServiceTest` | 3 |
| Chat-Authorisierung (Service) | `ChatAuthorizationServiceTest` | 2 |
| Chat-Realtime Events (Service) | `ChatRealtimeServiceTest` | 6 |
| Marketplace-Controller | `MarketplaceIntegrationTest` | 8 |
| Offer-Controller | `OfferIntegrationTest` | 7 |
| Pet-Controller | `PetIntegrationTest` | 3 |
| User-Controller | `UserIntegrationTest` | 18 |
| Host-Controller | `HostIntegrationTest` | 4 |
| Availability-Controller | `AvailabilityIntegrationTest` | 4 |
| Chat-Controller | `ChatIntegrationTest` | 18 |
| **Gesamt Backend** |  | **131** |

## Uebersicht Frontend

| Bereich | Testdatei | Anzahl Tests |
| --- | --- | ---: |
| Authentifizierung (E2E) | `auth-flows.e2e.spec.js` | 2 |
| Lokalisierung (E2E) | `auth-locale.e2e.spec.js` | 3 |
| Header-Menues (E2E) | `header-dropdown-exclusive.e2e.spec.js` | 1 |
| Home Latest Offers (E2E) | `home-offers-carousel.e2e.spec.js` | 2 |
| Home Search Results (E2E) | `home-search-results.e2e.spec.js` | 1 |
| My Offers Card Design (E2E) | `my-offers-card-background.e2e.spec.js` | 1 |
| My Offers Create Flow (E2E) | `my-offers-create-flow.e2e.spec.js` | 2 |
| Repository Git (E2E) | `repository-git.e2e.spec.js` | 3 |
| Repository Kanban (E2E) | `repository-kanban.e2e.spec.js` | 1 |
| Repository Loading (E2E) | `repository-loading.e2e.spec.js` | 2 |
| Repository Playwright UI (E2E) | `repository-playwright.e2e.spec.js` | 2 |
| Segment-Indicator Layout (E2E) | `segmented-indicator-alignment.e2e.spec.js` | 1 |
| Startseite (E2E) | `shell-home.e2e.spec.js` | 1 |
| Graph Data Parsing (Unit) | `repository-graph-data.test.mjs` | 7 |
| Repository Snapshot (Unit) | `repository-live.test.mjs` | 3 |
| Suchdaten & Enums (Unit) | `search-data.test.mjs` | 2 |
| **Gesamt Frontend** |  | **34** |

## Backend im Detail

### `AuthIntegrationTest` (29)
Prueft Auth-Flow, Session, Passwortvalidierung, Cookies, CORS und Fehlerszenarien.

- `sessionWithoutTokenReturnsLoggedInFalse`
- `sessionWithInvalidTokenReturnsLoggedInFalse`
- `loginWithUppercaseEmailSucceedsAfterRegister`
- `loginUsesUnicodeNormalizedPassword`
- `registerDuplicateEmailDifferentCaseReturnsBadRequest`
- `loginWithWrongPasswordReturnsInvalidCredentialsEnvelope`
- `repeatedFailedLoginAttemptsAreRateLimited`
- `malformedJsonReturnsMalformedRequestEnvelope`
- `registerValidationFailureReturnsFieldDetails`
- `registerWithTooShortPasswordReturnsPasswordValidationError`
- `registerWithNistStylePassphraseWithoutCharacterMixSucceeds`
- `registerWithPasswordContainingEmailLocalPartReturnsPasswordValidationError`
- `registerWithPasswordLongerThanBcryptLimitReturnsPasswordValidationError`
- `registerWithProjectNamePasswordVariantReturnsPasswordValidationError`
- `registerWithPasswordContainingFirstNameReturnsPasswordValidationError`
- `registerWithSequentialPasswordReturnsPasswordValidationError`
- `registerWithLongRepetitionPasswordReturnsPasswordValidationError`
- `mailExistsReturnsTrueForExistingEmailWithoutToken`
- `mailExistsReturnsFalseForUnknownEmailWithoutToken`
- `actuatorHealthIsPublicForDeploymentChecks`
- `sessionWithValidJwtReturnsLoggedInTrue`
- `sessionWithValidJwtCookieReturnsLoggedInTrue`
- `sessionAfterRegisterUsesAuthCookie`
- `sessionAfterLoginUsesAuthCookie`
- `loginSetsSecureCookieWhenForwardedProtoIsHttps`
- `loginSetsSecureCookieWhenStandardForwardedProtoIsHttps`
- `corsPreflightForSessionAllowsConfiguredLocalOrigin`
- `sessionWithRawAuthorizationTokenReturnsLoggedInTrue`
- `logoutInvalidatesTokenForSessionCheck`

### `JWTServiceTest` (4)
Prueft JWT-Erzeugung, Claim-Auslesen und Tokenvalidierung.

- `whenValidCredentials_thenTokenIsGenerated`
- `whenValidToken_thenEmailAndRoleAreExtractedCorrectly`
- `whenInvalidToken_thenIsTokenValidReturnsFalse`
- `whenExpiredToken_thenIsTokenValidReturnsFalse`

### `UserServiceTest` (23)
Prueft User-Erstellung, Rollenlogik, Patch/Update/Delete und Profilbildbezug auf Service-Ebene.

- `whenValidUser_thenUserIsSavedSuccessfully`
- `whenValidHost_thenEmptyHostProfileIsCreated`
- `whenDuplicateEmail_thenThrowException`
- `whenLoginEmailHasDifferentCase_thenFindByEmailStillReturnsUser`
- `whenDuplicateEmailWithDifferentCase_thenCreateUserThrowsException`
- `whenUserNotFound_thenGetUserByIdThrowsException`
- `whenEmailNotFound_thenFindByEmailThrowsException`
- `whenEmailExists_thenExistsByEmailReturnsTrue`
- `whenEmailNotExists_thenExistsByEmailReturnsFalse`
- `whenOwnerUpdatesUser_thenUserIsSaved`
- `whenWrongEmailUpdatesUser_thenThrowsException`
- `whenNullFieldsPatched_thenFieldsRemainUnchanged`
- `whenNonNullFieldsPatched_thenFieldsAreUpdated`
- `whenWrongEmailPatches_thenThrowsException`
- `whenOwnerPatchesPassword_thenPasswordHashIsUpdated`
- `whenNonAdminPatchesRoleToAdmin_thenThrowsForbidden`
- `whenRegisteringWithAdminRole_thenThrowException`
- `whenOwnerDeletes_thenUserIsDeleted`
- `whenWrongEmailDeletes_thenThrowsException`
- `whenAdminUpdatesRole_thenRoleIsChanged`
- `whenUserNotFoundForRoleUpdate_thenThrowsException`
- `whenOwnerUpdatesProfileImage_thenProfilePictureIsUpdated`
- `whenWrongEmailUpdatesProfileImage_thenThrowsException`

### `PetServiceTest` (2)
Prueft das Anlegen von Pets inkl. Owner-Validierung.

- `whenValidOwner_thenPetIsSavedSuccessfully`
- `whenOwnerNotFound_thenThrowException`

### `RequestServiceTest` (3)
Prueft Erzeugung von Requests inkl. Zeitraum- und Owner/Pet-Validierung.

- `whenValidData_thenRequestIsCreatedWithStatusOpen`
- `whenEndDateBeforeStartDate_thenThrowException`
- `whenPetDoesNotBelongToOwner_thenThrowException`

### `ChatAuthorizationServiceTest` (2)
Prueft Chat-Teilnehmerberechtigung (inkl. case-insensitive Mailvergleich).

- `allowsHostAndRequesterCaseInsensitively`
- `rejectsStrangersAndMissingChats`

### `ChatRealtimeServiceTest` (6)
Prueft Realtime-Events auf Topic und User-Queues fuer Chat-Updates.

- `publishesMessageCreatedToChatTopicAndParticipantQueues`
- `publishesAttachmentAddedWithUpdatedMessagePayload`
- `publishesBookingEventWithProvidedType`
- `publishesChatClosedEventWithProvidedPayload`
- `publishesChatReopenedEventWithProvidedPayload`
- `publishesChatDeletedListEvent`

### `MarketplaceIntegrationTest` (8)
Prueft Host-/Offer-Marketplace-Endpunkte, oeffentlichen Zugriff und Filter-/Latest-Logik.

- `getHostsReturnsHostOverviewEnvelope`
- `searchHostsBySpeciesAndPostalCodeReturnsMatchingHostsOnly`
- `filtersReturnAvailableMarketplaceOptionsDynamically`
- `getOffersIsAccessibleWithoutAuthentication`
- `searchOffersIsAccessibleWithoutAuthentication`
- `latestOffersReturnsNewestTenByDefaultAndSortedDescendingById`
- `latestOffersCanExcludeHostIdAndStillReturnRequestedLimit`
- `searchOffersSplitsMatchingAndAlternativeDatesByFilters`

### `OfferIntegrationTest` (7)
Prueft Offer-Lifecycle, Validierung, Rollenuebergaenge, Profilsichtbarkeit und Bildverwaltung.

- `offerCanMoveBetweenDraftAndPublishedAndMarketplaceShowsOnlyPublishedOffers`
- `hostCanUpdateDraftOfferButNotPublishedOffer`
- `hostCannotCreateOfferWithPastAvailabilityDates`
- `hostCannotUpdateDraftOfferWithPastAvailabilityDates`
- `petOwnerCanCreateOfferAndIsPromotedToHost`
- `profileOffersEndpointShowsOnlyPublishedOffers`
- `offerImageCanBeUploadedReplacedAndPersisted`

### `PetIntegrationTest` (3)
Prueft Pet-Profilfluss, Bild-Eindeutigkeit und Fallback-Bilder.

- `petProfileCanBeCreatedReadAndUpdated`
- `imageMustBeUniqueAcrossPets`
- `petResponseIncludesFallbackImagePath`

### `UserIntegrationTest` (18)
Prueft User-Endpunkte, Public/Protected Access, Rollenregeln, Patch-Flow und Profilbild-Upload.

- `currentUserResponseContainsPublicFieldsOnly`
- `deleteUserReturnsEnvelopeWithDeleteResponse`
- `protectedEndpointWithoutTokenReturnsAuthRequiredEnvelope`
- `invalidMailExistsQueryReturnsValidationEnvelope`
- `nonAdminCannotUpdateRoles`
- `missingUserReturnsNotFoundEnvelope`
- `userByIdEndpointIsPublicWithoutToken`
- `usersRegisterEndpointIsPublicAndCreatesUser`
- `usersRegisterEndpointRejectsAdminRole`
- `patchUserSupportsRegistrationFieldsAndPasswordUpdate`
- `patchUserRoleToAdminIsForbiddenForNonAdmins`
- `profileImageUploadAcceptsImageFieldAndReturnsPublicPath`
- `registrationWithoutProfilePictureUsesDefaultPlaceholder`
- `profileImageCanBeUploadedReplacedAndDeleted`
- `profileImageUploadAcceptsValidWebp`
- `profileImageUploadRejectsInvalidFiles`
- `profileImageUploadRejectsOversizedFilesWithPayloadTooLargeEnvelope`
- `onlyOwnerCanUploadOrDeleteProfileImage`

### `HostIntegrationTest` (4)
Prueft Hostprofil-Anlage, Galerie-Upload, Statistikaggregation und Rollenberechtigung.

- `hostRegistrationCreatesEmptyHostProfileImmediately`
- `hostProfileCanBeCreatedReadAndExtendedWithGalleryImage`
- `hostStatsReturnAveragesCalculatedFromReviews`
- `petOwnerCannotCreateHostProfile`

### `AvailabilityIntegrationTest` (4)
Prueft Einzel-/Recurring-Verfuegbarkeit, Konfliktpruefung und Einbindung in Booking-Proposals.

- `hostCanManageSingleAndRecurringAvailabilityWithOverlapValidation`
- `petOwnerCannotCreateAvailability`
- `bookingProposalOutsideHostCalendarReturnsFeedback`
- `bookingProposalHonorsRecurringAvailability`

### `ChatIntegrationTest` (18)
Prueft Chat-Zugriff, Attachments, Booking-Proposals, Statusuebergaenge und Cleanup-Regeln.

- `messagesAreReturnedChronologicallyAndOnlyParticipantsCanReadThem`
- `imageAttachmentUploadReturnsFetchableUrlAndRejectsInvalidFiles`
- `attachmentUploadIsRestrictedToChatParticipants`
- `bookingProposalFromPetOwnerCanBeAcceptedByHostAndAppearsInChat`
- `acceptedBookingCanBeCompletedAndMovesFromActiveToHistory`
- `bookingProposalAllowsSingleDayAtOfferAvailabilityStart`
- `bookingProposalFromHostCanBeAcceptedOnlyByPetOwner`
- `newBookingProposalAutomaticallyDeclinesPreviousPendingProposal`
- `manualDeclineSetsManualReasonAndInvalidProposalRequestsAreRejected`
- `withdrawingProposalUpdatesExistingProposalCardWithoutCreatingExtraChatMessage`
- `bookingProposalRequiresPetCountAtLeastPetSpeciesCount`
- `acceptingOverlappingAcceptedBookingReturnsConflict`
- `bookingProposalsCannotBeCreatedOrAcceptedAfterOfferIsWithdrawn`
- `participantsCanCloseChatAndClosedChatBlocksFurtherMutations`
- `acceptedProposalClosesChatAndParticipantsCanReopenIt`
- `expiredClosedChatIsDeletedByCleanup`
- `reopenedThenClosedAgainChatUsesFreshDeleteWindow`
- `closingChatIsRestrictedToParticipants`

## Frontend im Detail

### E2E-Tests

#### `auth-flows.e2e.spec.js` (2)
- `completes full registration flow and redirects from /register to home`
- `completes full modal login flow with mail check and hides login button when authenticated`

#### `auth-locale.e2e.spec.js` (3)
- `should open login modal in English and switch back to German`
- `should open login modal from register page and switch locale to English`
- `should open the login modal when clicking a legacy /login link`

#### `header-dropdown-exclusive.e2e.spec.js` (1)
- `should keep only one corporate header dropdown open at a time`

#### `home-offers-carousel.e2e.spec.js` (2)
- `excludes own published offers when logged in and supports species filter plus center modal`
- `shows all published offers when user is not logged in`

#### `home-search-results.e2e.spec.js` (1)
- `redirects to /search/{parameter} and renders matching plus alternative carousels on the search page`

#### `my-offers-card-background.e2e.spec.js` (1)
- `uses gray fallback without image and a darkened image background when available`

#### `my-offers-create-flow.e2e.spec.js` (2)
- `uses setup step for title, period and optional image before the offer details step`
- `keeps notifications above the create modal when create request fails`

#### `repository-git.e2e.spec.js` (3)
- `should render git activity and timeline interactions from live data`
- `should render distinct heights for top activity bars`
- `should reload timeline after manual repository refresh`

#### `repository-kanban.e2e.spec.js` (1)
- `should keep exactly one active board column and render matching cards`

#### `repository-loading.e2e.spec.js` (2)
- `should keep git and kanban content pending until live data resolves`
- `should request a fresh snapshot when the refresh action is triggered`

#### `repository-playwright.e2e.spec.js` (2)
- `should render a minimal start state, run tests, and show completion notification`
- `should expose consistent repository switch navigation targets`

#### `segmented-indicator-alignment.e2e.spec.js` (1)
- `keeps segmented indicator width and position correct after overflow scrolling and resize`

#### `shell-home.e2e.spec.js` (1)
- `should render the global start page without repository graph content`

### Unit-/Daten-Tests

#### `repository-graph-data.test.mjs` (7)
- `parseCommitImport keeps only parent links that exist in payload`
- `parseCommitImport preserves existing commit metadata`
- `parseBranchCommits does not map by author display name`
- `parseAuthorContributionStats counts commits and changed lines per author`
- `parseAuthorContributionStats ignores malformed and binary numstat entries`
- `createActivitySeries applies tie-breaking for duplicate max counts`
- `parseOpenApiYamlSnapshot extracts dynamic operations and tags`

#### `repository-live.test.mjs` (3)
- `live repository snapshot exposes real git and board data`
- `repository pages do not embed static snapshot payloads`
- `fresh repository snapshots rebuild and replace the in-memory cache`

#### `search-data.test.mjs` (2)
- `loadPetChoices reads and normalizes values from backend enum when backend is available`
- `loadPetChoices falls back to frontend assets data when backend source is unavailable`
