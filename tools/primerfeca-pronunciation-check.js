#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DEFAULT_LEXICON = path.join(__dirname, 'pronunciation-lexicon.json');

function usage() {
  console.error(`Usage:
  node tools/primerfeca-pronunciation-check.js check --script prompts/examples/.../script.txt [--json] [--strict]
  node tools/primerfeca-pronunciation-check.js check --text "guion hablado" [--json] [--strict]
  node tools/primerfeca-pronunciation-check.js lock --script prompts/examples/.../script.txt

check  Revisa el texto hablado y reporta trampas de pronunciacion.
       Salida 0 sin errores, 2 con errores, 1 si el uso es invalido.
       --strict trata los warnings como errores.
lock   Imprime el bloque "Pronunciation lock" para pegar en video-prompt.txt.

Opciones: --lexicon tools/pronunciation-lexicon.json`);
}

function parseArgs(argv) {
  const [command, ...rest] = argv;
  const args = { command };
  for (let i = 0; i < rest.length; i += 1) {
    const token = rest[i];
    if (!token.startsWith('--')) {
      throw new Error(`Unexpected argument: ${token}`);
    }
    const key = token.slice(2);
    if (key === 'json' || key === 'strict') {
      args[key] = true;
    } else {
      args[key.replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = rest[++i];
    }
  }
  return args;
}

function stripAccents(value) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

// Speaker labels (CLARA:, RICKY:) are stage directions, not spoken words.
function spokenLines(text) {
  return text
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line, index) => ({ number: index + 1, text: line }))
    .filter(({ text: line }) => line.trim() && !/^[A-ZÁÉÍÓÚÑ" ]+:\s*$/.test(line.trim()));
}

function words(line) {
  const found = [];
  const re = /[\p{L}\p{M}]+/gu;
  let match;
  while ((match = re.exec(line)) !== null) {
    found.push({ raw: match[0], index: match.index });
  }
  return found;
}

// Spans wrapped in ¿? or ¡! carry interrogative/exclamative accents.
function questionSpans(line) {
  const spans = [];
  const re = /[¿¡][^¿¡?!]*[?!]/g;
  let match;
  while ((match = re.exec(line)) !== null) {
    spans.push([match.index, match.index + match[0].length]);
  }
  return spans;
}

function inSpans(spans, index) {
  return spans.some(([start, end]) => index >= start && index < end);
}

function makeIssue(severity, rule, line, found, suggestion, why, column) {
  return { severity, rule, line, column: column || null, found, suggestion, why };
}

function checkText(text, lexicon) {
  const issues = [];
  const lines = spokenLines(text);
  const showPlain = lexicon.show_name.plain.toLowerCase();
  const showSpoken = lexicon.show_name.spoken;

  for (const { number, text: line } of lines) {
    const spans = questionSpans(line);

    // Digits are read unpredictably by the voice model: spell every figure out.
    const digit = line.match(/\d[\d.,/:%-]*/g);
    if (digit) {
      for (const value of new Set(digit)) {
        issues.push(makeIssue('error', 'digits', number, value, 'escribir la cifra en palabras',
          'el modelo de voz decide solo como leer los numeros y suele equivocar el orden o la unidad'));
      }
    }

    for (const [symbol, spoken] of Object.entries(lexicon.symbols)) {
      if (line.includes(symbol) && !/^[a-z]/i.test(symbol)) {
        issues.push(makeIssue('error', 'symbol', number, symbol, `escribir "${spoken}"`,
          'los simbolos se leen distinto en cada modelo, o directamente se saltean'));
      }
    }

    for (const [abbr, spoken] of Object.entries(lexicon.abbreviations)) {
      if (line.includes(abbr)) {
        issues.push(makeIssue('error', 'abbreviation', number, abbr, `escribir "${spoken}"`,
          'las abreviaturas se deletrean o se leen literales'));
      }
    }

    // A closing ? or ! without its opening pair leaves the model without the
    // intonation cue for the whole phrase.
    if (/[?!]/.test(line) && !/[¿¡]/.test(line)) {
      issues.push(makeIssue('error', 'missing-opening-mark', number, line.trim().slice(0, 60),
        'abrir la pregunta con ¿ o la exclamacion con ¡',
        'sin el signo de apertura la entonacion sube tarde o no sube'));
    }

    // Words that only need the tilde in certain phrases: decided by pattern.
    for (const rule of lexicon.tilde.context || []) {
      const match = new RegExp(rule.pattern, 'i').exec(line);
      if (match) {
        issues.push(makeIssue('warn', 'tilde-contexto', number, match[0].trim(), rule.accented,
          rule.why, match.index + 1));
      }
    }

    for (const { raw, index } of words(line)) {
      const lower = raw.toLowerCase();
      const plain = stripAccents(lower);
      const hasAccent = plain !== lower;

      if (lexicon.enie.always[plain] && lower === plain) {
        issues.push(makeIssue('error', 'enie', number, raw, lexicon.enie.always[plain],
          'sin la enie el modelo lee otra palabra distinta', index + 1));
        continue;
      }

      if (lexicon.enie.ambiguous[lower]) {
        issues.push(makeIssue('warn', 'enie-ambiguous', number, raw, lexicon.enie.ambiguous[lower],
          'las dos palabras existen: confirmar cual va', index + 1));
      }

      if (!hasAccent && lexicon.tilde.always[plain]) {
        issues.push(makeIssue('error', 'tilde', number, raw, lexicon.tilde.always[plain],
          'sin tilde el acento tonico cae en la silaba equivocada', index + 1));
        continue;
      }

      if (!hasAccent && lexicon.tilde.interrogatives[plain] && inSpans(spans, index)) {
        issues.push(makeIssue('error', 'tilde-interrogativa', number, raw,
          lexicon.tilde.interrogatives[plain],
          'dentro de una pregunta el interrogativo va acentuado y se pronuncia tonico', index + 1));
        continue;
      }

      if (!hasAccent && lexicon.tilde.ambiguous[lower]) {
        issues.push(makeIssue('warn', 'tilde-ambigua', number, raw, lexicon.tilde.ambiguous[lower],
          'las dos formas existen: confirmar si va con tilde', index + 1));
      }

      if (lexicon.voseo[lower]) {
        issues.push(makeIssue('warn', 'voseo', number, raw, lexicon.voseo[lower],
          'EL PRIMER FECA habla rioplatense con voseo: el tuteo cambia la silaba tonica', index + 1));
      }

      if (lexicon.foreign[lower]) {
        issues.push(makeIssue('warn', 'extranjerismo', number, raw, lexicon.foreign[lower],
          'declarar la pronunciacion en el bloque "Pronunciation lock" del video-prompt', index + 1));
      }

      if (raw.length >= 2 && raw === raw.toUpperCase() && /^[A-ZÁÉÍÓÚÑ]+$/.test(raw)) {
        const entry = lexicon.acronyms[raw];
        if (entry) {
          issues.push(makeIssue('warn', 'sigla', number, raw, entry.say,
            'declarar la sigla en el bloque "Pronunciation lock" del video-prompt', index + 1));
        } else {
          issues.push(makeIssue('warn', 'sigla-desconocida', number, raw,
            'agregar la sigla a tools/pronunciation-lexicon.json',
            'sin entrada en el lexico no hay forma de saber si se lee como palabra o se deletrea', index + 1));
        }
      }
    }

    if (stripAccents(line.toLowerCase()).includes(stripAccents(showPlain)) && !line.includes(showSpoken)) {
      issues.push(makeIssue('warn', 'nombre-del-programa', number, lexicon.show_name.plain, showSpoken,
        'el nombre se pronuncia El Pri-mer Fe-ca, nunca deletreado ni como el ingles "fake"'));
    }
  }

  const spokenWords = lines
    .map(({ text: line }) => line)
    .join(' ')
    .split(/[^\p{L}\p{M}\d]+/u)
    .filter(Boolean);

  const { min_words: min, max_words: max, seconds } = lexicon.pace;
  if (spokenWords.length > max) {
    issues.push(makeIssue('warn', 'ritmo', 0, `${spokenWords.length} palabras`,
      `${min}-${max} palabras para ${seconds} segundos`,
      'un guion largo obliga al modelo a acelerar y ahi es donde se come las silabas'));
  } else if (spokenWords.length < min) {
    issues.push(makeIssue('warn', 'ritmo', 0, `${spokenWords.length} palabras`,
      `${min}-${max} palabras para ${seconds} segundos`,
      'un guion corto deja aire de sobra: revisar si falta contenido'));
  }

  const errors = issues.filter((issue) => issue.severity === 'error');
  const warnings = issues.filter((issue) => issue.severity === 'warn');

  return {
    ok: errors.length === 0,
    status: errors.length === 0 ? 'pass' : 'pronunciation_blocked',
    word_count: spokenWords.length,
    error_count: errors.length,
    warning_count: warnings.length,
    issues
  };
}

function buildLock(text, lexicon) {
  const lines = [];
  const seen = new Set();
  const lower = text.toLowerCase();

  lines.push('Read every written accent in the script exactly as written: the tildes carry the stress.');
  lines.push(`The show name is said "${lexicon.show_name.spoken}", never spelled ${lexicon.show_name.never[0]} and never like English "${lexicon.show_name.never[1]}".`);

  for (const { text: line } of spokenLines(text)) {
    for (const { raw } of words(line)) {
      const key = raw.toLowerCase();
      if (lexicon.foreign[key] && !seen.has(key)) {
        seen.add(key);
        lines.push(`"${raw}" is said the Argentine way: ${lexicon.foreign[key]}.`);
      }
      const acronym = lexicon.acronyms[raw];
      if (acronym && !seen.has(raw)) {
        seen.add(raw);
        lines.push(`"${raw}" is said: ${acronym.say}.`);
      }
    }
  }

  if (/\b(cero|uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|mil|ciento|coma)\b/.test(lower)) {
    lines.push('Every figure is written as words and must be read as words, never as digits.');
  }

  return lines.join('\n');
}

function formatIssue(issue) {
  const mark = issue.severity === 'error' ? 'ERROR' : 'warn ';
  const place = issue.line ? `L${issue.line}${issue.column ? ':' + issue.column : ''}` : '--';
  return `${mark} ${place} [${issue.rule}] "${issue.found}" -> ${issue.suggestion}\n        ${issue.why}`;
}

function readText(args) {
  if (args.script) {
    return fs.readFileSync(path.resolve(process.cwd(), args.script), 'utf8');
  }
  if (args.text) {
    return args.text;
  }
  throw new Error('Missing --script or --text.');
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const lexiconPath = args.lexicon ? path.resolve(process.cwd(), args.lexicon) : DEFAULT_LEXICON;
  const lexicon = JSON.parse(fs.readFileSync(lexiconPath, 'utf8'));
  const text = readText(args);

  if (args.command === 'lock') {
    console.log(buildLock(text, lexicon));
    process.exit(0);
  }

  if (args.command !== 'check') {
    usage();
    process.exit(1);
  }

  const result = checkText(text, lexicon);
  const blocked = args.strict ? result.error_count + result.warning_count > 0 : !result.ok;

  if (args.json) {
    console.log(JSON.stringify(result, null, 2));
    process.exit(blocked ? 2 : 0);
  }

  const label = args.script ? path.relative(ROOT, path.resolve(process.cwd(), args.script)) : '--text';
  console.log(`${label}: ${result.word_count} palabras habladas, ${result.error_count} errores, ${result.warning_count} warnings`);
  for (const issue of result.issues) {
    console.log(formatIssue(issue));
  }
  if (!result.issues.length) {
    console.log('Sin trampas de pronunciacion conocidas.');
  }
  process.exit(blocked ? 2 : 0);
}

try {
  main();
} catch (error) {
  console.error(error.message);
  usage();
  process.exit(1);
}
