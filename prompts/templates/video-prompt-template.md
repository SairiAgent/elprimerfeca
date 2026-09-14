# Video Prompt Template

Create a 30-second vertical 9:16 Argentine AI-native newsroom segment for EL PRIMER FECA.

## Character

Use `[CHARACTER NAME]` as the visible presenter. Preserve the canonical character identity from the reference image and character bible:

- face, age, hair, skin tone and silhouette;
- wardrobe and signature props;
- editorial personality;
- natural Rioplatense Spanish delivery.

## Voice

The speaker must talk in Spanish:

`español rioplatense, acento argentino de Buenos Aires, voz natural, misma voz y mismo acento durante todo el video`

The show name is pronounced naturally as "El Pri-mer Fe-ca", never as letters and never like English "fake".

## Pronunciation Lock

Read every written accent in the script exactly as written: the tildes carry the stress.

List here every acronym, foreign term and hard proper noun in this script, with how it must be said. Generate the block instead of writing it by hand:

```bash
node tools/primerfeca-pronunciation-check.js lock --script script.txt
```

`[PRONUNCIATION LOCK]`

See `docs/pronunciation-guide.md`.

## Scene

Warm Buenos Aires morning newsroom. Wood, coffee, newspapers, books, plants, soft sunlight, used paper texture, lived-in editorial desk. Avoid cold corporate dashboard, blue-neon AI lab, generic TV studio, or data wall.

## Story

The story is:

`[ONE-SENTENCE STORY]`

The key visual element that must appear or be clearly evoked:

`[PHOTO / PLACE / OBJECT / PERSON / DOCUMENT]`

## Script

Use this exact narration:

```text
[SCRIPT]
```

## Shot Beats

1. Opening: `[movement, position, hook image]`.
2. Source/prop closeup: `[document, phone, newspaper, chart, object]`.
3. Presenter action: `[turns to board, walks, handles prop, marks notebook]`.
4. Visual evidence or location: `[generated location / source cue / scene]`.
5. Closing: `[return to presenter or strong visual ending]`.

## Constraints

- Keep the presenter recognizable.
- Keep subtitles out of the generated video; they will be added later.
- Keep generated readable text minimal and non-critical.
- Use visual props instead of walls of tiny text.
- The segment should feel alive, not like a locked talking head.

