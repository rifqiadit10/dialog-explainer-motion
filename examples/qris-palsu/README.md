# Example: fake QRIS stickers (Indonesian, 9:16, 64.6 s)

Two friends at a coffee shop counter. Dika just paid by QRIS, but the cashier never received the
money; Sari explains the fake-sticker scam, how to check before paying, and what to do if you
already paid.

This folder is the full reference project: root composition (world, cast, camera, captions),
cut-away views, overlays, tagline, `BRIEF.md`, `STORYBOARD.md` (with the shot list),
`SCRIPT.md`, `SOURCES.md`, `frame.md`, and `audio/lines.json` + `audio/timing.json`.

Media is not included: the voices and the music bed were generated or licensed under the
author's HeyGen account. To render it yourself:

```bash
npx hyperframes init my-qris --non-interactive --example=blank --skill=general-video
# copy this folder's files into my-qris/, then from my-qris/:
node <skill>/scripts/tts.mjs audio/lines.json audio/voice          # needs the HeyGen CLI, signed in
node <skill>/scripts/timing.mjs audio/lines.json audio/voice audio/timing.json
# add your own bed at audio/music/bed.mp3 (or remove "music" from lines.json)
node <skill>/scripts/build-root.mjs
npm i -D @hyperframes/core@0.8.183
node <hyperframes-audio>/scripts/carve.mjs --comp index.html
npx hyperframes check .
npx hyperframes render . -q high -o renders/qris-palsu.mp4
```

New TTS takes produce slightly different word timings. The camera shots (`SHOTS`), poses
(`POSES`), and overlay cues in this example are hand-timed to the original takes, so re-time them
to your `audio/timing.json` after regenerating the voices.

Facts were checked on 2026-10-21 (see `SOURCES.md`). Re-verify before publishing.
