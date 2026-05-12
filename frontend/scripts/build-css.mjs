import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const watchMode = process.argv.includes('--watch');
const minifyOutput = process.argv.includes('--minify') || !watchMode;

const cssEntries = [
  {
    input: './src/tailwind/site.base.css',
    output: './dist/assets/css/site-base.css'
  },
  {
    input: './src/tailwind/site.components.css',
    output: './dist/assets/css/site-components.css'
  },
  {
    input: './src/tailwind/site.utilities.css',
    output: './dist/assets/css/site-utilities.css'
  }
];

function binPath(name) {
  const executable = process.platform === 'win32' ? `${name}.cmd` : name;
  return path.join(rootDir, 'node_modules', '.bin', executable);
}

function resolveTailwindCommand() {
  const primaryBin = binPath('tailwindcss');
  if (existsSync(primaryBin)) {
    return {
      command: primaryBin,
      argsPrefix: [],
      source: 'tailwindcss'
    };
  }

  const legacyBin = binPath('tailwind');
  if (existsSync(legacyBin)) {
    return {
      command: legacyBin,
      argsPrefix: [],
      source: 'tailwind'
    };
  }

  const scopedCliEntry = path.join(rootDir, 'node_modules', '@tailwindcss', 'cli', 'dist', 'index.mjs');
  if (existsSync(scopedCliEntry)) {
    return {
      command: process.execPath,
      argsPrefix: [scopedCliEntry],
      source: '@tailwindcss/cli'
    };
  }

  throw new Error(
    [
      'Tailwind CLI not found in this frontend install.',
      'Expected one of:',
      `- ${primaryBin}`,
      `- ${legacyBin}`,
      `- ${scopedCliEntry}`,
      '',
      'Fix:',
      '1) Ensure you are in the frontend folder.',
      '2) Run `rm -rf node_modules package-lock.json && npm install`.'
    ].join('\n')
  );
}

function runProcess(command, args, label) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: rootDir,
      stdio: 'inherit'
    });

    child.on('error', (error) => {
      reject(new Error(`${label} failed to start: ${error.message}`));
    });

    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${label} failed with exit code ${code ?? 'unknown'}`));
    });
  });
}

async function writeCssAggregateFile() {
  const aggregatePath = path.join(rootDir, 'dist', 'assets', 'css', 'site.css');
  const content = [
    '@import "./site-base.css";',
    '@import "./site-components.css";',
    '@import "./site-utilities.css";',
    ''
  ].join('\n');

  await fs.writeFile(aggregatePath, content, 'utf8');
}

async function buildOnce(tailwindCommand) {
  await fs.mkdir(path.join(rootDir, 'dist', 'assets', 'css'), { recursive: true });

  for (const entry of cssEntries) {
    const args = [
      '-c',
      'tailwind.config.js',
      '-i',
      entry.input,
      '-o',
      entry.output
    ];

    if (minifyOutput) {
      args.push('--minify');
    }

    await runProcess(
      tailwindCommand.command,
      [...tailwindCommand.argsPrefix, ...args],
      `tailwind build (${tailwindCommand.source}): ${entry.output}`
    );
  }

  await writeCssAggregateFile();
}

function startWatchers(tailwindCommand) {
  const watchers = cssEntries.map((entry) => {
    const args = [
      '-c',
      'tailwind.config.js',
      '-i',
      entry.input,
      '-o',
      entry.output,
      '--watch'
    ];

    const child = spawn(tailwindCommand.command, [...tailwindCommand.argsPrefix, ...args], {
      cwd: rootDir,
      stdio: 'inherit'
    });

    child.on('error', (error) => {
      console.error(`tailwind watch failed to start (${tailwindCommand.source}, ${entry.output}): ${error.message}`);
      process.exit(1);
    });

    return child;
  });

  const shutdown = () => {
    watchers.forEach((watcher) => watcher.kill('SIGTERM'));
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

async function main() {
  const tailwindCommand = resolveTailwindCommand();
  await buildOnce(tailwindCommand);

  if (watchMode) {
    startWatchers(tailwindCommand);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
