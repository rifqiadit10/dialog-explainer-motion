// Lays the voiced lines on one timeline and derives frame windows from the speech.
//
//   node <skill>/scripts/timing.mjs audio/lines.json audio/voice audio/timing.json
//        [--start 0.5] [--turn-gap 0.3] [--frame-gap 0.45] [--lead-in 0.25] [--tail 1.8]
//
// Each line is placed so its first word lands right after the previous line's last word plus a
// gap (turn-gap inside a frame, frame-gap between frames). A frame starts lead-in seconds before
// its first word; the last frame holds tail seconds after the final word. Output (timing.json):
//   { total, frames: [{ frame, start, end, duration, mid }], lines: [{ id, frame, speaker, text,
//     audioStart, duration, speechStart, speechEnd, words: [{ word, start, end }] }] }
// All times are absolute seconds on the composition clock.
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const [, , linesPath, voiceDir, outPath, ...rest] = process.argv;
if (!linesPath || !voiceDir || !outPath) {
  console.error("usage: node scripts/timing.mjs <lines.json> <voice-dir> <timing.json> [--start s] [--turn-gap s] [--frame-gap s] [--lead-in s] [--tail s]");
  process.exit(2);
}
const opt = { start: 0.5, "turn-gap": 0.3, "frame-gap": 0.45, "lead-in": 0.25, tail: 1.8 };
for (let i = 0; i < rest.length; i += 2) opt[rest[i].replace(/^--/, "")] = Number(rest[i + 1]);

const { lines: L } = JSON.parse(readFileSync(linesPath, "utf8"));
const round = (v) => +v.toFixed(3);
let t = opt.start;
let prevFrame = null;
const lines = [];
for (const l of L) {
  const j = JSON.parse(readFileSync(join(voiceDir, `${l.id}.json`), "utf8"));
  const w = j.words.filter((x) => !/^<.*>$/.test(x.word));
  if (!w.length) throw new Error(`no word timestamps for ${l.id}`);
  if (lines.length) t += l.frame !== prevFrame ? opt["frame-gap"] : opt["turn-gap"];
  const audioStart = t - w[0].start;
  lines.push({
    id: l.id,
    frame: l.frame,
    speaker: l.speaker,
    text: l.text,
    audioStart: round(audioStart),
    duration: round(j.duration),
    speechStart: round(t),
    speechEnd: round(audioStart + w[w.length - 1].end),
    words: w.map((x) => ({ word: x.word, start: round(audioStart + x.start), end: round(audioStart + x.end) })),
  });
  t = audioStart + w[w.length - 1].end;
  prevFrame = l.frame;
}

const frameIds = [...new Set(lines.map((l) => l.frame))];
const frames = frameIds.map((f, i) => {
  const first = lines.find((l) => l.frame === f);
  return { frame: f, start: i === 0 ? 0 : round(first.speechStart - opt["lead-in"]) };
});
frames.forEach((fr, i) => {
  fr.end = i < frames.length - 1 ? frames[i + 1].start : round(lines[lines.length - 1].speechEnd + opt.tail);
  fr.duration = round(fr.end - fr.start);
  fr.mid = round((fr.start + fr.end) / 2);
});
const total = frames[frames.length - 1].end;
writeFileSync(outPath, JSON.stringify({ total, frames, lines }, null, 2));
console.log(`total ${total.toFixed(2)}s`);
for (const f of frames) console.log(`frame ${f.frame}: ${f.start.toFixed(2)} - ${f.end.toFixed(2)} (${f.duration.toFixed(2)}s)`);
