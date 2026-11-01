# Changelog

## 1.2.0 (2026-10-31)

- Isometric 3D style: a low-poly Three.js world under fixed HTML chrome, 3D characters with friendly
  faces, hinged arms (rest, hold, phone-at-ear poses), per-syllable mouths, a flying camera, 3D
  labels, overlay panels over a blurred world, and caption beats. New `references/isometrik.md`
  (build order, `beats.json`, layers, kit, poses, proven framings, patterns, checks). No example
  project ships for this style. Branding comes from `beats.json` `"series"`.
- Scripts: `beats.mjs` (caption beats checked against the timed words), `audio-tags.mjs` (voice
  clips, sound effects cued to words from `audio/sfx.json`, music bed), `tts-el.mjs` (ElevenLabs CLI,
  per line with character timing, dry run and per-line runs), `split-take.mjs` (one multi-speaker
  take cut per line in mid-pause, original spacing kept, `--start`, `--gap`, `--detect`, per-speaker
  ffmpeg filters such as a phone voice).
- Voice: four documented paths with their licences (HeyGen, ElevenLabs API, ElevenLabs web UI
  dialogue take, recordings); spelling acronyms with hyphens; loudness normalisation of quiet takes;
  running whisper.cpp directly when `hyperframes transcribe` is unavailable on Windows; extending a
  short music bed with a crossfade; synthesized phone sounds.
- Facts: source cards quote only what the source says (keep "diduga"/"terindikasi", data cut-off
  dates, no mixing of figures with different scopes).
- Workflow: story advice (a real process with a turn, one hero, an ending that repeats the opening
  changed), topic proposals from current data, credit estimates before generating, and checks on
  frames taken from the final MP4 plus a loudness target.
- Pitfalls added for WSL/Git Bash paths, ElevenLabs plan limits and PowerShell quoting, quiet takes,
  short music, carve dependencies, and the isometric style.

## 1.1.0 (2026-10-22)

- Word cues: shots, poses, world tweens, and root clips are written as `cue("line:word")` or
  `data-cue` / `data-cue-end` instead of seconds. `build-root.mjs` injects the resolver, checks every
  literal cue against `audio/timing.json` (stops with the line's words when one is missing), and
  `--words` lists the usable words. The starter and the QRIS example use cues; their renders are
  unchanged (starter bit-identical; example within 6 ms).
- `align.mjs`: word timestamps for audio from any source. Reads an ElevenLabs alignment, any
  word-timestamp JSON, or runs local whisper (`hyperframes transcribe`), and maps the heard words
  back onto the script, handling words heard as split or merged. HeyGen is now optional.
- Docs: cue syntax in `references/kamera.md`, the second voice path in `references/audio.md`,
  new pitfalls.

## 1.0.0 (2026-10-22)

- First release: workflow for two-character dialogue explainers on HyperFrames.
- Scripts: `tts.mjs` (HeyGen TTS with word timestamps, WSL-aware), `timing.mjs`, `build-root.mjs`.
- Runnable starter (camera rig, world, cast, lip-sync and karaoke caption drivers, one view, overlay, and tagline).
- Full reference example: fake QRIS stickers (Indonesian, 9:16, 64.6 s).
- References: camera, cast, audio, captions, facts, known pitfalls.
- Agent-neutral: open Agent Skills layout with a `compatibility` field; installs into any detected agent via `npx skills add`, plus a Claude Code plugin manifest.
