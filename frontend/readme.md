Frontend-only workspace for Pawsitters.

Structure:
- `src/templates/` shared layout and page templates
- `src/locales/` i18n content for `/de/`, `/en/`, and future languages
- `src/tailwind/` design system source
- `src/js/` Vue behavior
- `assets/` built CSS, JS, vendor files, and media
- `tests/e2e/` Playwright E2E checks
- `tests/*.test.mjs` data/snapshot validation checks

Start local development with `npm i` and `npm run dev`.
Create production-ready static files with `npm run build`.
