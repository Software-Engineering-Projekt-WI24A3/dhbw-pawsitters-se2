# KI-Frontend-Prompts und KI-Einsatz im Pawsitters-Frontend

Stand: 19.06.2026  
Ausgewerteter Workspace: `/Users/niklasulbrich/Desktop/pawsitters-se-projekt`  
Zeitzone der Datumsangaben: Europe/Berlin

Diese Datei fasst die KI-Chats zum Pawsitters-Frontend professionell zusammen. Sie dokumentiert nicht jeden Prompt wortwoertlich, sondern jede gefundene Chat-Session mit Datum, Umfang und fachlicher Verdichtung. Dadurch bleibt nachvollziehbar, wofuer KI eingesetzt wurde, ohne die Dokumentation mit Rohprompts, Logs und Wiederholungen zu ueberladen.

## Quellen und Auswertung

| Quelle | Ausgewertet | Ergebnis |
| --- | ---: | --- |
| Lokale Codex-Sessions mit `session_meta.cwd` exakt auf diesem Projektordner | 111 Chats | Hauptquelle fuer die chronologische Frontend-Prompt-Historie |
| User-Nachrichten innerhalb dieser Sessions | 332 Prompts | Mehrere Nachbesserungen innerhalb eines Chats wurden sinnvoll zusammengefasst |
| `frontend/` im Repository | Templates, Vue-Logik, Tailwind, i18n, Tests, Build-Skripte | Technischer Kontext fuer die Einordnung |
| `orga/KI_PROMPTS.md` | bestehende allgemeine KI-Dokumentation | nur als Kontext genutzt, nicht als Ziel dieser Datei |

Hinweis: Backend-, CI- oder Dokumentationschats wurden aufgenommen, wenn sie fuer Frontend-Verhalten, API-Anbindung, Deployment, Tests oder Praesentation relevant waren. Rein backendseitige Detailfragen sind nur als Kontext verdichtet.

## Kurzfazit

Die KI wurde im Frontend vor allem als Umsetzungs-, Debugging-, Review- und Dokumentationshilfe genutzt. Der Schwerpunkt lag auf Authentifizierung, Profil- und Einstellungsseiten, Haustieren, Angeboten, Suche, Startseite, Chat, Reviews, Internationalisierung, Corporate Design, responsiver Darstellung, CI-Fehlerbehebung und E2E-Tests.

Die wirksamsten Prompts enthielten meistens vier Bestandteile: konkretes UI-Ziel, vorhandene Projektkonventionen, gewuenschte Verifikation und klare Grenzen wie "bestehendes Corporate Design nutzen", "alle Sprachen pflegen", "keine Fallback-Daten" oder "Tests aktualisieren".

## Themenlandkarte

| Bereich | Zeitraum | Verdichteter Inhalt |
| --- | --- | --- |
| Auth, Registrierung und Session | 11.05.-14.05.2026 | Mail-Existenzpruefung, Login-/Registrierungsfenster, mehrstufige Registrierung, Passwortanforderungen, Apple-Autofill, geschuetzte Routen |
| Header, Navigation und Footer | 11.05.-19.05.2026 | Header-Reihenfolge, Profil-Dropdown, Sprachwahl, Footer-Kategorien, Scroll-Animation, Header-Suche, Entfernen unnoetiger Header-Elemente |
| Profile und Einstellungen | 11.05.-18.06.2026 | Oeffentliche Profile, Profilbilder, Settings-Seite, Kontaktdaten, Stadt/Flaggen, Bewertungsanzeige, Review-Interaktion |
| Haustiere und eigene Angebote | 13.05.-18.05.2026 | `/profile/my-pets`, `/profile/my-offers`, Uploads, Angebotsformular, Offer-Status, eigene Angebote in Listen ausblenden |
| Suche, Marketplace und Startseite | 14.05.-20.05.2026 | Startseitenangebote, Suchseite, Filterrouten, Angebotsdetails, Angebots- und Bildkarussells, Hero-/Banner-Verhalten |
| Chat und Booking-Anfragen | 18.05.-20.05.2026 | Nachrichtenlayout, Kontaktliste, Chatfensterhoehen, Bildvollbild, Angebotsanfragen, Chat-Dropdowns |
| i18n und UI-System | 12.05.-18.05.2026 | Vollstaendige Uebersetzungen, Notification-System, Corporate-Design-Popups, Kalender, dynamische Popup-Breiten |
| Tests, CI und Deployment | 11.05.-20.05.2026 | GitHub-Actions-Fehler, Playwright-Selektoren, Buildfehler, Container-Images, geschuetzte Routen auf Server, Testdokumentation |
| KI-Dokumentation und Praesentation | 20.05.-19.06.2026 | Frontend-Aufbau erklaeren, Codezeilen zaehlen, Slides-Text, KI-Prompt-Dokumentation |

## Chronologische Chat-Zusammenfassung

| Nr. | Datum | Chat | User-Prompts | Professionelle Zusammenfassung |
| ---: | --- | --- | ---: | --- |
| 1 | 11.05.2026 11:19 | Mail-Existenz pruefen | 5 | Anschluss von `/api/users/mailExists` an das Loginfenster; dynamisches Passwortfeld, Register-Flow bei neuer E-Mail, API-Fehlerhandling und passendes Corporate-Design-Verhalten. |
| 2 | 11.05.2026 11:21 | Fix missing repository-api template | 1 | Klaerung eines npm-Startfehlers durch falsches Arbeitsverzeichnis und fehlende Root-`package.json`; Frontend-Befehle muessen im `frontend/`-Ordner laufen. |
| 3 | 11.05.2026 11:56 | Fix login button selector | 3 | Behebung von GitHub-CI-/Playwright-Fehlern im Login-/Registrierungsflow, insbesondere robuste Selektoren und Build-Stabilitaet. |
| 4 | 11.05.2026 13:23 | Fix tailwindcss Buildfehler | 2 | Analyse und Korrektur eines Tailwind-/Container-Buildfehlers im Frontend-Deployment-Kontext. |
| 5 | 11.05.2026 14:00 | Entferne Startseiten-Navigation | 17 | Umfangreiche Header- und Startseitenbereinigung: unnoetige Repository-/Login-Elemente entfernen, Profilmenue fuer eingeloggte Nutzer, Locale-/Dropdown-Logik, responsive Header-Anordnung. |
| 6 | 11.05.2026 18:53 | Registrierung in Schritte teilen | 4 | Mehrstufiger Registrierungsprozess mit Tab-/Stepper-UI, konsistentem Corporate Design, Formularvalidierung und sauberem Nutzerfluss. |
| 7 | 11.05.2026 18:54 | Fix Server-Bug | 1 | Untersuchung serverseitiger Frontend-Auslieferungsprobleme, bei denen statische Daten, Routen und Locale-Wechsel lokal funktionierten, deployed aber fehlschlugen. |
| 8 | 11.05.2026 19:00 | Aendere Popup-Input-Label | 2 | Anpassung von Login- und Suchfeldern an klare Beschriftungen und einheitliches Corporate-Design-Inputstyling. |
| 9 | 11.05.2026 19:13 | Finde grosse Commit-Datei | 1 | Analyse eines extrem grossen Commit-Diffs zur Identifikation unnötiger oder versehentlich versionierter Dateien. |
| 10 | 11.05.2026 19:23 | Profilseite per E-Mail routen | 12 | Aufbau oeffentlicher Profilseiten mit Route `/profile/{email}` bzw. spaeter ID-Logik, Bannerbild, Profilbild, persoenlichen Daten, Dropdown-Verlinkung und UI-Polish. |
| 11 | 11.05.2026 20:12 | Corporate-Design-Dropdowns fixen | 1 | Zentrale Dropdown-Exklusivitaet: Profil-, Sprach- und andere Menues duerfen nicht parallel offen bleiben. |
| 12 | 11.05.2026 20:25 | Finde Ursache fuer Commit-Bloat | 1 | Weitere Untersuchung eines uebermaessig grossen Diffs mit Fokus auf versehentlich hinzugefuegte Build-/Datenartefakte. |
| 13 | 11.05.2026 20:32 | GitHub-Bugs beheben | 1 | Systematische Behebung von Frontend-CI-Fehlern nach Login-/Registrierungsarbeiten. |
| 14 | 11.05.2026 20:49 | Fix E2E login trigger locale | 1 | Stabilisierung von E2E-Tests im Zusammenhang mit Login-Triggern und Spracheinstellungen. |
| 15 | 12.05.2026 09:09 | Footer-Kategorien anpassen | 7 | Neustrukturierung des Footers mit Autoren, nuetzlichen Links, Informationen, Icons, GitHub-Profilen und responsiver Breite passend zum Suchcontainer. |
| 16 | 12.05.2026 09:42 | Einstellungen-Seite bauen | 2 | Neue geschuetzte `/settings`- bzw. Profilsettings-Seite mit Profilbearbeitung, Dropdown-Einstieg, Banneroptik und Auth-Schutz. |
| 17 | 12.05.2026 09:43 | Bewertungsdaten im Backend pruefen | 5 | Klaerung vorhandener Bewertungsdaten und UI-Vorbereitung fuer Bewertungsanzeige in Profilen, inklusive leerer und vorhandener Review-Zustaende. |
| 18 | 12.05.2026 10:32 | Uebersetzungen systematisch pruefen | 8 | Systematische i18n-Bereinigung aller Seiten, Popups und UI-Texte; harte deutsche Texte entfernen und Abdunklung/Modalverhalten vereinheitlichen. |
| 19 | 12.05.2026 11:11 | Benachrichtigungen ueberarbeiten | 1 | Zentrales Notification-System mit Farblogik fuer Erfolg, Fehler und neutrale Hinweise, Close-Button und Uebersetzungen. |
| 20 | 12.05.2026 11:33 | Popup-Abdunklung vereinheitlichen | 3 | Einheitliches, weniger starkes Fullscreen-Overlay fuer Corporate-Design-Popups sowie oeffentliche Nutzersuche und Locale-Notifications. |
| 21 | 12.05.2026 14:20 | Banner durch Amsterdam-Bild | 13 | Austausch globaler Bannerbilder, Korrektur von Passwortkriterien, Profil-/Settings-Feinschliff und weitere visuelle Vereinheitlichungen. |
| 22 | 12.05.2026 17:36 | Profilbild-Hover bearbeiten | 2 | Profilbildbearbeitung aus Standard-Formularen herausloesen und als Hover-Interaktion direkt auf dem runden Profilbild anbieten. |
| 23 | 12.05.2026 17:42 | Security-Frage Loginfenster | 1 | Bewertung des Security-Risikos durch Mail-Existenzpruefung im Loginfenster und moegliche Gegenmassnahmen gegen User Enumeration. |
| 24 | 12.05.2026 17:49 | Seite vollstaendig entfernen | 1 | Entfernen der Seite `/repository/api` als nicht mehr benoetigte Frontend-Funktion. |
| 25 | 12.05.2026 18:10 | Entferne Seite vollstaendig | 7 | Vollstaendige Bereinigung aller `/repository/api`-Referenzen inklusive Routen, Templates, Locale-Schluesseln, Datenquellen und Tests. |
| 26 | 12.05.2026 18:13 | Telefonnummer bearbeiten anpassen | 5 | Ueberarbeitung von Telefon-/Laenderauswahl in Registrierung und Profilbearbeitung mit Custom-Flaggen, Vorwahl-Darstellung und Dropdown-Design. |
| 27 | 12.05.2026 18:31 | Entferne repository/git-Seite | 1 | Vollstaendige Entfernung der `/repository/git`-Seite samt Links, Datenquellen und Uebersetzungen. |
| 28 | 12.05.2026 22:31 | Fixe fehlgeschlagene Tests | 2 | Behebung mehrerer GitHub-CI-Fehler nach manuellen Web-Editor-Aenderungen; Frontend-Tests und reale Aenderungen wieder in Einklang bringen. |
| 29 | 12.05.2026 23:11 | Fixe protected routes | 1 | Serverproblem bei geschuetzten Routen wie `/settings` analysieren und Routing/Build-Auslieferung reparieren. |
| 30 | 12.05.2026 23:15 | Fixe leere Routen und E2E-Tests | 2 | Deployed leere Repository-/Kanban-Routen und fehlschlagende E2E-Tests beheben; keine Fallbackdaten, sondern echte Datenquellen. |
| 31 | 12.05.2026 23:26 | Header beim Scrollen glaetten | 3 | Scrollverhalten des Headers deutlich smoother machen, inklusive weicher Ein-/Ausblendung statt ruckartiger Layoutspruenge. |
| 32 | 12.05.2026 23:29 | Fixe geschuetzte Routen | 2 | Weiteres Debugging weisser Server-Seiten bei `/settings`; statische Route, Asset- und JavaScript-Auslieferung stabilisieren. |
| 33 | 13.05.2026 09:24 | Erstelle /my-pets-Seite | 8 | Neue geschuetzte Haustierverwaltung mit Profil-Dropdown-Einstieg, CRUD, Bild-Upload, Corporate-Design-Modals, Tests und API-Anbindung. |
| 34 | 13.05.2026 09:44 | Profilbild-Upload anpassen | 4 | Umstellung der Profilbildbearbeitung von Link-Eingabe auf echten Backend-Upload mit passender UI und Fehlerbehandlung. |
| 35 | 13.05.2026 10:28 | Passe Popups auf /my-pets an | 7 | Standardisierung aller `/my-pets`-Popups auf das globale Corporate-Design-Modal inklusive Overlay, Header/Footer-Verhalten und Icons. |
| 36 | 13.05.2026 10:56 | Profilseite anpassen | 1 | Entfernen sensibler Kontaktkaesten aus Profilseiten und Ersatz durch Standort-/Rollenzeile mit Flagge und Stadt. |
| 37 | 13.05.2026 10:57 | Remove profile contact boxes | 1 | Gleiche Profilbereinigung fuer oeffentliche Profilroute mit Fokus auf Datenschutz und reduziertes UI. |
| 38 | 13.05.2026 10:58 | Passe oeffentliche Profilseite an | 3 | Weitere Profilkorrekturen: Geburtstags-/Ortskaesten entfernen, Rollen-/Standorttext sichtbar machen und Popups bereinigen. |
| 39 | 13.05.2026 11:13 | Nutze Custom-Flaggen fuer Staedte | 1 | Profilseiten sollen Projekt-eigene Flaggen-SVGs statt Standard-Emoji-Flaggen verwenden. |
| 40 | 13.05.2026 11:49 | Meine Angebote ergaenzen | 1 | Anbindung der Offer-API an eine neue Profilfunktion fuer eigene Betreuungspakete mit Entwurf, Publish und Withdraw. |
| 41 | 13.05.2026 11:50 | Entferne Geburtsdatum und Ort | 8 | Profilseiten weiter reduzieren, Tabs fuer Informationen/Haustiere/Angebote ergaenzen und Trennlinien im Corporate Design einfuehren. |
| 42 | 13.05.2026 12:10 | Carousel-Schatten entfernen | 1 | Visuelle Korrektur des Haustier-Bilderkarussells ohne grauen Hintergrund oder unpassende Schatten. |
| 43 | 13.05.2026 12:45 | Fix profile my-pets popups | 2 | Letzte Anpassungen der `/profile/my-pets`-Popups an Standardmodal, inklusive korrekter SVG-Darstellung im Dropdown. |
| 44 | 13.05.2026 12:46 | Zeige Betreuungsangebote im Profil | 1 | Oeffentliche Profile um Tab "Betreuungsangebote" erweitern und leere Haustier-/Angebotszustaende sauber anzeigen. |
| 45 | 13.05.2026 12:48 | Popups auf my-offers angleichen | 1 | `/profile/my-offers`-Popups auf Standard-Corporate-Design umstellen. |
| 46 | 13.05.2026 12:48 | Entferne SVG aus Angebote-Dropdown | 1 | Fehlerhafte Icon-Anzeige im Profil-Dropdown fuer "Meine Angebote" entfernen. |
| 47 | 13.05.2026 15:21 | Nutze Standard-Popup in My-Offers | 8 | Intensive Nacharbeit an `/profile/my-offers`: Standardmodals, Layout, Buttonverhalten, Formularflow und wiederholte Bugfixes. |
| 48 | 13.05.2026 15:58 | Profilseiten-Icons ergaenzen | 2 | E-Mail- und Telefon-Icons auf oeffentlichen Profilseiten ergaenzen und Sichtbarkeit reparieren. |
| 49 | 13.05.2026 16:02 | Zeilen im Profil tauschen | 1 | Reihenfolge und visuelle Konsistenz von Profilzeilen an `/profile/my-pets` angleichen. |
| 50 | 13.05.2026 16:07 | Profilseite my-offers reparieren | 1 | White-Screen-Bug auf `/profile/my-offers` beheben. |
| 51 | 14.05.2026 09:19 | Icons in Profilsettings entfernen | 12 | Sammelchat fuer Settings, Autofill, Offers, Stadt-Dropdown und Kalender: Icons korrigieren, Apple-Autofill verbessern, Offer-Erstellung debuggen und zentrale Kalenderkomponente vereinheitlichen. |
| 52 | 14.05.2026 10:35 | Beschleunige Header-Animation | 7 | Header-Performance optimieren, Offer-Erstellungsflow um Zeitraum/Bild erweitern, Backend-API pruefen, Tests ergaenzen und Angebotsdarstellung anpassen. |
| 53 | 14.05.2026 11:02 | Passworthinweise vereinfachen | 1 | Frontend-Passwortanforderungen an neue NIST-/Security-Regeln anpassen, nutzerverstaendlich formulieren und alte Komplexitaetscheckliste ersetzen. |
| 54 | 14.05.2026 15:39 | Angebote auf Startseite korrigieren | 5 | Startseitenangebote fuer nicht eingeloggte Nutzer sichtbar machen, eigene Angebote ausblenden, Bilder/Daten speichern und Angebotsdetail-Modals standardisieren. |
| 55 | 14.05.2026 17:39 | Mache Veroeffentlichen-Button weiss | 7 | Offer-UI-Polish: Buttonfarben, Detailmodal-Layout, Link zum Erstellerprofil, Tiericons auf Karten, Header-Bereinigung und neues Angebotskarussell vorbereiten. |
| 56 | 14.05.2026 17:56 | Zeige neueste Angebote | 1 | Startseite um ein horizontales Karussell der zehn neuesten Betreuungsangebote mit Animation, Fade, Pfeilen, Backend-Anbindung, i18n und Tests erweitern. |
| 57 | 14.05.2026 17:59 | Header-Kalender einschraenken | 1 | Datumslogik im Header-Suchkalender: keine Vergangenheit und maximal 100 Jahre Zukunft, ohne andere Kalender zu beeinflussen. |
| 58 | 14.05.2026 18:10 | Popup-Breiten dynamisch anpassen | 1 | Globale Modalbreiten dynamisch und inhaltsabhaengig verbessern, damit kleine und grosse Popups professionell wirken. |
| 59 | 18.05.2026 12:33 | Fixe Buttontext weiss | 3 | Buttontextfarben und Popupbreiten nachziehen; eigene Angebote auf Startseite und Angebotslisten fuer eingeloggte Ersteller ausblenden. |
| 60 | 18.05.2026 12:40 | Inspect container image build | 3 | Container-Image-Build und Smoke-Test-Ausgabe analysieren; Deployment-Verhalten von Frontend/Backend nachvollziehen. |
| 61 | 18.05.2026 12:56 | Tokenverbrauch fixen | 1 | Meta-Anfrage zum Umgang mit schnell verbrauchtem Codex-Tokenlimit, ohne Frontend-Codeaenderung. |
| 62 | 18.05.2026 12:58 | Baue Angebote-Karussell | 3 | Neueste-Angebote-Karussell erneut verbessern, Datumseinschraenkungen in Angebotsformularen beachten und Frontendtests absichern. |
| 63 | 18.05.2026 14:14 | Fix backend build failure | 1 | Backend-CI-Fehler im Kontext eines Frontend-Branches analysieren, damit Merge-/Deployment-Pipeline wieder gruen wird. |
| 64 | 18.05.2026 14:26 | Suche auf eigene Seite auslagern | 14 | Suche von Startseiten-Overlay auf eigene `/search/{parameter}`-Seite verlagern, Ergebnisdarstellung ohne unnoetigen Container, Filter-/Popup-/Route-Logik und Tests anpassen. |
| 65 | 18.05.2026 16:50 | Messages-Container vereinheitlichen | 1 | Nachrichten-Leerzustand und `/profile/messages`-Container auf einheitliches Corporate-Design ohne verschachtelte Karten reduzieren. |
| 66 | 18.05.2026 20:42 | Fixe Startseite-Bilder und Pfeile | 7 | Startseiten-Bildkarussell auf fuenf Bilder reduzieren, Pfeile exakt ausrichten, Karussell-Verhalten systematisch vereinheitlichen und visuelle Bugs beheben. |
| 67 | 18.05.2026 20:47 | Entferne Header-Elemente | 5 | Header bereinigen: Backend-Status, Angebots-/Projektumschalter und Projektbereich entfernen; Search-Container-Verhalten beim Scrollen erhalten. |
| 68 | 18.05.2026 20:55 | Nunito Sans fuer Website setzen | 2 | Globale Schriftart auf Nunito Sans umstellen und Typografie konsistent ueber die gesamte Website anwenden. |
| 69 | 18.05.2026 21:31 | Popup-Breite fixen | 11 | Detailreiche UI-Nacharbeit an Haustier-Popups, Angebotsanfragen im Chat, Kartenformaten und responsiven Breiten. |
| 70 | 19.05.2026 08:52 | Fix search carousel next button | 1 | Frontend-CI-Fehler am Such-/Karussell-Button in Playwright beheben. |
| 71 | 19.05.2026 08:52 | TEST_DOCUMENTATION.md aktualisieren | 1 | Testdokumentation auf aktuellen Frontend- und Backend-Stand bringen, weggefallene und neue Tests systematisch erfassen. |
| 72 | 19.05.2026 09:29 | Fix Chat-White-Screen | 2 | White-Screen beim Oeffnen eines Chats beheben; Frontend und Backend fuer Chatfluss, Datenzugriff und Stabilitaet pruefen. |
| 73 | 19.05.2026 09:30 | Reduziere Karussell auf 5 Bilder | 1 | Startseitenkarussell exakt auf fuenf Bilder begrenzen, Pfeilpositionen und nicht abgeschnittene Kacheln sicherstellen. |
| 74 | 19.05.2026 09:31 | Carousel-Animation glaetten | 1 | Animation aller Corporate-Design-Picture-Carousels smoother machen. |
| 75 | 19.05.2026 10:55 | Glaette Picture-Carousels | 1 | Wiederholte Performance-/Animationsverbesserung der Bildkarussells gegen ruckelige Bewegungen. |
| 76 | 19.05.2026 10:56 | Fixe Chat- und Kontaktliste | 2 | Chatfenster und Kontaktliste auf gleichbleibende Hoehe bringen, Scrollbereiche sauber trennen und Layoutspruenge verhindern. |
| 77 | 19.05.2026 10:57 | Chat-Buttons neu anordnen | 1 | Chat-Header-Aktionen mit X und Drei-Punkte-Menue nebeneinander korrekt positionieren. |
| 78 | 19.05.2026 11:06 | Chat-Input fokussieren | 1 | Beim Oeffnen eines Chats automatisch den Nachrichteneingabefokus setzen und Enter-Versand ermoeglichen. |
| 79 | 19.05.2026 11:07 | Vollbildansicht im Chat fixen | 1 | Fullscreen-Bildansicht fuer Chat-Anhaenge mit Standard-Overlay und Close-Button stabilisieren. |
| 80 | 19.05.2026 11:07 | Fix home offers carousel count | 1 | Playwright-/CI-Fehler zur Anzahl der Startseiten-Angebotskarten beheben. |
| 81 | 19.05.2026 11:20 | Angebot-Button im Chat fixen | 1 | "Angebot anfragen" im Chat reparieren, damit strukturierte Anfrage statt leerer Nachricht erscheint. |
| 82 | 19.05.2026 11:24 | Header und Carousel anpassen | 1 | Startseitenabstaende und Angebotskarussell-Kachelgroessen justieren, abgeschnittene Karten verhindern. |
| 83 | 19.05.2026 11:29 | Zentriere Chat-Buttons im Header | 1 | Chat-Header-Buttons exakt vertikal zentrieren. |
| 84 | 19.05.2026 11:31 | Fixe Chat- und Kontakt-Hoehe | 1 | Wiederholte Stabilisierung von Chatfenster- und Kontaktlistenhoehe. |
| 85 | 19.05.2026 11:51 | Anfragetext formatieren | 1 | Textformatierung fuer Angebotsanfragen im Chat korrigieren, inklusive Leerzeichen, Angebotsname und Tierliste. |
| 86 | 19.05.2026 11:53 | Fix Chatfenster-Hoehe | 1 | Weitere Layoutkorrektur der Chatfensterhoehe und Scrollbereiche. |
| 87 | 19.05.2026 11:54 | Vergroessere Angebots-Kacheln | 1 | Startseiten-Angebotskacheln vergroessern und vollstaendig sichtbar machen. |
| 88 | 19.05.2026 11:55 | Angebotskarussell vereinheitlichen | 1 | Suchergebnis-Angebotskarussell an bestehendes Corporate-Design anderer Angebotsslider angleichen. |
| 89 | 19.05.2026 12:06 | Startseite-Carousel hinzufuegen | 8 | Startseite grundlegend neu strukturieren: Header ohne zentrale Suche, vollbreites Hero-Bildkarussell, weiteres Angebotskarussell, Animationen, Suche und Tests. |
| 90 | 19.05.2026 13:26 | Pipeline-Fehler beheben | 1 | Frontend-Build-/Testfehler in der Pipeline nach Landingpage-Aenderungen beheben. |
| 91 | 19.05.2026 14:30 | Startseiten-Banner kuerzen | 5 | Hero-Bannerhoehe reduzieren, Karussellanzahl und Kachelsichtbarkeit korrigieren, Layout und Abstaende nachjustieren. |
| 92 | 19.05.2026 15:00 | Abstaende bei Angebote verkleinern | 1 | Vertikale Abstaende um Startseiten-Angebotsbereich reduzieren. |
| 93 | 19.05.2026 15:09 | Fix gleiche Chat-Container-Hoehe | 1 | Chat- und Kontaktlistenhoehen erneut fixieren, um inkonsistente Layoutgroessen zu verhindern. |
| 94 | 19.05.2026 15:10 | Animiere Header-Search | 5 | Header-Suche auf der Startseite erst nach Scroll-Schwelle einblenden, mit sauberer Animation und wiederholter Praezisierung des Triggerverhaltens. |
| 95 | 19.05.2026 15:57 | Pruefe ungenutzte Backend-APIs | 1 | Ohne Codeaenderung pruefen, welche vorhandenen Backend-APIs im Frontend noch nicht angebunden sind. |
| 96 | 19.05.2026 16:00 | Baue besonderes Bildkarussell | 4 | Spezielles Startseiten-Picture-Carousel ausserhalb des Standarddesigns mit grosser mittlerer Karte, Tiefenwirkung, Animation und Klickverhalten entwickeln. |
| 97 | 19.05.2026 16:18 | Fix carousel card count | 1 | CI-/Playwright-Fehler zur Kartenanzahl nach Carousel-Aenderungen beheben. |
| 98 | 19.05.2026 16:34 | Abstand um 25% erhoehen | 3 | Abstaende am Startseitenkarussell wieder anheben, graue Schatten/Ellipsen entfernen und optische Feinkorrekturen durchfuehren. |
| 99 | 19.05.2026 16:40 | Richte Chat-Buttons aus | 1 | Dritter Korrekturprompt zur exakten Ausrichtung von Chat-X und Drei-Punkte-Button. |
| 100 | 19.05.2026 16:50 | Fix home offers carousel test | 1 | Frontend-CI-Fehler nach Landingpage-Update und Carousel-Tests beheben. |
| 101 | 20.05.2026 10:06 | Dropdown im Chat anpassen | 2 | Chat-Drei-Punkte-Dropdown an Corporate Design anpassen, ohne Buttonpositionen zu veraendern; Klickbarkeit von Startseitenkacheln pruefen. |
| 102 | 20.05.2026 10:20 | Finde availability APIs | 1 | Lokalisieren der Availability-Endpunkte im Backend als Grundlage fuer moegliche Frontend-Anbindung. |
| 103 | 20.05.2026 10:26 | Setze Katze in Frankfurt ab | 1 | Marketing-/Suchkacheltext fuer Frankfurt und Katze anpassen, inklusive passendem Filterverhalten. |
| 104 | 20.05.2026 10:55 | Erklaere Slides-Umsetzung | 4 | Technische Umsetzung der Pawsitters-Slides lebendig, aber nicht zu ausfuehrlich beschreiben. |
| 105 | 20.05.2026 12:38 | Frontend-Code analysieren | 1 | Systematische Erklaerung des Frontend-Aufbaus, interessanter Architekturpunkte und Zusammenspiel von Templates, Styles, JS und Tests. |
| 106 | 20.05.2026 13:01 | Zaehle Codezeilen | 1 | Codezeilen im gesamten Projekt sowie getrennt nach Backend und Frontend ermitteln. |
| 107 | 20.05.2026 13:05 | Fix commit modal test | 3 | Aeltere Frontend-CI-Fehler mit Commit-Modal-/Repository-Testkontext analysieren und stabilisieren. |
| 108 | 21.05.2026 16:11 | KI_PROMPTS.md erweitern | 1 | Wunsch nach vollstaendiger, aber sinnvoll verdichteter KI-Prompt-Dokumentation aller Projektchats inklusive Struktur eines guten Codex-Prompts. |
| 109 | 18.06.2026 21:33 | Bewertungen im Profil einbauen | 7 | Review-Funktion aus Backend ins Frontend integrieren: Sterne, Durchschnittsbewertung, Bewertungsdialog, Profilanzeige, Notification-System und Corporate Design. |
| 110 | 19.06.2026 09:30 | Frontend-KI-Prompts buendeln | 1 | Erste Aufforderung, alle lokalen Projektchats frontendbezogen in einer KI-Prompt-Datei professionell zusammenzufassen. |
| 111 | 19.06.2026 09:36 | Fasse KI-Frontend-Prompts zusammen | 1 | Konkretisierung auf `ki_frontend_prompts.md` mit Anforderung, wirklich jeden Chat datiert und sinnvoll verdichtet zu dokumentieren. |

## Wiederverwendbare Master-Prompts

Die folgenden Prompts sind aus der gesamten Chat-Historie abgeleitet. Sie sind bewusst professionell formuliert und koennen fuer kuenftige Frontend-Aufgaben wiederverwendet werden.

### 1. Frontend-Feature sauber implementieren

```text
Du bist Senior Frontend Engineer im Projekt "Pawsitters".

Implementiere folgendes Frontend-Feature: [Feature beschreiben].

Arbeite im bestehenden Stack:
- Templates: `frontend/src/templates/`
- Verhalten: `frontend/src/js/site.js`
- Styles: `frontend/src/tailwind/`
- i18n: `frontend/src/locales/de.json`, `en.json`, `ro.json`
- Tests: `frontend/tests/`

Anforderungen:
1. Nutze vorhandene Layout-, Modal-, Dropdown-, Kalender- und Corporate-Design-Patterns.
2. Halte Mobile und Desktop stabil.
3. Pflege alle drei Sprachen.
4. Behandle Lade-, Leer-, Erfolgs- und Fehlerzustaende.
5. Aktualisiere oder ergaenze passende Tests.

Verifikation:
- Frontend-Build ausfuehren.
- Relevante Playwright-/Node-Tests ausfuehren.
- Kurz nennen, welche User-Flows geprueft wurden.
```

### 2. API sauber im Frontend anbinden

```text
Binde folgenden Backend-Endpunkt im Pawsitters-Frontend an: [Endpoint].

Beachte:
- API-Antworten kommen im einheitlichen Envelope mit `success`, `data`, `error` und `meta`.
- Fehler muessen nutzerfreundlich ueber das globale Notification-System angezeigt werden.
- Es duerfen keine Fallback-Daten verwendet werden, wenn echte API-Daten erwartet werden.
- Geschuetzte Aktionen muessen den Auth-Status beruecksichtigen.

Ergebnis:
1. Betroffene Templates und JS-Funktionen anpassen.
2. i18n-Schluessel ergaenzen.
3. Lade-, Leer- und Fehlerzustand bauen.
4. Tests fuer Erfolg und mindestens einen Fehlerfall ergaenzen.
```

### 3. Corporate-Design-UI vereinheitlichen

```text
Pruefe folgende UI-Bereiche auf Corporate-Design-Konsistenz: [Bereiche].

Ziel:
Alle Popups, Dropdowns, Buttons, Inputs, Kalender, Karten und Notifications sollen dieselben lokalen Designmuster verwenden.

Pruefkriterien:
- Keine Sonderloesungen fuer Modals, wenn ein Standard-Modal existiert.
- Dropdowns duerfen nicht parallel offen bleiben.
- Buttons behalten stabile Hoehe, Farbe und Textlesbarkeit.
- Text und Icons duerfen bei langen Inhalten nicht ueberlaufen.
- Overlays dunkeln den gesamten Viewport einheitlich ab.
```

### 4. Startseite und Suche verbessern

```text
Optimiere Startseite und Suche fuer Pawsitters.

Ziele:
- Startseite zeigt echte Angebote und klare Einstiegspunkte.
- Suche fuehrt auf eine eigene Ergebnisroute.
- Angebotskarten, Filter und Details funktionieren mit echten API-Daten.
- Karussells sind smooth, responsiv und layoutstabil.

Tests:
- Startseite laedt Angebote.
- Suche mit Ort/Tierart fuehrt zur passenden Ergebnisansicht.
- Angebotsdetail laesst sich oeffnen.
- Karussellnavigation funktioniert ohne abgeschnittene Karten.
```

### 5. Profil-, Haustier- und Angebotsbereiche erweitern

```text
Erweitere die Profilbereiche im Pawsitters-Frontend.

Funktionen:
- Oeffentliche Profilansicht.
- Eigene Einstellungen.
- Haustierverwaltung.
- Eigene Betreuungspakete.
- Bewertungsanzeige und Review-Aktionen.

Wichtig:
- Keine sensiblen Kontaktdaten unnoetig auf oeffentlichen Profilen anzeigen.
- Uploads muessen zur Backend-Implementierung passen.
- Formulare brauchen klares Validierungsfeedback.
- Tabs, Karten und leere Zustaende muessen konsistent aussehen.
```

### 6. Chat-UI stabilisieren

```text
Stabilisiere die Chat-Oberflaeche.

Pruefe:
- Kontaktliste und Chatfenster haben konstante Hoehen.
- Nachrichten werden korrekt formatiert.
- Angebotsanfragen erscheinen als strukturierte Nachricht.
- Bildanhaenge haben eine stabile Vollbildansicht.
- Header-Aktionen und Dropdowns sind korrekt ausgerichtet.
- Enter sendet Nachrichten, Fokus wird sinnvoll gesetzt.

Ergaenze Tests oder Smoke-Checks fuer die wichtigsten Chat-Flows.
```

### 7. Internationalisierung systematisch pruefen

```text
Pruefe das Frontend systematisch auf harte Texte und fehlende Uebersetzungen.

Sprachen:
- Deutsch
- Englisch
- Rumaenisch

Aufgaben:
1. Alle Templates, Popups und JS-Notifications pruefen.
2. Fehlende Locale-Keys in allen drei Dateien ergaenzen.
3. Lange Uebersetzungen in Buttons, Karten und Modals beruecksichtigen.
4. Sprachwechsel manuell oder per Test pruefen.
```

### 8. CI- und Playwright-Fehler beheben

```text
Analysiere folgenden Frontend-CI- oder Playwright-Fehler: [Fehler/Log].

Vorgehen:
1. Fehlerlog lesen und betroffene Tests identifizieren.
2. Lokale Ursache im Frontend-Code suchen.
3. Keine Tests blind abschwaechen.
4. UI- oder Selektorfehler robust beheben.
5. Relevante Tests lokal ausfuehren und Ergebnis dokumentieren.
```

### 9. Dokumentation aktualisieren

```text
Aktualisiere die Projektdokumentation fuer folgenden Frontend-Bereich: [Bereich].

Nutze nur vorhandene Implementierung als Quelle.

Dokumentiere:
- Zweck der Funktion.
- Betroffene Dateien.
- API-Anbindung.
- Tests und bekannte Grenzen.
- KI-Einsatz nur zusammengefasst, nicht als Rohpromptliste.
```

## Gute Prompt-Bausteine aus der Historie

- "Gucke dir zuerst genau an, wie es im Backend umgesetzt wurde."
- "Nutze das bestehende Corporate Design und keine Sonderloesung."
- "Denke an Uebersetzungen in alle Sprachen."
- "Baue passende Frontend-Tests mit ein."
- "Keine Fallbackdaten, wenn echte Daten erwartet werden."
- "Pruefe systematisch Frontend und Backend, bevor du etwas aenderst."
- "Aendere nur den betroffenen Bereich und lasse andere Positionen/Layouts unveraendert."
- "Sorge dafuer, dass Mobile und Desktop nicht brechen."

## Qualitaetsregeln fuer kuenftige KI-Nutzung

1. Kontext nennen: relevante Route, Datei, API und UI-Zustand angeben.
2. Akzeptanzkriterien formulieren: erwartetes Verhalten, leere Zustaende, Fehlerfaelle und Tests beschreiben.
3. Projektkonventionen erzwingen: Corporate Design, i18n, API-Envelope, Auth-Status und vorhandene Komponenten.
4. Verifikation verlangen: Build, Playwright, Node-Test oder manueller Smoke-Check.
5. Sicherheit beachten: keine Tokens, Passwoerter, privaten Keys oder unnoetigen personenbezogenen Daten in Prompts.
6. Wiederholte Bugs konkret benennen: Screenshots, Logauszug, Route und erwartetes Verhalten helfen mehr als "geht nicht".

## Abdeckungsnachweis

| Datum | Anzahl Chats | Hauptthemen |
| --- | ---: | --- |
| 11.05.2026 | 14 | Login, Registrierung, Header, Profilroute, CI-Fehler, Dropdowns |
| 12.05.2026 | 18 | Footer, Settings, i18n, Notifications, Popups, Routen, geschuetzte Seiten |
| 13.05.2026 | 18 | Haustiere, Profilbilder, Profile, eigene Angebote, Popups, Icons |
| 14.05.2026 | 8 | Kalender, Offer-Flow, Passworttexte, Startseitenangebote, Karussell |
| 18.05.2026 | 11 | Deployment, Suche, Messages, Header, Fonts, Carousels, Popups |
| 19.05.2026 | 31 | Chat, Startseite, Karussells, Pipeline, Header-Suche, Tests |
| 20.05.2026 | 7 | Chat-Dropdown, Availability-Kontext, Slides, Frontend-Analyse, Codezeilen, Tests |
| 21.05.2026 | 1 | KI-Prompt-Dokumentation |
| 18.06.2026 | 1 | Reviews und Bewertungen im Frontend |
| 19.06.2026 | 2 | Konsolidierung der KI-Frontend-Prompts |

Damit sind alle lokal auffindbaren Codex-Chats dieses Projektordners vom 11.05.2026 bis 19.06.2026 in frontendbezogener, datierter und professionell verdichteter Form dokumentiert.
