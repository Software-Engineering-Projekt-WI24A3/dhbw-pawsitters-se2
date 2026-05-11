import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { loadPetChoices } from '../scripts/lib/search-data.mjs';

async function withTempProjectDirectory(callback) {
  const tempRootDir = await mkdtemp(path.join(os.tmpdir(), 'pawsitters-search-data-'));
  try {
    await callback(tempRootDir);
  } finally {
    await rm(tempRootDir, { recursive: true, force: true });
  }
}

test('loadPetChoices reads and normalizes values from backend enum when backend is available', async () => {
  await withTempProjectDirectory(async (tempRootDir) => {
    const frontendRootDir = path.join(tempRootDir, 'frontend');
    const backendEnumPath = path.join(
      tempRootDir,
      'backend',
      'src',
      'main',
      'java',
      'com',
      'pawsitters',
      'model',
      'PetChoice.java'
    );

    await mkdir(path.dirname(backendEnumPath), { recursive: true });
    await mkdir(frontendRootDir, { recursive: true });
    await writeFile(
      backendEnumPath,
      [
        'package com.pawsitters.model;',
        '',
        'public enum PetChoice {',
        '  DOG("dog"),',
        '  CAT("cat"),',
        '  PARROT("parrot");',
        '}'
      ].join('\n'),
      'utf8'
    );

    const choices = await loadPetChoices(frontendRootDir);
    assert.deepEqual(choices, ['DOG', 'CAT', 'PARROT']);
  });
});

test('loadPetChoices falls back to frontend assets data when backend source is unavailable', async () => {
  await withTempProjectDirectory(async (tempRootDir) => {
    const frontendRootDir = path.join(tempRootDir, 'frontend');
    const fallbackPath = path.join(frontendRootDir, 'assets', 'data', 'pet-choices.json');

    await mkdir(path.dirname(fallbackPath), { recursive: true });
    await writeFile(
      fallbackPath,
      `${JSON.stringify({ choices: ['dog', 'cat', 'cat', 'invalid value', 'parrot'] }, null, 2)}\n`,
      'utf8'
    );

    const warnings = [];
    const originalWarn = console.warn;
    console.warn = (message) => warnings.push(String(message));

    try {
      const choices = await loadPetChoices(frontendRootDir);
      assert.deepEqual(choices, ['DOG', 'CAT', 'PARROT']);
      assert.equal(warnings.length, 1);
      assert.ok(warnings[0].includes('using fallback'));
    } finally {
      console.warn = originalWarn;
    }
  });
});
