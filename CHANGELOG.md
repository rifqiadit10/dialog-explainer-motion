# Changelog

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
