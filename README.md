<p align="center">
  <img src="assets/brand/el-primer-feca-logo-oficial-2026-09-07.jpg" alt="EL PRIMER FECA" width="420">
</p>

<h1 align="center">EL PRIMER FECA</h1>

Prompts, diseño editorial y biblia de personajes de **EL PRIMER FECA**, un noticiero argentino AI-native pensado para publicar videos cortos diarios en Instagram Reels.

La idea no es esconder que hay inteligencia artificial en el proceso. Al revés: el formato busca mostrar qué puede ser una redacción sintética cuando se toma en serio tres cosas que el periodismo no puede perder: fuentes, criterio y corrección.

## Qué Es

EL PRIMER FECA es un experimento de periodismo audiovisual generado con IA.

El formato base:

- un Reel vertical de alrededor de 30 segundos;
- español rioplatense;
- tono de mañana argentina: claro, filoso, rápido, con café;
- una noticia concreta por video;
- un protagonista o especialista que la cuenta;
- una portada ilustrada generativa;
- subtítulos quemados en postproducción;
- caption con descripción y fuentes.

No es un avatar leyendo titulares. La ambición es construir una redacción con personajes, mirada editorial, rutinas de verificación y una gramática visual propia.

## Qué Hay En Este Repo

- `docs/` - reglas editoriales, flujo diario, dirección visual, guía de pronunciación y criterios de QA.
- `characters/` - biblia de protagonistas: Clara Ferrer, Diego Moreno, Tomás Vega, Valentina Rinaldi, Ricky Bertola, Amaru Ferreyra, Sairi y Santi "El Productor".
- `assets/brand/` - marca visual pública de EL PRIMER FECA.
- `prompts/templates/` - plantillas para crear nuevos videos.
- `prompts/examples/` - prompts, guiones, captions y notas de investigación de piezas reales.
- `tools/` - utilidades publicables, sin credenciales, para checks editoriales: dedupe de temas y chequeo de pronunciación.

## Qué No Hay

Este repo evita publicar material operativo privado:

- tokens, OAuth, cookies o secretos;
- IDs internos de cuentas;
- logs de publicación;
- estados locales;
- MP4 finales, audios crudos o archivos pesados de producción;
- scripts de publicación con API;
- perfiles de navegador.

Eso no es romanticismo open source. Es higiene básica.

## Pipeline Creativo

1. **Research**
   Se revisan medios argentinos, fuentes primarias y fuentes internacionales. La noticia tiene que importar rápido para una audiencia argentina o latinoamericana.

2. **Selección**
   Se elige una historia con relevancia pública, novedad, fuente sólida, potencial visual y buen encaje con un personaje.

3. **Dedupe**
   Antes de gastar créditos de video, se compara la historia contra publicaciones recientes para no repetir tema.

4. **Guion**
   El guion apunta a 75-95 palabras para 30 segundos. Tiene hook, hecho, contexto, consecuencia y una pregunta o tesis final.

5. **Diseño de escena**
   El prompt visual define personaje, locación, props, referencias visuales concretas y ritmo de cámara.

6. **Generación**
   El video se genera con un modelo de video IA, usando referencias visuales de personaje cuando corresponde.

7. **Postproducción**
   Se agregan subtítulos, portada ilustrada inicial y cola de seguridad para que Instagram no corte el final.

8. **QA**
   Se verifica identidad del personaje, audio, acento, pronunciación palabra por palabra, subtítulos, verticalidad, portada, caption y aparición de elementos prometidos por el guion.

9. **Publicación**
   El video se publica con caption descriptivo y fuentes.

## Principios Editoriales

- La noticia va primero. La IA no es excusa para publicar humo.
- No repetir temas por inercia.
- No confundir rumor con hecho.
- Separar hecho, interpretación, opinión e incertidumbre.
- Usar fuentes primarias cuando existan.
- Si el video menciona una foto, lugar, protagonista, documento u objeto concreto, eso debe aparecer o evocarse visualmente.
- El formato puede ser entretenido, pero la claridad manda.

## Principios Visuales

- Estudio cálido, de mañana en Buenos Aires: madera, café, diarios, libros, plantas, luz suave y textura editorial.
- Evitar estética de dashboard frío, laboratorio azul-neón o pared de datos.
- Poca información escrita dentro del video generado; el texto preciso vive en subtítulos y caption.
- Portadas generativas con título integrado, no banners pegados encima.
- Personajes consistentes, no presentadores genéricos reciclados.
- Cuando la historia lo pide, salir del estudio: juzgados, shoppings, canchas, puertos, calles, escuelas, laboratorios, teatros.

## Personajes

- **Clara Ferrer** - conductora principal y editora de la mañana.
- **Diego Moreno** - deportes, historia deportiva y datos raros.
- **Tomás Vega** - movilero, calle y escenas externas.
- **Valentina Rinaldi** - espectáculos, cultura celebrity e inteligencia de chimentos.
- **Ricky Bertola** - economía, mercados y finanzas.
- **Amaru Ferreyra** - meteorología, clima, tiempo y territorio argentino.
- **Sairi** - tecnología, IA, ciencia y cultura digital.
- **Santi "El Productor"** - productor ejecutivo, caos controlado y apariciones accidentales.

Cada personaje tiene una biblia propia en `characters/`.

## Cómo Usar Los Prompts

Para crear una nueva pieza:

1. Copiá `prompts/templates/daily-reel-brief.md`.
2. Completá historia, fuentes, personaje y visuales concretos.
3. Usá `video-prompt-template.md` para generar la escena.
4. Usá `cover-prompt-template.md` para la portada.
5. Escribí el caption con `caption-template.md`.
6. Pasá el chequeo de pronunciación: `node tools/primerfeca-pronunciation-check.js check --script script.txt`.
7. Corré la checklist de `qa-checklist.md` antes de publicar.

Los ejemplos reales en `prompts/examples/` muestran cómo se aterriza el sistema.

## Licencia

Sin licencia por ahora. El repositorio es público para estudio, transparencia y conversación, no como permiso automático para reutilizar marca, personajes o assets.
