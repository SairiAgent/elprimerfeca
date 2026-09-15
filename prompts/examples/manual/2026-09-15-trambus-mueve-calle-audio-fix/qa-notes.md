# QA: `assets/reels-2026-09-15/trambus-mueve-calle.mp4` - audio no condice con subtitulos

## Hallazgo

Los subtitulos quemados del video son correctos, pero el audio generado no lee ese guion: falta un pasaje entero de un cartel, agrega frases que no estan en ningun subtitulo, y arrastra varios nombres propios mal pronunciados. Esto se valido transcribiendo el audio (`faster-whisper`, modelo `medium`, `es`) y comparando, cartel por cartel, contra los frames del video.

## Evidencia: subtitulo vs. audio transcripto

| Cartel (subtitulo, correcto) | Lo que dice el audio (transcripcion) |
| --- | --- |
| Te hago una sola: ¿tu calle sigue igual desde hoy? | Te hago una sola, ¿tu calle sigue siendo tu calle desde hoy? |
| Por el futuro TramBus T1, Almagro y Caballito cambian. | Por el futuro **Trambús** T1, **Almagrari** y Caballito **empiezan cambios de circulación y estacionamiento** |
| Hay nuevas manos, estacionamiento y circulación. | **desde este 15 de septiembre.** (la frase del cartel no se lee; el audio la reemplaza por la clausula de arriba) |
| Avenida La Plata, Quito, Mármol y Pringles entran primero. | Avenida La **Plati**, Quito, **Marmil, Pringues** e **Hipólito Irigoyoyo entran en la primera talla** |
| También cambia parte del recorrido de la línea 2. | y la línea 2 también cambia parte del recorrido. (reordenado, y fusionado con el cartel anterior) |
| La promesa es un eléctrico de 20 kilómetros. | La Promesa es un **sistema** eléctrico de 20 kilómetros |
| De Nueva Pompeya a Aeroparque, a fin de año. | de **Nueva Pompea** a **Aeroparco** a fin de año |
| Pero el impacto arranca antes: dónde doblás, dónde estacionás y cómo llegás al laburo. | Pero el impacto arranca antes, donde **doblas**, donde **estacionas** y cómo llegas al **labro** |

Dos problemas distintos, mezclados en el mismo clip:

1. **Contenido, no solo pronunciacion**: el audio menciona "Hipólito Yrigoyen" y "empiezan cambios de circulación y estacionamiento desde este 15 de septiembre", frases que no existen en ningun cartel de subtitulo, y en cambio nunca lee el cartel "Hay nuevas manos, estacionamiento y circulación." Esto indica que el audio se genero a partir de un borrador del guion mas largo/distinto al que despues se uso para quemar los subtitulos, y nunca se volvio a generar el video despues del ajuste editorial del guion.
2. **Pronunciacion**: nombres propios y una marca quedan irreconocibles - "TramBus" leido como una palabra fusionada "Trambús", "Almagro" como "Almagrari", "Mármol y Pringles" como "Marmil, Pringues", "Aeroparque" como "Aeroparco", "Nueva Pompeya" como "Nueva Pompea", "laburo" como "labro". Ademas el voseo del cierre ("doblás", "estacionás", "llegás") se escucha sin la tonica final, achatado hacia tuteo.

## Causa

Segun `docs/daily-reels-automation.md`, `script.txt` alimenta tanto el audio generado por el modelo de video como los subtitulos quemados en postproduccion; deberian decir lo mismo. Este asset se genero fuera del flujo `media/daily/**` documentado en este repo (commit `00fadf2`, autor `SairiAgent`, carpeta `assets/reels-2026-09-15/` + `assets/portal-*-2026-09-15/`), asi que no hay `script.txt` ni `video-prompt.txt` versionados para reconstruir exactamente que paso; el codigo de ese pipeline no vive en este repo (ver README, seccion "Que No Hay").

Con lo que si es visible (la comparacion palabra por palabra), el patron no es ruido: cada "correccion" del subtitulo es exactamente el nombre bien escrito que el audio comio (Almagro/Almagrari, Aeroparque/Aeroparco, Mármol y Pringles/Marmil-Pringues, Nueva Pompeya/Nueva Pompea), y el audio ademas dice clausulas enteras que no estan en ningun cartel (Hipólito Yrigoyen, el agregado sobre "estacionamiento desde el 15 de septiembre"). Esto no es el tipo de error que cubre `docs/pronunciation-guide.md` (tildes/enies/digitos faltantes en el guion escrito): ahi el guion esta mal y el modelo lee literal lo que dice. Aca el patron es al reves, un nombre propio poco frecuente que el modelo de voz no reconoce y arruina solo, mas contenido que el modelo agrego o nunca dijo — algo que ninguna regla de ortografia puede prevenir, y que solo se detecta escuchando el audio real.

Esto es una falla de proceso, no de "sistema de archivos": el gate de QA que exige rechazar/regenerar ante "any mispronounced word" (`docs/daily-reels-automation.md`, Quality Gates) nunca se corrio sobre este asset — probablemente porque el flujo que lo genero (portal/SairiAgent) no pasa por ese checklist, y porque hasta ahora ese gate era manual ("Voice/accent remains the hardest automated gate").

## Fix incluido en este PR

No se puede regenerar el `.mp4` (audio TTS + render de video) desde este entorno: no hay credenciales ni acceso al pipeline de generacion (Higgsfield/Seedance) en este workspace, y este repo explicitamente no debe tocar `sairiagent`. Lo que se entrega es el insumo correcto para que quien tenga acceso al generador regenere el clip:

- [`script.txt`](./script.txt): el guion hablado reconstruido a partir de los subtitulos (fuente correcta segun quien reporto el bug), con las cifras escritas en palabras y "T1" resuelto a "Te Uno" para que el modelo de voz no improvise. Pasa el chequeo automatico limpio:

  ```bash
  node tools/primerfeca-pronunciation-check.js check --script prompts/examples/manual/2026-09-15-trambus-mueve-calle-audio-fix/script.txt
  ```

- Bloque "Pronunciation lock" para pegar en el `video-prompt.txt` de regeneracion:

  ```bash
  node tools/primerfeca-pronunciation-check.js lock --script prompts/examples/manual/2026-09-15-trambus-mueve-calle-audio-fix/script.txt
  ```

- `tools/pronunciation-lexicon.json`: se agrego `trambus` a `foreign` (la marca compuesta "TramBus" leida como palabra fusionada "trambús" es exactamente el tipo de extranjerismo que este lexico existe para declarar) y `doblas`/`estacionas`/`llegas` a `voseo` (las tres formas que cierran el guion y que el checker no tenia cubiertas).

## Pendiente (no se puede hacer desde este repo/entorno)

- Regenerar `assets/reels-2026-09-15/trambus-mueve-calle.mp4` con este `script.txt` a traves del pipeline real (Higgsfield/Seedance u otro que use el equipo de `SairiAgent`/portal), volver a quemar los mismos subtitulos, y reemplazar el archivo.
- Si el video ya se publico en Instagram, evaluar si corresponde reemplazar el post o dejar constancia en el registro de produccion correspondiente, siguiendo el criterio de QA de `docs/daily-reels-automation.md` ("Reject/regenerate if... any mispronounced word").

## Validador nuevo: cerrar el gate de QA que faltaba

El gap de proceso de arriba (nadie corrio un chequeo de audio-vs-guion antes de publicar) ahora tiene un chequeo automatico: `tools/primerfeca-audio-subtitle-check.js`. Transcribe-independiente: recibe `script.txt` + una transcripcion real del audio (`transcript.txt`, producida localmente con `faster-whisper`, sin credenciales) y falla si el contenido no coincide o si una palabra "dura" del lexico (nombre propio/extranjerismo/sigla) quedo irreconocible, exactamente el patron de este incidente.

Corrida contra este caso real (guion corregido + transcripcion real del audio del `.mp4` publicado):

```bash
node tools/primerfeca-audio-subtitle-check.js check \
  --script prompts/examples/manual/2026-09-15-trambus-mueve-calle-audio-fix/script.txt \
  --transcript transcript.txt
```

Resultado: `wer 51.9%`, 11 errores duros, incluyendo exactamente los nombres propios detectados a mano en este documento (`almagro`, `aeroparque`, `marmol`, `pringles`, `pompeya`) y el bloque de contenido agregado ("2 tambien cambia parte del..."). Exit code `2`: hubiera bloqueado la publicacion si estuviera cableado al pipeline real, igual que `primerfeca-pronunciation-check.js` bloquea antes de generar.

Se agrego a `docs/daily-reels-automation.md`, seccion Quality Gates, como paso obligatorio antes de publicar.
