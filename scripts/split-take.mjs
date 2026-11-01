// Splits one multi-speaker take (e.g. an ElevenLabs dialogue generation) into per-line clips and
// lays them on the timeline at their original spacing, so the take's natural turn-taking is kept.
//
//   node <skill>/scripts/split-take.mjs audio/lines.json audio/voice dialog-take audio/timing.json
//        [--start 0.5] [--lead-in 0.25] [--tail 1.8] [--gap <id>=<s>,...] [--detect <take-id>]
//
// Needs <voice>/<take>.mp3 and <voice>/<take>.json (words for the whole take, from align.mjs run on
// a spec whose single line is every line's text joined in order). Each line gets the take's words in
// order; cuts sit halfway between one line's last word and the next line's first word. Writes
// <voice>/<id>.mp3 and <voice>/<id>.json per line and a timing.json in the timing.mjs format.
// A speaker listed in lines.json "tts.filters" gets that ffmpeg audio filter on its clips
// (used for the phone voice).
import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const [, , linesPath, voiceDir, take, outPath, ...rest] = process.argv;
if (!linesPath || !voiceDir || !take || !outPath) {
  console.error("usage: node scripts/split-take.mjs <lines.json> <voice-dir> <take-id> <timing.json> [--start s] [--lead-in s] [--tail s]");
  process.exit(2);
}
// --gap f7-2-b=1.0,... adds silence before a line (and pushes every later line back).
const opt = { start: 0.5, "lead-in": 0.25, tail: 1.8 };
const gaps = {};
for (let i = 0; i < rest.length; i += 2) {
  const k = rest[i].replace(/^--/, "");
  if (k === "gap") for (const g of rest[i + 1].split(",")) gaps[g.split("=")[0]] = Number(g.split("=")[1]);
  else if (k === "detect") opt.detect = rest[i + 1];
  else opt[k] = Number(rest[i + 1]);
}

const spec = JSON.parse(readFileSync(linesPath, "utf8"));
const filters = spec.tts?.filters || {};
const whole = JSON.parse(readFileSync(join(voiceDir, `${take}.json`), "utf8"));
const W = whole.words.filter((w) => !/^<.*>$/.test(w.word));
const round = (v) => +v.toFixed(3);

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const SPOKEN = (spec.spoken || []).map(([written, spoken]) => [new RegExp(`\\b${escape(written)}\\b`, "g"), spoken]);
const toSpoken = (t) => SPOKEN.reduce((s, [re, to]) => s.replace(re, to), t);

// Words per line, in order.
let k = 0;
const parts = spec.lines.map((l) => {
  const n = toSpoken(l.text).split(/\s+/).filter(Boolean).length;
  const words = W.slice(k, k + n);
  k += n;
  return { ...l, words };
});
if (k !== W.length) throw new Error(`take has ${W.length} words, lines have ${k}: is the take spec the lines joined in order?`);

// Recognizer words run edge to edge, so the pause between turns sits inside a word's span. Find the
// pauses in the audio, cut in the middle of the one at each turn, and trim the words to it.
// --detect <id> finds the pauses in another take (e.g. the raw one before loudness processing lifted them).
const sd = spawnSync("ffmpeg", ["-hide_banner", "-nostats", "-i", join(voiceDir, `${opt.detect || take}.mp3`), "-af", "silencedetect=noise=-35dB:d=0.1", "-f", "null", "-"], { encoding: "utf8" });
const pauses = [...sd.stderr.matchAll(/silence_end: ([\d.]+) \| silence_duration: ([\d.]+)/g)].map((m) => ({ a: m[1] - m[2], b: +m[1] }));
const cuts = parts.map((p, i) => {
  if (i === 0) return 0;
  const prev = parts[i - 1].words.at(-1);
  const mid = (prev.end + p.words[0].start) / 2;
  const pause = pauses.find((q) => q.a - 0.15 <= mid && mid <= q.b + 0.15);
  if (!pause) return mid;
  prev.end = Math.min(prev.end, pause.a);
  p.words[0].start = Math.max(p.words[0].start, pause.b);
  return (pause.a + pause.b) / 2;
});
cuts.push(whole.duration);

const lines = [];
let shift = 0;
parts.forEach((p, i) => {
  shift += gaps[p.id] || 0;
  const from = cuts[i];
  const dur = cuts[i + 1] - from;
  const args = ["-hide_banner", "-loglevel", "error", "-y", "-ss", String(from), "-t", String(dur), "-i", join(voiceDir, `${take}.mp3`)];
  if (filters[p.speaker]) args.push("-af", filters[p.speaker]);
  args.push("-c:a", "libmp3lame", "-b:a", "128k", join(voiceDir, `${p.id}.mp3`));
  execFileSync("ffmpeg", args);
  const words = p.words.map((w) => ({ word: w.word, start: round(w.start - from), end: round(w.end - from) }));
  writeFileSync(join(voiceDir, `${p.id}.json`), JSON.stringify({ id: p.id, speaker: p.speaker, text: p.text, source: take, duration: round(dur), words }, null, 2));
  const audioStart = opt.start + from + shift;
  lines.push({
    id: p.id,
    frame: p.frame,
    speaker: p.speaker,
    text: p.text,
    audioStart: round(audioStart),
    duration: round(dur),
    speechStart: round(audioStart + words[0].start),
    speechEnd: round(audioStart + words.at(-1).end),
    words: words.map((w) => ({ word: w.word, start: round(audioStart + w.start), end: round(audioStart + w.end) })),
  });
});

const frameIds = [...new Set(lines.map((l) => l.frame))];
const frames = frameIds.map((f, i) => {
  const first = lines.find((l) => l.frame === f);
  return { frame: f, start: i === 0 ? 0 : round(first.speechStart - opt["lead-in"]) };
});
frames.forEach((fr, i) => {
  fr.end = i < frames.length - 1 ? frames[i + 1].start : round(lines.at(-1).speechEnd + opt.tail);
  fr.duration = round(fr.end - fr.start);
  fr.mid = round((fr.start + fr.end) / 2);
});
const total = frames.at(-1).end;
writeFileSync(outPath, JSON.stringify({ total, frames, lines }, null, 2));
console.log(`total ${total.toFixed(2)}s`);
for (const l of lines) console.log(`${l.id.padEnd(14)} ${l.audioStart.toFixed(2)}  speech ${l.speechStart.toFixed(2)}-${l.speechEnd.toFixed(2)}  ${l.words.length} words`);
