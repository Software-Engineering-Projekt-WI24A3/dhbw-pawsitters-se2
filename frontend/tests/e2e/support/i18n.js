const de = require('../../../src/locales/de.json');
const en = require('../../../src/locales/en.json');
const fr = require('../../../src/locales/fr.json');

const LOCALES = {
  de,
  en,
  fr
};

function resolveLocale(locale) {
  if (typeof locale === 'string') {
    const bundle = LOCALES[locale];
    if (!bundle) {
      throw new Error(`Unknown locale: ${locale}`);
    }
    return bundle;
  }

  return locale;
}

function token(locale, key) {
  const bundle = resolveLocale(locale);
  const value = key.split('.').reduce((current, part) => current?.[part], bundle);

  if (typeof value !== 'string') {
    throw new Error(`Missing locale key: ${key}`);
  }

  return value;
}

module.exports = {
  LOCALES,
  token
};
