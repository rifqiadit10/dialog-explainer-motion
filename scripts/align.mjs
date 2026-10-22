// Word timestamps for voice audio from any source: another TTS, a recorded voice-over, or an export.
//
//   node <skill>/scripts/align.mjs audio/lines.json audio/voice [--model small] [--language id] [--force]
//
// Each line needs <voice>/<id>.mp3 (a .wav, .m4a, .ogg or .flac is converted with ffmpeg). Writes
// <voice>/<id>.json in the format tts.mjs writes, so timing.mjs and build-root.mjs run unchanged.
// Word times come from the first of:
//   1. <id>.json that already has words (kept unless --force)
//   2. <id>.alignment.json: an ElevenLabs "with-timestamps" response or its alignment object
//      (characters, character_start_times_seconds, character_end_times_seconds)
//   3. <id>.words.json: [{ word or text, start, end }] in seconds, from any aligner or TTS
//   4. `npx hyperframes transcribe` (local whisper). Use a multilingual model (small, medium,
//      large-v3-turbo) for non-English: the *.en models translate. --language defaults to lines.json.
// Recognized words are matched back onto the script text (after the "spoken" substitutions), so
// captions and cues keep the script's words; words the recognizer missed are interpolated.
import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const [, , linesPath, voiceDir, ...rest] = process.argv;
if (!linesPath || !voiceDir) {
  console.error("usage: node scripts/align.mjs <lines.json> <voice-dir> [--model small] [--language id] [--force]");
  process.exit(2);
}
const spec = JSON.parse(readFileSync(linesPath, "utf8"));
const opt = { model: "small", language: spec.language || "", force: false };
for (let i = 0; i < rest.length; i++) {
  const k = rest[i].replace(/^--/, "");
  if (k === "force") opt.force = true;
  else opt[k] = rest[++i];
}

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const SPOKEN = (spec.spoken || []).map(([written, spoken]) => [new RegExp(`\\b${escape(written)}\\b`, "g"), spoken]);
const toSpoken = (t) => SPOKEN.reduce((s, [re, to]) => s.replace(re, to), t);
const key = (w) => String(w).toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
const round = (v) => +v.toFixed(3);

const probe = (f) => Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f], { encoding: "utf8" }).trim());

function audioFor(id) {
  const mp3 = join(voiceDir, `${id}.mp3`);
  if (existsSync(mp3)) return mp3;
  for (const ext of ["wav", "m4a", "ogg", "flac"]) {
    const src = join(voiceDir, `${id}.${ext}`);
    if (!existsSync(src)) continue;
    execFileSync("ffmpeg", ["-v", "error", "-y", "-i", src, "-codec:a", "libmp3lame", "-q:a", "2", mp3]);
    console.log(`converted ${id}.${ext} -> ${id}.mp3`);
    return mp3;
  }
  return null;
}

// ElevenLabs character alignment -> words (split on whitespace).
function fromCharacters(a) {
  a = a.alignment || a.normalized_alignment || a;
  const out = [];
  let cur = null;
  a.characters.forEach((ch, i) => {
    if (/\s/.test(ch)) return void (cur = null);
    if (!cur) out.push((cur = { word: "", start: a.character_start_times_seconds[i], end: 0 }));
    cur.word += ch;
    cur.end = a.character_end_times_seconds[i];
  });
  return out;
}

// The CLI writes transcript.json into --dir and prints a summary; a temp dir keeps the project clean.
function transcribe(audio) {
  const dir = mkdtempSync(join(tmpdir(), "align-"));
  const args = ["--yes", "hyperframes", "transcribe", audio, "--model", opt.model, "--dir", dir, "--json"];
  if (opt.language) args.push("--language", opt.language);
  const win = process.platform === "win32";
  const r = spawnSync("npx", win ? args.map((a) => (/[\s"&]/.test(a) ? `"${a}"` : a)) : args, { encoding: "utf8", shell: win, maxBuffer: 64 << 20 });
  try {
    if (r.status !== 0) throw new Error(`hyperframes transcribe failed for ${audio}:\n${(r.stderr || "").trim().split("\n").slice(-8).join("\n")}`);
    const summary = JSON.parse(r.stdout.trim().split("\n").filter((l) => l.startsWith("{")).pop() || "{}");
    const j = JSON.parse(readFileSync(summary.transcriptPath || join(dir, "transcript.json"), "utf8"));
    return (Array.isArray(j) ? j : j.words || []).map((w) => ({ word: w.word ?? w.text, start: w.start, end: w.end }));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function lev(a, b) {
  const d = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let prev = d[0];
    d[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const t = d[j];
      d[j] = Math.min(d[j] + 1, d[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = t;
    }
  }
  return d[b.length];
}
const sim = (a, b) => (a === b ? 1 : !a || !b ? 0 : 1 - lev(a, b) / Math.max(a.length, b.length));

// Global alignment of script words onto heard words. A script word takes one heard word, two (the
// recognizer split it) or shares one with its neighbour (two words heard as one).
// Returns per script word { a, b, s: similarity, merged } (heard index span) or null.
function matchWords(script, heard) {
  const n = script.length;
  const m = heard.length;
  const GAP = -0.4;
  const score = (a, b) => 2 * (sim(a, b) - 0.5);
  const S = Array.from({ length: n + 1 }, (_, i) => Float64Array.from({ length: m + 1 }, (_, j) => (i + j) * GAP));
  const B = Array.from({ length: n + 1 }, (_, i) => Uint8Array.from({ length: m + 1 }, (_, j) => (i === 0 ? 2 : j === 0 ? 1 : 0)));
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const k = script[i - 1].k;
      const opts = [
        [S[i - 1][j - 1] + score(k, heard[j - 1].k), 0],
        [S[i - 1][j] + GAP, 1],
        [S[i][j - 1] + GAP, 2],
      ];
      if (j > 1) opts.push([S[i - 1][j - 2] + score(k, heard[j - 2].k + heard[j - 1].k) - 0.05, 3]);
      if (i > 1) opts.push([S[i - 2][j - 1] + score(script[i - 2].k + k, heard[j - 1].k) - 0.05, 4]);
      const best = opts.reduce((x, y) => (y[0] > x[0] ? y : x));
      S[i][j] = best[0];
      B[i][j] = best[1];
    }
  }
  const spans = new Array(n).fill(null);
  for (let i = n, j = m; i > 0 || j > 0; ) {
    const b = i > 0 && j > 0 ? B[i][j] : i > 0 ? 1 : 2;
    if (b === 0) {
      spans[i - 1] = { a: j - 1, b: j - 1, s: sim(script[i - 1].k, heard[j - 1].k) };
      i--, j--;
    } else if (b === 3) {
      spans[i - 1] = { a: j - 2, b: j - 1, s: sim(script[i - 1].k, heard[j - 2].k + heard[j - 1].k) };
      i--, (j -= 2);
    } else if (b === 4) {
      const s = sim(script[i - 2].k + script[i - 1].k, heard[j - 1].k);
      spans[i - 2] = { a: j - 1, b: j - 1, s, merged: true };
      spans[i - 1] = { a: j - 1, b: j - 1, s, merged: true };
      (i -= 2), j--;
    } else if (b === 1) i--;
    else j--;
  }
  return spans;
}

// Script words get the times of their matched heard words; a matched word absorbs unmatched heard
// words right after it; runs of unmatched script words share the time between their neighbours,
// by length.
function timeScript(scriptText, heard, duration) {
  const script = scriptText.split(/\s+/).filter(Boolean).map((w) => ({ word: w, k: key(w) }));
  const H = heard.filter((h) => key(h.word)).map((h) => ({ ...h, k: key(h.word) }));
  const spans = matchWords(script, H);
  const out = script.map((s, i) => (spans[i] ? { word: s.word, start: H[spans[i].a].start, end: H[spans[i].b].end } : { word: s.word }));
  for (let i = 0; i + 1 < out.length; i++) {
    if (!spans[i]?.merged || spans[i + 1]?.a !== spans[i].a) continue;
    const share = script[i].k.length / (script[i].k.length + script[i + 1].k.length);
    out[i].end = out[i + 1].start = out[i].start + (out[i].end - out[i].start) * share;
    i++;
  }
  for (let i = 0; i < out.length; i++) {
    if (!spans[i]) continue;
    const next = spans.slice(i + 1).find(Boolean)?.a ?? H.length;
    if (spans[i + 1] !== null && next > spans[i].b + 1) out[i].end = H[next - 1].end;
  }
  const matched = spans.filter((s) => s && s.s >= 0.5).length;
  const map = spans.map((s) => (s ? s.a : -1));
  const PER_CHAR = 0.075;
  for (let i = 0; i < out.length; ) {
    if (map[i] >= 0) {
      i++;
      continue;
    }
    let j = i;
    while (j < out.length && map[j] < 0) j++;
    const run = out.slice(i, j);
    const total = run.reduce((a, w) => a + w.word.length + 1, 0);
    // Edges: use unmatched heard words before the first / after the last anchor, else estimate.
    let from = i > 0 ? out[i - 1].end : null;
    let to = j < out.length ? out[j].start : null;
    if (from === null) from = H.length && (j === out.length || map[j] > 0) ? H[0].start : Math.max(0, (to ?? duration) - PER_CHAR * total);
    if (to === null) to = H.length && (i === 0 || spans[i - 1].b < H.length - 1) ? Math.max(H[H.length - 1].end, from) : Math.min(duration, from + PER_CHAR * total);
    let t = from;
    for (const w of run) {
      w.start = t;
      t += ((to - from) * (w.word.length + 1)) / total;
      w.end = t;
    }
    i = j;
  }
  return { words: out.map((w) => ({ word: w.word, start: round(w.start), end: round(Math.max(w.end, w.start)) })), matched, total: out.length };
}

for (const line of spec.lines) {
  const meta = join(voiceDir, `${line.id}.json`);
  if (!opt.force && existsSync(meta) && JSON.parse(readFileSync(meta, "utf8")).words?.length) {
    console.log(`skip ${line.id} (has words)`);
    continue;
  }
  const audio = audioFor(line.id);
  if (!audio) throw new Error(`no audio for ${line.id} in ${voiceDir}`);
  const duration = probe(audio);
  const elevenlabs = join(voiceDir, `${line.id}.alignment.json`);
  const generic = join(voiceDir, `${line.id}.words.json`);
  let source;
  let heard;
  if (existsSync(elevenlabs)) {
    source = "alignment.json";
    heard = fromCharacters(JSON.parse(readFileSync(elevenlabs, "utf8")));
  } else if (existsSync(generic)) {
    source = "words.json";
    const j = JSON.parse(readFileSync(generic, "utf8"));
    heard = (Array.isArray(j) ? j : j.words).map((w) => ({ word: w.word ?? w.text, start: w.start, end: w.end }));
  } else {
    source = `transcribe ${opt.model}${opt.language ? " " + opt.language : ""}`;
    heard = transcribe(audio);
  }
  const r = timeScript(toSpoken(line.text), heard, duration);
  writeFileSync(meta, JSON.stringify({ id: line.id, speaker: line.speaker, text: line.text, source, duration, words: r.words }, null, 2));
  const warn = r.total - r.matched > Math.max(1, r.total * 0.3) ? "  <- check this line: low match, wrong language or model?" : "";
  console.log(`ok ${line.id} ${duration.toFixed(2)}s, ${r.matched}/${r.total} words matched (${source})${warn}`);
}
