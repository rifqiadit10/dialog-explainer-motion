// Dialogue audio through the ElevenLabs CLI (TTS with timestamps), one take per line.
//
//   node <skill>/scripts/tts-el.mjs audio/lines.json audio/voice [--only id,id] [--force] [--dry-run]
//
// lines.json, on top of the tts.mjs format:
//   "tts": {
//     "model_id": "eleven_v4",
//     "output_format": "mp3_44100_128",
//     "voice_settings": { "speed": 1.0 },                     // optional, all speakers
//     "effects": { "TELEPON": { "filter_preset_id": "phone" } } // optional audio_effects per speaker
//   }
//
// Writes <out>/<id>.mp3 and <out>/<id>.alignment.json (character timing). Run align.mjs next: it
// reads the alignment, so no whisper pass is needed. Existing takes are skipped unless --force or
// listed in --only. Prints the characters each call bills before sending anything.
//
// Needs the `elevenlabs` CLI (npm i -g @elevenlabs/cli; ELEVENLABS_BIN overrides the binary) and
// ELEVENLABS_API_KEY in the environment. The key is read by the CLI only; this script never sees it.
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const [, , linesPath, outDir, ...rest] = process.argv;
if (!linesPath || !outDir) {
  console.error("usage: node scripts/tts-el.mjs <lines.json> <out-dir> [--only id,id] [--force] [--dry-run]");
  process.exit(2);
}
const opt = { only: null, force: false, "dry-run": false };
for (let i = 0; i < rest.length; i++) {
  const k = rest[i].replace(/^--/, "");
  if (k === "only") opt.only = new Set(rest[++i].split(","));
  else opt[k] = true;
}
const spec = JSON.parse(readFileSync(linesPath, "utf8"));
const tts = spec.tts || {};
mkdirSync(outDir, { recursive: true });

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const SPOKEN = (spec.spoken || []).map(([written, spoken]) => [new RegExp(`\\b${escape(written)}\\b`, "g"), spoken]);
const toSpoken = (t) => SPOKEN.reduce((s, [re, to]) => s.replace(re, to), t);

// On Windows the npm launcher is a .cmd, which Node only runs through a shell; the body goes in on
// stdin, so the shell only ever sees plain ids and flags.
const win = process.platform === "win32";
const bin = process.env.ELEVENLABS_BIN || (win ? "elevenlabs.cmd" : "elevenlabs");
function elevenlabs(args, body) {
  const r = spawnSync(bin, args, { input: JSON.stringify(body), encoding: "utf8", shell: win && !process.env.ELEVENLABS_BIN, maxBuffer: 64 << 20 });
  if (r.status !== 0) throw new Error(`elevenlabs ${args.slice(0, 2).join(" ")} failed:\n${(r.stdout || "").trim()}\n${(r.stderr || "").trim()}`.trim());
  return r.stdout;
}

const todo = spec.lines.filter((l) => {
  if (opt.only) return opt.only.has(l.id);
  return opt.force || !(existsSync(join(outDir, `${l.id}.mp3`)) && existsSync(join(outDir, `${l.id}.alignment.json`)));
});
const chars = todo.reduce((n, l) => n + toSpoken(l.text).length, 0);
console.log(`${todo.length} line(s), ${chars} characters${opt["dry-run"] ? " (dry run, nothing sent)" : ""}`);

for (const line of todo) {
  const voice = spec.voices[line.speaker];
  if (!voice) throw new Error(`no voice for speaker ${line.speaker}`);
  const body = { text: toSpoken(line.text), model_id: tts.model_id || "eleven_v4" };
  if (spec.language) body.language_code = spec.language;
  if (tts.voice_settings) body.voice_settings = tts.voice_settings;
  if (tts.effects?.[line.speaker]) body.audio_effects = tts.effects[line.speaker];
  const args = ["text-to-speech", "convert_with_timestamps", "--voice-id", voice, "--output-format", tts.output_format || "mp3_44100_128", "--json", "-", "--no-extract", "--format", "json"];
  if (opt["dry-run"]) {
    console.log(elevenlabs([...args, "--dry-run"], body).trim());
    continue;
  }
  const res = JSON.parse(elevenlabs(args, body));
  if (!res.audio_base64 || !res.alignment) throw new Error(`no audio or alignment for ${line.id}: ${Object.keys(res).join(", ")}`);
  writeFileSync(join(outDir, `${line.id}.mp3`), Buffer.from(res.audio_base64, "base64"));
  writeFileSync(join(outDir, `${line.id}.alignment.json`), JSON.stringify({ alignment: res.alignment, normalized_alignment: res.normalized_alignment }, null, 2));
  const a = res.alignment.character_end_times_seconds;
  console.log(`ok ${line.id} ${a[a.length - 1].toFixed(2)}s, ${body.text.length} chars`);
}
