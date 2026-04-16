import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildPreview } from './lib/thymeleaf-preview.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

async function main() {
  await buildPreview(rootDir);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
