Frontend-only workspace for Pawsitters.

Structure:
- `src/templates/` shared layout and page templates
- `src/locales/` i18n keys for all supported languages
- `src/tailwind/` design system source styles
- `src/js/` Vue behavior
- `src/media/` source images and icons
- `scripts/` build, check, serve, and dev runtime scripts
- `dist/` generated frontend output (HTML routes + `/assets/**`)
- `tests/e2e/` Playwright E2E checks
- `tests/*.test.mjs` data/snapshot validation checks

Start local development with `npm i` and `npm run dev`.
Create production-ready static files with `npm run build`.
