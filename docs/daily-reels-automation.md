# EL PRIMER FECA - Daily Reels Automation

Status: approved by Santi on 2026-09-06 for automatic daily Instagram publishing to `@elprimerfeca`.

## Schedule

Target timezone: `America/Argentina/Buenos_Aires`.

- Main story Reel: publish at 07:00 daily. Automation should start at 06:30 to allow research, script, Seedance generation, QA, and publishing.
- Category Reel: publish at 07:30 daily. Automation should start at 07:00 to allow research, script, Seedance generation, QA, and publishing.
- Third story Reel: publish at 08:00 daily. Automation should start at 07:30 to allow research, script, Seedance generation, QA, and publishing. This slot is permanent as of Santi's 2026-09-08 instruction: three EL PRIMER FECA publications per day between 07:00 and 08:00 Argentina.

If generation or Meta ingestion runs long, publish as soon as QA passes and record the delay. Never publish a known-bad video only to hit the clock.

## Account

- Instagram username: `elprimerfeca`
- Use only the official Instagram API helper in this workspace: `scripts/primerfeca-instagram-api.js`.
- Verify identity immediately before publishing.
- Never use or touch `lafronterasiri`, `sairiagent`, their browser profiles, cookies, tokens, crons, media folders, or post memory.
- Use a temporary HTTPS URL only for Meta video ingestion. Stop any temporary tunnel/server after publish or failure.

## Required Daily Outputs

Each run must create a date/slot-specific production package under:

`media/daily/YYYY-MM-DD/<slot>/`

Slots:

- `main-0700`
- `category-0730`
- `third-0800`

Each package should include:

- `research-notes.md`
- `candidate-ranking.md`
- `candidate-story.json`
- `dedupe-check.json`
- story-specific visual references: source image URLs, downloaded references when safe, screenshot notes, and/or `visual-references.md`
- `script.txt`
- `video-prompt.txt`
- `caption.txt`
- `cover-prompt.txt`
- `cover.png`
- `cover-higgsfield.json`
- `higgsfield.json`
- `raw.mp4`
- `audio.wav` when extractable
- `subtitles.ass`
- `subtitled.mp4`
- `final.mp4`
- preview frames
- `publish-result.json`
- `production.md`

Update `state/daily-reels-log.json` after each successful or failed run.

## Content Dedupe Gate

Santi's 2026-09-07 no-repeat rule: never repeat an EL PRIMER FECA news item. If a topic was already covered, do not cover it again in the next video or in a later daily Reel unless Santi explicitly asks for a follow-up.

- Before writing the final script or spending video credits, create a candidate object with `date`, `slot`, `title`, `selected_story`, and `sources`.
- Run the local duplicate checker against the historical Reel log:

```bash
node scripts/primerfeca-content-dedupe.js check --candidate candidate-story.json
```

- If the checker returns `duplicate_blocked` or exits non-zero, reject that candidate and choose another story. Do not merely change the title while keeping the same news item.
- Treat exact source URL overlap, high title similarity, and high topic similarity as blockers. The point is to avoid repeated content, not to find wording loopholes.
- The 07:30 Reel must also check today's `main-0700` package/log entry before selection, so the second daily video cannot repeat the first one.
- The 08:00 Reel must check both today's `main-0700` and `category-0730` package/log entries before selection, so the third daily video cannot repeat either earlier morning story.
- If the same public issue stays dominant for several days, only cover it again when there is a materially new development, a different primary event, and a clearly new angle. In that case, write the dedupe rationale into `candidate-ranking.md` and `production.md`.
- Save the checker output as `dedupe-check.json` in the package directory for auditability.

## Editorial Survey

Before selecting stories, survey major Argentine and international sources relevant to Argentina. Prefer current, reportable items with public-interest value and enough confirmed detail for a 30-second Reel.

Minimum source mix for the main story:

- La Nacion
- Clarin
- Infobae
- Ambito Financiero
- Perfil
- Pagina/12
- Cronista
- Telam or official government source when useful
- Reuters/AP/Bloomberg/AFP/BBC/CNN en Espanol when they are primary or stronger on the story
- Direct primary sources where available: court filings, government releases, central bank data, company statements, club/federation releases, official bulletins.

For the 07:30 category story, include the specialist's beat sources as appropriate:

- Sports: Ole, TyC Sports, ESPN Argentina, AFA/league/club primary sources.
- Entertainment/culture: Teleshow/Infobae, La Nacion Espectaculos, Clarin Espectaculos, verified posts/statements.
- Economy/markets: Ambito, Cronista, BCRA, INDEC, CNV, Economy Ministry, market data.
- Street/public life: local government, transport, weather alerts, police/civil-defense releases, major city desks.
- Technology/AI/science: company/research primary sources plus La Nacion/Infobae/Clarin tech desks.

Do not rely on a single outlet when the claim is contested. Do not cite rumors as facts.

## Visual Reference Gathering

Santi's 2026-09-08 postmortem on `SHOPPING EN DUDA`: if a Reel narrates a specific photo, protagonist, object, place, building, document, location, or public scene, that element must appear in the audiovisual plan. Do not mention "la foto", a named place, or a concrete protagonist while the video shows only a generic studio.

- During scraping/research, collect visual material that helps illustrate the fact: the actual public photo being discussed, the location, protagonists, official documents, maps, source screenshots, product images, buildings, court/club/stadium/venue facades, charts, or recognizable objects.
- Save links and notes in `research-notes.md` and, when there is enough material, create `visual-references.md` in the production package with each candidate visual, source URL, why it matters, and whether it is safe to pass as a generation reference.
- When technically possible, pass relevant story visuals to Higgsfield/Seedance along with the canonical character reference. If the route cannot safely preserve both character identity and story reference, prioritize character identity but write the concrete visual element into `video-prompt.txt` clearly enough that the generated scene evokes it.
- Use third-party news images as generation references or factual visual cues, not as final pasted footage, unless reuse rights are clear. Respect source attribution in notes/caption when practical.
- `video-prompt.txt` must include a short visual-reference plan: what exact photo/place/object/person should be visible, in which beat, and how it supports the narration.
- QA must check that promised concrete elements appear. If the script says a photo/location/object matters and the final video never shows or evokes it, mark that as a production failure for the next prompt/regeneration decision.

## Selection Rules

Main 07:00 Reel:

- Pick the protagonist story of the day: highest combination of public relevance, freshness, Argentine impact, factual confidence, and visual/narrative potential.
- Default narrator: Clara Ferrer.
- If the protagonist story is clearly specialized, Clara may introduce and hand off to the best specialist.
- For 2026-09-08 specifically, incorporate the trust/transparency layer into the main prompt: show source checking, uncertainty labels, and editorial judgment in the newsroom scene so the audience can see the method behind the AI-native format.

Category 07:30 Reel:

- Pick a different story from the main Reel.
- Choose the best character by beat:
  - Diego Moreno: sports.
  - Valentina Rinaldi: entertainment, celebrity culture, internet gossip with verification.
  - Ricky Bertola: economy, markets, inflation, finance, business, money.
  - Amaru Ferreyra: weather, climate, storms, heat, frost, drought, rivers, agriculture, transport and the practical story of the week's atmosphere.
  - Tomas Vega: street/public life, transport, protests, neighborhoods, human-detail reporting.
  - Sairi: technology, AI, science, digital culture.
  - Clara Ferrer: politics/general/editorial synthesis.
  - Santi - El Productor: only for short gag/interruption/background beat, not as a normal full-time anchor.
- Character variety matters for the 07:30 slot. Do not repeat the same secondary/full-segment specialist by default on consecutive days or too often in the same week. Check `state/daily-reels-log.json` before selecting; prefer a different approved specialist when two stories are editorially comparable.
- Monday morning recurring weather ritual: when there is meaningful weather/climate relevance, Amaru Ferreyra can present `EL TIEMPO DE LA SEMANA`, beginning from `Que clase de semana tenemos?` and identifying the week's weather story rather than listing temperatures mechanically. Always include a practical Buenos Aires answer when relevant, but remember Amaru's editorial principle: Argentina is not Buenos Aires.
- Clara Ferrer can stay fixed as the main 07:00 host, but the second daily video should feel like a rotating ensemble lane. Never force the wrong specialist onto a story just to vary the cast; if the best story clearly belongs to yesterday's character, either advance a materially new angle or choose the next strongest story with a better fresh character fit.

Avoid duplicate topics within the previous 7 days when possible. If the same story remains dominant, advance the angle instead of repeating yesterday's framing.

Third 08:00 Reel:

- Pick a third distinct story from the 07:00 and 07:30 Reels. This is not a duplicate or recap lane.
- It may be a sharper editorial/transparency/storytelling slot when the news cycle calls for it, but it must still tell a concrete noticia with sources and a fresh angle.
- Check today's `main-0700` and `category-0730` packages/log entries before selection. If either earlier package is still in progress or missing, read whatever candidate/log artifacts exist and avoid visible overlap.
- Rotate characters intelligently across the morning. Do not reuse the same full-segment specialist as 07:30 unless the editorial reason is strong and logged.
- Save assets under `media/daily/YYYY-MM-DD/third-0800/`.

## Format

- Language: contemporary Argentine Spanish / Rioplatense Spanish with natural voseo.
- Show name pronunciation: `El Pri-mer Fe-ca`, never spelled as `F-E-C-A`, never English `fake`.
- Spoken text is written in full Spanish orthography: tildes, enies, and `¿` / `¡` opening marks. The voice model reads what is written, so a missing tilde ships as a mispronounced Reel. Figures are always spelled out as words, never left as digits. Full rules in `docs/pronunciation-guide.md`.
- Every `video-prompt.txt` carries a pronunciation lock block declaring acronyms, foreign terms and hard proper nouns. Generate it with `node tools/primerfeca-pronunciation-check.js lock --script script.txt`.
- Hard gate before generation: `node tools/primerfeca-pronunciation-check.js check --script script.txt` must exit 0. Exit 2 means the script would be mispronounced; fix it before spending video credits.
- Duration target: 30 seconds. Seedance 2.5 reference-driven route currently caps at 30s.
- Script pacing is a hard quality gate. The protagonist must never sound rushed, breathless, or forced to cram too many clauses into 30 seconds. Prefer fewer claims, cleaner sentences, natural pauses, and visual evidence carrying part of the explanation. Target a concise 75-95 spoken Spanish words for a 30-second segment unless the delivery can clearly breathe.
- Production resolution: 480p vertical 9:16. Target file dimensions after local processing: 540x960, H.264/AAC.
- Cost target: Seedance 2.5 at 30s / 480p should cost about 75 Higgsfield credits per Reel. Do not use 720p by default unless Santi explicitly asks for the higher-cost render.
- Model: Higgsfield Seedance 2.5 (`seedance_2_5`) in `omni_reference` mode with the selected character's canonical visual reference. Use multiple references only when multiple characters appear.
- If the OpenClaw `video_generate` surface does not list Higgsfield, use the local Higgsfield CLI instead of stopping: `higgsfield generate create seedance_2_5 --prompt "$(cat video-prompt.txt)" --mode omni_reference --aspect_ratio 9:16 --resolution 480p --duration 30 --generate_audio true --image-references <canonical-reference-path> --wait --wait-timeout 30m --json`. The CLI is an approved fallback for this workspace and has access to Seedance 2.5.
- Subtitles: burn locally after generation. White bold text, black outline, no opaque box, safe mobile margins, two lines maximum.
- `ffmpeg` and `ffprobe` must be available on PATH. In this workspace they are exposed by wrappers in `system PATH/` that call `ffmpeg` and `ffprobe`; if `which ffmpeg` fails in an isolated run, prepend `system PATH` to PATH and continue.
- Include a small gag occasionally when organic, especially with El Productor, but the news must stay clear. Entertainment is seasoning, not the meal.

## Opening Cover / Thumbnail

Santi's 2026-09-07 cover rule, corrected at 18:52 UTC: every EL PRIMER FECA daily Reel needs a fully generative image plate in the first frames, like `@lafronterasiri` / La Frontera Siri. The previous subtitle-style banner approach is rejected.

- Official logo reference: `assets/brand/el-primer-feca-logo-oficial-2026-09-07.jpg`, sent by Santi on 2026-09-07. The logo is a square editorial coffee mug image with bold black `EL PRIMER FECA` type, an orange sunrise, steam, cyan-blue-violet stripe, newspaper lines, and a Buenos Aires/Obelisco panel. Use this exact file as the brand reference for cover generation and branded props.
- Choose a short uppercase impact title for the story, usually 2-6 words. It may match the caption title.
- Generate a 9:16 illustrated editorial cover image for the exact news story before final assembly. Use Higgsfield/GPT Image 2 when available, the selected protagonist's canonical reference image, and the official logo reference so the cover matches the character identity and EL PRIMER FECA newsroom language.
- The cover must be one coherent generated image, not a video frame with post-production text. Integrate the title inside the generated composition itself, along with the official EL PRIMER FECA logo/brand language and a story-specific visual background.
- The title must sit centered in the artwork, large, high-contrast, aesthetically designed, informative, and readable as an Instagram thumbnail. Keep the complete title inside the center-square safe crop.
- The cover image should be news-specific, not a generic title banner: include the protagonist when useful, the newsroom identity, and one concrete visual metaphor or source prop tied to the story.
- Forbidden cover shortcuts: subtitle UI text, ASS/SRT overlays, flat top/bottom banners, black rectangles with text, Canva-like stickers pasted onto a video frame, or any title card that looks like an editing overlay instead of generated editorial art.
- Save the cover artifacts as `cover-prompt.txt`, `cover.png`, and `cover-higgsfield.json` in the run package.
- Prepend the cover locally after subtitles for about the first 6 frames / 0.24-0.35 seconds, and append a 1.0-1.5s frozen safety tail. Use the local helper:

```bash
COVER_IMAGE_DURATION=0.35 REEL_TAIL_PAD_DURATION=1.25 REEL_WIDTH=540 REEL_HEIGHT=960 node scripts/prepend-reel-cover-image.js cover.png subtitled.mp4 final.mp4
```

- This must extend the MP4 by the cover plus tail duration, not replace, trim, or shorten the generated video/audio. For a 30s generated video, the finished file should normally be about 31.6s before encoder tolerance.
- If a generated illustrated cover fails or the title is not readable, retry the cover. Do not fall back to no cover unless generation is blocked and the blocker is logged to Santi.
- Inspect both `cover-preview-full` and `cover-preview-square` before publishing. The title must sit in the center of the generated image and remain readable as a thumbnail; the logo/title should look authored into the illustration, not pasted on afterward.

## Visual Direction

Santi's 2026-09-07 feedback, reinforced on 2026-09-08: the cast should feel less stiff and less locked to camera. Future prompts must include purposeful movement, camera variation, props, and short illustrative shots. A seated fixed presenter staring into camera for most of the segment is a production failure, even if the script is correct.

Santi's 2026-09-08 feedback after the launch reaction: public criticism and fear about AI replacing journalism should change the prompt language. Future prompts, especially on 2026-09-08, must make the reporting method visible inside the video. Show an AI-native newsroom that exposes its work instead of hiding the machine behind a fake human performance.

Santi's 2026-09-08 visual correction: use the warmer studio look from the earlier EL PRIMER FECA pilots as the baseline. The room should feel like morning Buenos Aires: warm wood, coffee, newspapers, books, plants, soft sun, paper texture, and human editorial mess. Avoid a cold data-wall aesthetic, blue-neon AI lab, generic corporate dashboard, or overlit TV set.

Santi's 2026-09-08 format direction for tomorrow onward: do not keep the show trapped in the studio. Use AI-native video to send the journalist to the scene when it improves the story. The protagonist can appear at the court, shopping, club, port, station, school, lab, street, theater, stadium, venue, or public location being discussed, or the edit can cut between the warm studio and a generated field scene.

- Avoid static talking-head delivery where the character only stares into camera for 30 seconds. Do not stage the segment as one seated person reading from a desk.
- Give the speaker natural blocking: walking through the newsroom, standing up from the desk, turning to a monitor, crossing to a source board, picking up a notebook, pointing to a printed source, showing a prop, reacting to an off-camera cue, or moving between desk/board/window when it fits the story.
- Include 4-6 shot beats in each `video-prompt.txt`: opening human movement, prop/source closeup, character crossing or changing position, monitor/board interaction or on-location observation, brief illustrative B-roll/reenactment/location shot, and return to the presenter or a strong field closing line.
- The studio should feel inhabited and active: background staff silhouettes, El Productor crossing frame when organic, papers being handed over, a camera operator reflection, monitors changing, coffee/newsroom props in use, and presenters physically interacting with the space. Keep it readable, not chaotic.
- Add simple visual evidence near the speaker: newspapers, official documents, maps, score sheets, market boards, court folders, phones, weather/radar graphics, sports props, or culture/internet artifacts. Keep text abstract unless it is verified and intentionally readable.
- Do not overload generated scenes with readable data or explanatory text. Model-rendered text is unreliable and makes the video look worse when it fails. Use the burned subtitles and Instagram caption for precise language; inside the generated video, prefer visual evidence, recognizable props, graphs without tiny labels, short labels only when necessary, and source closeups where exact text does not carry the claim.
- Add editorial-process evidence when useful: a source board with at least three outlets, Clara's marked-up blue notebook, labels such as "confirmado", "en disputa", "falta respuesta oficial", a correction-ready rundown, and quick glimpses of fact-checking rather than generic futuristic screens.
- Let the AI nature be acknowledged through format. The presenter may briefly reference audience concern about AI news, then answer it by showing verification steps. Do not over-explain the technology; show judgment, sourcing, and uncertainty.
- Use agile but readable camera language: gentle handheld push-in, lateral move, rack focus to props, over-the-shoulder monitor view, newsroom cutaway, exterior/calle insert for Tomas, and quick detail shots. Do not make it chaotic.
- When the story has a concrete event, include one brief illustrative shot showing the thing happening or its consequence: a port/map/ship for Malvinas, exchange-house board for dollar stories, station/platform for transport, training field/scoreboard for sports, phone/social feed artifact for culture, lab/device/demo for tech.
- Location variety is a creative lever, not a gimmick. Use exterior/location staging when it makes the fact clearer or more memorable; stay in the warm studio when the story is abstract, source-heavy, or needs editorial synthesis.
- Preserve character identity above all. Movement and B-roll are there to make the Reel alive, not to replace the protagonist with generic stock footage.
- Final QA should inspect whether the clip has real visual rhythm. If it is just a rigid monologue to camera, a seated fixed presenter, or a face reading without meaningful interaction with the studio, mark it as a production issue and improve the next prompt.

Baseline transparency prompt layer for 2026-09-08:

```text
Create a 30-second vertical Argentine AI-native newsroom segment. The presenter openly shows the reporting process: printed source notes, a screen with multiple verified outlets, highlighted uncertainty, and a correction-ready editorial board. The tone is transparent, sharp, and self-aware: this is not AI pretending to replace journalism, it is AI showing its work. Include natural movement, quick source closeups, newsroom interruptions, and one brief moment where the presenter acknowledges public concern about AI-generated news, then answers it by demonstrating verification. Preserve character identity, Rioplatense Spanish delivery, energetic but credible pacing.
```

## Caption Rules

Every Instagram caption must be in this structure:

```text
TITULO EN MAYUSCULA

Bajada clara en espanol que describe que paso, por que importa y que fuentes se usaron. Incluir fuentes dentro de la descripcion cuando entren bien.
```

Keep the caption compact enough for Instagram reliability. Include source outlet names and URLs when practical.

## Quality Gates

Before publishing:

- Verify account identity with `node scripts/primerfeca-instagram-api.js verify`.
- Confirm `final.mp4` is 9:16, 540x960, H.264/AAC, duration >= 20s, and audio is non-silent.
- Confirm the final MP4 duration is at least `subtitled.mp4` duration + cover duration + safety tail - 0.15s. Never publish a file where the cover/title intro cuts off the generated video or final spoken line.
- Inspect preview frames for cover/title readability, center-square thumbnail safety, character identity, framing, and subtitle readability.
- Inspect whether the concrete photo/place/object/protagonist referenced in the narration is visible or clearly evoked. If not, log the miss and regenerate when it is central to the story.
- Reject/regenerate if the clip has wrong account, wrong language, wrong accent, bad show-name pronunciation, any mispronounced word, misread figure or spelled-out acronym, missing/incorrect captions, unreadable subtitles, broken audio, or visual drift that misidentifies the selected character. When a word comes out wrong, fix the script and add the word to `tools/pronunciation-lexicon.json` so the checker catches it next time.

Voice/accent remains the hardest automated gate. If no reliable audio review is available, make the prompt explicit and log the limitation honestly in `production.md`.

## Publication

Use:

```bash
node scripts/primerfeca-instagram-api.js publish-reel --video-url <https-url> --video <local-final-mp4> --caption "$(cat caption.txt)"
```

After publish:

- Save API output to `publish-result.json`.
- Verify the permalink returned by Graph.
- Append the published item to `state/daily-reels-log.json`.
- Send Santi the final published MP4 on WhatsApp.
- Send Santi the exact `caption.txt` text used for the Instagram description. Do not paraphrase it as a summary.

If Santi asks for the latest/ultimo published EL PRIMER FECA video, inspect `state/daily-reels-log.json`, select the most recent entry with `published: true`, `published_at_utc`, and `final_mp4`, then send that MP4 and the exact caption from its package directory. Do not send generated-but-unpublished work in progress.
