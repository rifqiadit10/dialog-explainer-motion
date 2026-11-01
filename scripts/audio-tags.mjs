// Writes the <audio> clips between <!-- AUDIO:BEGIN --> and <!-- AUDIO:END --> in index.html and sets
// the composition length, all from audio/timing.json. Used by the isometric variant (build-root.mjs
// does this for the vector starter).
//
//   node <skill>/scripts/audio-tags.mjs [audio/lines.json] [audio/timing.json] [index.html] [audio/sfx.json]
//
// Voice clips alternate two tracks. The music bed (lines.json "music") spans the whole piece; it is
// written fresh, so run carve.mjs again afterwards. Sound effects come from an optional sfx.json:
//   [{ "id": "sfx-ring", "src": "audio/sfx/ring.wav", "at": 0.1, "until": "f1-1-a:start", "untilOffset": -0.1, "volume": 0.55 },
//    { "id": "sfx-hangup", "src": "audio/sfx/hangup.wav", "at": "f7-1-b:tutup", "offset": -0.05, "duration": 0.3, "volume": 0.5 }]
// A cue is seconds, "<line>:start", "<line>:end", or "<line>:<word>" (its first match; "<word>#2" for the second).
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const [linesPath = "audio/lines.json", timingPath = "audio/timing.json", htmlPath = "index.html", sfxPath = "audio/sfx.json"] = process.argv.slice(2);
const timing = JSON.parse(readFileSync(timingPath, "utf8"));
const spec = JSON.parse(readFileSync(linesPath, "utf8"));
const sfx = existsSync(sfxPath) ? JSON.parse(readFileSync(sfxPath, "utf8")) : [];
const key = (w) => String(w).toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
const f3 = (v) => v.toFixed(3);
const total = timing.total;

function cue(c, offset = 0) {
  if (typeof c === "number") return c + offset;
  const [id, what] = c.split(":");
  const line = timing.lines.find((l) => l.id === id);
  if (!line) throw new Error(`cue "${c}": no line ${id}`);
  if (what === "start") return line.speechStart + offset;
  if (what === "end") return line.speechEnd + offset;
  const [word, nth = "1"] = what.split("#");
  const hit = line.words.filter((w) => key(w.word) === key(word))[Number(nth) - 1];
  if (!hit) throw new Error(`cue "${c}": ${id} has no word "${word}" (#${nth})`);
  return hit.start + offset;
}

const tags = timing.lines.map(
  (l, i) => `<audio id="vo-${l.id}" src="audio/voice/${l.id}.mp3" data-start="${f3(l.audioStart)}" data-duration="${f3(l.duration)}" data-volume="1" data-audio-group="voiceover" data-track-index="${10 + (i % 2)}"></audio>`,
);
sfx.forEach((s, i) => {
  const start = cue(s.at, s.offset);
  const dur = s.until !== undefined ? cue(s.until, s.untilOffset) - start : s.duration;
  if (!(dur > 0)) throw new Error(`${s.id}: no positive duration`);
  tags.push(`<audio id="${s.id}" src="${s.src}" data-start="${f3(start)}" data-duration="${f3(dur)}" data-volume="${s.volume ?? 1}" data-audio-group="sfx" data-track-index="${30 + i}"></audio>`);
});
const music = spec.music;
if (music) tags.push(`<audio id="bgm" src="${music.src}" data-start="0" data-duration="${f3(total)}" data-volume="${music.volume}" data-audio-group="music" data-track-index="20"></audio>`);

let html = readFileSync(htmlPath, "utf8");
if (!/<!-- AUDIO:BEGIN -->[\s\S]*?<!-- AUDIO:END -->/.test(html)) throw new Error(`${htmlPath} has no <!-- AUDIO:BEGIN --> ... <!-- AUDIO:END --> marker`);
html = html.replace(/<!-- AUDIO:BEGIN -->[\s\S]*?<!-- AUDIO:END -->/, () => `<!-- AUDIO:BEGIN -->\n      ${tags.join("\n      ")}\n      <!-- AUDIO:END -->`);
html = html.replace(/(<div id="root"[^>]*data-duration=")[\d.]+(")/, `$1${f3(total)}$2`);
writeFileSync(htmlPath, html);
console.log(`${timing.lines.length} voice clips, ${sfx.length} sfx${music ? ", music" : ""}; duration ${f3(total)}s`);
