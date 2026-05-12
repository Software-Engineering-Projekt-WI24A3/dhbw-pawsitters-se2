import { promises as fs } from 'node:fs';
import path from 'node:path';

const PET_CHOICE_ENUM_PATTERN = /public\s+enum\s+PetChoice\s*\{([\s\S]*?)\}/m;
const PET_CHOICES_FALLBACK_RELATIVE_PATH = path.join('assets', 'data', 'pet-choices.json');
const REGIONAL_INDICATOR_A = 0x1F1E6;
const REGIONAL_INDICATOR_Z = 0x1F1FF;
const PHONE_COUNTRY_PREFIX_ENTRIES = [
  { code: 'DE', dialCode: '49', name: 'Deutschland' },
  { code: 'US', dialCode: '1', name: 'United States' },
  { code: 'RO', dialCode: '40', name: 'Romania' }
];

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

function normalizePetChoices(rawValues, sourceDescription) {
  if (!Array.isArray(rawValues)) {
    throw new Error(`Pet choices from ${sourceDescription} are invalid: expected an array.`);
  }

  const choices = [];
  const seen = new Set();

  for (const value of rawValues) {
    const normalized = typeof value === 'string' ? value.trim().toUpperCase() : '';
    if (!/^[A-Z][A-Z0-9_]*$/.test(normalized) || seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);
    choices.push(normalized);
  }

  if (!choices.length) {
    throw new Error(`Pet choices from ${sourceDescription} are empty or malformed.`);
  }

  return choices;
}

function parsePetChoicesFromBackendSource(source) {
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

  return normalizePetChoices(rawConstants, 'backend PetChoice enum');
}

function parsePetChoicesFallback(source, fallbackFilePath) {
  let payload;
  try {
    payload = JSON.parse(source);
  } catch (error) {
    throw new Error(
      `Cannot parse fallback pet choices JSON at ${fallbackFilePath}: ${error.message}`,
      { cause: error }
    );
  }

  return normalizePetChoices(payload?.choices, `fallback file ${fallbackFilePath}`);
}

function resolveBackendPetChoicePath(frontendRootDir) {
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

  return petChoiceFilePath;
}

async function loadPetChoicesFromBackend(frontendRootDir) {
  const petChoiceFilePath = resolveBackendPetChoicePath(frontendRootDir);
  const source = await fs.readFile(petChoiceFilePath, 'utf8');
  return parsePetChoicesFromBackendSource(source);
}

async function loadPetChoicesFromFallback(frontendRootDir) {
  const fallbackFilePath = path.join(frontendRootDir, PET_CHOICES_FALLBACK_RELATIVE_PATH);
  const source = await fs.readFile(fallbackFilePath, 'utf8');
  return parsePetChoicesFallback(source, fallbackFilePath);
}

export async function loadPetChoices(frontendRootDir) {
  try {
    return await loadPetChoicesFromBackend(frontendRootDir);
  } catch (error) {
    if (error?.code !== 'ENOENT') {
      throw error;
    }

    const backendPath = resolveBackendPetChoicePath(frontendRootDir);
    const fallbackChoices = await loadPetChoicesFromFallback(frontendRootDir);
    console.warn(
      `[search-data] Backend source missing (${backendPath}); using fallback ${PET_CHOICES_FALLBACK_RELATIVE_PATH}.`
    );
    return fallbackChoices;
  }
}

export async function loadPhoneCountryPrefixEntries(frontendRootDir) {
  const availableFlags = await loadCountryFlagEntries(frontendRootDir);
  const flagPathByCountryCode = new Map(
    availableFlags.map((country) => [country.code, country.flagPath])
  );

  return PHONE_COUNTRY_PREFIX_ENTRIES.map((entry) => {
    const normalizedCode = toUpperAlphaCountryCode(entry.code);
    const fallbackFlagPath = `/assets/media/country-flag/${countryCodeToFlagFileName(normalizedCode)}`;

    return {
      code: normalizedCode,
      dialCode: String(entry.dialCode).trim(),
      name: String(entry.name || '').trim(),
      flagPath: flagPathByCountryCode.get(normalizedCode) || fallbackFlagPath
    };
  }).filter((entry) => entry.code && entry.dialCode);
}
