// Isometric variant: turns beats.json + audio/timing.json into the SERIES and BEATS data inside index.html.
//
//   node <skill>/scripts/beats.mjs [beats.json] [audio/timing.json] [index.html]
//
// Each beat is a caption chunk of one line, in order. Its words are matched against the line's
// timed words, so a typo or a beat that skips a word stops the build instead of drifting. Spelled
// forms sent to TTS ("I-A-S-C") match their written word ("IASC") without a "spoken" entry, because
// matching ignores punctuation; a respelled word ("QRIS" voiced as "Kris") needs one.
import { readFileSync, writeFileSync } from "node:fs";

const [beatsPath = "beats.json", timingPath = "audio/timing.json", htmlPath = "index.html"] = process.argv.slice(2);
const beatsSpec = JSON.parse(readFileSync(beatsPath, "utf8"));
const timing = JSON.parse(readFileSync(timingPath, "utf8"));
const key = (w) => String(w).toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
const r3 = (v) => +v.toFixed(3);

// "spoken": written word -> the form the voice was generated from (the timed words use that form).
const spoken = Object.fromEntries((beatsSpec.spoken || []).map(([w, s]) => [key(w), key(s)]));
const heard = (w) => spoken[key(w)] ?? key(w);
const lines = Object.fromEntries(timing.lines.map((l) => [l.id, { ...l, at: 0 }]));
const errors = [];
const beats = beatsSpec.beats.map((b, i) => {
  const line = lines[b.line];
  if (!line) return void errors.push(`beat ${i + 1}: no line ${b.line}`);
  const words = b.text.split(/\s+/).filter(Boolean).map((w) => {
    const t = line.words[line.at++];
    if (!t || key(t.word) !== heard(w)) errors.push(`beat ${i + 1}: "${w}" != "${t?.word ?? "(end of line)"}" in ${b.line}`);
    return [w, r3(t?.start ?? 0), r3(t?.end ?? 0)];
  });
  const stampWord = b.stamp && words.find(([w]) => key(w) === key(b.stamp.at));
  if (b.stamp && !stampWord) errors.push(`beat ${i + 1}: stamp word "${b.stamp.at}" not in beat`);
  return {
    n: i + 1,
    who: line.speaker.toLowerCase(),
    chip: b.chip,
    head: b.head,
    kw: (b.kw || []).map(key),
    stamp: b.stamp ? { text: b.stamp.text, t: stampWord?.[1] ?? 0 } : null,
    src: b.src || null,
    start: words[0][1],
    end: words[words.length - 1][2],
    words,
  };
});
for (const l of Object.values(lines)) {
  if (l.at && l.at !== l.words.length) errors.push(`${l.id}: beats cover ${l.at} of ${l.words.length} words`);
}
if (errors.length) {
  console.error("beat errors (index.html not written):\n  " + errors.join("\n  "));
  process.exit(1);
}

const html = readFileSync(htmlPath, "utf8");
const re = /\/\* BEATS:BEGIN \*\/[\s\S]*?\/\* BEATS:END \*\//;
if (!re.test(html)) throw new Error(`${htmlPath} has no /* BEATS:BEGIN */ ... /* BEATS:END */ marker`);
const block = `/* BEATS:BEGIN */ const SERIES = ${JSON.stringify(beatsSpec.series)};\n      const BEATS = ${JSON.stringify(beats)}; /* BEATS:END */`;
writeFileSync(htmlPath, html.replace(re, () => block));
console.log(`beats ${beats.length}, ${beats[0].start}s - ${beats[beats.length - 1].end}s`);
