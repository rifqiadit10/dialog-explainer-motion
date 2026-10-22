// Dialogue audio through the HeyGen CLI (TTS), keeping word timestamps for lip-sync and captions.
//
//   node <skill>/scripts/tts.mjs audio/lines.json audio/voice
//
// lines.json:
//   {
//     "language": "id",
//     "voices":  { "A": "<voice_id>", "B": "<voice_id>" },
//     "spoken":  [["QRIS", "Kris"]],          // optional: written -> spoken forms sent to TTS
//     "lines":   [{ "id": "f1-1-a", "frame": 1, "speaker": "A", "text": "..." }]
//   }
//
// Writes <out>/<id>.mp3 and <out>/<id>.json ({ duration, words: [{ word, start, end }] }).
// Existing pairs are skipped, so re-running only fills gaps (delete a pair to redo that line).
//
// The CLI runs from PATH. It has no native Windows build; on Windows set HEYGEN_WSL=1 to call
// it inside WSL (HEYGEN_WSL_DISTRO picks the distro, HEYGEN_BIN overrides the binary path).
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const [, , linesPath, outDir] = process.argv;
if (!linesPath || !outDir) {
  console.error("usage: node scripts/tts.mjs <lines.json> <out-dir>");
  process.exit(2);
}
const spec = JSON.parse(readFileSync(linesPath, "utf8"));
mkdirSync(outDir, { recursive: true });

function heygenRunner() {
  if (process.env.HEYGEN_WSL === "1") {
    const distro = process.env.HEYGEN_WSL_DISTRO ? ["-d", process.env.HEYGEN_WSL_DISTRO] : [];
    const bin =
      process.env.HEYGEN_BIN ||
      execFileSync("wsl", [...distro, "--", "sh", "-c", 'command -v heygen || printf %s "$HOME/.local/bin/heygen"'], { encoding: "utf8" })
        .replace(/\0/g, "")
        .trim();
    return (args) => execFileSync("wsl", [...distro, "--", bin, ...args], { encoding: "utf8", maxBuffer: 16 << 20 }).replace(/\0/g, "");
  }
  const bin = process.env.HEYGEN_BIN || "heygen";
  return (args) => execFileSync(bin, args, { encoding: "utf8", maxBuffer: 16 << 20 });
}
const heygen = heygenRunner();

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const SPOKEN = (spec.spoken || []).map(([written, spoken]) => [new RegExp(`\\b${escape(written)}\\b`, "g"), spoken]);
const toSpoken = (t) => SPOKEN.reduce((s, [re, to]) => s.replace(re, to), t);

for (const line of spec.lines) {
  const voice = spec.voices[line.speaker];
  if (!voice) throw new Error(`no voice for speaker ${line.speaker}`);
  const meta = join(outDir, `${line.id}.json`);
  const audio = join(outDir, `${line.id}.mp3`);
  if (existsSync(meta) && existsSync(audio)) {
    console.log(`skip ${line.id} (exists)`);
    continue;
  }
  const args = ["voice", "speech", "create", "--voice-id", voice, "--text", toSpoken(line.text)];
  if (spec.language) args.push("--language", spec.language);
  if (spec.speed) args.push("--speed", String(spec.speed));
  const res = JSON.parse(heygen(args));
  const d = res.data || res;
  if (!d.audio_url) throw new Error(`no audio_url for ${line.id}`);
  const r = await fetch(d.audio_url);
  if (!r.ok) throw new Error(`download failed for ${line.id}: HTTP ${r.status}`);
  writeFileSync(audio, Buffer.from(await r.arrayBuffer()));
  writeFileSync(
    meta,
    JSON.stringify({ id: line.id, speaker: line.speaker, text: line.text, voice, duration: d.duration, words: d.word_timestamps || [] }, null, 2),
  );
  console.log(`ok ${line.id} ${Number(d.duration).toFixed(2)}s`);
}
