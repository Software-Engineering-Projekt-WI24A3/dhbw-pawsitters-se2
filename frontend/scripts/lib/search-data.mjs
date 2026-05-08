import { promises as fs } from 'node:fs';
import path from 'node:path';

const PET_CHOICE_ENUM_PATTERN = /public\s+enum\s+PetChoice\s*\{([\s\S]*?)\}/m;
const REGIONAL_INDICATOR_A = 0x1F1E6;
const REGIONAL_INDICATOR_Z = 0x1F1FF;

function removeJavaComments(value) {
  if (typeof value !== 'string') {
    return '';
  }

  return value
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '');
}

function splitJavaTopLevelByComma(value) {
  if (typeof value !== 'string' || !value.trim()) {
    return [];
  }

  const segments = [];
  let current = '';
  let parenDepth = 0;
  let braceDepth = 0;
  let bracketDepth = 0;
  let inString = false;
  let stringQuote = '';
  let escaped = false;

  for (const char of value) {
    if (inString) {
      current += char;

      if (escaped) {
        escaped = false;
        continue;
      }

      if (char === '\\') {
        escaped = true;
        continue;
      }

      if (char === stringQuote) {
        inString = false;
        stringQuote = '';
      }

      continue;
    }

    if (char === '"' || char === '\'') {
      inString = true;
      stringQuote = char;
      current += char;
      continue;
    }

    if (char === '(') {
      parenDepth += 1;
      current += char;
      continue;
    }

    if (char === ')') {
      if (parenDepth > 0) {
        parenDepth -= 1;
      }
      current += char;
      continue;
    }

    if (char === '{') {
      braceDepth += 1;
      current += char;
      continue;
    }

    if (char === '}') {
      if (braceDepth > 0) {
        braceDepth -= 1;
      }
      current += char;
      continue;
    }

    if (char === '[') {
      bracketDepth += 1;
      current += char;
      continue;
    }

    if (char === ']') {
      if (bracketDepth > 0) {
        bracketDepth -= 1;
      }
      current += char;
      continue;
    }

    if (char === ',' && parenDepth === 0 && braceDepth === 0 && bracketDepth === 0) {
      const segment = current.trim();
      if (segment) {
        segments.push(segment);
      }
      current = '';
      continue;
    }

    current += char;
  }

  const trailingSegment = current.trim();
  if (trailingSegment) {
    segments.push(trailingSegment);
  }

  return segments;
}

function extractJavaEnumConstantName(value) {
  if (typeof value !== 'string') {
    return '';
  }

  const withoutAnnotations = value.replace(/^(?:\s*@[\w.]+(?:\([^)]*\))?\s*)+/, '').trim();
  const match = withoutAnnotations.match(/^[A-Z][A-Z0-9_]*(?=\s*(?:$|\(|\{))/);
  return match ? match[0] : '';
}

function toUpperAlphaCountryCode(value) {
  if (typeof value !== 'string') {
    return '';
  }

  const normalized = value.trim().toUpperCase();
  return /^[A-Z]{2}$/.test(normalized) ? normalized : '';
}

function parseFlagFileToCountryCode(fileName) {
  if (typeof fileName !== 'string' || !fileName.toLowerCase().endsWith('.svg')) {
    return '';
  }

  const baseName = fileName.slice(0, -4);
  const parts = baseName.split('-');
  if (parts.length !== 2) {
    return '';
  }

  const letters = parts.map((part) => {
    const codepoint = Number.parseInt(part, 16);
    if (!Number.isFinite(codepoint) || codepoint < REGIONAL_INDICATOR_A || codepoint > REGIONAL_INDICATOR_Z) {
      return '';
    }

    return String.fromCharCode(65 + (codepoint - REGIONAL_INDICATOR_A));
  });

  if (letters.includes('')) {
    return '';
  }

  return letters.join('');
}

export function countryCodeToFlagFileName(countryCode) {
  const normalized = toUpperAlphaCountryCode(countryCode);
  if (!normalized) {
    return '';
  }

  const codepoints = normalized
    .split('')
    .map((letter) => REGIONAL_INDICATOR_A + (letter.charCodeAt(0) - 65))
    .map((codepoint) => codepoint.toString(16).toUpperCase());

  return `${codepoints[0]}-${codepoints[1]}.svg`;
}

export async function loadCountryFlagEntries(frontendRootDir) {
  const flagsDirectory = path.join(frontendRootDir, 'src', 'media', 'country-flag');
  const entries = await fs.readdir(flagsDirectory, { withFileTypes: true });
  const countriesByCode = new Map();

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.toLowerCase().endsWith('.svg')) {
      continue;
    }

    const code = parseFlagFileToCountryCode(entry.name);
    if (!code || countriesByCode.has(code)) {
      continue;
    }

    countriesByCode.set(code, {
      code,
      flagPath: `/assets/media/country-flag/${entry.name}`
    });
  }

  return Array.from(countriesByCode.values()).sort((left, right) => left.code.localeCompare(right.code));
}

export async function loadPetChoices(frontendRootDir) {
  const petChoiceFilePath = path.resolve(
    frontendRootDir,
    '..',
    'backend',
    'src',
    'main',
    'java',
    'com',
    'pawsitters',
    'model',
    'PetChoice.java'
  );

  const source = await fs.readFile(petChoiceFilePath, 'utf8');
  const match = source.match(PET_CHOICE_ENUM_PATTERN);
  if (!match) {
    throw new Error('Unable to parse PetChoice enum from backend source file.');
  }

  const enumBody = removeJavaComments(match[1]);
  const enumConstantsSection = enumBody.includes(';')
    ? enumBody.slice(0, enumBody.indexOf(';'))
    : enumBody;

  const rawConstants = splitJavaTopLevelByComma(enumConstantsSection)
    .map((value) => extractJavaEnumConstantName(value))
    .filter(Boolean);

  const choices = [];
  const seen = new Set();

  for (const value of rawConstants) {
    const normalized = value.toUpperCase();
    if (!/^[A-Z][A-Z0-9_]*$/.test(normalized) || seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);
    choices.push(normalized);
  }

  if (!choices.length) {
    throw new Error('PetChoice enum parsing returned no values.');
  }

  return choices;
}
