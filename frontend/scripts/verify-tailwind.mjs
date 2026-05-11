import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

function binPath(name) {
  const executable = process.platform === 'win32' ? `${name}.cmd` : name;
  return path.join(rootDir, 'node_modules', '.bin', executable);
}

function readJson(filePath, description) {
  try {
    return JSON.parse(readFileSync(filePath, 'utf8'));
  } catch (error) {
    throw new Error(`Cannot parse ${description} at ${filePath}: ${error.message}`);
  }
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

const projectPackageJson = readJson(path.join(rootDir, 'package.json'), 'frontend package.json');
const configuredTailwindVersion = projectPackageJson.devDependencies?.tailwindcss ?? '';
if (!/^3\./.test(configuredTailwindVersion)) {
  fail(
    [
      'Invalid Tailwind configuration in package.json.',
      `Configured value: "${configuredTailwindVersion || '(missing)'}"`,
      'This frontend currently depends on Tailwind v3 (tailwind.config.js + @tailwind directives).',
      'Set devDependencies.tailwindcss to a v3 version (recommended: 3.4.19).'
    ].join('\n')
  );
}

const installedTailwindPackageJsonPath = path.join(rootDir, 'node_modules', 'tailwindcss', 'package.json');
if (!existsSync(installedTailwindPackageJsonPath)) {
  fail(
    [
      'Tailwind package is missing in node_modules.',
      'Run `npm install` in the frontend folder.'
    ].join('\n')
  );
}

const installedTailwindPackageJson = readJson(installedTailwindPackageJsonPath, 'installed tailwindcss package.json');
const installedTailwindVersion = installedTailwindPackageJson.version ?? '';
if (!/^3\./.test(installedTailwindVersion)) {
  fail(
    [
      'Installed Tailwind major version is incompatible with this project.',
      `Installed version: "${installedTailwindVersion || '(unknown)'}"`,
      'Expected: v3.x (project uses Tailwind v3 configuration).',
      'Fix: `npm install --save-dev --save-exact tailwindcss@3.4.19`'
    ].join('\n')
  );
}

if (!existsSync(binPath('tailwindcss')) && !existsSync(binPath('tailwind'))) {
  fail(
    [
      'Tailwind CLI binary is missing from node_modules/.bin.',
      'Fix:',
      '1) Ensure you are in the frontend folder.',
      '2) Run `rm -rf node_modules package-lock.json && npm install`.'
    ].join('\n')
  );
}

console.log(`Tailwind check passed (configured ${configuredTailwindVersion}, installed ${installedTailwindVersion}).`);
