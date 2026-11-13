#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function usage() {
  console.error(`Usage:
  node tools/primerfeca-audio-subtitle-check.js check --script script.txt --transcript transcript.txt [--json] [--strict]
  node tools/primerfeca-audio-subtitle-check.js check --script script.txt --transcript transcript.json [--json] [--strict]

check   Compara el guion (lo que el video DEBERIA decir/mostrar en subtitulos) contra una
        transcripcion real del audio generado (lo que el video efectivamente dice), y falla
        si el contenido no coincide o si una palabra dura del lexico (nombre propio,
        extranjerismo, sigla) quedo sustituida por otra cosa.

        Esto detecta lo que el chequeo de ortografia (primerfeca-pronunciation-check.js) no
        puede ver: que el modelo de video invente, corte o desordene contenido, o que
        arruine un nombre propio aunque el guion este bien escrito.

--transcript acepta:
  - un .txt con la transcripcion en texto plano;
  - un .json con la forma { "text": "..." } o { "segments": [{ "text": "..." }, ...] }
    (el formato que devuelve faster-whisper/whisper).

--strict endurece los umbrales (ver mas abajo).
Salida 0 sin problemas, 2 con problemas, 1 si el uso es invalido.

Como producir el transcript localmente (no requiere credenciales, corre en la maquina):
  python3 -m pip install faster-whisper
  python3 -c "
from faster_whisper import WhisperModel
model = WhisperModel('medium', device='cpu', compute_type='int8')
segments, _ = model.transcribe('audio.wav', language='es', vad_filter=True)
print(' '.join(s.text.strip() for s in segments))
" > transcript.txt

Opciones: --lexicon tools/pronunciation-lexicon.json --min-run 3 --max-wer 0.12`);
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
  return value.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function normalizeWords(text) {
  const clean = stripAccents(text.toLowerCase());
  const found = [];
  const re = /[a-z0-9]+/g;
  let match;
  while ((match = re.exec(clean)) !== null) {
    found.push(match[0]);
  }
  return found;
}

// Speaker labels (CLARA:, RICKY:) are stage directions, not spoken words.
function scriptToSpokenText(text) {
  return text
    .replace(/\r\n/g, '\n')
    .split('\n')
    .filter((line) => line.trim() && !/^[A-ZÁÉÍÓÚÑ" ]+:\s*$/.test(line.trim()))
    .join(' ');
}

function loadTranscript(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  if (filePath.endsWith('.json')) {
    const data = JSON.parse(raw);
    if (typeof data.text === 'string') return data.text;
    if (Array.isArray(data.segments)) {
      return data.segments.map((s) => s.text || '').join(' ');
    }
    throw new Error('JSON de transcript no reconocido: se espera { text } o { segments: [{ text }] }');
  }
  return raw;
}

// Needleman-Wunsch style alignment: finds the cheapest sequence of
// match/substitution/deletion(script word never spoken)/insertion(spoken but
// not in script) edits that turns the script words into the heard words.
function align(scriptWords, heardWords) {
  const n = scriptWords.length;
  const m = heardWords.length;
  const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = 0; i <= n; i += 1) dp[i][0] = i;
  for (let j = 0; j <= m; j += 1) dp[0][j] = j;
  for (let i = 1; i <= n; i += 1) {
    for (let j = 1; j <= m; j += 1) {
      const cost = scriptWords[i - 1] === heardWords[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }

  const ops = [];
  let i = n;
  let j = m;
  while (i > 0 || j > 0) {
    const cost = i > 0 && j > 0 && scriptWords[i - 1] === heardWords[j - 1] ? 0 : 1;
    if (i > 0 && j > 0 && dp[i][j] === dp[i - 1][j - 1] + cost) {
      ops.push({
        type: cost === 0 ? 'match' : 'sub',
        script: scriptWords[i - 1],
        heard: heardWords[j - 1],
        scriptIndex: i - 1,
      });
      i -= 1;
      j -= 1;
    } else if (i > 0 && dp[i][j] === dp[i - 1][j] + 1) {
      ops.push({ type: 'del', script: scriptWords[i - 1], scriptIndex: i - 1 });
      i -= 1;
    } else {
      ops.push({ type: 'ins', heard: heardWords[j - 1] });
      j -= 1;
    }
  }
  ops.reverse();
  return { distance: dp[n][m], ops };
}

function groupRuns(ops, type, minRun) {
  const runs = [];
  let current = [];
  for (const op of ops) {
    if (op.type === type) {
      current.push(op);
    } else if (current.length) {
      if (current.length >= minRun) runs.push(current);
      current = [];
    }
  }
  if (current.length >= minRun) runs.push(current);
  return runs.map((run) => ({
    words: run.map((op) => op.script || op.heard),
    scriptIndex: run[0].scriptIndex,
  }));
}

function loadHardTerms(lexicon) {
  const terms = new Set();
  for (const key of Object.keys(lexicon.foreign || {})) terms.add(stripAccents(key.toLowerCase()));
  for (const key of Object.keys(lexicon.acronyms || {})) terms.add(stripAccents(key.toLowerCase()));
  for (const key of Object.keys((lexicon.tilde || {}).always || {})) terms.add(stripAccents(key.toLowerCase()));
  return terms;
}

// A capitalized script word (not at the very start of its sentence) is very
// likely a proper noun: exactly the category that a video model mangles even
// when the script spells it correctly, and that the pronunciation checker
// cannot flag because there is nothing wrong with the script's spelling.
function looksLikeProperNoun(rawWord) {
  return /^[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+$/.test(rawWord);
}

function runCheck(args) {
  if (!args.script || !args.transcript) {
    usage();
    process.exit(1);
  }
  const lexiconPath = args.lexicon || path.join(__dirname, 'pronunciation-lexicon.json');
  const lexicon = JSON.parse(fs.readFileSync(lexiconPath, 'utf8'));
  const hardTerms = loadHardTerms(lexicon);

  const scriptRaw = fs.readFileSync(args.script, 'utf8');
  const scriptSpoken = scriptToSpokenText(scriptRaw);
  const scriptRawWords = scriptSpoken.match(/[\p{L}\p{M}]+/gu) || [];
  const scriptWords = normalizeWords(scriptSpoken);

  const transcriptText = loadTranscript(args.transcript);
  const heardWords = normalizeWords(transcriptText);

  if (scriptWords.length === 0) {
    console.error('El guion no tiene palabras habladas.');
    process.exit(1);
  }

  const minRun = Number(args.minRun || 3);
  const maxWer = Number(args.maxWer || (args.strict ? 0.06 : 0.12));

  const { distance, ops } = align(scriptWords, heardWords);
  const wer = distance / scriptWords.length;

  const missingRuns = groupRuns(ops, 'del', minRun);
  const extraRuns = groupRuns(ops, 'ins', minRun);
  const substitutions = ops.filter((op) => op.type === 'sub');
  const hardMismatches = substitutions.filter((op) => {
    const rawWord = scriptRawWords[op.scriptIndex];
    return hardTerms.has(op.script) || (rawWord && looksLikeProperNoun(rawWord));
  });

  const problems = [];
  if (wer > maxWer) {
    problems.push({
      level: 'ERROR',
      code: 'wer',
      message: `word error rate ${(wer * 100).toFixed(1)}% supera el maximo ${(maxWer * 100).toFixed(1)}% -> el audio no dice lo mismo que el guion/subtitulo`,
    });
  }
  for (const run of missingRuns) {
    problems.push({
      level: 'ERROR',
      code: 'missing-content',
      message: `el audio nunca dice "${run.words.join(' ')}" (presente en el guion/subtitulo)`,
    });
  }
  for (const run of extraRuns) {
    problems.push({
      level: 'ERROR',
      code: 'extra-content',
      message: `el audio agrega "${run.words.join(' ')}", que no esta en el guion/subtitulo`,
    });
  }
  for (const op of hardMismatches) {
    problems.push({
      level: 'ERROR',
      code: 'proper-noun',
      message: `"${op.script}" (nombre propio/termino del lexico) se escucha como "${op.heard}"`,
    });
  }
  const softSubstitutions = substitutions.filter((op) => !hardMismatches.includes(op));
  for (const op of softSubstitutions) {
    problems.push({
      level: 'warn',
      code: 'substitution',
      message: `"${op.script}" se escucha como "${op.heard}"`,
    });
  }

  const errors = problems.filter((p) => p.level === 'ERROR').length;
  const warnings = problems.filter((p) => p.level === 'warn').length;
  const effectiveErrors = args.strict ? errors + warnings : errors;

  if (args.json) {
    console.log(JSON.stringify({
      script: args.script,
      transcript: args.transcript,
      script_words: scriptWords.length,
      heard_words: heardWords.length,
      word_error_rate: Number(wer.toFixed(4)),
      max_wer: maxWer,
      errors,
      warnings,
      problems,
    }, null, 2));
  } else {
    console.log(`${args.script} vs ${args.transcript}: ${scriptWords.length} palabras de guion, ${heardWords.length} palabras oidas, wer ${(wer * 100).toFixed(1)}%, ${errors} errores, ${warnings} warnings`);
    for (const problem of problems) {
      console.log(`${problem.level === 'ERROR' ? 'ERROR' : 'warn '} [${problem.code}] ${problem.message}`);
    }
    if (!problems.length) console.log('El audio dice lo mismo que el guion/subtitulo.');
  }

  process.exit(effectiveErrors > 0 ? 2 : 0);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.command === 'check') {
    runCheck(args);
    return;
  }
  usage();
  process.exit(1);
}

main();
