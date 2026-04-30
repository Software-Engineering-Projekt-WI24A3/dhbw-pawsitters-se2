import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildPreview, defaultLocale, supportedLocales, validatePreview } from './lib/thymeleaf-preview.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

async function main() {
  await buildPreview(rootDir);
  const results = await validatePreview(rootDir);

  assert.equal(results.length, 6);
  assert.ok(results.find((entry) => entry.locale === defaultLocale && entry.pageKey === 'home'));
  assert.ok(results.find((entry) => entry.pageKey === 'register'));
  assert.ok(results.find((entry) => entry.pageKey === 'repositoryGit'));
  assert.ok(results.find((entry) => entry.pageKey === 'repositoryPlaywright'));
  assert.ok(results.find((entry) => entry.pageKey === 'repositoryKanban'));
  assert.ok(results.find((entry) => entry.pageKey === 'notFound'));

  for (const entry of results) {
    assert.match(entry.html, /<main[^>]*class="main_container site_main"/);
    if (entry.pageKey === 'notFound') {
      assert.doesNotMatch(entry.html, /<footer[^>]*class="main_container site_footer"/);
      continue;
    }
    assert.match(entry.html, /<footer[^>]*class="main_container site_footer"/);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
