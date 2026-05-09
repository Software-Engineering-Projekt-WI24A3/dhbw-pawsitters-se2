# CI/CD-Konzept

## Zielbild

Pawsitters nutzt GitHub Actions als CI/CD-Plattform. Pull Requests und Pushes pruefen Backend und Frontend automatisch. Deployments werden erst nach erfolgreichem Build kontrolliert auf eine Demo-/Staging-Umgebung ausgerollt.

## Pipeline

- `Pawsitters CI`: baut und testet Backend mit Java 17/Maven sowie Frontend mit Node.js 22, Tailwind, Thymeleaf-Checks und Playwright.
- `Pawsitters Container Images`: baut reproduzierbare Docker Images fuer Backend und Frontend, pusht sie nach GHCR und prueft sie mit Docker Compose per Smoke Test.
- `Pawsitters Staging Deploy`: deployt per SSH auf einen Demo-Host. Automatisch nach erfolgreicher Container-Pipeline auf `develop`, oder manuell per `workflow_dispatch`.

## Docker

Docker ist fuer dieses Projekt sinnvoll, weil es eine einheitliche Laufzeit fuer Spring Boot und das statische Frontend bereitstellt. Der Staging-Host muss dadurch nur Docker Compose ausfuehren und keine lokale Java-, Maven- oder Node-Installation pflegen.

Die Images sind:

- `ghcr.io/software-engineering-projekt-wi24a3/dhbw-pawsitters-se2-backend:<tag>`
- `ghcr.io/software-engineering-projekt-wi24a3/dhbw-pawsitters-se2-frontend:<tag>`

## Kubernetes-Entscheidung

Kubernetes wird fuer v1 nicht eingefuehrt. Das Projekt ist aktuell ein monolithisches MVC-System mit H2-Demo-Datenbank und einem kleinen Team. Kubernetes wuerde Cluster-Betrieb, Ingress, Secrets, Volumes, Manifests und Rollout-Komplexitaet einfuehren, ohne dass die Anwendung diese Orchestrierung aktuell braucht.

Ein Wechsel zu Kubernetes ist spaeter sinnvoll, wenn echte Produktionsanforderungen entstehen: mehrere Replikas, Rolling Updates, automatisches Self-Healing, zentrales Secret-/Config-Management, persistente Volumes oder ein bereits vorhandenes Cluster.

## Repo-Einstellungen

In GitHub sollten `develop` und `main` per Branch Protection geschuetzt werden:

- Pull Request vor Merge erforderlich
- Status Checks `Backend build and tests` und `Frontend build and tests` erforderlich
- keine direkten Pushes auf `main`

Fuer Staging werden diese Secrets benoetigt:

- `JWT_SECRET`
- `STAGING_HOST`
- `STAGING_USER`
- `STAGING_SSH_KEY`

Optional bei privaten GHCR-Packages:

- `GHCR_USERNAME`
- `GHCR_TOKEN`
