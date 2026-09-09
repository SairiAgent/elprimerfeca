# Guía De Pronunciación

El guion de EL PRIMER FECA no es un texto para leer con los ojos. Es una partitura para un modelo de voz.

Un lector humano corrige solo: ve `dolar` y dice "dólar", ve `16 a 14 anos` y dice "dieciséis a catorce años". Un modelo de voz no corrige nada. Lee lo que está escrito, con el acento que está escrito. Si el guion dice `anos`, el Reel dice "anos".

Por eso la ortografía del guion es una decisión de producción, no de estilo.

## Regla Base

Todo lo que se pronuncia se escribe completo y correcto:

- `prompts/examples/**/script.txt`, que es el guion hablado;
- el bloque de guion citado dentro de `video-prompt.txt`, que es el texto que el modelo efectivamente lee;
- cualquier línea de diálogo suelta dentro del prompt de video.

Lo que no se pronuncia queda como está: carteles, monitores, etiquetas de escena y notas de dirección son elementos visuales, no texto hablado.

## Tildes Y Eñes

Las tildes van siempre. No son decoración: marcan la sílaba tónica, y sin ellas el modelo acentúa mal.

- `dolar` suena "dolár"; va `dólar`.
- `regimen` suena "regímen"; va `régimen`.
- `credito`, `grafico`, `numeros`, `metodo`, `pelicula`, `limite` son esdrújulas y sin tilde se leen como llanas.
- `estan`, `tambien`, `ademas`, `asi`, `aca`, `ahi`, `recien` no existen sin tilde.

Las eñes son el peor caso, porque cambian la palabra entera:

- `anos` no es "años". Es otra cosa, y el Reel la dice.
- `senora` no es "señora". `sueno` no es "sueño". `espanol` no es "español".

Cuando la palabra existe con y sin tilde, decide el sentido: `esta` / `está`, `quedo` / `quedó`, `para` / `pará`, `si` / `sí`, `mas` / `más`, `mi` / `mí`.

## Interrogativos Y Signos

Las preguntas se abren y se cierran: `¿Por qué?`, no `Por que?`. Sin el signo de apertura la entonación sube tarde o no sube.

Dentro de una pregunta, el interrogativo lleva tilde y es tónico: `qué`, `quién`, `cuál`, `cómo`, `cuándo`, `dónde`, `cuánto`.

En pregunta indirecta va la tilde pero no los signos: `La pregunta importante es otra: qué pasa con las tasas.` Ahí la entonación no debe subir.

`por qué` interrogativo va separado y con tilde. `porque` causal va junto y átono.

## Números

Todas las cifras se escriben en palabras. Sin excepción.

| No escribir | Escribir |
| --- | --- |
| `16 a 14 años` | `dieciséis a catorce años` |
| `60 días` | `sesenta días` |
| `4,9%` | `cuatro coma nueve por ciento` |
| `2001` | `dos mil uno` |
| `Decreto 868/26` | `decreto ochocientos sesenta y ocho barra veintiséis` |
| `$1.530` | `mil quinientos treinta pesos` |

El modelo decide solo cómo leer un número y suele equivocar el orden, la unidad o el separador decimal. Escribirlo en palabras es la única forma de fijarlo.

Lo mismo con los símbolos: `%` es `por ciento`, `°` es `grados`, `/` es `barra`, `km/h` es `kilómetros por hora`. Y con las abreviaturas: `etc.` es `etcétera`, `EE.UU.` es `Estados Unidos`.

## Siglas

Hay dos formas de leer una sigla y el guion tiene que saber cuál:

- **Como palabra**: INDEC se dice "índec", ANSES "anses", CONICET "conicet".
- **Deletreada**: BCRA es "be-ce-erre-a", FMI es "efe-eme-i", IA es "i-a".

`tools/pronunciation-lexicon.json` tiene el listado. Si aparece una sigla nueva, se agrega ahí antes de generar el video.

## Extranjerismos

El modelo lee en español. Un anglicismo escrito tal cual sale con fonética española y suena mal, o sale con acento inglés en medio de una frase rioplatense y suena peor.

La solución no es deformar la ortografía del guion, que también alimenta los subtítulos. La solución es declarar la pronunciación en el prompt de video:

- `doomscrolling` se dice "dum-SCRO-lin";
- `unfollow` se dice "an-FÓ-lou";
- `Soleil` se dice "so-LÉI";
- `Google` se dice "gú-gol";
- `Trump` se dice "tramp".

## Nombres Propios

Los apellidos y topónimos son la fuente silenciosa de errores, porque nadie los revisa:

- `Enríquez` se acentúa en la segunda sílaba; sin tilde el modelo dice "en-ri-QUEZ".
- `Casabé` se acentúa en la última.
- `Córdoba`, `Neuquén`, `Tucumán`, `Paraná`, `Perón` pierden el acento si pierden la tilde.
- `Goya` mantiene la Y rioplatense: "Go-sha".

## Nombre Del Programa

En el guion hablado se escribe `El Pri-mer Fe-ca`.

Nunca deletreado como `F-E-C-A`, nunca con la pronunciación inglesa de "fake" o "fika". La guionización es deliberada: es la forma de fijarle al modelo las dos sílabas de FE-ca.

## Voseo

EL PRIMER FECA habla rioplatense. El tuteo no es solo un error de registro: mueve la sílaba tónica y se escucha.

`sabés`, no `sabes`. `tenés`, no `tienes`. `podés`, no `puedes`. `decís`, no `dices`. `sos`, no `eres`.

## Ritmo

Un guion largo obliga al modelo a acelerar, y cuando acelera se come sílabas. El objetivo son 75-95 palabras habladas para 30 segundos.

Pasarse de ahí es un problema de pronunciación, no solo de duración.

## El Bloque Pronunciation Lock

Cada `video-prompt.txt` lleva un bloque que le fija al modelo las lecturas difíciles de esa pieza. Se puede generar solo:

```bash
node tools/primerfeca-pronunciation-check.js lock --script prompts/examples/daily/2026-09-08/special-0800/script.txt
```

La salida se pega en el prompt, cerca del bloque de idioma y voz.

## El Chequeo Automático

Antes de generar el video:

```bash
node tools/primerfeca-pronunciation-check.js check --script prompts/examples/daily/2026-09-08/main-0700/script.txt
```

Sale 0 si no hay errores y 2 si los hay. `--strict` convierte los warnings en bloqueantes y `--json` da salida estructurada para automatizar.

Los `ERROR` bloquean: cifras en dígitos, tildes faltantes, eñes faltantes, signos de apertura ausentes, símbolos y abreviaturas sin escribir. Los `warn` piden una decisión humana: palabras que existen con y sin tilde, extranjerismos y siglas que hay que declarar en el prompt, tuteo donde va voseo, y guiones fuera del rango de palabras.

## Qué No Cubre

El chequeo es una lista curada de trampas conocidas, no un corrector ortográfico del español. No conoce todas las palabras, no entiende el sentido de la frase y no puede saber si un nombre propio está bien escrito.

Encuentra lo que ya nos salió mal alguna vez. El criterio sigue siendo humano.

Cuando un Reel salga con una palabra mal pronunciada, la corrección tiene dos partes: arreglar el guion y agregar la palabra a `tools/pronunciation-lexicon.json`. Si solo se hace la primera, el error vuelve.
