import { load } from 'cheerio';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { loadRepositorySnapshot, localizeRepositorySnapshot } from './repository-snapshot.mjs';

export const supportedLocales = ['de', 'en', 'fr'];
export const defaultLocale = 'de';

const templateCache = new Map();
const fragmentCache = new Map();
const messageCache = new Map();
const localeTokenPattern = /^[A-Za-z0-9]+(?:[._-][A-Za-z0-9]+)+$/;
const localizedAttributeNames = new Set(['aria-label', 'placeholder', 'title', 'alt', 'value']);
const pageDefinitions = [
  { key: 'home', templatePath: 'pages/home.html' },
  { key: 'login', templatePath: 'pages/login.html' },
  { key: 'register', templatePath: 'pages/register.html' },
  { key: 'repositoryGit', templatePath: 'pages/repository-git.html' },
  { key: 'repositoryPlaywright', templatePath: 'pages/repository-playwright.html' },
  { key: 'repositoryKanban', templatePath: 'pages/repository-kanban.html' }
];
const routeToPageKey = new Map([
  ['/', 'home'],
  ['/login', 'login'],
  ['/register', 'register'],
  ['/repository/git', 'repositoryGit'],
  ['/repository/playwright', 'repositoryPlaywright'],
  ['/repository/kanban', 'repositoryKanban']
]);

function isFragmentRef(value) {
  return Boolean(value && typeof value === 'object' && value.kind === 'fragment-ref');
}

function splitTopLevel(input, separator = ',') {
  const parts = [];
  let current = '';
  let depthParen = 0;
  let depthBrace = 0;
  let inSingleQuote = false;

  for (let index = 0; index < input.length; index += 1) {
    const character = input[index];
    const nextCharacter = input[index + 1];

    if (character === "'" && input[index - 1] !== '\\') {
      inSingleQuote = !inSingleQuote;
      current += character;
      continue;
    }

    if (!inSingleQuote) {
      if (character === '(') {
        depthParen += 1;
      } else if (character === ')') {
        depthParen -= 1;
      } else if (character === '{') {
        depthBrace += 1;
      } else if (character === '}') {
        depthBrace -= 1;
      }

      if (
        separator.length === 2 &&
        character === separator[0] &&
        nextCharacter === separator[1] &&
        depthParen === 0 &&
        depthBrace === 0
      ) {
        parts.push(current.trim());
        current = '';
        index += 1;
        continue;
      }

      if (
        separator.length === 1 &&
        character === separator &&
        depthParen === 0 &&
        depthBrace === 0
      ) {
        parts.push(current.trim());
        current = '';
        continue;
      }
    }

    current += character;
  }

  if (current.trim()) {
    parts.push(current.trim());
  }

  return parts;
}

function hasOwnEntry(object, key) {
  return Object.prototype.hasOwnProperty.call(object, key);
}

function flattenMessages(value, prefix = '', result = {}) {
  if (Array.isArray(value)) {
    throw new Error(`Locale JSON must not contain arrays at "${prefix || '<root>'}"`);
  }

  if (value && typeof value === 'object') {
    for (const [key, childValue] of Object.entries(value)) {
      const nextPrefix = prefix ? `${prefix}.${key}` : key;
      flattenMessages(childValue, nextPrefix, result);
    }
    return result;
  }

  if (!prefix) {
    throw new Error('Locale JSON root must be an object');
  }

  result[prefix] = value;
  return result;
}

function getMessage(messages, key) {
  if (!hasOwnEntry(messages, key)) {
    throw new Error(`Missing message key: ${key}`);
  }

  return messages[key];
}

function normalizeTextContent(value) {
  return value.replace(/\s+/g, ' ').trim();
}

function isTokenPlaceholder(value) {
  return localeTokenPattern.test(value);
}

function resolveLocaleAssetCandidates(rootDir, assetPath) {
  const sanitizedAssetPath = assetPath.replace(/^\/+/, '');
  const candidates = [path.join(rootDir, sanitizedAssetPath)];

  if (sanitizedAssetPath.startsWith('assets/media/country-flag/')) {
    candidates.push(
      path.join(
        rootDir,
        sanitizedAssetPath.replace(/^assets\/media\/country-flag\//, 'src/media/country-flag/')
      )
    );
  }

  return candidates;
}

async function walkFiles(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await walkFiles(entryPath));
      continue;
    }

    if (entry.isFile()) {
      files.push(entryPath);
    }
  }

  return files;
}

async function readTemplate(rootDir, templatePath) {
  const cacheKey = `${rootDir}::${templatePath}`;
  if (templateCache.has(cacheKey)) {
    return templateCache.get(cacheKey);
  }

  const absolutePath = path.join(rootDir, 'src', 'templates', templatePath);
  const content = await fs.readFile(absolutePath, 'utf8');
  templateCache.set(cacheKey, content);
  return content;
}

async function loadMessages(rootDir, locale) {
  const cacheKey = `${rootDir}::${locale}`;
  if (messageCache.has(cacheKey)) {
    return messageCache.get(cacheKey);
  }

  const localeMessagesPath = path.join(rootDir, 'src', 'locales', `${locale}.json`);
  const localeContent = await fs.readFile(localeMessagesPath, 'utf8');
  let parsedMessages;

  try {
    parsedMessages = JSON.parse(localeContent);
  } catch (error) {
    throw new Error(`Invalid locale JSON in ${localeMessagesPath}: ${error.message}`);
  }

  const messages = flattenMessages(parsedMessages);

  messageCache.set(cacheKey, messages);
  return messages;
}

export async function validateLocaleResources(rootDir) {
  const localeMessages = Object.fromEntries(await Promise.all(
    supportedLocales.map(async (locale) => [locale, await loadMessages(rootDir, locale)])
  ));
  const referenceLocale = supportedLocales[0];
  const referenceKeys = Object.keys(localeMessages[referenceLocale]).sort();
  const referenceKeySet = new Set(referenceKeys);

  for (const locale of supportedLocales.slice(1)) {
    const localeKeys = Object.keys(localeMessages[locale]).sort();
    const localeKeySet = new Set(localeKeys);
    const missingKeys = referenceKeys.filter((key) => !localeKeySet.has(key));
    const extraKeys = localeKeys.filter((key) => !referenceKeySet.has(key));

    if (missingKeys.length || extraKeys.length) {
      throw new Error(
        [
          `Locale key mismatch for "${locale}" compared to "${referenceLocale}".`,
          missingKeys.length ? `Missing keys: ${missingKeys.join(', ')}` : null,
          extraKeys.length ? `Extra keys: ${extraKeys.join(', ')}` : null
        ].filter(Boolean).join('\n')
      );
    }
  }

  for (const locale of supportedLocales) {
    const messages = localeMessages[locale];

    for (const localeOption of supportedLocales) {
      getMessage(messages, `locale.${localeOption}.code`);
      getMessage(messages, `locale.${localeOption}.label`);
      const flagPath = getMessage(messages, `locale.${localeOption}.flagPath`);
      const candidatePaths = resolveLocaleAssetCandidates(rootDir, flagPath);
      let flagExists = false;

      for (const candidatePath of candidatePaths) {
        try {
          await fs.access(candidatePath);
          flagExists = true;
          break;
        } catch {
          continue;
        }
      }

      if (!flagExists) {
        throw new Error(`Missing locale flag asset for "${locale}.${localeOption}": ${flagPath}`);
      }
    }
  }
}

export async function validateSourceTemplates(rootDir) {
  const templateDirectory = path.join(rootDir, 'src', 'templates');
  const templateFiles = await walkFiles(templateDirectory);
  const issues = [];

  for (const templateFile of templateFiles) {
    const markup = await fs.readFile(templateFile, 'utf8');
    const $ = load(markup, { decodeEntities: false }, isDocumentMarkup(markup));

    $.root().find('*').each((_, element) => {
      if (['script', 'style'].includes(element.tagName)) {
        return;
      }

      const $element = $(element);
      const directTextNodes = $element.contents().toArray().filter((node) => node.type === 'text');

      for (const textNode of directTextNodes) {
        const normalizedText = normalizeTextContent(textNode.data ?? '');

        if (!normalizedText || !/\p{L}/u.test(normalizedText) || isTokenPlaceholder(normalizedText)) {
          continue;
        }

        issues.push(`${path.relative(rootDir, templateFile)}: hardcoded text "${normalizedText}"`);
      }

      for (const attributeName of localizedAttributeNames) {
        const attributeValue = $element.attr(attributeName);
        const normalizedValue = normalizeTextContent(attributeValue ?? '');

        if (!normalizedValue || !/\p{L}/u.test(normalizedValue) || isTokenPlaceholder(normalizedValue)) {
          continue;
        }

        issues.push(
          `${path.relative(rootDir, templateFile)}: hardcoded ${attributeName}="${normalizedValue}"`
        );
      }
    });
  }

  if (issues.length) {
    const preview = issues.slice(0, 12).join('\n');
    const remainder = issues.length > 12 ? `\n...and ${issues.length - 12} more` : '';
    throw new Error(`Hardcoded localized copy found in source templates:\n${preview}${remainder}`);
  }
}

function normalizeTemplatePath(templateReference) {
  const cleaned = templateReference.trim().replace(/^\/+/, '');
  return cleaned.endsWith('.html') ? cleaned : `${cleaned}.html`;
}

function resolveLocalizedPath(locale, pageKey) {
  const query = locale === defaultLocale ? '' : `?locale=${locale}`;

  switch (pageKey) {
    case 'home':
      return `/${query}`;
    case 'login':
      return `/login${query}`;
    case 'register':
      return `/register${query}`;
    case 'repositoryGit':
      return `/repository/git${query}`;
    case 'repositoryPlaywright':
      return `/repository/playwright${query}`;
    case 'repositoryKanban':
      return `/repository/kanban${query}`;
    default:
      return `/${pageKey}${query}`;
  }
}

function resolveOutputPaths(locale, pageKey) {
  if (locale !== defaultLocale) {
    return [];
  }

  switch (pageKey) {
    case 'home':
      return ['index.html'];
    case 'login':
      return [path.join('login', 'index.html')];
    case 'register':
      return [path.join('register', 'index.html')];
    case 'repositoryGit':
      return [
        path.join('repository', 'git', 'index.html'),
        path.join('git', 'index.html')
      ];
    case 'repositoryPlaywright':
      return [
        path.join('repository', 'playwright', 'index.html'),
        path.join('playwright', 'index.html')
      ];
    case 'repositoryKanban':
      return [
        path.join('repository', 'kanban', 'index.html'),
        path.join('kanban', 'index.html')
      ];
    default:
      return [path.join(pageKey, 'index.html')];
  }
}

function parseFragmentDefinition(definition) {
  const match = definition.trim().match(/^([^(]+?)(?:\((.*)\))?$/);
  if (!match) {
    throw new Error(`Invalid fragment definition: ${definition}`);
  }

  const [, name, parameters] = match;
  const params = parameters ? splitTopLevel(parameters).map((param) => param.trim()) : [];

  return {
    name: name.trim(),
    params
  };
}

async function getFragmentDefinition(rootDir, templatePath, fragmentName) {
  const cacheKey = `${rootDir}::${templatePath}::${fragmentName}`;
  if (fragmentCache.has(cacheKey)) {
    return fragmentCache.get(cacheKey);
  }

  const source = await readTemplate(rootDir, templatePath);
  const $ = load(source, { decodeEntities: false }, isDocumentMarkup(source));
  const candidates = $('[th\\:fragment]');
  let fragment = null;

  candidates.each((_, element) => {
    const definition = $(element).attr('th:fragment');
    if (!definition) {
      return;
    }

    const parsed = parseFragmentDefinition(definition);
    if (parsed.name !== fragmentName) {
      return;
    }

    fragment = {
      html: $.html(element),
      params: parsed.params,
      prependDoctype: /^<!DOCTYPE html>/i.test(source) && element.tagName === 'html'
    };
  });

  if (!fragment) {
    throw new Error(`Fragment "${fragmentName}" not found in template "${templatePath}"`);
  }

  fragmentCache.set(cacheKey, fragment);
  return fragment;
}

function resolveContextValue(token, context) {
  const trimmed = token.trim();
  if (!trimmed) {
    return '';
  }

  if (trimmed === 'true') {
    return true;
  }

  if (trimmed === 'false') {
    return false;
  }

  if (trimmed.startsWith("'") && trimmed.endsWith("'")) {
    return trimmed.slice(1, -1);
  }

  return trimmed.split('.').reduce((current, part) => current?.[part], context);
}

function evaluateMessage(token, messages) {
  const key = token.slice(2, -1).trim();
  return getMessage(messages, key);
}

function findTopLevelTernary(expression) {
  let depthParen = 0;
  let depthBrace = 0;
  let inSingleQuote = false;
  let questionIndex = -1;

  for (let index = 0; index < expression.length; index += 1) {
    const character = expression[index];

    if (character === "'" && expression[index - 1] !== '\\') {
      inSingleQuote = !inSingleQuote;
      continue;
    }

    if (inSingleQuote) {
      continue;
    }

    if (character === '(') {
      depthParen += 1;
      continue;
    }

    if (character === ')') {
      depthParen -= 1;
      continue;
    }

    if (character === '{') {
      depthBrace += 1;
      continue;
    }

    if (character === '}') {
      depthBrace -= 1;
      continue;
    }

    if (depthParen === 0 && depthBrace === 0 && character === '?' && questionIndex === -1) {
      questionIndex = index;
      continue;
    }

    if (depthParen === 0 && depthBrace === 0 && character === ':' && questionIndex !== -1) {
      return {
        condition: expression.slice(0, questionIndex).trim(),
        truthy: expression.slice(questionIndex + 1, index).trim(),
        falsy: expression.slice(index + 1).trim()
      };
    }
  }

  return null;
}

function findTopLevelComparator(expression) {
  const operators = ['==', '!='];
  let depthParen = 0;
  let depthBrace = 0;
  let inSingleQuote = false;

  for (let index = 0; index < expression.length - 1; index += 1) {
    const character = expression[index];

    if (character === "'" && expression[index - 1] !== '\\') {
      inSingleQuote = !inSingleQuote;
      continue;
    }

    if (inSingleQuote) {
      continue;
    }

    if (character === '(') {
      depthParen += 1;
      continue;
    }

    if (character === ')') {
      depthParen -= 1;
      continue;
    }

    if (character === '{') {
      depthBrace += 1;
      continue;
    }

    if (character === '}') {
      depthBrace -= 1;
      continue;
    }

    if (depthParen === 0 && depthBrace === 0) {
      for (const operator of operators) {
        if (expression.slice(index, index + operator.length) === operator) {
          return {
            operator,
            left: expression.slice(0, index).trim(),
            right: expression.slice(index + operator.length).trim()
          };
        }
      }
    }
  }

  return null;
}

function buildUrl(expression, context) {
  const match = expression.match(/^([^()]+?)(?:\((.*)\))?$/);
  if (!match) {
    throw new Error(`Invalid Thymeleaf URL expression: @{${expression}}`);
  }

  const [, rawPath, rawParams] = match;
  let resolvedPath = rawPath.trim();

  if (rawParams) {
    const assignments = splitTopLevel(rawParams);
    for (const assignment of assignments) {
      const [name, valueExpression] = assignment.split('=');
      const value = String(evaluateExpression(valueExpression.trim(), context));
      resolvedPath = resolvedPath.replace(`{${name.trim()}}`, value);
    }
  }

  return resolvedPath;
}

function parseFragmentExpression(expression, currentTemplatePath, context) {
  const inner = expression.slice(2, -1).trim();

  if (inner.startsWith('::')) {
    return {
      kind: 'fragment-ref',
      templatePath: currentTemplatePath,
      fragmentName: inner.slice(2).trim(),
      args: []
    };
  }

  const [templateReference, fragmentCall] = splitTopLevel(inner, '::');
  if (!templateReference || !fragmentCall) {
    throw new Error(`Invalid fragment expression: ${expression}`);
  }

  const match = fragmentCall.match(/^([^(]+?)(?:\((.*)\))?$/);
  if (!match) {
    throw new Error(`Invalid fragment call: ${fragmentCall}`);
  }

  const [, fragmentName, rawArguments] = match;
  const args = rawArguments
    ? splitTopLevel(rawArguments).map((argument) => evaluateExpression(argument, context, currentTemplatePath))
    : [];

  return {
    kind: 'fragment-ref',
    templatePath: normalizeTemplatePath(templateReference),
    fragmentName: fragmentName.trim(),
    args
  };
}

function evaluateExpression(expression, context, currentTemplatePath = 'pages/home.html') {
  const trimmed = expression.trim();

  const ternary = findTopLevelTernary(trimmed);
  if (ternary) {
    return evaluateExpression(ternary.condition, context, currentTemplatePath)
      ? evaluateExpression(ternary.truthy, context, currentTemplatePath)
      : evaluateExpression(ternary.falsy, context, currentTemplatePath);
  }

  const comparator = findTopLevelComparator(trimmed);
  if (comparator) {
    const left = evaluateExpression(comparator.left, context, currentTemplatePath);
    const right = evaluateExpression(comparator.right, context, currentTemplatePath);
    return comparator.operator === '==' ? left === right : left !== right;
  }

  if (trimmed.startsWith('#{') && trimmed.endsWith('}')) {
    return evaluateMessage(trimmed, context.__messages);
  }

  if (trimmed.startsWith('${') && trimmed.endsWith('}')) {
    return evaluateExpression(trimmed.slice(2, -1), context, currentTemplatePath);
  }

  if (trimmed.startsWith('@{') && trimmed.endsWith('}')) {
    return buildUrl(trimmed.slice(2, -1), context);
  }

  if (trimmed.startsWith('~{') && trimmed.endsWith('}')) {
    return parseFragmentExpression(trimmed, currentTemplatePath, context);
  }

  return resolveContextValue(trimmed, context);
}

async function renderFragmentRef(rootDir, fragmentRef, context) {
  const definition = await getFragmentDefinition(rootDir, fragmentRef.templatePath, fragmentRef.fragmentName);
  const fragmentContext = { ...context };

  definition.params.forEach((parameter, index) => {
    fragmentContext[parameter] = fragmentRef.args[index];
  });

  const rendered = await renderMarkup(rootDir, definition.html, fragmentRef.templatePath, fragmentContext);
  return definition.prependDoctype && !rendered.startsWith('<!DOCTYPE html>')
    ? `<!DOCTYPE html>\n${rendered}`
    : rendered;
}

async function renderEach(rootDir, $, element, eachExpression, context, templatePath) {
  const match = eachExpression.match(/^([A-Za-z0-9_]+)\s*:\s*(.+)$/);
  if (!match) {
    throw new Error(`Unsupported th:each expression: ${eachExpression}`);
  }

  const [, itemName, listExpression] = match;
  const values = evaluateExpression(listExpression, context, templatePath);
  if (!Array.isArray(values)) {
    throw new Error(`th:each expected an array but received ${typeof values}`);
  }

  const clone = $(element).clone();
  clone.removeAttr('th:each');
  const cloneHtml = $.html(clone);

  let rendered = '';
  for (const value of values) {
    const itemContext = {
      ...context,
      [itemName]: value
    };
    rendered += await renderMarkup(rootDir, cloneHtml, templatePath, itemContext);
  }

  return rendered;
}

function applyAttribute($element, attributeName, value) {
  if (value === false || value === null || value === undefined || value === '') {
    if (attributeName !== 'class') {
      $element.removeAttr(attributeName);
    }
    if (attributeName === 'class' && !$element.attr('class')) {
      $element.removeAttr('class');
    }
    return;
  }

  $element.attr(attributeName, String(value));
}

function isDocumentMarkup(markup) {
  return /<!DOCTYPE html>|<html[\s>]/i.test(markup);
}

function containsUnresolvedThymeleaf(markup) {
  return /\b(?:xmlns:th|th:[\w-]+)\b|#\{|\$\{/.test(markup);
}

function loadReplacementRoot(rendered, tagName) {
  if (tagName === 'html') {
    return load(rendered, { decodeEntities: false }, true)('html').first();
  }

  const wrappedDocument = tagName === 'head'
    ? `<!DOCTYPE html><html>${rendered}<body></body></html>`
    : `<!DOCTYPE html><html><head></head>${rendered}</html>`;

  return load(wrappedDocument, { decodeEntities: false }, true)(tagName).first();
}

function replaceStructuredElement($element, tagName, rendered) {
  const replacementRoot = loadReplacementRoot(rendered, tagName);
  if (!replacementRoot.length) {
    $element.replaceWith(rendered);
    return;
  }

  Object.keys($element.attr() ?? {}).forEach((attribute) => {
    $element.removeAttr(attribute);
  });

  Object.entries(replacementRoot.attr() ?? {}).forEach(([attribute, value]) => {
    $element.attr(attribute, value);
  });

  $element.html(replacementRoot.html() ?? '');
}

async function processElement(rootDir, $, element, context, templatePath) {
  if (!element || !['tag', 'script', 'style'].includes(element.type)) {
    return;
  }

  const $element = $(element);
  const replaceExpression = $element.attr('th:replace');
  if (replaceExpression) {
    const replacement = evaluateExpression(replaceExpression, context, templatePath);
    const renderedReplacement = isFragmentRef(replacement)
      ? await renderFragmentRef(rootDir, replacement, context)
      : String(replacement);

    if (['head', 'body'].includes(element.tagName)) {
      replaceStructuredElement($element, element.tagName, renderedReplacement);
      return;
    }

    $element.replaceWith(renderedReplacement);
    return;
  }

  const eachExpression = $element.attr('th:each');
  if (eachExpression) {
    $element.replaceWith(await renderEach(rootDir, $, element, eachExpression, context, templatePath));
    return;
  }

  const children = $element.contents().toArray();
  for (const child of children) {
    await processElement(rootDir, $, child, context, templatePath);
  }

  const textExpression = $element.attr('th:text');
  if (textExpression) {
    $element.text(String(evaluateExpression(textExpression, context, templatePath) ?? ''));
  }

  const utextExpression = $element.attr('th:utext');
  if (utextExpression) {
    $element.html(String(evaluateExpression(utextExpression, context, templatePath) ?? ''));
  }

  const contentExpression = $element.attr('th:content');
  if (contentExpression) {
    applyAttribute($element, 'content', evaluateExpression(contentExpression, context, templatePath));
  }

  const hrefExpression = $element.attr('th:href');
  if (hrefExpression) {
    applyAttribute($element, 'href', evaluateExpression(hrefExpression, context, templatePath));
  }

  const srcExpression = $element.attr('th:src');
  if (srcExpression) {
    applyAttribute($element, 'src', evaluateExpression(srcExpression, context, templatePath));
  }

  const langExpression = $element.attr('th:lang');
  if (langExpression) {
    applyAttribute($element, 'lang', evaluateExpression(langExpression, context, templatePath));
  }

  const classExpression = $element.attr('th:class');
  if (classExpression) {
    applyAttribute($element, 'class', evaluateExpression(classExpression, context, templatePath));
  }

  const classAppendExpression = $element.attr('th:classappend');
  if (classAppendExpression) {
    const existingClass = ($element.attr('class') ?? '').trim();
    const appendValue = String(evaluateExpression(classAppendExpression, context, templatePath) ?? '').trim();
    applyAttribute($element, 'class', [existingClass, appendValue].filter(Boolean).join(' '));
  }

  const attrExpression = $element.attr('th:attr');
  if (attrExpression) {
    const assignments = splitTopLevel(attrExpression);
    for (const assignment of assignments) {
      const [name, valueExpression] = assignment.split('=');
      if (!name || !valueExpression) {
        throw new Error(`Invalid th:attr assignment: ${assignment}`);
      }

      applyAttribute(
        $element,
        name.trim(),
        evaluateExpression(valueExpression.trim(), context, templatePath)
      );
    }
  }

  Object.keys(element.attribs ?? {}).forEach((attribute) => {
    if (attribute === 'xmlns:th' || attribute.startsWith('th:')) {
      $element.removeAttr(attribute);
    }
  });

  if (element.tagName === 'th:block') {
    $element.replaceWith($element.html() ?? '');
  }
}

async function renderMarkup(rootDir, markup, templatePath, context, depth = 0) {
  const documentMode = isDocumentMarkup(markup);
  const $ = load(markup, { decodeEntities: false }, documentMode);
  const children = $.root().contents().toArray();

  if (documentMode) {
    const htmlElement = children.find((child) => child.type === 'tag' && child.tagName === 'html');
    const rootReplaceExpression = htmlElement ? $(htmlElement).attr('th:replace') : null;

    if (rootReplaceExpression) {
      const replacement = evaluateExpression(rootReplaceExpression, context, templatePath);
      const renderedReplacement = isFragmentRef(replacement)
        ? renderFragmentRef(rootDir, replacement, context)
        : String(replacement);
      const resolvedReplacement = await renderedReplacement;

      return depth < 2 && containsUnresolvedThymeleaf(resolvedReplacement)
        ? renderMarkup(rootDir, resolvedReplacement, templatePath, context, depth + 1)
        : resolvedReplacement;
    }
  }

  for (const child of children) {
    await processElement(rootDir, $, child, context, templatePath);
  }

  const renderedMarkup = documentMode
    ? $.html().trim()
    : ($.root().html()?.trim() ?? '');

  return depth < 2 && containsUnresolvedThymeleaf(renderedMarkup)
    ? renderMarkup(rootDir, renderedMarkup, templatePath, context, depth + 1)
    : renderedMarkup;
}

function buildRedirectPage(targetPath, locale, pageTitle) {
  return `<!DOCTYPE html>
<html lang="${locale}">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="refresh" content="0; url=${targetPath}">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${pageTitle}</title>
    <script>window.location.replace(${JSON.stringify(targetPath)});</script>
</head>
<body></body>
</html>
`;
}

async function copyAsset(rootDir, fromRelativePath, toRelativePath) {
  const fromPath = path.join(rootDir, fromRelativePath);
  const toPath = path.join(rootDir, toRelativePath);
  await fs.mkdir(path.dirname(toPath), { recursive: true });
  await fs.copyFile(fromPath, toPath);
}

async function copyAssetIfExists(rootDir, fromRelativePath, toRelativePath) {
  try {
    await copyAsset(rootDir, fromRelativePath, toRelativePath);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }
}

async function copyDirectory(rootDir, fromRelativePath, toRelativePath) {
  const fromPath = path.join(rootDir, fromRelativePath);
  const toPath = path.join(rootDir, toRelativePath);
  const entries = await fs.readdir(fromPath, { withFileTypes: true });

  await fs.mkdir(toPath, { recursive: true });

  for (const entry of entries) {
    const fromEntryPath = path.join(fromPath, entry.name);
    const toEntryPath = path.join(toPath, entry.name);

    if (entry.isDirectory()) {
      await copyDirectory(rootDir, path.join(fromRelativePath, entry.name), path.join(toRelativePath, entry.name));
      continue;
    }

    if (entry.isFile()) {
      await fs.copyFile(fromEntryPath, toEntryPath);
    }
  }
}

async function buildPageContext(rootDir, locale, pageKey) {
  const messages = await loadMessages(rootDir, locale);
  const repositorySnapshot = localizeRepositorySnapshot(await loadRepositorySnapshot(rootDir), locale, messages);

  return {
    currentLocale: locale,
    currentPageKey: pageKey,
    currentLocaleCode: getMessage(messages, `locale.${locale}.code`),
    currentLocaleLabel: getMessage(messages, `locale.${locale}.label`),
    currentLocaleFlagPath: getMessage(messages, `locale.${locale}.flagPath`),
    supportedLocales: [...supportedLocales],
    localeLinks: supportedLocales.map((localeOption) => ({
      code: getMessage(messages, `locale.${localeOption}.code`),
      label: getMessage(messages, `locale.${localeOption}.label`),
      flagPath: getMessage(messages, `locale.${localeOption}.flagPath`),
      path: resolveLocalizedPath(localeOption, pageKey),
      active: localeOption === locale
    })),
    homePath: resolveLocalizedPath(locale, 'home'),
    loginPath: resolveLocalizedPath(locale, 'login'),
    registerPath: resolveLocalizedPath(locale, 'register'),
    repositoryGitPath: resolveLocalizedPath(locale, 'repositoryGit'),
    repositoryPlaywrightPath: resolveLocalizedPath(locale, 'repositoryPlaywright'),
    repositoryBoardPath: resolveLocalizedPath(locale, 'repositoryKanban'),
    repositorySnapshot,
    __messages: messages
  };
}

async function renderPage(rootDir, locale, pageDefinition) {
  const context = await buildPageContext(rootDir, locale, pageDefinition.key);
  const source = await readTemplate(rootDir, pageDefinition.templatePath);
  const rendered = await renderMarkup(rootDir, source, pageDefinition.templatePath, context);
  return rendered.startsWith('<!DOCTYPE html>') ? rendered : `<!DOCTYPE html>\n${rendered}`;
}

async function renderAllPages(rootDir) {
  const renderedPages = [];

  for (const pageDefinition of pageDefinitions) {
    renderedPages.push({
      locale: defaultLocale,
      pageKey: pageDefinition.key,
      outputPaths: resolveOutputPaths(defaultLocale, pageDefinition.key),
      html: await renderPage(rootDir, defaultLocale, pageDefinition)
    });
  }

  return renderedPages;
}

async function writeRenderedPages(rootDir, renderedPages) {
  for (const renderedPage of renderedPages) {
    for (const outputPathValue of renderedPage.outputPaths) {
      const outputPath = path.join(rootDir, outputPathValue);
      await fs.mkdir(path.dirname(outputPath), { recursive: true });
      await fs.writeFile(outputPath, renderedPage.html, 'utf8');
    }
  }
}

export async function buildPreview(rootDir) {
  await validateLocaleResources(rootDir);
  await validateSourceTemplates(rootDir);

  await Promise.all([
    copyAsset(rootDir, 'src/js/site.js', 'assets/js/site.js'),
    copyAsset(rootDir, 'node_modules/@gitgraph/js/lib/gitgraph.umd.min.js', 'assets/vendor/gitgraph.umd.min.js'),
    copyAsset(rootDir, 'node_modules/vue/dist/vue.esm-browser.prod.js', 'assets/vendor/vue.esm-browser.prod.js'),
    copyAssetIfExists(rootDir, 'src/media/pawsitters-scene.svg', 'assets/media/pawsitters-scene.svg'),
    copyDirectory(rootDir, 'src/media/country-flag', 'assets/media/country-flag')
  ]);

  const renderedPages = await renderAllPages(rootDir);
  await writeRenderedPages(rootDir, renderedPages);
  const defaultMessages = await loadMessages(rootDir, defaultLocale);
  await fs.writeFile(
    path.join(rootDir, 'git', 'index.html'),
    buildRedirectPage('/repository/git', defaultLocale, getMessage(defaultMessages, 'meta.repositoryGit.title')),
    'utf8'
  );
  await fs.writeFile(
    path.join(rootDir, 'kanban', 'index.html'),
    buildRedirectPage('/repository/kanban', defaultLocale, getMessage(defaultMessages, 'meta.repositoryKanban.title')),
    'utf8'
  );
  await fs.writeFile(
    path.join(rootDir, 'playwright', 'index.html'),
    buildRedirectPage('/repository/playwright', defaultLocale, getMessage(defaultMessages, 'meta.repositoryPlaywright.title')),
    'utf8'
  );
}

export async function loadLocalizedRepositorySnapshot(rootDir, locale, options = {}) {
  const messages = await loadMessages(rootDir, locale);
  return localizeRepositorySnapshot(await loadRepositorySnapshot(rootDir, options), locale, messages);
}

export async function renderLocalizedPage(rootDir, routePath, locale) {
  const normalizedPath = routePath.endsWith('/') && routePath !== '/'
    ? routePath.slice(0, -1)
    : routePath;
  const pageKey = routeToPageKey.get(normalizedPath);
  if (!pageKey) {
    return null;
  }

  const pageDefinition = pageDefinitions.find((definition) => definition.key === pageKey);
  if (!pageDefinition) {
    return null;
  }

  const targetLocale = supportedLocales.includes(locale) ? locale : defaultLocale;
  return renderPage(rootDir, targetLocale, pageDefinition);
}

export async function validatePreview(rootDir) {
  await validateLocaleResources(rootDir);
  await validateSourceTemplates(rootDir);

  const results = [];

  for (const pageDefinition of pageDefinitions) {
    const html = await renderPage(rootDir, defaultLocale, pageDefinition);
    if (!html.includes(`<html lang="${defaultLocale}"`)) {
      throw new Error(`Rendered ${defaultLocale}/${pageDefinition.key} page is missing the correct lang attribute`);
    }

    if (containsUnresolvedThymeleaf(html)) {
      throw new Error(`Rendered ${defaultLocale}/${pageDefinition.key} page still contains unresolved Thymeleaf syntax`);
    }

    if (!html.includes('id="site-shell-header"')) {
      throw new Error(`Rendered ${defaultLocale}/${pageDefinition.key} page is missing the shared header shell`);
    }

    results.push({ locale: defaultLocale, pageKey: pageDefinition.key, html });
  }

  return results;
}
