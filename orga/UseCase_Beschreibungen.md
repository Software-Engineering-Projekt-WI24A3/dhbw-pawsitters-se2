# UseCase-Beschreibungen – Pawsitters Plattform

---

## UC7 – Account erstellen

| Feld            | Beschreibung |
|-----------------|--------------|
| **Name**        | Account erstellen |
| **Beschreibung**| Ein neuer Nutzer registriert sich auf der Pawsitters-Plattform, indem er seine persönlichen Daten (Name, E-Mail, Passwort, Telefonnummer) eingibt und ein Konto anlegt. |
| **Akteure**     | Benutzer (unregistriert) |
| **Auslöser**    | Der Nutzer möchte die Plattform nutzen und ruft die Registrierungsseite auf. |
| **Vorbedingung**| Es existiert noch kein Konto mit der angegebenen E-Mail-Adresse. |
| **Standardablauf** | 1. Nutzer ruft die Registrierungsseite auf. <br>2. Nutzer füllt das Registrierungsformular aus (Vorname, Nachname, E-Mail, Passwort, Telefonnummer). <br>3. System validiert die Eingaben (Format, Pflichtfelder, Passwortstärke). <br>4. System prüft, ob die E-Mail-Adresse bereits vergeben ist. <br>5. System speichert das Konto mit gehastem Passwort (BCrypt). <br>6. Nutzer wird zur Startseite/Dashboard weitergeleitet. |

---

## UC1 – Konto verwalten

| Feld            | Beschreibung |
|-----------------|--------------|
| **Name**        | Konto verwalten |
| **Beschreibung**| Ein angemeldeter Benutzer kann seine Profildaten (Name, E-Mail, Telefonnummer, Passwort) einsehen und aktualisieren sowie sein Konto löschen. |
| **Akteure**     | Benutzer (eingeloggt) |
| **Auslöser**    | Der Benutzer navigiert zu seinem Profilbereich und möchte Daten ändern. |
| **Vorbedingung**| Der Benutzer ist auf der Plattform angemeldet (authentifiziert). |
| **Standardablauf** | 1. Benutzer ruft die Profilseite auf. <br>2. System zeigt die aktuellen Kontodaten an. <br>3. Benutzer ändert die gewünschten Felder (z. B. Telefonnummer, Passwort). <br>4. System validiert die geänderten Eingaben. <br>5. System speichert die aktualisierten Daten. <br>6. Benutzer erhält eine Bestätigung der erfolgreichen Aktualisierung. |

---

## UC2 – Chatten

| Feld            | Beschreibung |
|-----------------|--------------|
| **Name**        | Chatten |
| **Beschreibung**| Zwei Benutzer (Tierhalter und Gastgeber) können über einen integrierten Chat miteinander kommunizieren, um Details zur Betreuung zu klären. |
| **Akteure**     | Benutzer (Tierhalter und/oder Gastgeber, jeweils eingeloggt) |
| **Auslöser**    | Ein Benutzer möchte Kontakt zu einem anderen Nutzer aufnehmen (z. B. nach Angebotserstellung). |
| **Vorbedingung**| Beide Benutzer sind auf der Plattform registriert und angemeldet. |
| **Standardablauf** | 1. Benutzer öffnet den Chat mit einem anderen Nutzer. <br>2. Benutzer gibt eine Nachricht ein und sendet sie ab. <br>3. System speichert und übermittelt die Nachricht an den Empfänger. <br>4. Empfänger sieht die eingehende Nachricht in seinem Posteingang/Chat-Fenster. <br>5. Empfänger kann antworten (Schritte 2–4 wiederholen sich). |

---

## UC3 – Haustier registrieren

| Feld            | Beschreibung |
|-----------------|--------------|
| **Name**        | Haustier registrieren |
| **Beschreibung**| Ein Tierhalter legt ein neues Haustier in seinem Profil an und gibt relevante Informationen wie Name, Spezies, Rasse, Alter und besondere Bedürfnisse ein. |
| **Akteure**     | Tierhalter (eingeloggt) |
| **Auslöser**    | Der Tierhalter möchte ein neues Haustier auf der Plattform erfassen. |
| **Vorbedingung**| Der Benutzer ist angemeldet und hat die Rolle „Tierhalter". |
| **Standardablauf** | 1. Tierhalter navigiert zum Bereich „Meine Haustiere". <br>2. Tierhalter klickt auf „Haustier hinzufügen". <br>3. Tierhalter füllt das Formular aus (Name, Spezies, Rasse, Alter, besondere Bedürfnisse). <br>4. System validiert die Pflichtfelder. <br>5. System speichert das Haustier und verknüpft es mit dem Besitzerkonto. <br>6. Das neue Haustier erscheint in der Übersicht des Tierhalters. |

---

## UC8 – Haustiere verwalten

| Feld            | Beschreibung |
|-----------------|--------------|
| **Name**        | Haustiere verwalten |
| **Beschreibung**| Ein Tierhalter kann seine bereits registrierten Haustiere einsehen, deren Daten bearbeiten oder ein Haustier aus seinem Profil entfernen. |
| **Akteure**     | Tierhalter (eingeloggt) |
| **Auslöser**    | Der Tierhalter möchte Daten eines Haustieres ändern oder ein Haustier entfernen. |
| **Vorbedingung**| Der Tierhalter ist angemeldet und hat mindestens ein Haustier registriert. |
| **Standardablauf** | 1. Tierhalter öffnet die Übersicht „Meine Haustiere". <br>2. System zeigt alle registrierten Haustiere des Tierhalters an. <br>3. Tierhalter wählt ein Haustier aus und klickt auf „Bearbeiten" oder „Löschen". <br>4a. Bei Bearbeiten: Tierhalter ändert die gewünschten Felder und speichert. <br>4b. Bei Löschen: System fragt zur Bestätigung und entfernt das Haustier anschließend. <br>5. System aktualisiert die Übersicht. |

---

## UC4 – Suche & Marketplace

| Feld            | Beschreibung |
|-----------------|--------------|
| **Name**        | Suche & Marketplace |
| **Beschreibung**| Ein Tierhalter kann auf dem Marketplace nach verfügbaren Gastgebern oder Betreuungsangeboten suchen und diese filtern (z. B. nach Zeitraum, Spezies). |
| **Akteure**     | Tierhalter (eingeloggt) |
| **Auslöser**    | Der Tierhalter sucht eine Betreuung für sein Haustier und möchte passende Angebote finden. |
| **Vorbedingung**| Der Tierhalter ist angemeldet. Es existieren Angebote auf der Plattform. |
| **Standardablauf** | 1. Tierhalter navigiert zum Marketplace. <br>2. Tierhalter gibt Suchkriterien ein (z. B. Zeitraum, Tierart, Preisrahmen). <br>3. System filtert und zeigt passende Angebote von Gastgebern an. <br>4. Tierhalter kann ein Angebot auswählen und Details einsehen. <br>5. Tierhalter kann den Gastgeber kontaktieren oder eine Buchungsanfrage stellen. |

---

## UC5 – Angebot erstellen

| Feld            | Beschreibung |
|-----------------|--------------|
| **Name**        | Angebot erstellen |
| **Beschreibung**| Ein Gastgeber erstellt eigenständig ein Betreuungsangebot und veröffentlicht es auf dem Marketplace. Das Angebot enthält den Betreuungszeitraum, den Preis pro Tag, die angebotenen Leistungen sowie die akzeptierten Tierarten. |
| **Akteure**     | Gastgeber (eingeloggt) |
| **Auslöser**    | Der Gastgeber möchte seine Betreuungskapazitäten anbieten und erstellt ein neues Angebot. |
| **Vorbedingung**| Der Gastgeber ist angemeldet und hat die Rolle „Gastgeber". |
| **Standardablauf** | 1. Gastgeber navigiert zu „Angebot erstellen". <br>2. Gastgeber füllt das Angebotsformular aus: Betreuungszeitraum (Von–Bis), Preis pro Tag, angebotene Leistungen (z. B. Fütterung, Spaziergänge, Übernachtung) und akzeptierte Tierarten (z. B. Hund, Katze, Vogel). <br>3. System validiert die Pflichtfelder (Zeitraum, Preis > 0, mind. eine Tierart). <br>4. System speichert das Angebot und veröffentlicht es auf the Marketplace. |

---

## UC9 – Angebot verwalten

| Feld            | Beschreibung |
|-----------------|--------------|
| **Name**        | Angebot verwalten |
| **Beschreibung**| Ein Gastgeber kann seine erstellten Angebote einsehen, bearbeiten (solange noch ausstehend) oder zurückziehen. |
| **Akteure**     | Gastgeber (eingeloggt) |
| **Auslöser**    | Der Gastgeber möchte den Status oder Inhalt seiner Angebote überprüfen oder ändern. |
| **Vorbedingung**| Der Gastgeber ist angemeldet und hat mindestens ein Angebot erstellt. |
| **Standardablauf** | 1. Gastgeber öffnet die Übersicht „Meine Angebote". <br>2. System zeigt alle Angebote des Gastgebers mit Status (PENDING, ACCEPTED, REJECTED) an. <br>3. Gastgeber wählt ein Angebot aus. <br>4a. Bei ausstehenden Angeboten: Gastgeber kann Preis oder Nachricht anpassen und speichern. <br>4b. Gastgeber kann das Angebot zurückziehen. <br>5. System aktualisiert den Angebotsstatus und informiert ggf. den Tierhalter. |

---

## UC6 – Buchung annehmen/ablehnen

| Feld            | Beschreibung |
|-----------------|--------------|
| **Name**        | Buchung annehmen/ablehnen |
| **Beschreibung**| Ein Tierhalter sendet über den Marketplace eine Buchungsanfrage für ein Angebot eines Gastgebers. Der Gastgeber erhält diese Anfrage und kann sie annehmen oder ablehnen. Bei Annahme gilt das Angebot als gebucht. |
| **Akteure**     | Tierhalter (eingeloggt), Gastgeber (eingeloggt) |
| **Auslöser**    | Der Tierhalter klickt auf einem Angebot im Marketplace auf „Annehmen" und sendet damit eine Buchungsanfrage an den Gastgeber. |
| **Vorbedingung**| Der Tierhalter ist angemeldet. Das gewählte Angebot des Gastgebers ist noch verfügbar (nicht bereits gebucht). |
| **Standardablauf** | 1. Tierhalter wählt im Marketplace ein passendes Angebot aus und klickt auf „Annehmen". <br>2. System erstellt eine Buchungsanfrage und sendet sie an den Gastgeber. <br>3. Gastgeber öffnet seine eingehenden Buchungsanfragen. <br>4a. Gastgeber klickt auf „Annehmen" → System markiert das Angebot als gebucht und benachrichtigt den Tierhalter. <br>4b. Gastgeber klickt auf „Ablehnen" → System verwirft die Anfrage und benachrichtigt den Tierhalter. |

---
